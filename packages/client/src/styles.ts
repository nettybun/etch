import { decl, colours, sizes, css, injectGlobal, cl } from 'styletakeout.macro';

// CSS classname joining
const c = (...args: string[]) => args.join(' ');

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
  /* These are references with TS support via cl.xyz in .babelrc.json */
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
  .text-xs { font-size: 0.75rem ; }
  .text-sm { font-size: 0.875rem; }
  .text-md { font-size: 1rem    ; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem ; }
`;

// I recommend inlining styles to one object without pointing to variables.
// Then Ctrl+Hover will show you the full definition as a hint in VSCode.
const styles = {
  ButtonBlue: c(cl.text.xs, css`
    min-width: 80px;
    color: ${colours.white};
    padding: ${sizes._02} ${sizes._04};
    background-color: ${colours.blue._400};
    border: 2px solid ${colours.blue._200};
    border-radius: 2px;
    &:hover {
      background-color: ${colours.blue._500};
    }
  `),
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

export { c, styles };
