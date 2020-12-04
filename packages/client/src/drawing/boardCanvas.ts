import { on } from 'haptic/s';
import { data } from '../data.js';
import { registerBoard } from '../rAF.js';

import type { TileXY } from '../types/etch.js';

const createBoardCanvas = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser doesn\'t support canvas elements');
  }
  ctx.imageSmoothingEnabled = false;

  // Resizing
  on([data.tileCountX, data.tileCountY, data.tileSizePx], () => {
    const [cX, cY] = [data.tileCountX(), data.tileCountY()];
    const size = data.tileSizePx();

    // There's a border so +1
    // Needs to redraw all tiles on resize https://stackoverflow.com/q/11179274/
    canvas.width = cX * size + 1;
    canvas.height = cY * size + 1;

    for (let y = 0; y < cY; y++)
      for (let x = 0; x < cX; x++)
        canvasDrawTile(ctx, [x, y], size, data.tileData[y][x]);
  });

  // Registration with rAF handler
  registerBoard(([x, y], colour) => {
    canvasDrawTile(ctx, [x, y], data.tileSizePx(), colour);
  });

  return canvas;
};

const canvasEvTileXY = (ev: MouseEvent) => {
  const size = data.tileSizePx();
  const x = Math.floor(ev.offsetX / size);
  const y = Math.floor(ev.offsetY / size);
  return [x, y] as TileXY;
};

// Two options for drawing a grid:
// - Draw the grid and account for the grid widths to know the tile location
// - Draw tiles without a grid, but then outline each tile as 0.5px

// The second one doesn't need any math to count the offset which is nice, but
// it does mean drawing an outline everytime instead of only once on startup

const canvasDrawTile = (ctx: CanvasRenderingContext2D, xy: TileXY, px: number, colour: string) => {
  const [x, y] = xy;
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

export { createBoardCanvas, canvasEvTileXY, canvasDrawTile };
