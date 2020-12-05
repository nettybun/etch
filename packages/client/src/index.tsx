import { h } from 'haptic';
import { css, colours, cl, sizes, decl } from 'styletakeout.macro';
import { c, styles } from './styles.js';
import { data } from './data.js';
import { openWS, closeWS, sendMessage } from './websocket.js';

import { BoardCanvas } from './visual/board.js';
import { Palette } from './visual/palette.js';
import { ArrowButton } from './visual/arrowbutton.js';
import { Tools } from './visual/tools.js';

const {
  click,
  hover,
  tileCountX,
  tileCountY,
  tileSizePx,
} = data;

const ClickButton = ({ text, fn }: { text: string, fn: () => unknown }) =>
  <button class={styles.ButtonBlue} type="button" onClick={fn}>{text}</button>;

const Page = () =>
  <main>
    <section class={c(cl.vspace, css`
      position: fixed;
      width: 300px;
      height: 100%;
      background: ${decl.pageBackground};
      border-right: 2px solid ${colours.purple._200};
      padding: ${sizes._05};
    `)}>
      <h1 class={css`
        font-weight: 400;
        font-size: 32px;
        line-height: 32px;
      `}>
        Etch <span class={c(styles.ForceEmoji, cl.text.sm)}>✏️</span>
      </h1>
      <p>Hover: {hover}</p>
      <p>Last click: {click}</p>

      <div class={css`
        display: flex;
        align-items: center;
        font-size: 120%;
      `}>
        <ArrowButton obs={tileCountX}/>x
        <ArrowButton obs={tileCountY}/>@
        <ArrowButton obs={tileSizePx}/>px/tile
      </div>
      <Palette/>
      <Tools/>
    </section>

    <section class={c(cl.hspace, css`
      display: flex;
      padding: 20px;
      margin-left: 300px;
    `)}>
      <div>
        <BoardCanvas/>
      </div>
      <div class={cl.vspace}>
        {() => data.names().map(n => <p>{n}</p>)}
        <div class={cl.hspace}>
          <ClickButton text='Open WS' fn={openWS}/>
          <ClickButton text='Close WS' fn={closeWS}/>
          <ClickButton text='Clear Board' fn={() => {
            sendMessage({ type: 'app/clearBoardHistory' });
          }}/>
        </div>
        <pre class={c(cl.text.xs, css`
          background: ${colours.gray._100};
          border: 2px solid ${colours.gray._400};
          padding: 10px;
          min-width: 500px;
        `)}>
          {() => data.wsMessages().join('\n')}
        </pre>
      </div>
    </section>
  </main>;

document.body.appendChild(<Page/>);
openWS();
sendMessage({ type: 'app/getBoardHistory' });
