import { h, svg } from '../sinuous.js';
import { css, sizes } from 'styletakeout.macro';
import { Observable } from 'sinuous/observable';

const numberEditable = css`
  display: inline-block;
  background: transparent;
  border-bottom: 1px solid transparent;
  text-align: center;
  padding: 0 6px;
  font-size: ${sizes._06};
  &:focus {
    border-bottom: 1px solid;
  }
`;

const ArrowButton = (attrs: { obs: Observable<number> }): h.JSX.Element => {
  return (
    <div class={css`
      display: inline-flex;
      flex-direction: column;
      align-items: center;
    `}
    >
      {svg(() =>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="4 4 16 16" stroke="currentColor" width='20px' onClick={() => attrs.obs(attrs.obs() + 1)}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>)}
      {/* Originally I used an <input type='text'> but the CSS is wrong */}
      <span
        class={numberEditable}
        role="textbox"
        contentEditable
        // TODO: Add keyup/keydown and enter button handlers...
      >
        {attrs.obs}
      </span>
      {svg(() =>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="4 4 16 16" stroke="currentColor" width='20px' onClick={() => attrs.obs(attrs.obs() - 1)}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>)}
    </div>
  );
};

export { ArrowButton };
