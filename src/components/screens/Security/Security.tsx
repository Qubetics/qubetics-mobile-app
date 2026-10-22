import { Component } from "react";
import {
  Animated,
  BackHandler,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import {
  getDimensionPercentage as dimen,
  widthDimen
} from "../../../Utils";
import { consoleLogFunc, getData, saveData } from "../../../Utils/MethodsUtils";
import { Colors, Images } from "../../../theme";
import {
  AppAlert,
  CardView,
  HeaderMain,
  LoaderView,
  SessionTimeout
} from "../../common";
class Security extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      bioMetricMode: this.props.isBioMatricData,
      themeSelected: "",
      isBiometricSupported: "false",
      showAlertDialog: false,
      alertTxt: "",
      anim: new Animated.Value(0),
      showSessionTimeOut: false,
      isLoading: false
    };
  }

  /******************************************************************************************/
  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackButtonClick);

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showSessionTimeOut: false,
        showAlertDialog: false,
        alertTxt: "",
      });
    });

    this.props.navigation.addListener('focus', (event: any) => {
      getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
        this.setState({ themeSelected: theme });
      });
      EventRegister.addEventListener("getThemeChanged", (data) => {
        this.setState({ themeSelected: data });
      });
      getData(Constants.BIOMETRIC_SUPPORTED).then((res) => {
        this.setState({ isBiometricSupported: res });
      });
      getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
        bio_mode == "true"
          ? this.setState({ bioMetricMode: true })
          : this.setState({ bioMetricMode: false });
      });
      this.setState({ isLoading: true });
      setTimeout(() => {
        this.setState({ isLoading: false });
      }, 200);
    });
  }

  handleBackButtonClick() {
    consoleLogFunc('back----');
    Actions.pop()

    return true;
  };

  /******************************************************************************************/
  toggleBioMetricMode() {
    consoleLogFunc('toggleBioMetricMode--', this.state.bioMetricMode);
    consoleLogFunc('toggleBioMetricMode--', this.state.isBiometricSupported);

    if (this.state.bioMetricMode) {
      saveData(Constants.BIOMETRIC_MODE, "false");
      this.setState({ bioMetricMode: false });
      if (this.state.isBiometricSupported == "true") {
        Singleton.getInstance().deleteKeyChainData()
      }
    } else {
      consoleLogFunc('toggleBioMetricMode--else --- 1111');
      if (this.state.isBiometricSupported == "true") {
        consoleLogFunc('toggleBioMetricMode--else --- 2222');
        Singleton.getInstance().walletPinCallback = async (pin: any) => {
          try {
            await Singleton.getInstance().handleSetItemUsingTouchIDOnPress(pin).then(() => {
              saveData(Constants.BIOMETRIC_MODE, "true");
              saveData(Constants.NEW_USER, "true");
              this.setState({ bioMetricMode: true });
            })
          } catch (error: any) {
          }
        };
        Actions.currentScene !== "EnterPinSecurity" &&
          (Actions as any).EnterPinSecurity({
            from: "Security",
            fromScreen: "Security",
          });

      } else {
        this.setState({
          showAlertDialog: true,
          alertTxt: LanguageManager.alertMessages.systemSecurityIsNotEnabled,
        });
      }
    }
  }

  /******************************************************************************************/
  render() {
    const { referral, pins } = LanguageManager;
    const { themeSelected } = this.state;
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <HeaderMain
          BackButtonText={referral.security}
          customStyle={{
            paddingHorizontal: widthDimen(24),
          }}
        />

        <CardView
          isToggle={true}
          mainCard={true}
          viewStyle={{ justifyContent: "center" }}
          leftImg={true}
          leftIcon={Images.biometricNew}
          leftText={pins.biometric}
          imgIcon={
            this.state.bioMetricMode
              ? ThemeManager.ImageIcons.toggleNewIcon
              : ThemeManager.ImageIcons.toggleOff
          }
          showIcon={true}
          mainStyle={{ marginTop: dimen(24) }}
          hideBottom={true}
          onPressToggle={() => this.toggleBioMetricMode()}
          themeSelected={themeSelected}
        />

        <CardView
          viewStyle={{ justifyContent: "center" }}
          leftImg={true}
          leftIcon={Images.lockIcon}
          leftText={pins.resetCode}
          imgIcon={ThemeManager.ImageIcons.rightArrow}
          hideBottom={false}
          onPress={() => {
            Actions.currentScene !== "EnterPinSecurity" &&
              (Actions as any).EnterPinSecurity({ from: "Security" });
          }}
          mainStyle={{ marginTop: dimen(0) }}
          themeSelected={themeSelected}
        />

        <CardView
          viewStyle={{ justifyContent: "center" }}
          leftImg={true}
          leftIcon={Images.lockIcon}
          leftText={pins.autoLock}
          imgIcon={ThemeManager.ImageIcons.rightArrow}
          hideBottom={false}
          onPress={() => {
            Actions.currentScene !== "AutoLock" &&
              (Actions as any).AutoLock();
          }}
          mainStyle={{ marginTop: dimen(0) }}
          themeSelected={themeSelected}
        />

        <SessionTimeout
          handleBack={() => {
            this.setState({ showSessionTimeOut: false });
            Actions.pop();
          }}
          showSessionTimeoutModal={this.state.showSessionTimeOut}
        />

        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false });
          }}
        />
        <LoaderView isLoading={this.state.isLoading} />
      </BackgroundImage>
    );
  }
}

export default Security;
