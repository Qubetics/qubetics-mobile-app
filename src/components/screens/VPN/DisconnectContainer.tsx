import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';
import RecentSessions from '../../common/RecentSessions';
import { Actions } from '../../../navigation/RootNavigation';
import {
  consoleLogFunc,
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../../Utils/MethodsUtils';
import { stopVpnSessionOnChain } from '../../Api/VPN/api/stopVpnSessionOnChain';
import * as Constants from '../../../Constants';
import { startVpnSessionOnChain } from '../../Api/VPN/api/startVpnSessionOnChain';
import { startSubscriptionOnChain } from '../../Api/VPN/api/startSubscriptionOnChain';
import {
  connectVpn,
  createOrUpdateVPN,
  disconnectVpn,
  startVPN,
  stopVPN,
} from '../../../components/common/WireGuardNative';
import RecentProviders from '../../../../assets/RecentProviders';
import { EventRegister } from 'react-native-event-listeners';
import Singleton from '../../../Singleton';

const DisconnectContainer = ({
  sessions,
  balance,
  isConnected,
  onPress,
  onBeforeConnect,
  stopLoader,
  startLoader,
  subscriptions,
  defaultWallet,
  providers = [],
  quickConnectNode,
  onShowAlert,
}: any) => {
  const [lastPlanId, setLastPlanId] = useState(0);

  useEffect(() => {
    const loadLastPlanId = async () => {
      try {
        const lastPlanId = await getData(Constants.LAST_PLAN_ID_USED);

        if (lastPlanId !== null) {
          setLastPlanId(lastPlanId);
        }
      } catch (error: any) {
        consoleLogFunc("Error loading lastPlanId:", error);
      }
    };

    loadLastPlanId();
  }, []);
  const connectToVpn = async () => {
    let parsedBalance = parseFloat(balance);
    if (parsedBalance <= 0) {
          onShowAlert('Insufficient balance to connect VPN.');
      return;
    }
    if (!quickConnectNode) {
      onShowAlert('Plan has been expired.');
            return;
    }
    const mnemonics: any = await getMnemonics();
    try {
      if (isConnected) {
        const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);
        await stopVpnSessionOnChain({
          mnemonic: mnemonics?.toLowerCase()?.trim(),
          rpc: Constants.COSMO_RPC_URL,
          id: sessionId,
        });
        await removeStorageItem(Constants.CONNECTED_VPN_SESSION_ID);
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        onPress(false);
        stopLoader();
      } else {
        startLoader();
        let subscriptionId;
        let connectedSessionId;
        let vpnConfig;
        if (subscriptions.length > 0) {
          subscriptionId = quickConnectNode?.subscriptions?.id;
          consoleLogFunc('<<<---subscriptionId->>', subscriptionId);
          consoleLogFunc('<<<---quickConnectNode->>', quickConnectNode);

          consoleLogFunc('🟢 Reusing existing subscription:', subscriptionId);
          const { config, sessionId } = (await startVpnSessionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.["remote_url"],
            rpc: Constants.COSMO_RPC_URL,
            id: subscriptionId,
            node_address: quickConnectNode?.["address"],
          }) as any);
          vpnConfig = config;
          connectedSessionId = sessionId;
        } else {
          const randomIndex = Math.floor(
            Math.random() * quickConnectNode.plans.length,
          );
          const randomPlanId = parseInt(
            quickConnectNode.plans[randomIndex].planId,
            10,
          );
          let { config, sessionId } = (await startSubscriptionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: randomPlanId,
            node_address: quickConnectNode?.address,
          }) as any);
          vpnConfig = config;
          connectedSessionId = sessionId;
        }
        consoleLogFunc('dynamicConfig---->>>', vpnConfig);
        if (vpnConfig) {
          Platform.OS === 'android'
            ? await connectVpn(vpnConfig)
            : await createOrUpdateVPN(vpnConfig);
          saveData(Constants.CONNECTED_VPN_SESSION_ID, connectedSessionId);
          saveData(Constants.LAST_PLAN_ID_USED, quickConnectNode?.plan_id);
          Platform.OS === 'ios' && (await startVPN());
          setTimeout(async () => {
            onPress(true);
            stopLoader();
          }, 1500);
        } else {
          stopLoader();
          Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
                    onShowAlert('Failed to connect VPN');
        }
      }
    } catch (e: any) {
      stopLoader();
      console.error('VPN toggle error2', e);
    }
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
        } catch (error: any) {
          reject(error);
        }
      };
      if (Actions.currentScene != 'EnterPinSecurity') {
        consoleLogFunc('[VPN🔍] DisconnectContainer → calling onBeforeConnect, opening pin screen');
        onBeforeConnect?.();
        (Actions as any).EnterPinSecurity({from: 'Security', fromScreen: 'Security'});
      }
    });
  };

  return (
    <>
      <RecentProviders
        providers={providers}
        onPressViewAll={() => {
          Actions.currentScene != 'ServiceProvider' &&
            (Actions as any).ServiceProvider({ isFrom: "VPN_SCREEN" })
        }}
        onPressProvider={(item: any) => {
          Actions.currentScene != 'SeverByProvider' &&
            (Actions as any).SeverByProvider({ selectedProvider: item })
        }}
        lastPlanId={lastPlanId}
      />
      <View style={styles.subHeaderView}>
        <Text
          style={[
            styles.leftText,
            { color: ThemeManager.colors.headersTextColor },
          ]}>
          {LanguageManager.vpn.recentSessions}
        </Text>
        <Text
          onPress={() => {
            EventRegister.emit("isHistoryClicked")
            Actions.currentScene != 'RecentSessionScreen' &&
              (Actions as any).RecentSessionScreen()
          }}
          style={[
            styles.rightText,
            { color: ThemeManager.colors.legalGreyColor },
          ]}>
          {LanguageManager.vpn.viewAll}
        </Text>
      </View>
      {sessions?.length > 0 ? (
        <RecentSessions
          sessions={sessions}
          handleEndReached={() => { }}
          onReconnectPress={(item: any) => {
            connectToVpn();
          }}
        />
      ) : (
        <View style={{ flex: 1, marginTop: 30, justifyContent: 'center' }}>
          <Text
            allowFontScaling={false}
            style={[
              {
                color: ThemeManager.colors.blackWhiteText,
                fontFamily: Fonts.dmMedium,
                fontSize: 15,
                paddingHorizontal: 8,
                alignSelf: 'center',
              },
            ]}>
            {'No session found'}
          </Text>
        </View>
      )}
    </>
  );
};

export default DisconnectContainer;

const styles = StyleSheet.create({
  subHeaderView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightDimen(20),
    marginHorizontal: widthDimen(24),
  },
  leftText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
  },
  rightText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
});
