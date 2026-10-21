import { useEffect, useState } from 'react';
import {
  BackHandler,
  FlatList,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import { HeaderMain, DvpnLoader, AppAlert } from '../../common';
import RecentSessions from '../../common/RecentSessions';
import styles from './RecentSessionScreenStyle';
import { getSessions } from '../../Api/VPN/api/getSessions';
import { stopVpnSessionOnChain } from '../../Api/VPN/api/stopVpnSessionOnChain';
import { startVpnSessionOnChain } from '../../Api/VPN/api/startVpnSessionOnChain';
import {
  getBalance,
} from '../../Api/VPN/api/startSubscriptionOnChain';
import {
  checkAndGetVpnStatus,
  connectVpn,
  createOrUpdateVPN,
  disconnectVpn,
  getRuntimeStats,
  startVPN,
  stopVPN,
} from '../../../components/common/WireGuardNative';
import {
  consoleLogFunc,
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../../Utils/MethodsUtils';
import { getRenewPlanListApi, getUserSubscriptions } from '../../Api/VPN/api/getUserSubscriptions';
import { Fonts } from '../../../theme';
import LinearGradient from 'react-native-linear-gradient';
import PlansHistory from './PlansHistory';
import TxnHistory from './TxnHistory';
import Clipboard from '@react-native-clipboard/clipboard';
import { APIClient } from '../../Api';
import { GET_SESSION_HISTORY } from '../../../EndPoint';
import { getRandomNode } from '../../Api/VPN/api/getRandomNode';

const RecentSessionScreen = (props: any) => {
  const RESET_PAGINATION_DATA = {
    isMoreData: false,
    page: 1,
    isLoading: false,
  };
  const { merchantCard } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [userAddress, setUserAddress] = useState<any>();
  const [defaultWallet, setDefaultWallet] = useState<any>();
  const [isConnected, setIsConnected] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any[]>([]);
  const [renewPlanList, setRenewPlanList] = useState<any[]>([]);
  const [sessionTrxList, setSessionTrxList] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>();
  const [historyPaginationData, setHistoryPaginationData] = useState(RESET_PAGINATION_DATA);
  const [selectedTab, setSelectedTab] = useState(1);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertTxt, setAlertTxt] = useState('');



  const historyConstId = {
    Sessions: 1,
    Plans: 2,
    Renew: 3,
    Txn: 4,
  }


  const TABS_LIST = [
    {
      id: historyConstId.Sessions,
      title: 'Sessions'
    },
    {
      id: historyConstId.Plans,
      title: 'Plans'
    },
    {
      id: historyConstId.Renew,
      title: 'Renew'
    },
    {
      id: historyConstId.Txn,
      title: 'Txn'
    },
  ]

  useEffect(() => {
    initScreen();
    EventRegister.addEventListener('getThemeChanged', data => {
    });
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      setSessionList([]);
      initScreen();
    });
    const blurListener = props.navigation.addListener('blur', () => {

      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setShowAlertDialog(false);
    });
    return () => {
      focusListener();
      blurListener();
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);

  useEffect(() => {
    fetchHistory();
    const focusListener = props.navigation.addListener('focus', () => {
      fetchHistory();
    });
    return () => {
      focusListener();
    };
  }, [selectedTab]);

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({ type: ActionConst.RESET });
    return true;
  };

  const initScreen = async () => {
    try {


      const address = await loadUserInfo();
      await Promise.all([
        checkVpnStatus(),
        loadBalance(address), // ⬅️ will now have a valid userAddress

      ]);
    } catch (error: any) {
      console.error('🔴 initScreen error:', error.message);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    if (selectedTab == 1) {
      getUserPlans();
      fetchUserSessions();
    } else if (selectedTab == 2) {
      getUserPlans();
    } else if (selectedTab == 3) {
      getRenewPlanList();
    } else {
      fetchSessionTrxHistory();
    }
  }


  const getUserPlans = async (page = 1) => {
    try {
      if (page != 1) {
        setHistoryPaginationData({ ...historyPaginationData, isLoading: true })
      }
      const subsResponse = await getUserSubscriptions({
        limit: 10,
        order: 'DESC',
        page: page,
      });
      const subscriptions = subsResponse?.data?.subscriptions || [];
      setUserSubscription(page == 1 ? subscriptions : [...userSubscription, ...subscriptions]);
      setHistoryPaginationData({ page: page, isLoading: false, isMoreData: subscriptions.length > 0 })
    } catch (error: any) {
      console.error('🔴 getUserPlans error:', error.message);
      setHistoryPaginationData({ ...historyPaginationData, isLoading: false })
    } finally {
      setLoading(false);
    }
  }

  const getRenewPlanList = async (page = 1) => {
    try {
      if (page != 1) {
        setHistoryPaginationData({ ...historyPaginationData, isLoading: true })
      }
      const subsResponse = await getRenewPlanListApi({
        order: 'DESC',
      });
      const subscriptions = subsResponse?.data?.subscriptions || [];
      setRenewPlanList(page == 1 ? subscriptions : [...renewPlanList, ...subscriptions]);
      setHistoryPaginationData({ page: page, isLoading: false, isMoreData: subscriptions.length > 0 })
    } catch (error: any) {
      setHistoryPaginationData({ ...historyPaginationData, isLoading: false })

    } finally {
      setLoading(false);
    }

  }

  const extractIP = (endpoint: any) => {
    if (!endpoint) return null;

    // Check for NAT64 IPv6 format like: [64:ff9b::bcef:2152]:51820
    const ipv6Match = endpoint.match(/\[64:ff9b::([0-9a-f]+):([0-9a-f]+)\]/i);
    if (ipv6Match) {
      const part1 = parseInt(ipv6Match[1], 16);
      const part2 = parseInt(ipv6Match[2], 16);
      return `${(part1 >> 8) & 0xff}.${part1 & 0xff}.${(part2 >> 8) & 0xff}.${part2 & 0xff
        }`;
    }

    // Regular IPv4 case like: 203.0.113.10:51820
    const ipv4Match = endpoint.match(/^([0-9.]+):/);
    if (ipv4Match) {
      return ipv4Match[1];
    }

    return null;
  };


  const checkVpnStatus = async () => {
    try {
      const stats =
        Platform.OS === 'android'
          ? await checkAndGetVpnStatus()
          : await getRuntimeStats();
      consoleLogFunc('VPN Stats:', stats);
      const status = Platform.OS === 'android' ? stats : stats?.status;
      const endpoint = stats?.endpoint;
      const actualIP = extractIP(endpoint);

      if (status == 'disconnected' && actualIP != null) {
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        return;
      }
      setIsConnected(status?.toLowerCase() === 'connected');
    } catch (e) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      consoleLogFunc('VPN status check failed', e);
      setIsConnected(false);
    }
  };

  const loadBalance = async (addressParam: any) => {
    const address = addressParam || userAddress;
    consoleLogFunc('✅ Fetching balance for:', address);
    if (!address) {
      console.warn('🚫 Cannot load balance: address is undefined');
      return;
    }

    try {
      let balance = await getBalance({
        denom: 'tics',
        address: address,
        rcp: Constants.COSMO_RPC_URL,
      });
      consoleLogFunc('✅ Balance fetched:', balance);
      setBalance(balance);
    } catch (e) {
      consoleLogFunc('❌ VPN status check failed', e);
    }
  };

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
      if (address) {
        setUserAddress(address); // ✅ update state still for later use
      }

      const walletList = await getData(Constants.MULTI_WALLET_LIST);
      const parsed = JSON.parse(walletList)?.find((w: any) => w?.defaultWallet);
      setDefaultWallet(parsed);

      return address; // ✅ return it
    } catch (err: any) {
      console.error('❌ Error loading user info:', err.message);
      return null;
    }
  };

  const fetchUserSessions = async (pageNumber = 1) => {
    try {
      if (pageNumber != 1) {
        setHistoryPaginationData({ ...historyPaginationData, isLoading: true })
      }

      const result = await getSessions({
        limit: 10,
        page: pageNumber,
        order: 'DEC',
      });

      if (!result.Error) {
        const newSessions = result?.data?.sessions || [];
        if (pageNumber === 1) {
          setSessionList(newSessions);
        } else {
          setSessionList(prev => [...prev, ...newSessions]);
        }

        setHistoryPaginationData({
          page: pageNumber,
          isLoading: false,
          isMoreData: newSessions.length > 0,
        })

      } else {
        console.warn('⚠️ Failed to fetch sessions:', result?.message);
      }
    } catch (err: any) {
      console.error('❌ Error:', err?.message);
    } finally {
      setLoading(false);
      setHistoryPaginationData({ ...historyPaginationData, isLoading: false })
    }
  };

  const connectToVpn = async (quickConnectNode: any) => {
    let parsedBalance = parseFloat(balance as any);
    if (parsedBalance <= 0) {
      showAlert('Please top-up your account');
      return;
    }
    if (!quickConnectNode) {
      showAlert('Please top up you account');
      return;
    }
    const mnemonics = await getMnemonics();
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
        setLoading(false);
      } else {
        setLoading(true);
        let subscriptionId;
        let connectedSessionId;
        let vpnConfig: any;
        if (userSubscription.length > 0) {
          subscriptionId = parseInt(quickConnectNode.subscriptions?.id);
          consoleLogFunc('<<<---subscriptionId->>', subscriptionId);
          consoleLogFunc('🟢 Reusing existing subscription:', subscriptionId);
          const { config, sessionId } = (await startVpnSessionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: subscriptionId,
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
            setLoading(false);
            Actions.currentScene != 'VpnScreen' && (Actions as any).VpnScreen()
          }, 1500);
        } else {
          setLoading(false);
          Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
          showAlert("Failed to connect VPN");
          // @ts-ignore BUG PRESERVED: 'response' is not defined (ReferenceError at runtime)
          consoleLogFunc('Failed to connect ---->>>', response);
        }
      }
    } catch (e) {
      setLoading(false);
      console.error('VPN toggle error4', e);
    }
  };

  const showAlert = (message: any) => {
    setShowAlertDialog(true);
    setAlertTxt(message);
  }

  const getMnemonics = async () => {
    return new Promise<any>((resolve, reject) => {
      Singleton.getInstance().walletPinCallback = async (pin: any) => {
        setLoading(true);
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
      (Actions as any).EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
      });
    });
  };


  const fetchSessionTrxHistory = async (pageNumber = 1) => {
    try {
      if (pageNumber !== 1) {
        setHistoryPaginationData({ ...historyPaginationData, isLoading: true })
      };
      const token = await getData(Constants.ACCESS_TOKEN);
      const result = await APIClient.getInstance().post(GET_SESSION_HISTORY, {
        limit: 10,
        page: pageNumber,
      }, token);
      const newSessions = result?.data?.history || [];
      if (pageNumber == 1) {
        setSessionTrxList(newSessions);
      } else {
        setSessionTrxList(prev => [...prev, ...newSessions]);
      }

      setHistoryPaginationData({ page: pageNumber, isMoreData: result?.data?.history?.length > 0, isLoading: false })

    } catch (error: any) {
      setHistoryPaginationData({ ...historyPaginationData, isLoading: false })
    } finally {
      setLoading(false);
    }
  }

  const handlePaginationOfHistory = () => {
    if (historyPaginationData.isMoreData && !historyPaginationData.isLoading && selectedTab == 1) {
      fetchUserSessions(historyPaginationData.page + 1);
    } else if (historyPaginationData.isMoreData && !historyPaginationData.isLoading && selectedTab == 2) {
      getUserPlans(historyPaginationData.page + 1);
    } else if (historyPaginationData.isMoreData && !historyPaginationData.isLoading && selectedTab == 3) {
      getRenewPlanList(historyPaginationData.page + 1);
    } else if (historyPaginationData.isMoreData && !historyPaginationData.isLoading && selectedTab == 4) {
      fetchSessionTrxHistory(historyPaginationData.page + 1);
    }
  };



  const renderItem = ({ item }: {item: any}) => (
    <LinearGradient
      colors={item.id != selectedTab ? [ThemeManager.colors.legalGreyColor, ThemeManager.colors.legalGreyColor] : ['#85FFC4', '#5CC6FF', '#6456B2', '#6145EA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: dimen(14), marginRight: widthDimen(9) }}
    >
      <TouchableOpacity onPress={() => {
        consoleLogFunc("RecentProviders Pressed", item)
        setSelectedTab(item.id)

      }}
        activeOpacity={1}
        style={{
          backgroundColor: 'black',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: dimen(14),
          paddingVertical: heightDimen(12),
          paddingHorizontal: widthDimen(8),
          margin: 1.5
        }}>
        <Text style={{
          fontSize: dimen(14), fontFamily: Fonts.dmMedium, color: item.id == selectedTab ? 'white' : ThemeManager.colors.legalGreyColor,
          paddingHorizontal: widthDimen(10)
        }}>{item?.title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  )


  const onCopyAddress = async (address: any) => {
    const { alertMessages } = LanguageManager;
    await Clipboard.setString(address);
    setShowAlertDialog(true);
    setShowSuccess(true);
    setAlertTxt(alertMessages.txnAddressCopied)
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={merchantCard.history}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          showBackBtn={true}
        />

        <View style={{
          flexDirection: 'row', justifyContent: 'center', marginTop: heightDimen(20),
          marginBottom: heightDimen(15), gap: widthDimen(12), marginHorizontal: widthDimen(24),
        }}>

          <FlatList
            data={TABS_LIST}
            renderItem={renderItem}
            horizontal
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {
          selectedTab == historyConstId.Sessions &&
          <>
            <RecentSessions
              sessions={sessionList}
              loading={loading}
              handleEndReached={handlePaginationOfHistory}
              hideReconnectButton={true}
              onReconnectPress={async (item: any) => {
                consoleLogFunc('12313123', isConnected);
                if (isConnected) {
                  showAlert('Please disconnect active session');
                  return;
                }
                const node = await getRandomNode({ protocol: 'wireguard' });
                consoleLogFunc('node---->>>', node);
                connectToVpn(node?.data);
              }}
            />
          </>
        }

        {
          selectedTab == historyConstId.Plans &&
          <>
            {/* @ts-ignore BUG PRESERVED: onRenewPress prop not passed here */}
            <PlansHistory
              planList={userSubscription}
              loading={loading}
              handleEndReached={handlePaginationOfHistory}
            />
          </>
        }

        {
          selectedTab == historyConstId.Renew &&
          <>
            <PlansHistory
              planList={renewPlanList}
              loading={loading}
              handleEndReached={() => { }}
              emptyComponentText='No renew plans found'
              onRenewPress={(item: any) => {

                Actions.currentScene != 'BuyCredit' &&
                  (Actions as any).BuyCredit({
                    defaultWallet: defaultWallet,
                    serviceProvider: { identity: item?.providers?.name, address: item?.provider_address },
                  })
              }}
            />
          </>
        }
        {
          selectedTab == historyConstId.Txn &&
          <>
            <TxnHistory
              transactionList={sessionTrxList}
              loading={loading}
              handleEndReached={handlePaginationOfHistory}
              onCopyAddress={(address: any) => { onCopyAddress(address) }}
            />
          </>
        }

        <AppAlert
          visible={showAlertDialog}
          showSuccess={showSuccess}
          alertTxt={alertTxt}
          hideAlertDialog={() => {
            setShowSuccess(false)
            setShowAlertDialog(false)
          }}
        />
        <DvpnLoader isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(RecentSessionScreen);
