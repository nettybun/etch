import { h, api } from './sinuous.js';
import { css, snippets, sizes } from 'styletakeout.macro';

import { styles } from './styles.js';
import { o } from 'sinuous/observable';

const number = o(0);

const Page = () =>
  <main class={`${styles.Page} space`}>
    <h1 class={css`font-weight: 400; ${snippets.text.xl_4}`}>Hi 🌺</h1>

    <p>This is a content</p>
    <p>{number}</p>

    <button
      class={styles.ButtonBlue}
      type="button"
      onClick={() => number(number() + 1)}
    >
      +1
    </button>
  </main>;

document.body.appendChild(<Page />);
