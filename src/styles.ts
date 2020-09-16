import { decl, colours, sizes, css, injectGlobal, snippets } from 'styletakeout.macro';

// Most of this is lifted from Tailwind
injectGlobal`
  * {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #eee;
  }
  html {
    /* It's actually important to have the emoji fonts too */
    font-family: system-ui,Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Noto Color Emoji";
    line-height: 1.5;
  }
  body {
    background-color: ${decl.bodyBackground};
  }
  /* From Tailwind's preflight.css */
  body, blockquote, h1, h2, h3, h4, h5, h6, hr, figure, p, pre {
    margin: 0;
  }
  img, svg, video, canvas, audio, iframe {
    display: block;
  }
  img, video {
    max-width: 100%;
    height: auto;
  }
  .v-space > * {
    margin-bottom: ${sizes._04};
  }
  .v-space > :last-child {
    margin-bottom: 0;
  }
  .h-space > * {
    margin-right: ${sizes._04};
  }
  .h-space > :last-child {
    margin-right: 0;
  }
`;

// I recommend inlining styles to one object without pointing to variables.
// Then Ctrl+Hover will show you the full definition as a hint in VSCode.
const styles = {
  Page: css`
    display: flex;
    background-color: ${decl.pageBackground};
    padding: ${sizes._08};
    > section {
      flex: 1;
    }
    > :first-child {
      min-width: 300px;
      flex: 0;
    }
  `,
  ButtonBlue: css`
    min-width: 80px;
    color: ${colours.white};
    padding: ${sizes._02} ${sizes._04};
    background-color: ${colours.blue._400};
    border: 2px solid ${colours.blue._200};
    border-radius: 2px;
    ${snippets.text.xs}
    &:hover {
      background-color: ${colours.blue._500};
    }
  `,
  Bordered: css`
    display: inline-block;
    border: 1px solid ${colours.indigo._400};
  `,
  ForceEmoji: css`
    font-family: "Apple Color Emoji","Noto Color Emoji";
    font-size: 60%;
    vertical-align: middle;
  `,
};

export { styles };
