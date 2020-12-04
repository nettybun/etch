// The X,Y location within a board. Not the browser pixel offset.
export type TileXY = [x: number, y: number];

// When a rAF callback is running, all canvases are updated by calling their
// respective BoardDrawCallback functions which they've registered during
// inititalization (see visual/board.tsx for an example)
export type BoardDrawCallback = (xy: TileXY, colour: string) => void;

// Canvases can optionally receive draw events from tools. Tools receive state,
// specific to the canvas instance, that is shared among all tools. Internally
// they may have their own state
export type BoardToolState = {
  toolDown: TileXY | undefined;
  toolUp:   TileXY | undefined;
  toolMove: TileXY | undefined;
  cursorTiles: TileXY[];
}

// Tools define methods for (begin, move, end) aka (down, move, up)
export type Tool = {
  name: string;
  evDown: (xy: TileXY) => void;
  evUp:   (xy: TileXY) => void;
  evMove: (xy: TileXY) => void;
}

// Tools must be instantiated with an instance per drawable/interactable canvas
export type ToolCreator = (boardState: BoardToolState) => Tool;
