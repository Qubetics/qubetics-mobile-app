import {useEffect, useState} from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  View,
} from 'react-native';
import {EventRegister} from 'react-native-event-listeners';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import {connect} from 'react-redux';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import {widthDimen} from '../../../Utils';
import {
  AppAlert,
  DvpnLoader,
  HeaderMain,
  InputtextSearch,
} from '../../common';
import LocationInfoCard from '../../common/LocationInfoCard';
import styles from './SelectServersStyle';
import {getVpnNodes} from '../../Api/VPN/api/getVpnNodes';
import {
  checkAndGetVpnStatus,
  connectVpn,
  createOrUpdateVPN,
  disconnectVpn,
  getEndpointFromConfig,
  getRunningVpnConfig,
  getRuntimeStats,
  startVPN,
  stopVPN,
} from '../../common/WireGuardNative';
import {
  getBalance,
} from '../../Api/VPN/api/startSubscriptionOnChain';
import {
  consoleLogFunc,
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../../Utils/MethodsUtils';
import {stopVpnSessionOnChain} from '../../Api/VPN/api/stopVpnSessionOnChain';
import {getUserSubscriptions} from '../../Api/VPN/api/getUserSubscriptions';
import {startVpnSessionOnChain} from '../../Api/VPN/api/startVpnSessionOnChain';

const SelectServers = (props: any) => {
  const {data} = props;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [, setIsToggle] = useState(false);
  const [selectIndex, setSelectIndex] = useState('');
  const [VpnList, setVpnList] = useState<any[]>([]);
  const [filteredVpnList, setFilteredVpnList] = useState<any[]>([]);
  const [defaultWallet, setDefaultWallet] = useState<any>();
  const [balance, setBalance] = useState<any>();
  const [userAddress, setUserAddress] = useState<any>();
  const [isConnected, setIsConnected] = useState(false);
  const [endpoint, setendpoint] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [userSubscription, setUserSubscription] = useState<any[]>([]);

  useEffect(() => {
    getData(Constants.MULTI_WALLET_LIST).then(list => {
      let currentWallet = JSON.parse(list);
      currentWallet = currentWallet.find((res: any) => res?.defaultWallet);
      setDefaultWallet(currentWallet);
    });
    initScreen();
    EventRegister.addEventListener('getThemeChanged', data => {});
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    checkVpnStatus();
    return () => {
      setIsToggle(false);
      focusListener();
      blurListener();
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);
  const extractIP = (endpoint: any) => {
    if (!endpoint) return null;

    // Check for NAT64 IPv6 format like: [64:ff9b::bcef:2152]:51820
    const ipv6Match = endpoint.match(/\[64:ff9b::([0-9a-f]+):([0-9a-f]+)\]/i);
    if (ipv6Match) {
      const part1 = parseInt(ipv6Match[1], 16);
      const part2 = parseInt(ipv6Match[2], 16);
      return `${(part1 >> 8) & 0xff}.${part1 & 0xff}.${(part2 >> 8) & 0xff}.${
        part2 & 0xff
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
      if (Platform.OS === 'ios') {
        const stats = await getRuntimeStats();
        consoleLogFunc('VPN Stats:', stats);
        const status = stats?.status;
        const endpoint = stats?.endpoint;
        const actualIP = extractIP(endpoint);
        if (status == 'disconnected' && actualIP != null) {
          setAlertText('Internet not available, please try again later.');
          setAlertModal(true);
          stopVPN();
          return;
        }
        setIsConnected(status === 'connected');
        setendpoint(actualIP);
      } else {
        const status = await checkAndGetVpnStatus();
        const currentVpnConfig = await getRunningVpnConfig();
        const endpoint = getEndpointFromConfig(currentVpnConfig);
        const actualIP = extractIP(endpoint);
        if (status == 'disconnected' && actualIP != null) {
          setAlertText('Internet not available, please try again later.');
          setAlertModal(true);
          disconnectVpn();
          return;
        }
        setendpoint(actualIP);
        setIsConnected(status?.toLowerCase() === 'connected');
      }
    } catch (e) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      setendpoint(null);
      consoleLogFunc('VPN status check failed', e);
      setIsConnected(false);
    }
  };

  const initScreen = async () => {
    setLoading(true);
    try {
      const address = await loadUserInfo();
      consoleLogFunc('address---->>', address);
      await Promise.all([
        loadBalance(address),
        gerUserSubscrption(),
        loadVpnNodes(),
        checkVpnStatus(), // ⬅️ will now have a valid userAddress
      ]);
    } catch (error: any) {
      console.error('🔴 initScreen error:', error.message);
    } finally {
      setLoading(false);
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
      console.error('❌ Error loading user info:', err.message);
      return null;
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
      setLoading(false);
      consoleLogFunc('❌ VPN status check failed', e);
    }
  };

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({type: ActionConst.RESET});
    return true;
  };
  const gerUserSubscrption = async () => {
    const subsResponse = await getUserSubscriptions({
      limit: 5,
      order: 'DESC',
    });
    const subscriptions = subsResponse?.data?.subscriptions || [];
    const validSubscriptions = subscriptions.filter((sub: any) => {
      const inactiveAt = new Date(sub?.inactive_at);
      return sub?.status === 'active' && inactiveAt.getTime() > Date.now();
    });

    if (validSubscriptions.length > 0) {
      setUserSubscription(subscriptions);
    } else {
      setUserSubscription([]);
    }
    
  };

  const loadVpnNodes = async (subscriptions?: any) => {
    consoleLogFunc('✅ subscriptions subscriptions:', subscriptions);

    try {
      const result = await getVpnNodes({
        limit: 10,
        page: 1,
        order: 'ASC',
        reverse: false,
        country: props?.data?.country,
        city: props?.data?.city,
        planId: props?.planId,
        protocol: props?.protocol,
      });

      if (!result.Error) {
        consoleLogFunc('✅ all VPN Nodes:111', result);
        consoleLogFunc('✅ VPN Nodes:111', JSON.stringify(result?.data?.nodes));
        setVpnList(result?.data?.nodes);
        setFilteredVpnList(result?.data?.nodes);

        if (result?.total) {
          consoleLogFunc('Total Nodes:', result?.data?.total);
        }
      } else {
        console.warn('⚠️ Failed to fetch nodes:', result.Message);
      }
    } catch (err: any) {
      console.error('❌ Error fetching nodes:', err.message);
    }
  };

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
      Actions.currentScene != 'EnterPinSecurity' && (Actions as any).EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
      });
    });
  };


  const updateSearch = (text: any) => {
    let list = VpnList.filter(
      res =>
        res.id?.toLowerCase().startsWith(text.toLowerCase()) ||
        res.address?.toLowerCase().startsWith(text.toLowerCase()),
    );
    setFilteredVpnList(list);
  };

  const connectToVpn = async (item: any) => {
    try {
      // ✅ Early exits (pre-checks)
      if (!isConnected) {
        if (!userSubscription?.length) {
          setAlertText('Please purchase an available plan.');
          setAlertModal(true);
          return;
        }

        if (parseFloat(balance) <= 0) {
          setAlertModal(true);
          return setAlertText(
            userSubscription?.length
              ? 'Minimum 1 TICS balance required to connect VPN.'
              : 'Please top-up your account.',
          );
        }
      }

      setLoading(true);

      // ✅ Disconnect flow (if already connected)
      if (isConnected && item?.remote_url?.includes(endpoint)) {
        await handleDisconnect();
        return;
      } else if (isConnected) {
        await handleDisconnect();
      }

      // ✅ Connect flow
      if (!userSubscription.length) {
        setAlertText('Please purchase an available plan.');
        setAlertModal(true);
        setLoading(false);
        return;
      }

      await handleConnect(item);
    } catch (e) {
      console.error('VPN connection error:', e);
      setLoading(false);
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      setAlertText('Failed to connect VPN');
      setAlertModal(true);
    }
  };

  /** 🔹 Handle disconnecting VPN */
  const handleDisconnect = async () => {
    const mnemonics = await getMnemonics();
    const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);

    await stopVpnSessionOnChain({
      mnemonic: mnemonics?.toLowerCase()?.trim(),
      rpc: Constants.COSMO_RPC_URL,
      id: sessionId,
    });

    await removeStorageItem(Constants.CONNECTED_VPN_SESSION_ID);
    Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
    setendpoint(null);

    setTimeout(async () => {
      await checkVpnStatus();
      setLoading(false);
    }, 800);
  };

  /** 🔹 Handle connecting VPN */
  const handleConnect = async (item: any) => {
    consoleLogFunc('handleConnect handleConnect--->', item?.plans?.subscriptions);
    const activeSubscription = item?.plans?.subscriptions?.find((sub: any) => sub?.status === 'active');
    const mnemonics = await getMnemonics();
    const subscriptionId = activeSubscription?.id || 0;
    consoleLogFunc('subscriptionId--->', subscriptionId);
    const {config: vpnConfig, sessionId} = (await startVpnSessionOnChain({
      mnemonic: mnemonics?.toLowerCase()?.trim(),
      url: item?.remote_url,
      rpc: Constants.COSMO_RPC_URL,
      id: subscriptionId,
      node_address: item?.address,
    }) as any);

    if (!vpnConfig) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      setAlertText('Failed to connect VPN');
      setAlertModal(true);
      setLoading(false);
      return;
    }

    if (Platform.OS === 'android') {
      await connectVpn(vpnConfig);
    } else {
      await createOrUpdateVPN(vpnConfig);
      await startVPN();
    }
    saveData(Constants.LAST_PLAN_ID_USED, props?.planId);

    saveData(Constants.CONNECTED_VPN_SESSION_ID, sessionId);

    setTimeout(async () => {
      await checkVpnStatus();
      setLoading(false);
    }, 1500);
  };
  const renderItem = ({item, index}: {item: any; index: any}) => (
    <LocationInfoCard
      location={item.id}
      ip={item.address}
      plans={item?.plans}
      rightImg={
        selectIndex == index
          ? ThemeManager.ImageIcons.enable_toggle_vpn
          : ThemeManager.ImageIcons.disable_toggle_vpn
      }
      arrowStyle={styles.toggleIcon}
      container={{marginTop: 8}}
      isConnectedd={item?.remote_url?.includes(endpoint)}
      onPress={() => {
        setSelectIndex(index);
        connectToVpn(item);
      }}
    />
  );

  return (
    <>
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
        <View style={[styles.mainView]}>
          <HeaderMain
            BackButtonText={data?.city}
            customStyle={{paddingHorizontal: widthDimen(24)}}
          />
          <InputtextSearch
            style={{
              height: 50,
              width: Dimensions.get('screen').width - widthDimen(48),
            }}
            placeholder={'Search Server'}
            returnKeyType={'done'}
            value={search}
            search={true}
            clear={search ? true : false}
            pressClear={() => {
              setSearch('');
              updateSearch('');
            }}
            onChangeNumber={(text: any) => {
              setSearch(text);
              updateSearch(text);
              consoleLogFunc('SERARCH_____', text);
            }}
            onSubmitEditing={() => updateSearch(search)}
          />

          <FlatList
            data={filteredVpnList}
            showsVerticalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            extraData={endpoint}
          />
          <DvpnLoader isLoading={loading} />
        </View>
        <AppAlert
          visible={alertModal}
          alertTxt={alertText}
          hideAlertDialog={() => {
            setAlertModal(false);
            if (alertText == 'Please purchase an available plan.') {
              Actions.currentScene != "ServiceProvider" && (Actions as any).ServiceProvider({isFrom: "VPN_SCREEN"})
            }
          }}
        />
      </ImageBackground>
    </>
  );
};

export default connect(undefined, {})(SelectServers);
