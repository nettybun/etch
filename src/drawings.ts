import { Point } from './types/etch.js';

// Bresenham's Line Algorithm
// https://stackoverflow.com/q/4672279/
function drawLine(a: Point, b: Point) {
  const result: Point[] = [];
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const sx = (a.x < b.x) ? 1 : -1;
  const sy = (a.y < b.y) ? 1 : -1;
  let err = dx - dy;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Copy the point instead of passing by reference
    result.push({ x: a.x, y: a.y });
    if ((a.x === b.x) && (a.y === b.y)) {
      break;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy; a.x += sx;
    }
    if (e2 < dx) {
      err += dx; a.y += sy;
    }
  }
  return result;
}

// Midpoint Circle Algorithm
// https://rosettacode.org/wiki/Bitmap/Midpoint_circle_algorithm#Python
function drawCircle(center: Point, radius: number) {
  const result: Point[] = [];
  const { x: x0, y: y0 } = center;

  let f = 1 - radius;
  let ddf_x = 1;
  let ddf_y = -2 * radius;
  let x = 0;
  let y = radius;
  result.push(
    { x: x0, y: y0 + radius },
    { x: x0, y: y0 - radius },
    { x: x0 + radius, y: y0 },
    { x: x0 - radius, y: y0 }
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
      { x: x0 + x, y: y0 + y },
      { x: x0 - x, y: y0 + y },
      { x: x0 + x, y: y0 - y },
      { x: x0 - x, y: y0 - y },
      { x: x0 + y, y: y0 + x },
      { x: x0 - y, y: y0 + x },
      { x: x0 + y, y: y0 - x },
      { x: x0 - y, y: y0 - x }
    );
  }
  return result;
}

export { drawLine, drawCircle };
