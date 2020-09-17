import { h } from './sinuous.js';
import { css, snippets, sizes, colours } from 'styletakeout.macro';

import { styles } from './styles.js';
import { o, computed, subscribe, on } from 'sinuous/observable';

const NO_CURSOR = '✖';
const DEFAULT_TILE_COUNT_X = 20;
const DEFAULT_TILE_COUNT_Y = 20;
const DEFAULT_TILE_SIZE_PX = 20;
const BG_COLOUR = '#FFF';

const cursor = o(NO_CURSOR);
const tileCountX = o(DEFAULT_TILE_COUNT_X);
const tileCountY = o(DEFAULT_TILE_COUNT_Y);
const tileSizePx = o(DEFAULT_TILE_SIZE_PX);

// TODO: There's a border so +1
const canvasWidthPx = computed(() => tileCountX() * tileSizePx() + 1);
const canvasHeightPx = computed(() => tileCountY() * tileSizePx() + 1);

// Colours
// TODO: Use a palette for over-the-wire encoding of limited colours
// TODO: Support colours. Don't hardcode #000
const brushColour = '#000';
const palette = [];

// Can't use new Array().fill(new Array()) since it's filling a shared object
const newTiles = (x: number, y: number) => {
  const arr = new Array<string[]>(y);
  for (let i = 0; i < y; i++) arr[i] = new Array<string>(x);
  return arr;
};
// ReferenceError: Can't access lexical declaration 'tiles' before initialization
const tilesEmpty = newTiles(tileCountX(), tileCountY());
for (const row of tilesEmpty) row.fill(BG_COLOUR);
const tiles = o(tilesEmpty);

// Sinuous PR...
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
on([tileCountY, tileCountX], () => {
  console.log('Size change');
  const current = tiles();
  const [cX, cY] = [tileCountX(), tileCountY()];
  const tilesNew = newTiles(cX, cY);
  // Carry-over the current values
  for (let y = 0; y < cY; y++)
    for (let x = 0; x < cX; x++)
      tilesNew[y][x]
        = (y < current.length && x < current[y].length)
          ? current[y][x]
          : BG_COLOUR;
  tiles(tilesNew);
}, null, true);

const ClickButton = ({ text, fn }: { text: string, fn: () => unknown }) =>
  <button class={styles.ButtonBlue} type="button" onClick={fn}>{text}</button>;

const Page = () =>
  <main class={styles.Page}>
    <section class='v-space'>
      <h1 class={css`
        font-weight: 400;
        font-size: 32px;
        line-height: 32px;
      `}
      >
        Etch <span class={styles.ForceEmoji}>✏️</span>
      </h1>
      <p>Board size: {tileCountX}x{tileCountY}</p>
      <p>Tile size:
        <input
          type="number"
          value={tileSizePx}
          onInput={(ev) => {
            tileSizePx(Number((ev.target as HTMLInputElement).value));
          }}
          class={css`
          padding: ${sizes._01} ${sizes._02};
          margin-left: ${sizes._01};
          color: ${colours.gray._700};
          border-width: 2px;
          &:focus {
            border-color: ${colours.purple._300};
          }
        `}
        />
      </p>

      <div class='h-space'>
        <ClickButton text='X++' fn={() => tileCountX(tileCountX() + 1)}/>
        <ClickButton text='X--' fn={() => tileCountX(tileCountX() - 1)}/>
      </div>
      <div class='h-space'>
        <ClickButton text='Y++' fn={() => tileCountY(tileCountY() + 1)}/>
        <ClickButton text='Y--' fn={() => tileCountY(tileCountY() - 1)}/>
      </div>
    </section>

    <section>
      <div class={styles.Bordered}>
        {() => {
          console.log('Draw');
          return tiles().map((row, y) =>
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
      </div>
    </section>
  </main>;

const tileClick = ({ target }: { target: HTMLDivElement }) => {
  console.log('Click');
  if (!target.dataset.coord) return;
  const [x, y] = target.dataset.coord.split(',').map(Number);
  const arr = tiles();
  arr[y][x] = brushColour;
  console.log(`Updated (${x},${y})`, arr);
  tiles(arr);
};

document.body.appendChild(<Page />);
