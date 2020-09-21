import { h } from '../sinuous.js';
import { data } from '../data.js';
import { subscribe, sample, computed } from 'sinuous/observable';
import { debounce, throttle } from '../util.js';

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

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  };

  let rAFLineQueue: { x: number, y: number }[] = [];
  let rAFTileQueue: { x: number, y: number }[] = [];
  let rAFSet = false;
  let brushDown = false;
  let brushDragging = false;

  const rAFUpdate = () => {
    console.log('rAFRedrawQueue:', rAFTileQueue.length);
    const data = tileData();
    const size = tileSizePx();
    for (const c of rAFTileQueue) {
      drawSquare(c.x, c.y, size, data[c.y][c.x]);
    }
    if (rAFLineQueue.length > 1) {
      let [p] = rAFLineQueue;
      for (let i = 1; i < rAFLineQueue.length; i++) {
        const c = rAFLineQueue[i];
        drawLine(p.x, p.y, c.x, c.y);
        p = c;
      }
      rAFLineQueue = [];
    }
    rAFTileQueue = [];
    rAFSet = false;
  };

  const updateTile = (coord: { x: number, y: number }) => {
    const { x, y } = coord;
    const arr = tileData();
    if (arr[y][x] === brushColour()) return;
    arr[y][x] = brushColour();
    tileData(arr);

    rAFTileQueue.push(coord);
    // Call rAF only once since callbacks stack
    if (!rAFSet) {
      requestAnimationFrame(rAFUpdate);
      rAFSet = true;
    }
  };

  const evToCoord = (ev: MouseEvent) => {
    const size = tileSizePx();
    const x = Math.floor(ev.offsetX / size);
    const y = Math.floor(ev.offsetY / size);
    return { x, y };
  };

  canvas.addEventListener('mousedown', ev => {
    brushDown = true;
    rAFLineQueue = [{ x: ev.offsetX, y: ev.offsetY }];
  });

  canvas.addEventListener('mouseup', ev => {
    rAFLineQueue.push({ x: ev.offsetX, y: ev.offsetY });

    const c = evToCoord(ev);
    updateTile(c);
    click(`(${c.x}, ${c.y})`);

    brushDown = false;
    if (brushDragging) brushDragging = false;
  });

  canvas.addEventListener('mousemove', ev => {
    const c = evToCoord(ev);
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${c.x}, ${c.y})`);
    if (brushDown) {
      brushDragging = true;
      updateTile(c);
      rAFLineQueue.push({ x: ev.offsetX, y: ev.offsetY });
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
