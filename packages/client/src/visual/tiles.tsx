import { h } from 'haptic';
import { data } from '../data.js';
import { subscribe, computed } from 'haptic/s';
import { debounce, throttle } from '../util.js';
import { drawLine } from '../drawings.js';
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

  registerTileDrawCallback((x, y) => {
    drawCanvasTile(x, y, data.tileSizePx(), data.tileData[x][y]);
  });

  // Event handling

  let brushDown: TileXY | undefined;

  const evToTileXY = (ev: MouseEvent) => {
    const size = data.tileSizePx();
    const x = Math.floor(ev.offsetX / size);
    const y = Math.floor(ev.offsetY / size);
    return { x, y } as TileXY;
  };

  canvas.addEventListener('mousedown', ev => {
    brushDown = evToTileXY(ev);
  });

  canvas.addEventListener('mouseup', ev => {
    brushDown = undefined;

    const c = evToTileXY(ev);
    queueTileDraw(c, data.brushColour());
    data.click(`(${c.x}, ${c.y})`);
  });

  canvas.addEventListener('mousemove', ev => {
    const c = evToTileXY(ev);
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${c.x}, ${c.y})`);
    if (typeof brushDown !== 'undefined') {
      // Browsers throttle mousemove. Quickly moving a mouse across an entire
      // screen in ~0.5s returns maybe 5 readings. This fills in the gaps...
      const colour = data.brushColour();
      drawLine(brushDown, c).forEach((xy: TileXY) => {
        queueTileDraw(xy, colour);
      });
      // Oh boy...
      sendMessage({
        type: 'canvas/drawLine',
        xyA: brushDown,
        xyB: c,
        colour,
      });
    }
  });

  // Resizing
  // Needs to redraw all tiles https://stackoverflow.com/q/11179274/

  subscribe(() => {
    console.log('Resizing canvas');
    const [cX, cY] = [data.tileCountX(), data.tileCountY()];
    const size = data.tileSizePx();

    // There's a border so +1
    canvas.width = cX * size + 1;
    canvas.height = cY * size + 1;

    for (let y = 0; y < cY; y++)
      for (let x = 0; x < cX; x++)
        drawCanvasTile(x, y, size, data.tileData[y][x]);
  });

  return canvas;
};

export { TilesCanvas };
