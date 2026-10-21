import { Component } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../navigation/RootNavigation';
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { Images } from "../../theme";
import { getData } from "../../Utils/MethodsUtils";
import { TabIconCustom } from "./TabIconCustom";

class CustomTabBarVpn extends Component<any, any> {
  translateY: any;
  bouncyAnimation: any;
  constructor(props: any) {
    super(props);
    this.state = {
      show: true,
      activeScene: "WalletMain",
      themeSelected: "",
      isBtcTrxPrivateKey: false,
      activeTabIndex: 0
    };
    this.translateY = new Animated.Value(20);
  }

  //******************************************************************************************/
  componentDidMount() {
    this.startAnimation();
    this.checkPrivateKeyWallet();
    EventRegister.addEventListener("isHistoryClicked", () => {
      this.setState({ activeTabIndex: 2 });
    });
    EventRegister.addEventListener("getThemeChanged", (data) => {
      this.setState({ themeSelected: data ? data : 2 });
    });
    getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
      this.setState({ themeSelected: theme });
    });
  }

  checkPrivateKeyWallet() {
    getData(Constants.MULTI_WALLET_LIST).then((list) => {
      const currentWalletList = JSON.parse(list);
      let currentWallet = currentWalletList.find((res: any) => res?.defaultWallet);
      if (currentWallet?.isPrivateKey) {
        if (currentWallet?.coinFamily == 3 || currentWallet?.coinFamily == 6) {
          if (Actions.currentScene == "DefiAccessMain") {
            Actions.pop();
          } else if (Actions.currentScene == "Swap") {
            Actions.pop();
          }
          this.setState({
            isBtcTrxPrivateKey: true,
          });
        } else {
          this.setState({
            isBtcTrxPrivateKey: false,
          });
        }
      } else {
        this.setState({
          isBtcTrxPrivateKey: false,
        });
      }
    });
  }
  startAnimation() {
    this.bouncyAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(this.translateY, {
          toValue: 50,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(this.translateY, {
          toValue: 20,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    this.bouncyAnimation.start();
  }

  componentDidUpdate(prevProps: any) { }

  //******************************************************************************************/

  //******************************************************************************************/

  //******************************************************************************************/
  navigateTab = (scene: any) => {
    this.setState({ activeScene: scene });
  };

  //******************************************************************************************/
  getTextColor(item: any, isActive: any) {
    const { themeSelected } = this.state;
    let color = "";
    if (themeSelected == 2) {
      color = isActive
        ? ThemeManager.colors.colorVariation
        : "rgba(79, 83, 83, 1)";
    } else {
      color = isActive ? "#24A09D" : ThemeManager.colors.lightGrayTextColor;
    }
    return color;
  }

  //******************************************************************************************/
  render() {
    const imgArr = [
      {
        scene: "VpnScreen",
        label: "VpnScreen",
        inactive: Images.home2,
      },
      {
        scene: "Main",
        label: "Main",
        inactive: ThemeManager.ImageIcons.vpn_wallet,
      },
      {
        scene: "RecentSessionScreen",
        label: "RecentSessionScreen",
        inactive: ThemeManager.ImageIcons.vpn_session,
      },
      {
        scene: "ServersScreen",
        label: "ServersScreen",
        inactive: ThemeManager.ImageIcons.vpn_globe_tab,
      },
      {
        scene: "VpnSettings",
        label: "VpnSettings",
        inactive: ThemeManager.ImageIcons.vpn_setting_tab,
      },

    ];

    if (!this.state.show) return null;

    return (
      <>
        <SafeAreaView
          style={{ backgroundColor: ThemeManager.colors.tabBarBgColor }}
        >
          <View
            style={[
              styles.ViewStyle1,
              { backgroundColor: ThemeManager.colors.tabBarBgColor },
            ]}
          >
            {imgArr.map((item, index) => {
              return (
                <TouchableOpacity
                  key={"key" + index}
                  onPress={() => {
                    Actions.currentScene != "jump" &&
                      Actions.jump(item.scene, { wc_url: "" });
                    (Singleton as any).fromWatchList = false;
                    this.setState({ activeScene: item.scene, activeTabIndex: index });
                  }}
                >
                  <TabIconCustom
                    focused={this.state.activeTabIndex == index}
                    themeSelected={this.state.themeSelected}
                    activeImg={item.inactive}
                    title={item.label}
                    titleColor={{
                      color: this.getTextColor(item, this.state.activeTabIndex == index),
                    }}
                    ImgSize={{}}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </>
    );
  }
}

//******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle1: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center",
    height: 65,
  },

});

export { CustomTabBarVpn };