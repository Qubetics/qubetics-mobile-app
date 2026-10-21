import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  NativeModules,
  Platform,
  BackHandler,
  ImageBackground,
  Image,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { ThemeManager } from "../../../../ThemeManager";
import { Button, CardView, HeaderMain, LoaderView } from "../../common";
import { LanguageManager } from "../../../../LanguageManager";
import styles from "./SettingsStyle";
import { clearStorage, consoleLogFunc, getData, saveData } from "../../../Utils/MethodsUtils";
import {
  getDimensionPercentage as dimen,
  widthDimen,
} from "../../../Utils";
import Toast from "react-native-easy-toast";
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { EventRegister } from "react-native-event-listeners";
import Singleton from "../../../Singleton";
import * as Constants from "../../../Constants";
import { ConfirmAlert } from "../../common/ConfirmAlert";
import {
  logoutUser,
} from "../../../Redux/Actions";
import { connect, useDispatch } from "react-redux";
import CommonModal from "../../common/CommonModal";
import WalletConnectInstance from "../../../Utils/WalletConnectInstance";
import { stopVPN } from "../../common/WireGuardNative";
import { logoutCosmosWallet } from "../../Api/VPN/api/authWithCosmosWallet";


const STATIC_LIST = [
  {
    id: 1,
    images: "manageAccountIcon",
    title: LanguageManager.manage.manageAccount,
    showView: false,
  },
  {
    id: 2,
    images: "securityIcon",
    title: LanguageManager.setting.security,
    showView: false,
  },
  {
    id: 3,
    images: "nativeCurrency",
    title: LanguageManager.setting.nativeCurrency,
    showView: true,
  },

  {
    id: 4,
    images: "walletConnect",
    title: LanguageManager.setting.walletConnect,
    showView: true,
  },
  {
    id: 5,
    images: "privacyPolicy",
    title: LanguageManager.setting.privacyPolicy,
    showView: false,
  },
  {
    id: 7,
    images: "transactionHistory",
    title: LanguageManager.merchantCard.transactionHistory,
    showView: false,
  },
  {
    id: 8,
    images: "addressBookIcon",
    title: LanguageManager.setting.addressBook,
    showView: true,
  },
  {
    id: 10,
    images: "logOutIcon",
    title: LanguageManager.setting.logout,
    showView: false,
  },
];

