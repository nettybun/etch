import { h } from 'haptic';
import { subscribe, computed, on } from 'haptic/s';
import { colours } from 'styletakeout.macro';

import { data } from '../data.js';
import { debounce, throttle } from '../util.js';
import { genCircleXY, genLineXY } from '../drawings.js';
import { queueTileDraw, registerTileDrawCallback } from '../rAF.js';
import { sendMessage } from '../websocket.js';

import type { TileXY } from '../types/etch.js';
import type { DrawModes } from '../data.js';

// Hard on the eyes if it's too fast...
const hoverThrottled = throttle(data.hover, 50);

const evToTileXY = (ev: MouseEvent) => {
  const size = data.tileSizePx();
  const x = Math.floor(ev.offsetX / size);
  const y = Math.floor(ev.offsetY / size);
  return [x, y] as TileXY;
};

const TilesCanvas = () => {
  const canvas = <canvas/> as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Browser support?
    return <div>No canvas support</div>;
  }
  ctx.imageSmoothingEnabled = false;

  // Two options for drawing a grid:
  // - Draw the grid and account for the grid widths to know the tile location
  // - Draw tiles without a grid, but then outline each tile as 0.5px

  // The second one doesn't need any math to count the offset which is nice, but
  // it does mean drawing an outline everytime instead of only once on startup

  const drawCanvasTile = (x: number, y: number, px: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.clearRect(x * px, y * px, px, px);
    ctx.beginPath();
    ctx.fillRect(x * px, y * px, px, px);
    ctx.closePath();

    // Outline the tile
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'black';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(0.5, 0.5);

    ctx.beginPath();
    ctx.moveTo(x * px, y * px);

    ctx.lineTo(x * px, (y + 1) * px);
    ctx.stroke();
    ctx.lineTo((x + 1) * px, (y + 1) * px);
    ctx.stroke();
    ctx.lineTo((x + 1) * px, y * px);
    ctx.stroke();
    ctx.lineTo(x * px, y * px);
    ctx.stroke();

    ctx.closePath();
  };

  const drawEntireCanvas = () => {
    const [cX, cY] = [data.tileCountX(), data.tileCountY()];
    const size = data.tileSizePx();

    // There's a border so +1
    // Needs to redraw all tiles on resize https://stackoverflow.com/q/11179274/
    canvas.width = cX * size + 1;
    canvas.height = cY * size + 1;

    for (let y = 0; y < cY; y++)
      for (let x = 0; x < cX; x++)
        drawCanvasTile(x, y, size, data.tileData[y][x]);
  };

  // Event handling

  let brushDownXY: TileXY | undefined;
  let cursorXY: Array<{ xy: TileXY, prevColour: string}> = [];

  function clearPrevCursor() {
    cursorXY.forEach(({ xy, prevColour }) => {
      queueTileDraw(xy, prevColour);
    });
    cursorXY = [];
  }

  canvas.addEventListener('mousedown', ev => {
    const xy = evToTileXY(ev);
    brushDownXY = xy;
    evMouse[data.drawMode].evDown(xy);
  });
  canvas.addEventListener('mouseup', ev => {
    const xy = evToTileXY(ev);
    evMouse[data.drawMode].evUp(xy);
    brushDownXY = undefined;
    const [x, y] = xy;
    data.click(`(${x}, ${y})`);
  });
  canvas.addEventListener('mousemove', ev => {
    const xy = evToTileXY(ev);
    evMouse[data.drawMode].evMove(xy);
    const [x, y] = xy;
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${x}, ${y})`);
  });

  // Specific event handling for the drawMode
  const evMouse: {
    [k in DrawModes]: {
      [k in 'evDown' | 'evUp' | 'evMove']: (xy: TileXY) => void
    }
  } = {
    LINE: {
      evDown(xy) {
        queueTileDraw(xy, data.brushColour());
      },
      evUp(xy) {
        queueTileDraw(xy, data.brushColour());
        cursorXY = [];
      },
      evMove(xy) {
        if (!brushDownXY) {
          clearPrevCursor();
          const [x, y] = xy;
          cursorXY.push({ xy, prevColour: data.tileData[y][x] });
          queueTileDraw(xy, colours.gray._400);
          return;
        }
        // Browsers throttle mousemove. Quickly moving a mouse across an entire
        // screen in ~0.5s returns maybe 5 readings. This fills in the gaps...
        const colour = data.brushColour();
        genLineXY(brushDownXY, xy).forEach(xyLoop => {
          queueTileDraw(xyLoop, colour);
        });
        sendMessage({
          type: 'canvas/drawLine',
          xyA: brushDownXY,
          xyB: xy,
          colour,
        });
        // Move along the line in chunks
        brushDownXY = xy;
      },
    },
    STRAIGHT: {
      evDown(xy) {
        queueTileDraw(xy, data.brushColour());
      },
      evUp(xy) {
        if (!brushDownXY) {
          return; // Should never happen
        }
        const colour = data.brushColour();
        genLineXY(brushDownXY, xy).forEach(xyLoop => {
          queueTileDraw(xyLoop, colour);
        });
        sendMessage({
          type: 'canvas/drawLine',
          xyA: brushDownXY,
          xyB: xy,
          colour,
        });
        cursorXY = [];
      },
      evMove(xy) {
        clearPrevCursor();
        if (!brushDownXY) {
          const [x, y] = xy;
          cursorXY.push({ xy, prevColour: data.tileData[y][x] });
          queueTileDraw(xy, colours.gray._400);
          return;
        }
        genLineXY(brushDownXY, xy).forEach(xyLoop => {
          const [x, y] = xyLoop;
          cursorXY.push({ xy: xyLoop, prevColour: data.tileData[y][x] });
          queueTileDraw(xyLoop, colours.gray._400);
        });
        // Keep the first pixel coloured to show that it's started
        queueTileDraw(brushDownXY, data.brushColour());
      },
    },
    // CIRCLE: {
    //   evDown(xy) {},
    //   evUp(xy) {},
    //   evMove(xy) {
    //     if (!brushDownXY) return;
    //     const [aX, aY] = xy;
    //     const [bX, bY] = brushDownXY;
    //     const radius = Math.floor(
    //       Math.sqrt(Math.abs(aX - bX) ** 2 + Math.abs(aY - bY) ** 2)
    //     );
    //     genCircleXY(brushDownXY, radius).forEach(ixy => {
    //       queueTileDraw(ixy, colours.gray._400);
    //     });
    //   },
    // },
  };

  // Resizing
  on([data.tileCountX, data.tileCountY, data.tileSizePx], drawEntireCanvas);

  // Registration
  registerTileDrawCallback(([x, y]) => {
    drawCanvasTile(x, y, data.tileSizePx(), data.tileData[y][x]);
  });

  return canvas;
};

export { TilesCanvas };
