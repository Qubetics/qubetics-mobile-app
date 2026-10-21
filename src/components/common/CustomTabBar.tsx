import { Component } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { Images } from "../../theme/";
import { TabIconCustom } from "./TabIconCustom";
import { Actions } from '../../navigation/RootNavigation';
import { ThemeManager } from "../../../ThemeManager";
import { getData } from "../../Utils/MethodsUtils";
import Singleton from "../../Singleton";
import { LanguageManager } from "../../../LanguageManager";
import { EventRegister } from "react-native-event-listeners";
import * as Constants from "../../Constants";

class CustomTabBarComp extends Component<any, any> {
  translateY: any;
  bouncyAnimation: any;
  constructor(props: any) {
    super(props);
    this.state = {
      show: true,
      activeScene: 'WalletMain',
      themeSelected: '',
      isBtcTrxPrivateKey: false, // need to check if active tab bar icon is highlighted corrected without this or not
    };
    this.translateY = new Animated.Value(20);
  }

  //******************************************************************************************/
  componentDidMount() {
    this.startAnimation();
    this.checkPrivateKeyWallet();
    EventRegister.addEventListener('getThemeChanged', data => {
      this.setState({ themeSelected: data ? data : 2 });
    });
    getData(Constants.DARK_MODE_STATUS).then(async theme => {
      this.setState({ themeSelected: theme });
    });
  }

  checkPrivateKeyWallet() {
    getData(Constants.MULTI_WALLET_LIST).then(list => {
      const currentWalletList = JSON.parse(list);
      let currentWallet = currentWalletList.find((res: any) => res?.defaultWallet);
      if (currentWallet?.isPrivateKey) {
        if (currentWallet?.coinFamily == 3 || currentWallet?.coinFamily == 6) {
          if (Actions.currentScene == 'DefiAccessMain') {
            Actions.pop();
          } else if (Actions.currentScene == 'Swap') {
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
      ]),
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
    let color = '';
    if (themeSelected == 2) {
      color = isActive
        ? ThemeManager.colors.colorVariation
        : 'rgba(79, 83, 83, 1)';
    } else {
      color = isActive ? '#24A09D' : ThemeManager.colors.lightGrayTextColor;
    }
    return color;
  }

  //******************************************************************************************/
  render() {
    const { walletMain, portfolio } = LanguageManager;
    const imgArr = [
      {
        scene: 'WalletMain',
        label: walletMain.Wallet,
        inactive: ThemeManager.ImageIcons.dashBInActive,
      },
      {
        scene: 'Swap',
        label: 'Swap',
        inactive: ThemeManager.ImageIcons.swapInactive,
      },
      {
        scene: 'Portfolio',
        label: portfolio.Portfolio,
        inactive: ThemeManager.ImageIcons.portfolio_active,
      },
      {
        scene: 'DefiAccessMain',
        label: 'DApp',
        inactive: ThemeManager.ImageIcons.otcInactive,
      },
      {
        scene: "ChainAbstraction",
        label: 'ChainAbstraction',
        inactive: Images.chain_abstraction_icon || ThemeManager.ImageIcons.swapInactive,
      },
       {
        scene: 'VpnTab',
        label: 'VpnTab',
        inactive: Images.vpn_home_copy,
      },
    ];
    if (Platform.OS === 'android') {
      imgArr.splice(5, 1);
    }

    if (!this.state.show) return null;
    const { state } = this.props;
    const activeTabIndex = state.index;

    return (
      <SafeAreaView
        style={{ backgroundColor: ThemeManager.colors.tabBarBgColor }}
      >
        <View
          style={[styles.ViewStyle1]}
        >
          {imgArr.map((item, index) => {
            return (
              <TouchableOpacity
                key={'key' + index}
                disabled={
                  (index == 1 && this.state.isBtcTrxPrivateKey) ||
                  (index == 3 && this.state.isBtcTrxPrivateKey)
                }
                onPress={() => {
                  Actions.currentScene != 'jump' &&
                    Actions.jump(item.scene, { wc_url: '' });
                  (Singleton as any).fromWatchList = false;
                  this.setState({ activeScene: item.scene });
                }}>
                <TabIconCustom
                  focused={activeTabIndex == index}
                  themeSelected={this.state.themeSelected}
                  activeImg={item.inactive}
                  title={item.label}
                  titleColor={{
                    color: this.getTextColor(item, activeTabIndex == index),
                  }}
                  ImgSize={{}}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

    );
  }
}

//******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle1: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
    height: 65,
  },

});

export { CustomTabBarComp as CustomTabBar };
