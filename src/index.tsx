import { h } from './sinuous.js';
import { css, sizes, colours, snippets } from 'styletakeout.macro';
import { styles } from './styles.js';
import { data } from './data.js';

import { Tiles } from './visual/tiles.js';
import { Palette } from './visual/palette.js';

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
      <p>Board size: {tileCountX}x{tileCountY}</p>
      <p>Tile size:
        <input
          type="number"
          value={tileSizePx}
          onInput={(ev) => {
            tileSizePx(Number((ev.target as HTMLInputElement).value));
          }}
          class={css`
          padding: ${sizes._01} ${sizes._02};
          margin-left: ${sizes._01};
          color: ${colours.gray._700};
          border-width: 2px;
          &:focus {
            border-color: ${colours.purple._300};
          }
        `}
        />
      </p>

      <div class='h-space'>
        <ClickButton text='X++' fn={() => tileCountX(tileCountX() + 1)}/>
        <ClickButton text='X--' fn={() => tileCountX(tileCountX() - 1)}/>
      </div>
      <div class='h-space'>
        <ClickButton text='Y++' fn={() => tileCountY(tileCountY() + 1)}/>
        <ClickButton text='Y--' fn={() => tileCountY(tileCountY() - 1)}/>
      </div>
      <Palette />
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
