/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';

const originalWarn = console.warn;
console.warn = (...args) => {
  const firstArg = args[0];
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('pointerEvents is deprecated')
  ) {
    return;
  }
  originalWarn(...args);
};

import App from './App';

AppRegistry.registerComponent(appName, () => App);
