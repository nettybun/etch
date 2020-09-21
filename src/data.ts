import { o, computed, on } from 'sinuous/observable';
import LZString from 'lz-string/libs/lz-string.min.js';

const NO_CURSOR = '✖';
const DEFAULT_TILE_COUNT_X = 40;
const DEFAULT_TILE_COUNT_Y = 40;
const DEFAULT_TILE_SIZE_PX = 20;
const BG_COLOUR = '#FFF';
const DEFAULT_PALETTE = [
  '#000000', '#ff7e7e', '#ffc175',
  '#fbff87', '#9fff8c', '#6cf3ff',
  '#71a7ff', '#9583ff', '#ff95ff',
];

const tileCountX = o(DEFAULT_TILE_COUNT_X);
const tileCountY = o(DEFAULT_TILE_COUNT_Y);
const tileSizePx = o(DEFAULT_TILE_SIZE_PX);

// Colours
const palette = o(DEFAULT_PALETTE);
const brushColour = o(DEFAULT_PALETTE[0]);

on([brushColour], () => {
  const value = brushColour();
  const pals = palette();
  if (!pals.includes(value)) {
    pals.push(value);
    palette(pals);
  }
}, null, true);

// Tiles
// Can't use new Array().fill(new Array()) since it's filling a shared object
const newTiles = (x: number, y: number) => {
  const arr = new Array<string[]>(y);
  for (let i = 0; i < y; i++) arr[i] = new Array<string>(x);
  return arr;
};
// ReferenceError: Can't access lexical declaration 'tiles' before initialization
const tilesEmpty = newTiles(tileCountX(), tileCountY());
for (const row of tilesEmpty) row.fill(BG_COLOUR);
const tileData = o(tilesEmpty);

on([tileCountY, tileCountX], () => {
  console.log('Size change');
  const current = tileData();
  const [cX, cY] = [tileCountX(), tileCountY()];
  const tilesNew = newTiles(cX, cY);
  // Carry-over the current values
  for (let y = 0; y < cY; y++)
    for (let x = 0; x < cX; x++)
      tilesNew[y][x]
        = (y < current.length && x < current[y].length)
          ? current[y][x]
          : BG_COLOUR;
  tileData(tilesNew);
}, null, true);

export const data = {
  hover: o(NO_CURSOR),
  click: o(NO_CURSOR),
  tiles: {
    tileData,
    tileCountX,
    tileCountY,
    tileSizePx,
    lzData(): string {
      const encoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const pals = palette();
      const palMap: { [key in string]: string } = {};
      for (let i = 0; i < pals.length; i++) palMap[pals[i]] = encoding[i];

      const asFile = {
        palette: pals,
        data: tileData().map(row => row.map(text => palMap[text] || '.').join('')).join(','),
      };
      const serialized = JSON.stringify(asFile);
      return `${serialized}\n\n${LZString.compressToEncodedURIComponent(serialized)}`;
    },
  },
  brushColour,
  palette,
};

// @ts-ignore
window.data = data;
