import { h } from '../sinuous.js';
import { styles } from '../styles.js';
import { data } from '../data.js';
import { subscribe, sample, computed } from 'sinuous/observable';

const {
  tiles: {
    cursor,
    tileData,
    tileCountX,
    tileCountY,
    tileSizePx,
  },
  brushColour,
} = data;

const TilesCanvas = (): h.JSX.Element => {
  const canvas = <canvas/> as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Browser support?
    return <div>No canvas support</div>;
  }
  ctx.imageSmoothingEnabled = false;

  // There's a border so +1
  const canvasWidthPx = computed(() => tileCountX() * tileSizePx() + 1);
  const canvasHeightPx = computed(() => tileCountY() * tileSizePx() + 1);

  // FIXME: BUG: Observable runs after the data is written, so the canvas is
  // cleared. https://stackoverflow.com/q/11179274/
  subscribe(() => canvas.width = canvasWidthPx());
  subscribe(() => canvas.height = canvasHeightPx());

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

  // TODO: Maintain a list of dirty values to update instead of everything...
  subscribe(() => {
    console.log('Draw');
    const data = tileData();
    const size = tileSizePx();
    // Don't redraw when the count changes: tiles() will update via computed()
    const cX = sample(tileCountX);
    const cY = sample(tileCountY);
    console.log(cX, cY);
    for (let y = 0; y < cY; y++) {
      for (let x = 0; x < cX; x++) {
        drawSquare(x, y, size, data[y][x]);
      }
    }
  });

  canvas.addEventListener('click', ev => {
    const x = Math.floor(ev.offsetX / tileCountX());
    const y = Math.floor(ev.offsetY / tileCountY());
    const arr = tileData();
    if (arr[y][x] === brushColour()) return;
    console.log(`Updated (${x},${y})`);
    cursor(`(${x},${y})`);
    arr[y][x] = brushColour();
    tileData(arr);
  });

  return canvas;
};

const Tiles = (): h.JSX.Element =>
  <div class={styles.Bordered}>
    {() => {
      console.log('Draw');
      return tileData().map((row, y) =>
        <div>
          {row.map((text, x) =>
            <div
              class={styles.Bordered}
              style={() => ({
                'width': tileSizePx(),
                'height': tileSizePx(),
                'background-color': text,
              })}
              data-coord={`${x},${y}`}
              // @ts-ignore Sinuous wants OrObservable<MouseEventHandler<HTMLDivElement>>
              onClick={tileClick}
            />
          )}
        </div>
      );
    }}
  </div>;

const tileClick = ({ target }: { target: HTMLDivElement }) => {
  if (!target.dataset.coord) return;
  const [x, y] = target.dataset.coord.split(',').map(Number);
  const arr = tileData();
  if (arr[y][x] === brushColour()) return;
  console.log(`Updated (${x},${y})`);
  cursor(`(${x},${y})`);
  arr[y][x] = brushColour();
  tileData(arr);
};

export { Tiles, TilesCanvas };
