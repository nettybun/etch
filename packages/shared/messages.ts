
// Created by the server (only) and broadcast to all clients
export type ServerBroadcastedMsg =
  | {
    type: 'app/reload'
  }
  | {
    type: 'app/userPresence'
    id: string
    status: 'online'|'away'|'joined'|'left'
  }

// Created by client and then broadcast to other clients via server
export type ClientBroadcastedMsg =
  | {
    type: 'canvas/resize'
    x: number
    y: number
  }
  | {
    type: 'canvas/drawLine'
    colour: string
    xyA: [number, number],
    xyB: [number, number],
  }
  | {
    type: 'canvas/drawCircle' // TODO: Ellipse later
    colour: string
    xy: number
    radius: number
  }
  | {
    type: 'canvas/drawSquare' // TODO: Rectangle later
    colour: string
    xy: number
    radius: number
  }
  | {
    type: 'canvas/drawPixelArea'
    // Top left to bottom right, where length matches region size
    pixels: string[]
    xyA: [number, number],
    xyB: [number, number],
  }

// These are not broadcast and are instead direct actions on the server
export type ClientSentMsg =
  | {
    type: 'app/init'
    // Commit hash? Or JS build? I need to do sourcemap unwinding to find the
    // source code error location in app/error...
    version: string
  }
  | {
    type: 'app/crdtSave'
    // The entire CRDT?
    data: string
  }
  | {
    type: 'app/crdtPush'
    // The new data?
    data: string
  }
  | {
    type: 'app/crdtSubscribe'
    id: string
  }
  | {
    // Different than just closing the tab (i.e disconnecting)
    // Broadcast? Or does the server send app/userPresence instead?
    // No, that means "forward the message" which is bad here
    type: 'app/crdtUnsubscribe'
    id: string
  }
  | {
    // Literally a JS error
    type: 'app/error'
    name: string
    message: string
    stack: string
  }

export type ServerSentMsg =
  | {
    type: 'app/crdtPush'
    // ??
  }

// Better to just use HTTP? Feel like I'm reinventing the wheel
