import { TileXY } from './types/etch.js';
/* eslint-disable prefer-const, no-constant-condition*/

// Bresenham's Line Algorithm
// https://stackoverflow.com/q/4672279/
function genLineXY(a: TileXY, b: TileXY) {
  let [aX, aY] = a;
  let [bX, bY] = b;
  const result: TileXY[] = [];
  const dx = Math.abs(bX - aX);
  const dy = Math.abs(bY - aY);
  const sx = (aX < bX) ? 1 : -1;
  const sy = (aY < bY) ? 1 : -1;
  let err = dx - dy;
  while (true) {
    // Copy the point instead of passing by reference
    result.push([aX, aY]);
    if ((aX === bX) && (aY === bY)) {
      break;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy; aX += sx;
    }
    if (e2 < dx) {
      err += dx; aY += sy;
    }
  }
  return result;
}

// Midpoint Circle Algorithm
// https://rosettacode.org/wiki/Bitmap/Midpoint_circle_algorithm#Python
function genCircleXY(center: TileXY, radius: number) {
  const result: TileXY[] = [];
  const [x0, y0] = center;

  let f = 1 - radius;
  let ddf_x = 1;
  let ddf_y = -2 * radius;
  let x = 0;
  let y = radius;
  result.push(
    [x0, y0 + radius],
    [x0, y0 - radius],
    [x0 + radius, y0],
    [x0 - radius, y0]
  );
  while (x < y) {
    if (f >= 0) {
      y -= 1;
      ddf_y += 2;
      f += ddf_y;
    }
    x += 1;
    ddf_x += 2;
    f += ddf_x;
    result.push(
      [x0 + x, y0 + y],
      [x0 - x, y0 + y],
      [x0 + x, y0 - y],
      [x0 - x, y0 - y],
      [x0 + y, y0 + x],
      [x0 - y, y0 + x],
      [x0 + y, y0 - x],
      [x0 - y, y0 - x]
    );
  }
  return result;
}

export { genLineXY, genCircleXY };
