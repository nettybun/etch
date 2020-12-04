import { h } from 'haptic';
import { css, cl } from 'styletakeout.macro';
import { data } from '../data.js';
import { c } from '../styles.js';

const swatch = css`
  display: inline-block;
  width: 32px;
  height: 32px;
  border-radius: 2px;
  border: 1px solid;
  margin: 10px 10px 0 0;
`;

const Swatch = ({ colour }: { colour: string }) =>
  <div
    class={swatch}
    style={{ 'background-color': colour }}
    onClick={() => { data.brushColour(colour); }}/>;

const Palette = () =>
  <div>
    <div>
      {() => data.palette().map(colour => <Swatch colour={colour}/>)}
    </div>
    <label
      for='colourInput'
      class={c(cl.text.xs, css`
        display: block;
        margin-top: 10px;
      `)}>
      Colour picker:
    </label>
    <input
      id='colourInput'
      type='color'
      value={data.brushColour}
      class={css`
        border: 1px solid grey;
        width: 100%;
      `}
      onChange={({ target }) => {
        const { value } = (target as HTMLInputElement);
        // This also updates the palette as needed
        data.brushColour(value);
      }}/>
  </div>;

export { Palette };
