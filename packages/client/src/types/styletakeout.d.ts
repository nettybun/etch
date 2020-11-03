import 'styletakeout.macro';

declare module 'styletakeout.macro' {
  // Classes defined in injectGlobal
  const cl: {
    vspace: string
    hspace: string
    text: { [size in 'xs'|'sm'|'md'|'lg'|'xl']: string }
  };

  const decl: {
    pageBackground: string
    bodyBackground: string

    colour: typeof colours
    size: typeof sizes
  };

  const colours: {
    black: string,
    white: string
  } & {
    [color in
      | 'gray'
      | 'red'
      | 'orange'
      | 'yellow'
      | 'green'
      | 'teal'
      | 'blue'
      | 'indigo'
      | 'purple'
      | 'pink'
    ]: { [level in Shades]: string }
  };

  const sizes: {
    // Without the leading 0 autocomplete will order them wrong
    // If I made this "string" then autocomplete won't display the rem values
    _00: '0'
    _01: '0.25rem'
    _02: '0.5rem'
    _03: '0.75rem'
    _04: '1rem'
    _05: '1.25rem'
    _06: '1.5rem'
    _08: '2rem'
    _10: '2.5rem'
    _12: '3rem'
    _16: '4rem'
    _20: '5rem'
    _24: '6rem'
    _32: '8rem'
    _40: '10rem'
    _48: '12rem'
    _56: '14rem'
    _64: '16rem'
  };

  // Numbers can't be property names so prefix with '_'
  type Shades = '_100'|'_200'|'_300'|'_400'|'_500'|'_600'|'_700'|'_800'|'_900'
}
