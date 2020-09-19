import { h } from './sinuous.js';
import { css, sizes, colours, snippets } from 'styletakeout.macro';
import { styles } from './styles.js';
import { data } from './data.js';

import { Tiles } from './visual/tiles.js';
import { Palette } from './visual/palette.js';
import { ArrowButton } from './visual/arrowbutton.js';
import { ColourPicker } from './visual/colourpicker.js';

import { o } from 'sinuous/observable';
const lzDataText = o('');

const { tiles: { cursor, tileCountX, tileCountY, tileSizePx } } = data;

const ClickButton = ({ text, fn }: { text: string, fn: () => unknown }) =>
  <button class={styles.ButtonBlue} type="button" onClick={fn}>{text}</button>;

const Page = () =>
  <main class={styles.Page}>
    <section class='v-space' style='width: 400px;'>
      <h1 class={css`
        font-weight: 400;
        font-size: 32px;
        line-height: 32px;
      `}
      >
        Etch <span class={styles.ForceEmoji}>✏️</span>
      </h1>
      <p>Last click: {cursor}</p>

      <div class={css`
        display: flex;
        align-items: center;
        font-size: 120%;
      `}
      >
        <ArrowButton obs={tileCountX}/>x
        <ArrowButton obs={tileCountY}/>@
        <ArrowButton obs={tileSizePx}/>px/tile
      </div>
      <Palette />
      <ColourPicker />
    </section>

    <section style='flex: 1;'>
      <Tiles />
    </section>

    <section style='width: 400px;'>
      <ClickButton text='LZString' fn={() => lzDataText(data.tiles.lzData())}/>
      <pre class={css`
        white-space: pre-wrap;
        word-wrap: anywhere;
        ${snippets.text.xs}
      `}
      >
        {lzDataText}
      </pre>
    </section>
  </main>;

document.body.appendChild(<Page />);
