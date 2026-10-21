import React, { useState } from "react";
import { BackHandler, ImageBackground } from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import { consoleLogFunc, getData } from "../../../Utils/MethodsUtils";
import { AppAlert } from "../../common";
import ChainAbstractionSwap from "./ChainAbstractionSwap";

const ChainAbstraction = (props: any) => {
  const [, SetThemeSelected] = useState("");
  const [alertData, setAlertData] = useState({
    isShow: false,
    msg: "",
  });

  /******************************************************************************************/
  React.useEffect(() => {
    EventRegister.addEventListener("getThemeChanged", (data) => {
      SetThemeSelected(data);
    });
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
        SetThemeSelected(theme);
      });
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });
    return () => {
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
    };
  }, []);

  /******************************************************************************************/
  const handleBackButtonClick = () => {
    consoleLogFunc("Backhandler Swap");
    Singleton.bottomBar?.navigateTab("WalletMain");
    Actions.pop();
    return true;
  };



  /******************************************************************************************/
  return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
      

        <ChainAbstractionSwap  navigation={props.navigation} />

        <AppAlert
          visible={alertData.isShow}
          alertTxt={alertData.msg}
          hideAlertDialog={() => {
            setAlertData({ isShow: false, msg: "" });
          }}
        />

      </ImageBackground>
  );
};

export default ChainAbstraction;
