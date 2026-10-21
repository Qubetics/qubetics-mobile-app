import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { dimen, heightDimen, widthDimen } from '../../Utils';
import { Fonts, Images } from '../../theme';
import {
  startVPN,
  stopVPN,
  createOrUpdateVPN,
  connectVpn,
  disconnectVpn,
} from './WireGuardNative';
import { stopVpnSessionOnChain } from '../Api/VPN/api/stopVpnSessionOnChain';
import { Actions } from '../../navigation/RootNavigation';
import {
  consoleLogFunc,
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../Utils/MethodsUtils';
import { startVpnSessionOnChain } from '../Api/VPN/api/startVpnSessionOnChain';
import * as Constants from '../../Constants';
import { AppAlert } from './AppAlert';
import colors from '../../theme/Colors';
import Singleton from '../../Singleton';

const VpnGlobeComp = ({
  text,
  defaultWallet,
  src,
  onPress,
  onBeforeConnect,
  isConnected,
  quickConnectNode,
  startLoader,
  stopLoader,
  balance,
  subscriptions,
  remaining,
  buyaPlan,
}: any) => {
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');

  const connectToVpn = async () => {
    try {
      // ✅ Pre-checks only if NOT connected
      if (!isConnected) {
        if (!subscriptions?.length) {
          return showAlert('Please purchase an available plan.');
        }

        if (parseFloat(balance) <= 0) {
          return showAlert(
            subscriptions?.length
              ? 'Minimum 1 TICS balance required to connect VPN.'
              : 'Please top-up your account.',
          );
        }
      }

      const mnemonics = await getMnemonics();

      if (isConnected) {
        await handleDisconnect(mnemonics);
      } else {
        await handleConnect(mnemonics);
      }
    } catch (e) {
      console.error('VPN connection error:', e);
      stopLoader();
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      showAlert('Failed to connect VPN');
    }
  };

  /** 🔹 Disconnect Flow */
  const handleDisconnect = async (mnemonics: any) => {
    const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);
    consoleLogFunc('sessionId', sessionId);
    await stopVpnSessionOnChain({
      mnemonic: mnemonics?.toLowerCase()?.trim(),
      rpc: Constants.COSMO_RPC_URL,
      id: sessionId,
    });

    await removeStorageItem(Constants.CONNECTED_VPN_SESSION_ID);

    Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();

    stopLoader();
    setTimeout(() => onPress(false), 500);
  };

  /** 🔹 Connect Flow */
  const handleConnect = async (mnemonics: any) => {
    startLoader();
    consoleLogFunc('quickConnectNode---->>>', quickConnectNode);
    const subscriptionId = quickConnectNode?.subscriptions;
    const { config: vpnConfig, sessionId } = (await startVpnSessionOnChain({
      mnemonic: mnemonics?.toLowerCase()?.trim(),
      url: quickConnectNode?.remote_url,
      rpc: Constants.COSMO_RPC_URL,
      id: subscriptionId?.id,
      node_address: quickConnectNode?.address,
    })) as any;

    if (!vpnConfig) {
      stopLoader();
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      return showAlert('Failed to connect VPN');
    }

    if (Platform.OS === 'android') {
      await connectVpn(vpnConfig);
    } else {
      await createOrUpdateVPN(vpnConfig);
      await startVPN();
    }

    saveData(Constants.CONNECTED_VPN_SESSION_ID, sessionId);
    saveData(Constants.LAST_PLAN_ID_USED, quickConnectNode?.plan_id);
    consoleLogFunc('vpnConfig---->>>', vpnConfig);

    setTimeout(() => {
      onPress(true);
      stopLoader();
    }, 1500);
  };

  /** 🔹 Reusable helper */
  const showAlert = (message: any) => {
    setAlertText(message);
    setAlertModal(true);
  };

  const getMnemonics = async () => {
    return new Promise((resolve, reject) => {
      Singleton.getInstance().walletPinCallback = async (pin: any) => {
        startLoader();
        try {
          const mnemonics = await getEncryptedData(
            defaultWallet.loginRequest.wallet_address,
            pin,
          );
          resolve(mnemonics);
        } catch (error) {
          reject(error);
        }
      };
      if (Actions.currentScene !== 'EnterPinSecurity') {
        consoleLogFunc('[VPN🔍] VpnGlobeComp → calling onBeforeConnect, opening pin screen');
        onBeforeConnect?.();
        (Actions as any).EnterPinSecurity({from: 'Security', fromScreen: 'Security'});
      }
    });
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'center',
          paddingHorizontal: widthDimen(15),
          alignItems: 'center',
        }}>
        <View style={{ position: 'absolute' }} />
        <View style={{
          backgroundColor: isConnected ? (colors as any).rgbGreen : (colors as any).rgbRed,
          paddingVertical: heightDimen(10),
          paddingHorizontal: widthDimen(15),
          borderRadius: dimen(30)
        }}>
          <Text
            style={[
              styles.statusText,
              {
                color: isConnected
                  ? ThemeManager.colors.darkGreen
                  : ThemeManager.colors.bloodRed,
              },
            ]}>
            {text}
          </Text>
        </View>
        {remaining && (
          <TouchableOpacity
            onPress={() => {
              if (remaining == 'Buy a plan' || remaining == 'Expired') {
                buyaPlan();
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              position: 'absolute',
              right: 20,
            }}>
            <Image source={Images.icon_wallet_validity} />
            <Text style={{ color: 'white' }}>
              {remaining}
             
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ImageBackground
        source={ThemeManager.ImageIcons.globe_img}
        style={styles.background}
        resizeMode="contain">
        <TouchableOpacity
          style={styles.powerButton}
          onPress={async () => {
            connectToVpn();
          }}
          activeOpacity={0.8}>
          <Image source={src} style={styles.circleImage} />
        </TouchableOpacity>
        {!isConnected && (
          <Text
            style={{
              marginTop: 12,
              color: 'white',
              fontSize: 18,
              fontFamily: Fonts.dmMedium,
            }}>
            Quick Connect
          </Text>
        )}
      </ImageBackground>
      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        hideAlertDialog={() => {
          setAlertModal(false);
          if (alertText == 'Please purchase an available plan.') {
            Actions.currentScene != 'ServiceProvider' &&
            (Actions as any).ServiceProvider({isFrom: "VPN_SCREEN"})
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    width: '100%',
    height: dimen(213),
    marginTop: heightDimen(30),
  },
  statusText: {
    fontSize: dimen(15),
    fontFamily: Fonts.dmSemiBold,
  },
  powerButton: {
    alignItems: 'center',
    marginTop: heightDimen(36),
  },
  circleImage: {
    height: dimen(118),
    width: dimen(118),
    resizeMode: 'contain',
  },
});

export { VpnGlobeComp };