import 'react-native-get-random-values';
/**
 * Patch for Hermes bug: "TypeError: Error.stack getter called with an invalid receiver"
 * This happens when code tries to access .stack on something that isn't a "real" Error,
 * or on a proxied Error object.
 */
if (Error.prototype.hasOwnProperty('stack')) {
  const originalStackDescriptor = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
  if (originalStackDescriptor && typeof originalStackDescriptor.get === 'function') {
    const originalStackGetter = originalStackDescriptor.get;
    Object.defineProperty(Error.prototype, 'stack', {
      get() {
        try {
          return originalStackGetter.call(this);
        } catch (e) {
          // If the receiver is invalid, return an empty string or a placeholder
          return '';
        }
      },
      configurable: true,
    });
  }
}

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();
import 'whatwg-fetch';
import 'text-encoding-polyfill'
import 'react-native-url-polyfill/auto';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import './shim';

import '@react-native-anywhere/polyfill-base64';
import { AppRegistry, LogBox, Text, TextInput, BackHandler } from 'react-native';
import { name as appName } from './app.json';
import SplashScreen from 'react-native-splash-screen'
import 'react-native-randombytes';
import App from './src/App';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

// Polyfill BackHandler.removeEventListener which was removed in RN 0.78
const originalAddEventListener = BackHandler.addEventListener;
const subscriptionMap = new Map();

BackHandler.addEventListener = (eventName, handler) => {
  const subscription = originalAddEventListener(eventName, handler);
  subscriptionMap.set(handler, subscription);
  return subscription;
};

BackHandler.removeEventListener = (eventName, handler) => {
  const subscription = subscriptionMap.get(handler);
  if (subscription) {
    subscription.remove();
    subscriptionMap.delete(handler);
  }
};


// Firebase v22+ removed the v8 namespaced API (`messaging()`); use the modular API.
const messagingInstance = getMessaging(getApp());
if (!isDeviceRegisteredForRemoteMessages(messagingInstance)) {
  registerDeviceForRemoteMessages(messagingInstance);
}
setBackgroundMessageHandler(messagingInstance, async remoteMessage => {

});
LogBox.ignoreAllLogs();
SplashScreen.hide();


if (Text.defaultProps == null) {
  Text.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
}

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
  TextInput.defaultProps.allowFontScaling = false;
}


AppRegistry.registerComponent(appName, () => App);