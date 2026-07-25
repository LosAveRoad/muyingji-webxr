const COLORS = {
  OFF: '#111',
  WHITE: '#f0f0f0',

  DARKRED: '#4a160f',
  RED: '#b7472a',
  BRIGHTRED: '#e58b55',

  DARKBLUE: '#4b3615',
  BLUE: '#d4af37',
  BRIGHTBLUE: '#f4d675',

  YELLOW: '#fff568',

  UI_ACCENT: '#d4af37',
  UI_ACCENT2: '#b7472a'
};

COLORS.schemes = {
  gold: {
    name: 'Black Gold',
    off: '#050403',
    primary: '#D4AF37',
    primarybright: '#F4D675',
    secondary: '#9B7B23',
    secondarybright: '#D4AF37',
    tertiary: '#E8C85A'
  },

  default: {
    name: 'Super Medium',
    off: '#111',
    primary: COLORS.RED,
    primarybright: COLORS.BRIGHTRED,
    secondary: COLORS.BLUE,
    secondarybright: COLORS.BRIGHTBLUE,
    tertiary: COLORS.YELLOW
  },

  blue: {
    name: 'Star Warrior',
    off: '#111',
    primary: '#1e4482',
    primarybright: '#0B4BB3',
    secondary: '#c27727',
    secondarybright: '#FFD840',
    tertiary: '#d7fdf9'
  },

  purple: {
    name: 'Galactic Royal',
    off: '#111',
    primary: '#6A39B3',
    primarybright: '#B685FF',
    secondary: '#FAF239',
    secondarybright: '#FFFC9E',
    tertiary: '#50FFF2'
  },

  green: {
    name: 'Space Joker',
    off: '#111',
    primary: '#779E37',
    primarybright: '#C0FF59',
    secondary: '#6A39B3',
    secondarybright: '#B685FF',
    tertiary: '#FAFAFA'
  },

  yellow: {
    name: 'Solar Flare',
    off: '#111',
    primary: '#C2C04C',
    primarybright: '#FAF761',
    secondary: '#E03A3E',
    secondarybright: '#FA7578',
    tertiary: '#278ECC'
  },

  red: {
    name: 'Trail Blazer',
    off: '#111',
    primary: '#E03A3E',
    primarybright: '#FA7578',
    secondary: '#DADADA',
    secondarybright: '#EFEFEF',
    tertiary: '#666'
  },

  rgb: {
    name: 'Mint Choco',
    off: '#111',
    primary: '#34eb89',
    primarYBRIGht: '#40fb95',
    secondary: '#34ebd8',
    secondarybright: '#40fbeA',
    tertiary: '#eb3434'
  },

  cheetah: {
    name: 'Cheetah SoL',
    off: '#111',
    primary: '#c27727',
    primarYBright: '#e68319',
    secondary: '#635c54',
    secondarybright: '#8a857f',
    tertiary: '#ebebeb'
  },

  black: {
    name: 'Ash Nova',
    off: '#111',
    primary: '#555',
    primarybright: '#808080',
    secondary: '#FFF',
    secondarybright: '#FFF',
    tertiary: '#B8B8B8'
  }
};

COLORS.options = Object.keys(COLORS.schemes);

if (typeof localStorage === 'undefined') {
  COLORS.initial = 'gold';
} else {
  COLORS.initial = COLORS.schemes.gold;
}

module.exports = COLORS;
