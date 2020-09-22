import { h } from '../sinuous.js';
import { data } from '../data.js';
import { subscribe, sample, computed } from 'sinuous/observable';
import { debounce, throttle } from '../util.js';
import { drawLine } from '../drawings.js';

import type { Point } from '../types/etch.js';

const {
  click,
  hover,
  tiles: {
    tileData,
    tileCountX,
    tileCountY,
    tileSizePx,
  },
  brushColour,
} = data;

// Hard on the eyes if it's too fast...
const hoverThrottled = throttle(hover, 50);

const TilesCanvas = (): h.JSX.Element => {
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

  const drawSquare = (x: number, y: number, px: number, colour: string) => {
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

  let rAFQueue: Point[] = [];
  let rAFScheduled = false;
  let brushDown: Point | undefined;

  const rAFUpdate = () => {
    const data = tileData();
    const size = tileSizePx();
    for (const c of rAFQueue) {
      drawSquare(c.x, c.y, size, data[c.y][c.x]);
    }
    rAFQueue = [];
    rAFScheduled = false;
  };

  const paintTile = (point: Point) => {
    const { x, y } = point;
    // This happens easily in drawing tools like drawCircle()
    if (x < 0 || y < 0 || x > tileCountX() || y > tileCountY()) return;
    const arr = tileData();
    if (arr[y][x] === brushColour()) return;
    arr[y][x] = brushColour();
    tileData(arr);

    rAFQueue.push(point);
    // Call rAF only once since callbacks stack
    if (!rAFScheduled) {
      requestAnimationFrame(rAFUpdate);
      rAFScheduled = true;
    }
  };

  const evToPoint = (ev: MouseEvent): Point => {
    const size = tileSizePx();
    const x = Math.floor(ev.offsetX / size);
    const y = Math.floor(ev.offsetY / size);
    return { x, y };
  };

  canvas.addEventListener('mousedown', ev => {
    brushDown = evToPoint(ev);
  });

  canvas.addEventListener('mouseup', ev => {
    brushDown = undefined;

    const c = evToPoint(ev);
    paintTile(c);
    click(`(${c.x}, ${c.y})`);
  });

  canvas.addEventListener('mousemove', ev => {
    const c = evToPoint(ev);
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${c.x}, ${c.y})`);
    if (typeof brushDown !== 'undefined') {
      // Browsers throttle mousemove. Quickly moving a mouse across an entire
      // screen in ~0.5s returns maybe 5 readings. This fills in the gaps...
      drawLine(brushDown, c).forEach(paintTile);
    }
  });

  // Resizing needs to redraw all tiles https://stackoverflow.com/q/11179274/
  subscribe(() => {
    console.log('Resizing canvas');
    const [cX, cY, size] = [tileCountX(), tileCountY(), tileSizePx()];
    // Don't track updates to the tile array
    const data = sample(tileData);

    // There's a border so +1
    canvas.width = cX * size + 1;
    canvas.height = cY * size + 1;

    for (let y = 0; y < cY; y++)
      for (let x = 0; x < cX; x++)
        drawSquare(x, y, size, data[y][x]);
  });

  return canvas;
};

export { TilesCanvas };
