import { h } from 'haptic';
import { data } from '../data.js';
import { throttle } from '../util.js';
import { createBoardCanvas, canvasEvTileXY } from '../drawing/boardCanvas.js';
import { createToolCircle, createToolLine, createToolStraight } from '../drawing/tools.js';

import type { BoardToolState, Tool } from '../types/etch.js';
import type { DrawModes } from '../data.js';

// Hard on the eyes if it's too fast...
const hoverThrottled = throttle(data.hover, 50);

const BoardCanvas = () => {
  let canvas: HTMLCanvasElement;
  try {
    canvas = createBoardCanvas();
  } catch (err) {
    return <div>Couldn't create a canvas: ${err}</div>;
  }

  // Support events and tools in this canvas

  // TODO: BoardToolState is... questionable. When changing tools, all states
  // could be reset and that'd be fine. In an FSM-model that might be onEnter
  // and onExit hooks to clear the cursorTiles on switch?
  const toolState: BoardToolState = {
    toolDown: undefined,
    toolUp:   undefined,
    toolMove: undefined,
    cursorTiles: [],
  };

  const tools: { [k in DrawModes]: Tool } = {
    LINE:     createToolLine(toolState),
    STRAIGHT: createToolStraight(toolState),
    CIRCLE:   createToolCircle(toolState),
  };

  canvas.addEventListener('mousedown', ev => {
    const xy = canvasEvTileXY(ev);
    tools[data.drawMode].evDown(xy);
  });
  canvas.addEventListener('mouseup', ev => {
    const xy = canvasEvTileXY(ev);
    tools[data.drawMode].evUp(xy);
    // Not tool related, but I want this canvas to have this
    const [x, y] = xy;
    data.click(`(${x}, ${y})`);
  });
  canvas.addEventListener('mousemove', ev => {
    const xy = canvasEvTileXY(ev);
    tools[data.drawMode].evMove(xy);
    // Not tool related, but I want this canvas to have this
    const [x, y] = xy;
    hoverThrottled(`(${ev.offsetX}, ${ev.offsetY}) ➡ (${x}, ${y})`);
  });

  return canvas;
};

export { BoardCanvas };
