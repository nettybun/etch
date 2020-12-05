import { s, on, subscribe, sample } from 'haptic/s';
import { sendMessage } from './websocket.js';

type DrawModes = 'LINE' | 'STRAIGHT' | 'CIRCLE'

const UNKNOWN = '✖';
const DEFAULT_TILE_COUNT_X = 30;
const DEFAULT_TILE_COUNT_Y = 30;
const DEFAULT_TILE_SIZE_PX = 20;
const BG_COLOUR = '#FFF';
const DEFAULT_PALETTE = [
  '#000000', '#ff7e7e', '#ffc175',
  '#fbff87', '#9fff8c', '#6cf3ff',
  '#71a7ff', '#9583ff', '#ff95ff',
];

const data = {
  hover:       s(UNKNOWN),
  click:       s(UNKNOWN),
  // Tiles
  tileData:    [] as string[][],
  tileCountX:  s(DEFAULT_TILE_COUNT_X),
  tileCountY:  s(DEFAULT_TILE_COUNT_Y),
  tileSizePx:  s(DEFAULT_TILE_SIZE_PX),
  // Colours
  palette:     s(DEFAULT_PALETTE),
  brushColour: s(DEFAULT_PALETTE[0]),
  // Websocket
  names:       s([] as string[]),
  wsMessages:  s([] as string[]),
  // Shapes
  drawMode:    'LINE' as DrawModes,
};

subscribe(() => {
  const value = data.brushColour();
  const pals = sample(data.palette);
  if (!pals.includes(value)) {
    pals.push(value);
    data.palette(pals);
  }
});

// Tiles
// Can't use new Array().fill(new Array()) since it's filling a shared object
const genTiles = (x: number, y: number) => {
  const arr = new Array<string[]>(y);
  for (let i = 0; i < y; i++) arr[i] = new Array<string>(x);
  return arr;
};
// ReferenceError: Can't access lexical declaration 'tiles' before initialization
data.tileData = genTiles(data.tileCountX(), data.tileCountY());
for (const row of data.tileData) row.fill(BG_COLOUR);

on([data.tileCountX, data.tileCountY], () => {
  const [cX, cY] = [data.tileCountX(), data.tileCountY()];
  console.log('Size change');

  sendMessage({
    type: 'canvas/resize',
    x: cX,
    y: cY,
  });

  const tilesNew = genTiles(cX, cY);
  // Carry-over the current values
  for (let y = 0; y < cY; y++)
    for (let x = 0; x < cX; x++)
      tilesNew[y][x]
        = (y < data.tileData.length && x < data.tileData[y].length)
          ? data.tileData[y][x]
          : BG_COLOUR;
  data.tileData = tilesNew;
}, { onlyChanges: true });

// @ts-ignore
window.data = data;

// Types
export { DrawModes };
export { data };
