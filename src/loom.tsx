import { observable, h } from 'sinuous';
import type { Observable } from 'sinuous/observable/src';

// I will need to hook this up to an observable later, I imagine...
const DEFAULT_W = 14;
const DEFAULT_H = 40;
const CURSOR_NA = 'N/A';

const Loom = ({ width, height }: { width?: number; height?: number }) => {
  // Keep it simple and store the hex colour directly in the data store
  // You absolutely need data in the width array else `row.map` doesn't run
  const loomData: Array<string[]>
    = (new Array(height || DEFAULT_H))
      .fill(new Array(width || DEFAULT_W)
        .fill('#000')
      );

  const cursor: Observable<string> = observable(CURSOR_NA);
  const status: Observable<string> = observable('');

  return (
    <div
      className="my-4 sm:flex sm:flex-row-reverse sm:justify-end"
    >
      <aside
        className="my-4 sm:mx-4"
      >
        <p>Hovered at: {cursor}</p>
        <p><em>Status: </em>{() => status && <code>{status}</code>}</p>
      </aside>
      <section
        className="inline-block overflow-auto bg-gray-100"
        onMouseOver={(ev: MouseEvent) => {
          if (!ev.target) return;
          const pixel = ev.target as HTMLDivElement;
          const { loomCoord } = pixel.dataset;
          if (!loomCoord) return;
          cursor(loomCoord);
          status('');
        }}
      >
        {loomData.map((row, rowIndex) =>
          <div>
            {row.map((col, colIndex) =>
              <div
                className="inline-block w-4 h-4 bg-gray-300 hover:bg-gray-500"
                style="margin: 1px"
                data-loom-coord={`x${colIndex}y${rowIndex}`}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export { Loom };
