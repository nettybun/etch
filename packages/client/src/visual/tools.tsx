import { h } from 'haptic';
import { css } from 'styletakeout.macro';
import { data } from '../data.js';

import type { DrawModes } from '../data.js';

const toolChoices: { [k in DrawModes]: h.JSX.Element } = {
  LINE: <p>Freehand line</p>, // <svg/>,
  STRAIGHT: <p>Straight line</p>, // <svg/>,
  CIRCLE: <p>Circle</p>, // <svg/>,
};

const Tools = () =>
  <div>
    {Object.entries(toolChoices).map(([mode, icon]) =>
      <div>
        <label for={mode}>
          <input
            type='radio'
            name='drawMode'
            checked={mode === data.drawMode}
            onChange={() => data.drawMode = mode as DrawModes}/>
          {mode}
        </label>
      </div>
    )}
  </div>;

export { Tools };
