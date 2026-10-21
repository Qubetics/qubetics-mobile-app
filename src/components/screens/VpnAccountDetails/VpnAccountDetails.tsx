import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  ImageBackground,
  Text,
  View,
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import images from "../../../theme/Images";
import { widthDimen } from "../../../Utils";
import { Button, DvpnLoader, HeaderMain } from "../../common";
import ConnectedStatusCard from "../../common/ConnectedStatusCard";
import styles from "./VpnAccountDetailsStyle";
import { getBalance } from "../../Api/VPN/api/startSubscriptionOnChain";
import { consoleLogFunc, getData, toFixedExp } from "../../../Utils/MethodsUtils";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-easy-toast";


const VpnAccountDetails = (props: any) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<any>();
  const [userAddress, setUserAddress] = useState<any>();
  const toast = useRef<any>(null);

  useEffect(() => {
    initScreen();

    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
    return () => {
      focusListener();
      blurListener();
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  const initScreen = async () => {
    setLoading(true);
    try {
      const address = await loadUserInfo();
      await Promise.all([
        loadBalance(address), // ⬅️ will now have a valid userAddress
      ]);
    } catch (error: any) {
      console.error("🔴 initScreen error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async (addressParam: any) => {
    const address = addressParam || userAddress;
    consoleLogFunc("✅ Fetching balance for:", address);
    if (!address) {
      console.warn("🚫 Cannot load balance: address is undefined");
      return;
    }

    try {
      let balance = await getBalance({
        denom: "tics",
        address: address,
        rcp: Constants.COSMO_RPC_URL,
      });
      consoleLogFunc("✅ Balance fetched:111", balance);
      setBalance(balance);
    } catch (e: any) {
      consoleLogFunc("❌ VPN status check failed", e);
    }
  };

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
      if (address) {
        setUserAddress(address); // ✅ update state still for later use
      }
      return address; // ✅ return it
    } catch (err: any) {
      console.error("❌ Error loading user info:", err.message);
      return null;
    }
  };

  const handleBackButtonClick = () => {
    return true;
  };

  const onPressCopy = async (address: any) => {
    await Clipboard.setString(address);
    toast.current?.show("Copied");
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.accountDetails}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
        />
        {/* **********************************Card View*************************************** */}

        <View style={[styles.mainView_2, {}]}>
          <ConnectedStatusCard
            src={images.vpn_logo}
            title1={vpn.yourCredits}
            title2={balance ? `${toFixedExp(balance, Number(balance) < 1 ? 4 : 2)} TICS` : "0.00 TICS"}
            connectedText={styles.connectedText}
            isDot
            refreshClicked={() => {
              initScreen();
            }}
          />
          {/* **********************************text View*************************************** */}

          <View style={[styles.container]}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  { color: ThemeManager.colors.headersTextColor },
                ]}
              >
                {vpn.accountAddress}
              </Text>
              <Text
                ellipsizeMode="middle"
                numberOfLines={1}
                style={[
                  styles.viewAll,
                  { color: ThemeManager.colors.legalGreyColor, width: "50%" },
                ]}
              >
                {userAddress}
              </Text>
            </View>
          </View>
          {/* **********************************Button View*************************************** */}
          <View style={styles.bottomView}>
            <Button
              buttontext={vpn.copyAddress}
              onPress={
                () => {
                  onPressCopy(userAddress);
                }
              }
            />
          </View>
        </View>
        <DvpnLoader isLoading={loading} />
      </View>
      <Toast
        ref={toast}
        position="bottom"
        positionValue={250}
        // @ts-ignore BUG PRESERVED: Toast has no style prop (ignored at runtime)
        style={{ backgroundColor: ThemeManager.colors.toastBg }}
      />
    </ImageBackground>
  );
};

export default connect(undefined, {})(VpnAccountDetails);
