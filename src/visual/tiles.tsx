import { h } from '../sinuous.js';
import { styles } from '../styles.js';
import { data } from '../data.js';

const { tiles: { cursor, tileData, tileSizePx }, brushColour } = data;

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
  console.log('Click');
  if (!target.dataset.coord) return;

  const [x, y] = target.dataset.coord.split(',').map(Number);
  const arr = tileData();
  if (arr[y][x] === brushColour()) return;

  console.log(`Updated (${x},${y})`);
  cursor(`(${x},${y})`);
  arr[y][x] = brushColour();
  tileData(arr);
};

export { Tiles };
