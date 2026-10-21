import { useEffect, useRef, useState } from "react";
import {
  AppState,
  Dimensions,
  Platform,
  StatusBar,
  View
} from "react-native";
import { hasNotch } from "react-native-device-info";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../navigation/RootNavigation';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { consoleLogFunc, getData } from "../../Utils/MethodsUtils";

function AppView(props: any) {
  const { height } = Dimensions.get("window");
  consoleLogFunc("height--SCREEN--", height);
  const insets = useSafeAreaInsets();
  const [screen, setscreen] = useState("");
  const [time, setTime] = useState(0);

  const accessTokenRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  /******************************************************************************************/
  useEffect(() => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      if (!!token) {
        accessTokenRef.current = token;
      }else{
        accessTokenRef.current = null;
      }
    });
  }, [screen]);

  useEffect(() => {
    const fromscreenListener = EventRegister.addEventListener("fromscreen", (data) => {
      setscreen(data);
    });
    
    const turnOffListener = EventRegister.addEventListener(
      "turnOffDapp",
      () => {
        const timeout = Singleton.getInstance().dappDisconnectTimeout || 0;
        setTime(timeout);
        clearTimeout(timeoutRef.current);
        lastTouchTime(timeout);
      }
    );

    return () => {
      EventRegister?.removeEventListener(turnOffListener as string);
      EventRegister?.removeEventListener(fromscreenListener as string);
    };
  }, []);

  useEffect(() => {
    const timeout = Singleton.getInstance().dappDisconnectTimeout || 0;
    setTime(timeout);
  }, []);

  const lastTouchTime = (customTime?: any) => {
    const currentTime = customTime !== undefined ? customTime : time;
    if (currentTime > 0 && accessTokenRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setTimeout(() => {
          if (
            Actions.currentScene != "EnterPin" &&
            Actions.currentScene != "Welcome" &&
            AppState.currentState == "active"
          ) {
            EventRegister.emit(Constants.DOWN_MODAL, "yes");
            (Actions as any).EnterPin();
          }
        }, 800);
      }, currentTime);
    }
  };

  const [theme, setTheme] = useState<any>(ThemeManager.colors.mainBgNew);

  useEffect(() => {
    const themeListener = EventRegister.addEventListener('getThemeChanged', () => {
      setTheme(ThemeManager.colors.mainBgNew);
    });
    return () => {
      EventRegister.removeEventListener(themeListener as string);
    };
  }, []);

  consoleLogFunc("StatusBar?.currentHeight", !hasNotch());
  return (
    <>
      <StatusBar
        barStyle={
          ThemeManager.colors.mode == "light" ? "dark-content" : "light-content"
        }
      />
      <View
        onTouchStart={() => {
          clearTimeout(timeoutRef.current);
          lastTouchTime();
        }}
        style={{
          flex: 1,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          backgroundColor: theme,
        }}
      >
        {props.children}
      </View>

    </>
  );
}

export { AppView };
