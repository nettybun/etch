import { h } from 'sinuous';
import { css, colours, snippets } from 'styletakeout.macro';
import { data } from '../data.js';

const { brushColour } = data;

const gradientHue = css`
  width: 100%;
  height: 30px;
  margin-top: 10px;
  border: 1px solid grey;
  background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
`;
const gradientSaturation = css`
  background-image: linear-gradient(to right, #fff, rgba(204, 154, 129, 0));
`;
const gradientValue = css`
  background-image: linear-gradient(to top, #000, rgba(204, 154, 129, 0));
`;
// Use `top` to move the slider
const colourPicker = css`
  position: absolute;
  cursor: pointer;
  height: 5px;
  top: 0;
  left: -5px;
  right: -5px;
  border: 5px solid ${colours.gray._200};
  background: white;
  opacity: 0.5;
`;

const ColourPicker = () =>
  <div style='width: 200px;'>
    <div
      style='background-color: red;'
      class={css`
        position: relative;
        border: 1px solid grey;
        width: 200px;
        height: 200px;
        > div {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
      `}>
      <div class={gradientSaturation}/>
      <div class={gradientValue}/>
    </div>
    <div class={gradientHue}/>

    <label
      for='colourInput'
      class={css`
        display: block;
        margin-top: 10px;
        ${snippets.text.sm}
      `}>
      Browser colour picker:
    </label>
    <input
      id='colourInput'
      type='color'
      value={brushColour}
      class={css`
        border: 1px solid grey;
        width: 100%;
      `}
      onChange={({ target }) => {
        const { value } = (target as HTMLInputElement);
        // This also updates the palette as needed
        brushColour(value);
      }}/>
  </div>;

export { ColourPicker };
