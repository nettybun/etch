import { data } from './data.js';
import { TileXY, BoardDrawCallback } from './types/etch.js';

const knownBoards: BoardDrawCallback[] = [];

// TODO: Remove duplicates by using a hash system that serializes [x,y]?
// You can queue any number of changes to one xy and the canvas draws everything
let rAFTilesToDraw: Array<{ xy: TileXY, colour: string }> = [];
let rAFDrawScheduled = false;

// TODO: It's really common to do this:

// genLineXY(state.toolDown, xy).forEach(xyLoop => {
//   applyTileDataValue(xyLoop, colour);
//   queueTileDraw(xyLoop);
// });

// Which will do validation twice...

const validateTileXY = (xy: TileXY) => {
  const [x, y] = xy;
  // This happens easily in drawing tools like drawCircle()
  if (x < 0 || y < 0 || x >= data.tileCountX() || y >= data.tileCountY()) {
    return false;
  }
  return true;
};

const applyTileDataValue = (xy: TileXY, colour: string) => {
  if (!validateTileXY(xy)) {
    return;
  }
  const [x, y] = xy;
  data.tileData[y][x] = colour;
};

// Can be used to draw to a board _without_ writing to the data array
const queueTileDraw = (xy: TileXY, colour?: string) => {
  if (!validateTileXY(xy)) {
    return;
  }
  const [x, y] = xy;
  colour = colour || data.tileData[y][x];
  rAFTilesToDraw.push({ xy, colour });
  // Call rAF only once since rAFs stack
  if (!rAFDrawScheduled) {
    window.requestAnimationFrame(() => {
      // There's usually only one callback registered in the system, so O(n)
      for (const callback of knownBoards) {
        for (const { xy: xyLoop, colour } of rAFTilesToDraw) {
          callback(xyLoop, colour);
        }
      }
      rAFTilesToDraw = [];
      rAFDrawScheduled = false;
    });
    rAFDrawScheduled = true;
  }
};

const registerBoard = (fn: BoardDrawCallback) => {
  knownBoards.push(fn);
};

export { applyTileDataValue, queueTileDraw, registerBoard };
