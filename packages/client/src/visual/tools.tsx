import { h } from 'haptic';
import { css } from 'styletakeout.macro';
import { data } from '../data.js';

import type { DrawModes } from '../data.js';

const toolChoices: { [k in DrawModes]: string } = {
  LINE: 'Freehand line', // <svg/>,
  STRAIGHT: 'Straight line', // <svg/>,
  CIRCLE: 'Circle', // <svg/>,
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
          {icon}
        </label>
      </div>
    )}
  </div>;

export { Tools };
