import {useCallback, useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  ImageBackground,
  Platform,
  View,
} from 'react-native';
import {EventRegister} from 'react-native-event-listeners';
import {ActionConst, Actions} from '../../../navigation/RootNavigation';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import {getDaysLeftOnPlan, widthDimen} from '../../../Utils';
import {
  HeaderMain,
  VpnGlobeComp,
  DvpnLoader,
  AppAlert,
} from '../../common';
import ConnectContainer from './ConnectContainer';
import DisconnectContainer from './DisconnectContainer';
import styles from './VpnScreenStyle';
import {
  checkAndGetVpnStatus,
  disconnectVpn,
  getEndpointFromConfig,
  getRunningVpnConfig,
  getRuntimeStats,
  stopVPN,
} from '../../common/WireGuardNative';
import {getSessions} from '../../Api/VPN/api/getSessions';
import {getBalance} from '../../Api/VPN/api/startSubscriptionOnChain';
import {consoleLogFunc, getData} from '../../../Utils/MethodsUtils';
import {getRandomNode} from '../../Api/VPN/api/getRandomNode';
import {getUserSubscriptions} from '../../Api/VPN/api/getUserSubscriptions';
import {getAllProviders} from '../../Api/VPN/api/getAllProviders';
import {clearVpnApiCache} from '../../Api/VPN/api/VPNApiClient';

