import { data } from '../data.js';
import { colours } from 'styletakeout.macro';
import { applyTileDataValue, queueTileDraw } from '../rAF.js';
import { genCircleXY, genLineXY } from '../drawing/shapeGenerators.js';
import { sendMessage } from '../websocket.js';

import type { BoardToolState, TileXY, Tool, ToolCreator } from '../types/etch.js';

// Tools are...kind of a State Pattern? Only two states though.
// Also at the same time they're a Strategy Pattern...

// There's an opportunity to have classes and inheritance, and I went down that
// road, but it got weird with calls like `super.evDown()`

const cursorDraw = (state: BoardToolState, xy: TileXY) => {
  state.cursorTiles.push(xy);
  queueTileDraw(xy, colours.gray._400);
};

const cursorClear = (state: BoardToolState) => {
  state.cursorTiles.forEach(xy => {
    // Restore the data.tileData value
    queueTileDraw(xy);
  });
  state.cursorTiles = [];
};

const toolMoveDuplicate = (state: BoardToolState, xy: TileXY) => {
  return (
    state.toolMove
    && state.toolMove[0] === xy[0]
    && state.toolMove[1] === xy[1]
  );
};

const createToolCursor: ToolCreator = (state) => {
  return {
    name: 'Cursor',
    evDown(xy) {
      state.toolDown = xy;
    },
    evUp(xy) {
      state.toolDown = undefined;
      // Maybe end of a brush stroke, clear any cursors
      cursorClear(state);
    },
    // Draw cursor
    evMove(xy) {
      if (toolMoveDuplicate(state, xy)) {
        return;
      }
      state.toolMove = xy;
      cursorClear(state);
      cursorDraw(state, xy);
    },
  };
};

const createToolLine: ToolCreator = (state) => {
  return {
    name: 'Freehand line tool',
    evDown(xy) {
      state.toolDown = xy;
      queueTileDraw(xy, data.brushColour());
    },
    evUp(xy) {
      state.toolDown = undefined;
      // Maybe end of a brush stroke, clear any cursors
      cursorClear(state);
      queueTileDraw(xy, data.brushColour());
    },
    evMove(xy) {
      if (toolMoveDuplicate(state, xy)) {
        return;
      }
      state.toolMove = xy;
      cursorClear(state);
      if (!state.toolDown) {
        cursorDraw(state, xy);
        return;
      }
      // Browsers throttle mousemove. Quickly moving a mouse across an entire
      // screen in ~0.5s returns maybe 5 readings. This fills in the gaps...
      const colour = data.brushColour();
      genLineXY(state.toolDown, xy).forEach(xyLoop => {
        applyTileDataValue(xyLoop, colour);
        queueTileDraw(xyLoop);
      });
      sendMessage({
        type: 'canvas/drawLine',
        xyA: state.toolDown,
        xyB: xy,
        colour,
      });
      // Move along the line in chunks
      state.toolDown = xy;
    },
  };
};

const createToolStraight: ToolCreator = (state) => {
  return {
    name: 'Straight line tool',
    evDown(xy) {
      state.toolDown = xy;
      queueTileDraw(xy, data.brushColour());
    },
    evUp(xy) {
      // Maybe end of a brush stroke, clear any cursors
      cursorClear(state);
      if (!state.toolDown) {
        return; // Should never happen, but TS
      }
      const colour = data.brushColour();
      genLineXY(state.toolDown, xy).forEach(xyLoop => {
        applyTileDataValue(xyLoop, colour);
        queueTileDraw(xyLoop);
      });
      sendMessage({
        type: 'canvas/drawLine',
        xyA: state.toolDown,
        xyB: xy,
        colour,
      });
      state.toolDown = undefined;
    },
    evMove(xy) {
      if (toolMoveDuplicate(state, xy)) {
        return;
      }
      state.toolMove = xy;
      cursorClear(state);
      // If not down yet, copy freehand line cursor behavior
      if (!state.toolDown) {
        cursorDraw(state, xy);
        return;
      }
      genLineXY(state.toolDown, xy).forEach(xyLoop => {
        cursorDraw(state, xyLoop);
      });
      // Keep the first pixel coloured to show that the process has started
      queueTileDraw(state.toolDown, data.brushColour());
    },
  };
};

const createToolCircle: ToolCreator = (state) => {
  const calcRadius = (xyA: TileXY, xyB: TileXY) => {
    const [aX, aY] = xyA;
    const [bX, bY] = xyB;
    return (
      Math.floor(Math.sqrt(Math.abs(aX - bX) ** 2 + Math.abs(aY - bY) ** 2))
    );
  };
  return {
    name: 'Circle tool',
    evDown(xy) {
      state.toolDown = xy;
      // Unlike other tools, this doesn't draw anything on mouse down
    },
    evUp(xy) {
      // Maybe end of a brush stroke, clear any cursors
      cursorClear(state);
      if (!state.toolDown) {
        return; // Should never happen, but TS
      }
      const colour = data.brushColour();
      const radius = calcRadius(state.toolDown, xy);
      genCircleXY(state.toolDown, radius).forEach(xyLoop => {
        applyTileDataValue(xyLoop, colour);
        queueTileDraw(xyLoop);
      });
      sendMessage({
        type: 'canvas/drawCircle',
        xyCenter: state.toolDown,
        colour,
        radius,
      });
      state.toolDown = undefined;
    },
    evMove(xy) {
      if (toolMoveDuplicate(state, xy)) {
        return;
      }
      state.toolMove = xy;
      cursorClear(state);
      // If not down yet, copy freehand line cursor behavior
      if (!state.toolDown) {
        cursorDraw(state, xy);
        return;
      }
      const radius = calcRadius(state.toolDown, xy);
      genCircleXY(state.toolDown, radius).forEach(xyLoop => {
        cursorDraw(state, xyLoop);
      });
    },
  };
};

export {
  createToolCursor,
  createToolLine,
  createToolStraight,
  createToolCircle
};
