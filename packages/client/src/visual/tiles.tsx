import { h } from 'haptic';
import { colours } from 'styletakeout.macro';
import { data } from '../data.js';
import { subscribe, computed, on } from 'haptic/s';
import { debounce, throttle } from '../util.js';
import { genCircleXY, genLineXY } from '../drawings.js';
import { queueTileDraw, registerTileDrawCallback } from '../rAF.js';

import type { TileXY } from '../types/etch.js';
import { sendMessage } from '../websocket.js';

// Hard on the eyes if it's too fast...
const hoverThrottled = throttle(data.hover, 50);

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

  const evToTileXY = (ev: MouseEvent) => {
    const size = data.tileSizePx();
    const x = Math.floor(ev.offsetX / size);
    const y = Math.floor(ev.offsetY / size);
    return [x, y] as TileXY;
  };

  type DrawModes = typeof data.drawMode;
  type MouseEvents = 'onMouseDown' | 'onMouseUp' | 'onMouseMove';

  let brushDown: TileXY | undefined;

  // Global between all drawMode options
  canvas.addEventListener('mousedown', ev => {
    brushDown = evToTileXY(ev);
  });
  canvas.addEventListener('mouseup', ev => {
    brushDown = undefined;
    const [x, y] = evToTileXY(ev);
    data.click(`(${x}, ${y})`);
  });
  canvas.addEventListener('mousemove', ev => {
    const [x, y] = evToTileXY(ev);
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${x}, ${y})`);
  });

  // Specific to the drawMode...
  const evMouse: {
    [k in DrawModes]:
      & { [k in MouseEvents]: (ev: MouseEvent) => void }
  } = {
    LINE: {
      onMouseDown(ev) {},
      onMouseUp(ev) {
        // TODO: Testing if this is not needed...
        // const c = evToTileXY(ev);
        // queueTileDraw(c, data.brushColour());
      },
      onMouseMove(ev) {
        if (typeof brushDown === 'undefined') return;
        const c = evToTileXY(ev);
        // Browsers throttle mousemove. Quickly moving a mouse across an entire
        // screen in ~0.5s returns maybe 5 readings. This fills in the gaps...
        const colour = data.brushColour();
        genLineXY(brushDown, c).forEach((xy: TileXY) => {
          queueTileDraw(xy, colour);
        });
        sendMessage({
          type: 'canvas/drawLine',
          xyA: brushDown,
          xyB: c,
          colour,
        });
        // Move along the line in chunks
        brushDown = c;
      },
    },
    STRAIGHT: {
      onMouseDown(ev) {},
      onMouseUp(ev) {},
      onMouseMove(ev) {
        if (typeof brushDown === 'undefined') return;
        const c = evToTileXY(ev);
        // TODO: Where's a good place to redraw the whole canvas?
        // Can I request an animation frame here?
        genLineXY(brushDown, c).forEach((xy: TileXY) => {
          queueTileDraw(xy, colours.gray._400);
        });
      },
    },
    CIRCLE: {
      onMouseDown(ev) {},
      onMouseUp(ev) {},
      onMouseMove(ev) {
        if (typeof brushDown === 'undefined') return;
        const [aX, aY] = evToTileXY(ev);
        const [bX, bY] = brushDown;
        const radius = Math.floor(
          Math.sqrt(Math.abs(aX - bX) ** 2 + Math.abs(aY - bY) ** 2)
        );
        // TODO: Where's a good place to redraw the whole canvas?
        // Can I request an animation frame here?
        genCircleXY(brushDown, radius).forEach((xy: TileXY) => {
          queueTileDraw(xy, colours.gray._400);
        });
      },
    },
  };

  canvas.addEventListener('mousedown', ev => {
    evMouse[data.drawMode].onMouseDown(ev);
  });
  canvas.addEventListener('mouseup', ev => {
    evMouse[data.drawMode].onMouseUp(ev);
  });
  canvas.addEventListener('mousemove', ev => {
    evMouse[data.drawMode].onMouseMove(ev);
  });

  // Resizing
  on([data.tileCountX, data.tileCountY, data.tileSizePx], drawEntireCanvas);

  // Registration
  registerTileDrawCallback(([x, y]) => {
    drawCanvasTile(x, y, data.tileSizePx(), data.tileData[y][x]);
  });

  return canvas;
};

export { TilesCanvas };
