import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { requestNotifications } from 'react-native-permissions';
import { getData } from './Utils/MethodsUtils';
import * as Constants from "./Constants";
import { Actions } from './navigation/RootNavigation';

let lastMessageId = 0
const SKIP_PIN_TTL_MS = 5000;
 const notificationState = {
  fromNotificationPress: false,
  skipPinOnce: false,
  skipPinExpiresAt: 0,
};

// The skip applies to one background-to-foreground transition and only while fresh.
const consumeSkipPinOnce = () => {
  const shouldSkip =
    notificationState.skipPinOnce && Date.now() <= notificationState.skipPinExpiresAt;
  notificationState.skipPinOnce = false;
  notificationState.skipPinExpiresAt = 0;
  return shouldSkip;
};
const showNotification = async (title: any, message: any, messageId: any) => {
  if (messageId != lastMessageId) {

    lastMessageId = messageId
    const channelId = await notifee.createChannel({
      id: messageId,
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });
    await notifee.displayNotification({
      title: title,
      body: message,
      android: {
        timestamp: new Date().getTime(),
        channelId: channelId,
        smallIcon: 'ic_stat_name',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    });
  }


}

const createNotificationChannel = async () => {
  if (Platform.OS == "ios") {
    await notifee.requestPermission()
  } else {
    // react-native-permissions v5 removed PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
    // notification permission now goes through the dedicated API.
    await requestNotifications(['alert', 'sound', 'badge']);
    await notifee.createChannel({
      id: 'default',
      name: 'Qubetics',
      vibration: true,
      badge: true,
      soundName: "default",
    } as any);
  }
}

const registerNotifeeListeners = async ()=>{  
   notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      notificationState.fromNotificationPress = true;
      notificationState.skipPinOnce = true;
      notificationState.skipPinExpiresAt = Date.now() + SKIP_PIN_TTL_MS;
                  getData(Constants.PIN_LOCK).then((pinLock) => {
              const isLoggedIn = pinLock && pinLock != "null";
              isLoggedIn && Actions.currentScene != "Welcome" &&
                Actions.currentScene != "EnterPin" &&
                Actions.currentScene != "NotificationsTab" &&
                (Actions as any).NotificationsTab({ themeSelected: 2 });
            });
    }
  });
}


export {notificationState, consumeSkipPinOnce, showNotification, createNotificationChannel, registerNotifeeListeners }
