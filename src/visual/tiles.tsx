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

const colourTile = (x: number, y: number) => {
  const arr = tileData();
  if (arr[y][x] === brushColour()) return;
  arr[y][x] = brushColour();
  tileData(arr);
};

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

  // let toRedraw = [];
  subscribe(() => {
    const data = tileData();
    const size = tileSizePx();
    // Don't redraw when the count changes: tiles() will update via computed()
    const cX = sample(tileCountX);
    const cY = sample(tileCountY);

    // There's a border so +1
    const canvasWidthPx = cX * size + 1;
    const canvasHeightPx = cY * size + 1;
    // If this is a different observable/subscription there's a race condition
    // where canvas resizing runs _after_ data is drawn. Resizing always clears
    // a canvas: https://stackoverflow.com/q/11179274/
    if (canvas.width !== canvasWidthPx || canvas.height !== canvasHeightPx) {
      console.log('Resizing canvas');
      canvas.width = canvasWidthPx;
      canvas.height = canvasHeightPx;
    }
    console.log('Draw');
    for (let y = 0; y < cY; y++) {
      for (let x = 0; x < cX; x++) {
        drawSquare(x, y, size, data[y][x]);
      }
    }
  });

  const coord = (ev: MouseEvent) => {
    const size = tileSizePx();
    const x = Math.floor(ev.offsetX / size);
    const y = Math.floor(ev.offsetY / size);
    return { x, y };
  };

  let brushDown = false;
  let brushDragging = false;
  canvas.addEventListener('mousedown', () => {
    brushDown = true;
  });
  canvas.addEventListener('mouseup', ev => {
    brushDown = false;
    if (brushDragging) {
      console.log('Dragend');
      brushDragging = false;
      const { x, y } = coord(ev);
      colourTile(x, y);
    }
  });
  canvas.addEventListener('mousemove', ev => {
    const { x, y } = coord(ev);
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${x}, ${y})`);
    if (brushDown) {
      brushDragging = true;
      colourTile(x, y);
    }
  });
  canvas.addEventListener('click', ev => {
    const { x, y } = coord(ev);
    click(`(${x}, ${y})`);
    colourTile(x, y);
  });

  return canvas;
};

export { TilesCanvas };
