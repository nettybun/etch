
// Created by the server (only) and broadcast to all clients
export type ServerBroadcastMessage = {
  'app/reload': {
    // None
  },
  'app/userPresence': {
    id: string
    status: 'online'|'away'|'joined'|'left'
  }
}

// Created by client and then broadcast to other clients via server
export type ClientBroadcastMessage = {
  'canvas/resize': {
    x: number
    y: number
  }
  'canvas/drawLine': {
    colour: string
    xyA: [number, number],
    xyB: [number, number],
  }
  'canvas/drawCircle': { // TODO: Ellipse later
    colour: string
    xy: number
    radius: number
  }
  'canvas/drawSquare': { // TODO: Rectangle later
    colour: string
    xy: number
    radius: number
  }
  'canvas/drawPixelArea': {
    // Top left to bottom right, where length matches region size
    pixels: string[]
    xyA: [number, number],
    xyB: [number, number],
  }
}

// These are not broadcast and are instead direct actions on the server
// Typical REST req/res client-initiated stuff
export type RequestResponseCall = {
  'app/init': {
    // Commit hash? Or JS build? I need to do sourcemap unwinding to find the
    // source code error location in app/error...
    version: string
  }
  'app/roomNew': {
    // None
  }
  'app/roomJoin': {
    id: string
  }
  // I think this is different than just closing the tab (i.e disconnecting)
  // Broadcast? Or does the server send app/userPresence instead?
  // No not broacast because that means "forward the message" which is bad here
  'app/roomLeave': {
    id: string
  }
  // Literally a JS error
  'app/error': {
    name: string
    message: string
    stack: string
  }
}

// Better to just use HTTP? Feel like I'm reinventing the wheel

type MessageName =
  | keyof ServerBroadcastMessage
  | keyof ClientBroadcastMessage
  | keyof RequestResponseCall

type MessagePayload =
  & ServerBroadcastMessage
  & ClientBroadcastMessage
  & RequestResponseCall


// Write something like this on both the client and server but with restricted
// messages. Now it'll autocomplete the correct payload for you.
const sendMessage = <T extends MessageName>(
  action: T,
  payload: MessagePayload[T]
): void => {
  // Send to the client/server
};
