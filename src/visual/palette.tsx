import { h } from 'sinuous';
import { css } from 'styletakeout.macro';
import { data } from '../data.js';

const { brushColour, palette } = data;

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
    onClick={() => { brushColour(colour); }}/>;

const Palette = () =>
  <div>
    <div>
      {() => palette().map(colour => <Swatch colour={colour}/>)}
    </div>
  </div>;

export { Palette };
