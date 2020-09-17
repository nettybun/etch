import { h } from '../sinuous.js';
import { css } from 'styletakeout.macro';
import { data } from '../data.js';

const { brushColour, palette } = data;

const swatch = css`
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 2px;
  border: 1px solid;
  margin: 10px 10px 0 0;
`;

const ColourInput = () =>
  <input
    type='color'
    value={brushColour}
    onInput={({ target }) => {
      const { value } = (target as HTMLInputElement);
      // This also updates the palette as needed
      brushColour(value);
    }}
  />;

const Swatch = ({ colour }: { colour: string }) =>
  <div
    class={swatch}
    style={{ 'background-color': colour }}
    onClick={() => { brushColour(colour); }}
  />;

const Palette = (): h.JSX.Element =>
  <div>
    <ColourInput />
    <div>
      {() => palette().map(colour => <Swatch colour={colour} />)}
    </div>
  </div>;

export { Palette };
