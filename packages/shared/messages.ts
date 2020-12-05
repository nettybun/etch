// Copied from client/src/types/etch.ts
type TileXY = [x: number, y: number]

// Created by the server (only) and broadcast to all clients
export type ServerClientBroadcast =
  | {
    type: 'app/reload'
  }
  | {
    type: 'app/userPresence'
    id: string
    status: 'online'|'away'|'joined'|'left'
  }

// Created by client and then broadcast to other clients via server
export type ClientClientBroadcast =
  | {
    type: 'canvas/resize'
    x: number
    y: number
  }
  | {
    type: 'canvas/drawLine'
    colour: string
    xyA: TileXY,
    xyB: TileXY,
  }
  | {
    type: 'canvas/drawCircle' // TODO: Ellipse later
    colour: string
    xyCenter: TileXY
    radius: number
  }
  | {
    type: 'canvas/drawPixelArea'
    // Top left to bottom right, where length matches region size
    pixels: string[]
    xyA: TileXY,
    xyB: TileXY,
  }

// These are not broadcast and are instead direct actions on the server
export type ClientServerDM =
  | {
    type: 'app/init'
    // Commit hash? Or JS build? I need to do sourcemap unwinding to find the
    // source code error location in app/error...
    version: string
  }
  | {
    // Literally a JS error
    type: 'app/error'
    name: string
    message: string
    stack: string
  }
  | {
    type: 'app/getBoardHistory'
  }
  | {
    type: 'app/clearBoardHistory'
  }

export type ServerClientDM =
  | {
    type: 'app/setName'
    name: string
  }
  // TODO: Oh noooo this is a messages that's not actually only a DM because I
  // end up broadcasting it to all clients :(
  | {
    type: 'app/setBoardHistory'
    history: Array<ServerClientBroadcast | ClientClientBroadcast>
  }

// Better to just use HTTP? Feel like I'm reinventing the wheel
