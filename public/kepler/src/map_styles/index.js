import positron from './positron';
import dark_matter from './dark_matter';
import basic from './basic';
import bright from './bright';

const MAP_STYLES = [
  {
    name: 'positron',
    config: positron
  },
  {
    name: 'dark_matter',
    config: dark_matter
  },
  {
    name: 'basic',
    config: basic
  },
  {
    name: 'bright',
    config: bright
  }
];

export default MAP_STYLES;
