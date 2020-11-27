import { data } from './data.js';

let down = false;

const onKeyDown = (ev: KeyboardEvent) => {
  if (down) return;
  console.log('ev.shiftKey', ev.shiftKey, 'ev.ctrlKey', ev.ctrlKey);
  if (ev.shiftKey) {
    data.drawMode = 'STRAIGHT';
    down = true;
    return;
  }
  if (ev.ctrlKey) {
    data.drawMode = 'CIRCLE';
    down = true;
    return;
  }
};

const onKeyUp = (ev: KeyboardEvent) => {
  if (!ev.shiftKey && !ev.ctrlKey) {
    data.drawMode = 'LINE';
    down = false;
  }
};

const addKeyboardEventListeners = () => {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
};

export { addKeyboardEventListeners };