const Settings = (props: any) => {
  const dispatch: any = useDispatch();
  const toast = useRef<any>(null);
  const { setting } = LanguageManager;
  const [themeSelected, setThemeSelected] = useState<any>("");
  const [showAlertDialogConfirm, setshowAlertDialogConfirm] = useState(false);
  const [alertTxt, setalertTxt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBioMatric, setIsBioMatric] = useState(false);
  const [allUserIds, setAllUserIds] = useState<any[]>([]);
  const [logoutWarning, setLogoutWarning] = useState(false)
  const [checkedOne, setcheckedOne] = useState(false)
  const [checkedThree, setcheckedThree] = useState(false)

  useEffect(() => {
    EventRegister.addEventListener("getThemeChanged", (data) => {
      setThemeSelected({ themeSelected: data ? data : 2 });
    });
    consoleLogFunc("useeefect---setting");
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

    // REQUIRED HERE AS WELL SINCE focus IS NOT CALLED THE FIRST TIME
    getLogoutRequiredIds();
    const focusListener = props.navigation.addListener('focus', () => {
      consoleLogFunc("focus---setting");
      getLogoutRequiredIds();

      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
      getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
        consoleLogFunc("bio_mode----", bio_mode);
        bio_mode == "true" ? setIsBioMatric(true) : setIsBioMatric(false);
      });
    });
    const blurListener = props.navigation.addListener('blur', () => {

      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any)?.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setLogoutWarning(false);
      setshowAlertDialogConfirm(false);
    });
    return () => {
      consoleLogFunc("Removing event listeners");
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any)?.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  const getLogoutRequiredIds = async () => {
    let multiWalletArray = await getData(Constants.MULTI_WALLET_LIST);
    multiWalletArray = multiWalletArray ? JSON.parse(multiWalletArray) : [];
    consoleLogFunc("multiWalletArray -------", multiWalletArray);
    const tempMakerIds = [];
    const tempUserIds = multiWalletArray.map((val: any) => {
      const tempUserId = val.login_data.userId;
      if (val.login_data?.makerUserId) {
        tempMakerIds.push(val.login_data.makerUserId);
      }
      return tempUserId;
    });
    setAllUserIds(tempUserIds);
  };

  const onPressCard = (item: any) => {
    if (item.title == LanguageManager.manage.manageAccount) {
      Actions.currentScene != "MyWalletList" && (Actions as any).MyWalletList({ isFrom: "setting" });
    } else if (item.title == LanguageManager.setting.security) {
      Actions.currentScene != "Security" &&
        (Actions as any).Security({ isBioMatricData: isBioMatric });
    } else if (item.title == LanguageManager.setting.nativeCurrency) {
      Actions.currentScene != "Currency" && (Actions as any).Currency();
    } else if (item.title == LanguageManager.setting.addressBook) {
      Actions.currentScene != "AddressBook" &&
        (Actions as any).AddressBook({ themeSelected: themeSelected, symbol: "all" });
    } else if (item.title == LanguageManager.setting.walletConnect) {
      Actions.currentScene != "WalletConnection" && (Actions as any).WalletConnection();
    }
    else if (item.title == LanguageManager.setting.privacyPolicy) {
      (Actions as any).PrivacyPolicy({
        Viewtype: 'PrivacyPolicy',
        url: Constants.PRIVACY_POLICY_LINK,
      });
    } else if (item.title == LanguageManager.merchantCard.transactionHistory) {
      Actions.currentScene != "DetailTransaction" &&
        (Actions as any).DetailTransaction({
          themeSelected: themeSelected,
          symbol: "all",
        });
    } else if (item.title == LanguageManager.setting.logout) {
      logoutPressed();
    }
  };
  /******************************************************************************************/
  const logoutPressed = () => {
    setLogoutWarning(true);
  };

  /******************************************************************************************/
  const logout = () => {
    setshowAlertDialogConfirm(false);
    setLoading(true);

    getData(Constants.DEVICE_TOKEN).then((device_token) => {
      let data = {
        deviceId: Singleton.getInstance().unique_id,
        userIds: allUserIds,
        type: "all"
      };
      dispatch(logoutUser({ data }))
        .then(async (res: any) => {
          await logoutCosmosWallet();
          resetAppData(data)
        })
        .catch((err: any) => {
          consoleLogFunc("chk logotu err::::>>>>>>>>", err);
          resetAppData(data)
          setLoading(false);
        });
    });
  };

  const resetAppData = async (data: any) => {
    clearStorage();
    stopVPN()
    saveData(Constants.DEVICE_TOKEN, data.deviceToken);
    if (Platform.OS == "android") {
      var ClrStorageModule = NativeModules.EncryptionModule;
      ClrStorageModule.clearApplicationData();
    }
    await WalletConnectInstance.getInstance()?.deleteAllSessions()
    await Singleton.getInstance().deleteKeyChainData();
    // reset values for following case
    // on fresh install maker makes an account and login, then logout
    // then it imports a wallet (any checker) then these values were not being reset and causing issue
    // for example - not showing checker key codes
    Singleton.getInstance().isMakerWallet = false;

    setTimeout(() => {
      setLoading(false);

      saveData(Constants.DARK_MODE_STATUS, 1);
      saveData(Constants.AUTO_LOCK_TIMEOUT, 0);
      Singleton.getInstance().dappDisconnectTimeout = 0;
      EventRegister.emit("turnOffDapp");
      ThemeManager.setLanguage("darkMode");
      EventRegister.emit("getThemeChanged", 1);
      EventRegister.emit("theme", "#0C0C0D");
      LanguageManager.setLanguage("English");
      Singleton.getInstance().userRefCode = "";
      (global as any).isDeepLink = false;
      saveData(Constants.SELECTED_LANGUAGE, "en");

      Actions.currentScene != "Onboarding" &&
        (Actions as any).Onboarding({ type: ActionConst.RESET });
    }, 1200);
  };

  const handleBackButtonClick = () => {
    consoleLogFunc("Backhandler setting----");
    Singleton.bottomBar?.navigateTab("WalletMain");
    (Actions as any).Main({ type: ActionConst.RESET });

    return true;
  };

  const renderItem = ({ item, index }: {item: any; index: any}) => {
    return (
      <TouchableOpacity
        disabled={
          item.title == LanguageManager.setting.addressBook &&
          Singleton.getInstance().isMakerWallet
        }
        style={[styles.cardStyle, {}]}
        onPress={() => onPressCard(item)}
      >
        <View style={{ flex: 1 }}>
          <CardView
            disabled={
              item.title == LanguageManager.setting.addressBook &&
              Singleton.getInstance().isMakerWallet
            }
            imgStyle={{}}
            viewStyle={{ justifyContent: "center" }}
            leftImg={true}
            leftIcon={(ThemeManager.ImageIcons as any)?.[item.images]}
            leftText={item.title}
            gradientStyle={{}}
            imgIcon={ThemeManager.ImageIcons.rightArrow}
            showIcon={true}
            hideBottom={true}
            onPress={() => onPressCard(item)}
            themeSelected={themeSelected}
          />

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={setting.settings}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
        />


        <View style={styles.mainViewStyle}>
          <FlatList
            data={STATIC_LIST}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{
              marginTop: dimen(24),
              paddingBottom: dimen(24),
            }}
            renderItem={renderItem}
          />
        </View>
        <Toast
          ref={toast}
          position="bottom"
          positionValue={230}
          {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)}
        />
        {showAlertDialogConfirm && (
          <ConfirmAlert
            {...({} as any)}
            text={LanguageManager.addressBook.yes}
            alertTxt={alertTxt}
            hideAlertDialog={() => {
              setshowAlertDialogConfirm(false);
            }}
            ConfirmAlertDialog={() => {
              logout();
            }}
          />
        )}

        {logoutWarning && <CommonModal
          isTopLine={false}
          visible={logoutWarning}
          mainContainerModal={{ backgroundColor: "transparent" }}
          onClose={() => {
            setLogoutWarning(false);
          }}
          button={true}
        >
          <View >
            <View style={styles.imagetextContainer}>
              <Text
                style={[
                  styles.txt2,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                Are you sure?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setcheckedOne(!checkedOne)}
              style={styles.imagetextContainerOne}>
              <View>
                <Image
                  style={[
                    styles.dotStyle,
                    { tintColor: ThemeManager.colors.primaryColor },
                  ]}
                  source={
                    checkedOne
                      ? ThemeManager.ImageIcons.checkedIcon
                      : ThemeManager.ImageIcons.unCheckedIcon
                  }
                  resizeMode="contain"
                />
              </View>

              <Text
                style={[
                  styles.txt4,
                  { color: ThemeManager.colors.legalGreyColor },
                ]}
              >
                {LanguageManager.walletName.logoutWarning1}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setcheckedThree(!checkedThree)}
              style={styles.imagetextContainerThree}>
              <View >
                <Image
                  style={[
                    styles.dotStyle,
                    { tintColor: ThemeManager.colors.primaryColor },
                  ]}
                  source={
                    checkedThree
                      ? ThemeManager.ImageIcons.checkedIcon
                      : ThemeManager.ImageIcons.unCheckedIcon
                  }
                />
              </View>
              <Text
                style={[
                  styles.txt4,
                  { color: ThemeManager.colors.legalGreyColor },
                ]}
              >
                {LanguageManager.walletName.logoutWarning2}
              </Text>
            </TouchableOpacity>

            <View style={[styles.btnViewModal]}>
              <View style={{ marginRight: dimen(8) }}>
                <Button
                  buttontext={LanguageManager.sendTrx.Cancel}
                  onPress={() => {
                    setcheckedOne(false);
                    setcheckedThree(false);
                    setLogoutWarning(false);
                  }}
                  myStyle={{ width: widthDimen(182), alignItems: "center" }}
                  viewStyle={{
                    backgroundColor: ThemeManager.colors.mnemonicsBg,
                    ...styles.borderButtonStyle
                  }}
                />
              </View>
              <View style={{ marginLeft: dimen(8) }}>
                <Button
                  buttontext={LanguageManager.pins.Continue}
                  disabled={!(checkedOne && checkedThree)}
                  myStyle={{ width: widthDimen(182), alignItems: "center" }}
                  onPress={() => {
                    setcheckedOne(false);
                    setcheckedThree(false);
                    setLogoutWarning(false);
                    setTimeout(() => {
                      setshowAlertDialogConfirm(true);
                      setalertTxt(LanguageManager.alertMessages.willBeLoggedOutFromTheApp);
                    }, 1000);
                  }}
                />
              </View>
            </View>
          </View>
        </CommonModal>}
        <LoaderView isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {
})(Settings);
