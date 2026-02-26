jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: ({children}) => children,
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

global.fetch = jest.fn(() => Promise.reject(new Error('Network disabled in tests')));

// mock alert so we can assert calls
const {Alert, Clipboard} = require('react-native');
Alert.alert = jest.fn();
// Clipboard may not exist on older RN versions, ensure it's defined
if (Clipboard && typeof Clipboard.setString === 'function') {
  Clipboard.setString = jest.fn();
} else {
  // add simple mock object so imports don't break
  jest.mock('react-native', () => ({
    Clipboard: {setString: jest.fn()},
  }));
}