const VpnScreen = (props: any) => {
  const {vpn} = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [vpnIP, setVpnIP] = useState<any>(null);
  const [vpnLocation, setVpnLocation] = useState<any>('Unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [defaultWallet, setDefaultWallet] = useState<any>();
  const [quickConnectNode, setQuickConnectNode] = useState<any>();
  const [userAddress, setUserAddress] = useState<any>();
  const [balance, setBalance] = useState<any>();
  const [userSubscription, setUserSubscription] = useState<any[]>([]);
  const [remaining, setRemaining] = useState<any>('');
  const [activePlanId, setActivePlanId] = useState<any>(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState<any>('');
  const [providers, setProviders] = useState<any[]>([]);

  // Prevents concurrent runs
  const isUpdatingRef = useRef(false);
  // Timestamp of last completed refresh — debounces focus-triggered calls
  const lastRefreshRef = useRef(0);
  // When true, the next focus event is skipped (initial mount + VPN connect flow)
  const suppressNextFocusRef = useRef(true);

  useEffect(() => {
    initScreen();
    fetchProviders();

    const focusListener = props.navigation.addListener('focus', () => {
      consoleLogFunc('[VPN🔍] focus fired | suppress=', suppressNextFocusRef.current, '| age=', Date.now() - lastRefreshRef.current, 'ms | busy=', isUpdatingRef.current);
      if (suppressNextFocusRef.current) {
        suppressNextFocusRef.current = false;
        consoleLogFunc('[VPN🔍] focus → suppressed (pre-connect gate was set)');
        return;
      }
      consoleLogFunc('[VPN🔍] focus → triggering updateBalance');
      updateBalance();
    });
    const blurListener = props.navigation.addListener('blur', () =>
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      ),
    );

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);

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
    if (vpnIP) {
      fetchLocation(vpnIP);
    }
  }, [vpnIP]);

  const fetchProviders = async () => {
    try {
      const response = await getAllProviders({isRecent: true});
      consoleLogFunc('response--->>', JSON.stringify(response));
      if (response.status === 200) {
        setProviders(response?.data);
      }
    } catch (error: any) {
      console.error('Error fetching providers', error);
    }
  };

  const updateBalance = async () => {
    const now = Date.now();
    const age = now - lastRefreshRef.current;
    if (isUpdatingRef.current) {
      consoleLogFunc('[VPN🔍] updateBalance → SKIPPED (already running)');
      return;
    }
    if (age < 5000) {
      consoleLogFunc('[VPN🔍] updateBalance → SKIPPED (debounce, last run', age, 'ms ago)');
      return;
    }
    consoleLogFunc('[VPN🔍] updateBalance → START (last run', age === now ? 'never' : age + 'ms ago', ')');
    isUpdatingRef.current = true;
    lastRefreshRef.current = now;
    try {
      const address = await loadUserInfo();
      await Promise.all([
        gerUserSubscrption(),
        loadUserSessions(),
        loadBalance(address),
        checkVpnStatus(),
      ]);
      consoleLogFunc('[VPN🔍] updateBalance → DONE');
    } catch (err: any) {
      consoleLogFunc('[VPN🔍] updateBalance → ERROR', err?.message || err);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const initScreen = async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setLoading(true);
    try {
      const address = await loadUserInfo();
      await Promise.all([
        loadBalance(address),
        gerUserSubscrption(),
        checkVpnStatus(),
        loadUserSessions(),
      ]);
    } catch (error: any) {
      console.error('initScreen error:', error.message);
    } finally {
      isUpdatingRef.current = false;
      setLoading(false);
    }
  };

  const gerUserSubscrption = async () => {
    try {
      const subsResponse = await getUserSubscriptions({
        limit: 5,
        order: 'DESC',
      });
      const subscriptions = subsResponse?.data?.subscriptions || [];

      const validSubscriptions = subscriptions.filter((sub: any) => {
        if (!sub?.inactive_at) return false;
        const inactiveAt = new Date(sub.inactive_at);
        if (isNaN(inactiveAt.getTime())) return false;
        return sub?.status === 'active' && inactiveAt.getTime() > Date.now();
      });

      if (validSubscriptions.length > 0) {
        const subscribedTo = validSubscriptions[0];
        setActivePlanId(subscribedTo.plan_id);
        setUserSubscription(validSubscriptions);
        loadQuickConnectNode();
      } else if (subscriptions.length > 0) {
        setRemaining('Expired');
        setUserSubscription([]);
      } else {
        setRemaining('Buy a plan');
        setUserSubscription([]);
      }
    } catch (err: any) {
      console.error('getUserSubscriptions failed:', err.message);
      setRemaining('');
      setUserSubscription([]);
    }
  };

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
      consoleLogFunc('address----->>>', address);

      if (address) {
        setUserAddress(address);
      }

      const walletList = await getData(Constants.MULTI_WALLET_LIST);
      const parsed = JSON.parse(walletList)?.find((w: any) => w?.defaultWallet);
      setDefaultWallet(parsed);

      return address;
    } catch (err: any) {
      console.error('Error loading user info:', err.message);
      return null;
    }
  };

  const loadQuickConnectNode = async () => {
    try {
      const node = await getRandomNode({protocol: 'wireguard'});
      setQuickConnectNode(node?.data);
      setRemaining(getDaysLeftOnPlan(node?.data?.subscriptions?.inactive_at));
    } catch (err: any) {
      console.error('Failed to get random node:', err);
    }
  };

  const loadBalance = async (addressParam: any) => {
    const address = addressParam || userAddress;
    if (!address) {
      console.warn('Cannot load balance: address is undefined');
      return;
    }
    try {
      const bal = await getBalance({
        denom: 'tics',
        address,
        rcp: Constants.COSMO_RPC_URL,
      });
      consoleLogFunc('Balance fetched:', bal);
      setBalance(bal);
    } catch (e: any) {
      consoleLogFunc('VPN balance fetch failed', e);
    }
  };

  const loadUserSessions = async () => {
    try {
      const result = await getSessions({limit: 4, page: 1, order: 'DES'});
      if (!result.Error) {
        if (result?.data?.total) {
          setSessionList(result?.data?.sessions);
        }
      } else {
        console.warn('Failed to fetch sessions:', result?.message);
      }
    } catch (err: any) {
      console.error('Error loading sessions:', err?.message);
    }
  };

  const extractIP = (endpoint: any) => {
    if (!endpoint) return null;

    // NAT64 IPv6 format: [64:ff9b::bcef:2152]:51820
    const ipv6Match = endpoint.match(/\[64:ff9b::([0-9a-f]+):([0-9a-f]+)\]/i);
    if (ipv6Match) {
      const part1 = parseInt(ipv6Match[1], 16);
      const part2 = parseInt(ipv6Match[2], 16);
      return `${(part1 >> 8) & 0xff}.${part1 & 0xff}.${(part2 >> 8) & 0xff}.${
        part2 & 0xff
      }`;
    }

    const ipv4Match = endpoint.match(/^([0-9.]+):/);
    return ipv4Match ? ipv4Match[1] : null;
  };

  const checkVpnStatus = async () => {
    try {
      if (Platform.OS === 'ios') {
        const stats = await getRuntimeStats();
        const status = stats?.status;
        const actualIP = extractIP(stats?.endpoint);
        if (status === 'disconnected' && actualIP != null) {
          await stopVPN();
          showAlert('Internet not available, please try again later.');
          return;
        }
        setIsConnected(status === 'connected');
        setVpnIP(actualIP);
      } else {
        const status = await checkAndGetVpnStatus();
        const currentVpnConfig = await getRunningVpnConfig();
        const endpoint = getEndpointFromConfig(currentVpnConfig);
        const actualIP = extractIP(endpoint);
        if (status === 'disconnected' && actualIP != null) {
          await disconnectVpn();
          showAlert('Internet not available, please try again later.');
          return;
        }
        setIsConnected(status?.toLowerCase() === 'connected');
        setVpnIP(actualIP);
      }
    } catch (e: any) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      consoleLogFunc('VPN status check failed', e);
      setIsConnected(false);
      setVpnIP(null);
    }
  };

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({type: ActionConst.RESET});
    return true;
  };

  const fetchLocation = async (ip: any) => {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      if (!response.ok) {
        setVpnLocation(null);
        return;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setVpnLocation(null);
        return;
      }
      const data = await response.json();
      setVpnLocation(data?.country || '');
    } catch (error: any) {
      console.error('Error fetching IP details:', error);
      setVpnLocation(null);
    }
  };

  const showAlert = useCallback((message: any) => {
    setAlertText(message);
    setAlertModal(true);
  }, []);

  const hideAlert = useCallback(() => setAlertModal(false), []);

  const startLoader = useCallback(() => setLoading(true), []);
  const stopLoader = useCallback(() => setLoading(false), []);

  // Called by child components (VpnGlobeComp, DisconnectContainer) right before
  // they navigate to EnterPinSecurity. Suppresses the focus-fired updateBalance
  // that would otherwise run immediately when the pin screen pops — too early for
  // DNS to be ready after VPN connects.
  const onBeforeConnect = useCallback(() => {
    consoleLogFunc('[VPN🔍] onBeforeConnect → suppressNextFocus set (pin screen opening)');
    suppressNextFocusRef.current = true;
  }, []);

  const handleVpnToggle = useCallback((res: any) => {
    consoleLogFunc('[VPN🔍] handleVpnToggle called | connected=', res);
    if (res) {
      setIsConnected(true);
      // WireGuard handshake duration is non-deterministic — a fixed delay isn't
      // reliable. Instead we probe the API host directly every 2.5 s and only
      // trigger a full refresh once DNS resolves (or after 6 failed attempts).
      let probeAttempt = 0;
      const MAX_PROBE_ATTEMPTS = 6; // 2.5s initial + up to 5×2.5s = max ~15s

      const probeDnsAndRefresh = async () => {
        probeAttempt++;
        consoleLogFunc('[VPN🔍] DNS probe attempt', probeAttempt, '/', MAX_PROBE_ATTEMPTS);

        let dnsReady = false;
        try {
          const controller = new AbortController();
          // 5 s — enough for DNS resolution + TCP handshake + server response.
          // If this fires, DNS didn't settle yet; treat as DOWN.
          const timerId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(Constants.VPN_BASE_URL!, {
            method: 'HEAD',
            signal: controller.signal,
          });
          clearTimeout(timerId);
          // Received an actual HTTP response → DNS resolved + TCP connected
          consoleLogFunc('[VPN🔍] DNS probe HTTP status:', response.status, '→ DNS UP');
          dnsReady = true;
        } catch (err: any) {
          const msg = String(err?.message || '');
          const name = String(err?.name || '');
          const isAbort =
            name === 'AbortError' ||
            msg === 'Aborted' ||
            msg.toLowerCase().includes('aborted') ||
            msg.toLowerCase().includes('cancelled');
          const isDnsFailure =
            msg.includes('Unable to resolve host') ||
            msg.includes('No address associated with hostname');

          if (isAbort) {
            // Probe timed out — DNS still routing through the tunnel, not ready yet
            consoleLogFunc('[VPN🔍] DNS probe timed out (5s) → DNS DOWN, tunnel still initializing');
            dnsReady = false;
          } else if (isDnsFailure) {
            consoleLogFunc('[VPN🔍] DNS probe DNS failure →', msg, '→ DNS DOWN');
            dnsReady = false;
          } else {
            // Connection refused, SSL error, 4xx/5xx, etc. — DNS resolved, network reachable
            consoleLogFunc('[VPN🔍] DNS probe non-DNS error:', msg, '→ DNS UP (host resolved)');
            dnsReady = true;
          }
        }

        if (dnsReady || probeAttempt >= MAX_PROBE_ATTEMPTS) {
          consoleLogFunc(
            '[VPN🔍] DNS',
            dnsReady ? 'ready' : 'probe exhausted — refreshing anyway',
            'at attempt',
            probeAttempt,
          );
          suppressNextFocusRef.current = false;
          lastRefreshRef.current = 0;
          checkVpnStatus();
          updateBalance();
        } else {
          consoleLogFunc('[VPN🔍] DNS not ready — retrying in 2500ms');
          setTimeout(probeDnsAndRefresh, 2500);
        }
      };

      setTimeout(probeDnsAndRefresh, 2500);
    } else {
      consoleLogFunc('[VPN🔍] handleVpnToggle → VPN disconnected, clearing cache');
      clearVpnApiCache();
      setIsConnected(false);
    }
  }, []);

  const navigateToServiceProvider = useCallback(() => {
    if (Actions.currentScene !== 'ServiceProvider') {
      (Actions as any).ServiceProvider({isFrom: 'VPN_SCREEN'});
    }
  }, []);

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={styles.mainView}>
        <HeaderMain
          BackButtonText={vpn.trueVPN}
          customStyle={{paddingHorizontal: widthDimen(24)}}
          showBackBtn={true}
          imgSecond={ThemeManager.ImageIcons.crown_icon}
          onPressIcon={navigateToServiceProvider}
        />

        <VpnGlobeComp
          text={isConnected ? vpn.connected : vpn.disconnected}
          defaultWallet={defaultWallet}
          isConnected={isConnected}
          remaining={remaining}
          buyaPlan={navigateToServiceProvider}
          startLoader={startLoader}
          stopLoader={stopLoader}
          quickConnectNode={quickConnectNode}
          subscriptions={userSubscription}
          onPress={handleVpnToggle}
          onBeforeConnect={onBeforeConnect}
          src={
            isConnected
              ? ThemeManager.ImageIcons.connect_icon
              : ThemeManager.ImageIcons.disconnect_icon
          }
          imgSecond={ThemeManager.ImageIcons.crown_icon}
          balance={balance}
        />

        {isConnected ? (
          <ConnectContainer
            providers={providers}
            vpnLocation={vpnLocation}
            subscriptions={userSubscription}
            vpnIP={vpnIP}
            planId={activePlanId}
          />
        ) : (
          <DisconnectContainer
            sessions={sessionList}
            providers={providers}
            defaultWallet={defaultWallet}
            isConnected={isConnected}
            startLoader={startLoader}
            stopLoader={stopLoader}
            quickConnectNode={quickConnectNode}
            subscriptions={userSubscription}
            onPress={handleVpnToggle}
            onBeforeConnect={onBeforeConnect}
            balance={balance}
            onShowAlert={showAlert}
          />
        )}

        <DvpnLoader isLoading={loading} />
        <AppAlert visible={alertModal} alertTxt={alertText} hideAlertDialog={hideAlert} />
      </View>
    </ImageBackground>
  );
};

export default VpnScreen;
