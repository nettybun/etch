import { data } from './data.js';
import { TileXY, TileDrawCallback } from './types/etch.js';

const knownCallbacks: TileDrawCallback[] = [];
let rAFTilesToDraw: TileXY[] = [];
let rAFDrawScheduled = false;

const queueTileDraw = (tile: TileXY, colour: string) => {
  const { x, y } = tile;
  // This happens easily in drawing tools like drawCircle()
  if (x < 0 || y < 0 || x > data.tileCountX() || y > data.tileCountY()) {
    return;
  }
  if (data.tileData[y][x] === colour) {
    return;
  }
  data.tileData[y][x] = colour;

  rAFTilesToDraw.push(tile);
  // Call rAF only once since callbacks stack
  if (!rAFDrawScheduled) {
    requestAnimationFrame(() => {
      // There's usually only one callback registered in the system, so O(n)
      for (const callback of knownCallbacks) {
        for (const c of rAFTilesToDraw) {
          // The drawer, whoever it is (DOM/Canvas/WebGL etc) will get the
          // colour and sizing information themselves
          callback(c.x, c.y);
        }
      }
      rAFTilesToDraw = [];
      rAFDrawScheduled = false;
    });
    rAFDrawScheduled = true;
  }
};

const registerTileDrawCallback = (fn: TileDrawCallback) => {
  knownCallbacks.push(fn);
};

export { queueTileDraw, registerTileDrawCallback };
