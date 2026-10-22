
import { useState, useEffect } from 'react';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EventRegister } from 'react-native-event-listeners';
import { navigationRef } from './navigation/RootNavigation';

import SendBnbPol from './components/screens/SendBnbPol/SendBnbPol';
import { CustomTabBar } from './components/common/CustomTabBar';
import Singleton from './Singleton';
import Manage from './components/screens/Manage/Manage';
import AddressBook from './components/screens/AddressBook/AddressBook';
import AddContact from './components/screens/AddContact/AddContact';
import PrivacyPolicy from './components/screens/PrivacyPolicy/PrivacyPolicy';
import {
  Welcome,
  Settings,
  DefiAccessMain,
  SelectCoin,
  Send,
  SendBtc,
  WalletMain,
  CreatePin,
  DetailTransaction,
  TransactionHistory,
  Security,
  AddCustomToken,
  EnterPin,
  Currency,
  ConfirmPin,
  EnterPinSecurity,
  CreatePinSecurity,
  ConfirmPinSecurity,
  Receive,
  Swap,
  Portfolio,
  UpdateWatchList,
  ToggleWalletNew,
  DetailCrossChain,
  SendTrx,
  NotificationsTab,
  DappBrowserNew,
  Onboarding,
  Legal,
  WalletName,
  ImportWallet,
  SecretPhrase,
  VerifySecretPhrase,
  ManageOnboarding,
  ManageImportWallet,
  ManageVerifySecretPhrase,
  ExportPrivateKeys,
  ShowRecoveryPhrase,
  MyWalletList,
  SendSol,
  WalletConnection,
  DappHistory,
  SendCosmos,
  ChainAbstraction,
  VpnScreen,
  RecentSessionScreen,
  ServersScreen,
  WishlistServersScreen,
  SelectServers,
  VpnAccountDetails,
  BuyCredit,
  VpnNodeAccess,
  RpcDetails,
  VpnSettings,
  MpcWalletCoinList
} from './components/screens/index';
import Nft from './components/screens/Nft/Nft';
import NftDetails from './components/screens/NftDetail/NftDetails';
import SendNft from './components/screens/SendNft';
import AutoLock from './components/screens/AutoLock/AutoLock';
import { CustomTabBarVpn } from './components/common/CustomTabBarVpn';
import ServiceProvider from './components/screens/ServiceProvider/ServiceProvider';
import { ThemeManager } from '../ThemeManager';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Helper to pass route params as props (mimics RNRF behavior) ---
const wrapComponent = (Component: any) => {
  return (props: any) => {
    return <Component {...props} {...(props.route?.params || {})} />;
  };
};

// --- Tab Navigators ---
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => {
        // Needs proper import inside or outside. Let's rely on global imports
        return <CustomTabBar {...props} ref={(ref) => { Singleton.bottomBar = ref; }} />;
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="WalletMain" component={wrapComponent(WalletMain)} />
      <Tab.Screen name="Swap" component={wrapComponent(Swap)} />
      <Tab.Screen name="Portfolio" component={wrapComponent(Portfolio)} />
      <Tab.Screen name="DefiAccessMain" component={wrapComponent(DefiAccessMain)} />
      <Tab.Screen name="ChainAbstraction" component={wrapComponent(ChainAbstraction)} />
    </Tab.Navigator>
  );
}

function VpnTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => {
        return <CustomTabBarVpn {...props} ref={(ref) => { Singleton.bottomBar = ref; }} />;
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="VpnScreen" component={wrapComponent(VpnScreen)} />
      <Tab.Screen name="WalletMain" component={wrapComponent(WalletMain)} />
      <Tab.Screen name="RecentSessionScreen" component={wrapComponent(RecentSessionScreen)} />
      <Tab.Screen name="ServersScreen" component={wrapComponent(ServiceProvider)} />
      <Tab.Screen name="VpnSettings" component={wrapComponent(VpnSettings)} />
    </Tab.Navigator>
  );
}

// --- Root Stack Navigator ---
const Router = ({ onRouteChanged }: { onRouteChanged?: any }) => {
  const [theme, setTheme] = useState<any>(ThemeManager.colors.mainBgNew);

  useEffect(() => {
    const themeListener = EventRegister.addEventListener('getThemeChanged', (data) => {
      setTheme(ThemeManager.colors.mainBgNew);
    });
    return () => {
      EventRegister.removeEventListener(themeListener as any);
    };
  }, []);

  const MyTheme = {
    ...((ThemeManager as any).mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...((ThemeManager as any).mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme,
      card: theme,
    },
  };

  return (
    <NavigationContainer
      theme={MyTheme}
      ref={navigationRef}
      onStateChange={(state) => {
        const currentRoute: any = navigationRef.getCurrentRoute();
        if (currentRoute && onRouteChanged) {
          onRouteChanged(currentRoute.name);
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme }
        }}
      >
        <Stack.Screen name="Welcome" component={wrapComponent(Welcome)} />
        <Stack.Screen name="Onboarding" component={wrapComponent(Onboarding)} />
        <Stack.Screen name="Legal" component={wrapComponent(Legal)} />
        <Stack.Screen name="WalletName" component={wrapComponent(WalletName)} />
        <Stack.Screen name="ImportWallet" component={wrapComponent(ImportWallet)} />
        <Stack.Screen name="SecretPhrase" component={wrapComponent(SecretPhrase)} />
        <Stack.Screen name="VerifySecretPhrase" component={wrapComponent(VerifySecretPhrase)} />
        <Stack.Screen name="ManageOnboarding" component={wrapComponent(ManageOnboarding)} />
        <Stack.Screen name="ManageImportWallet" component={wrapComponent(ManageImportWallet)} />
        <Stack.Screen name="ManageVerifySecretPhrase" component={wrapComponent(ManageVerifySecretPhrase)} />
        <Stack.Screen name="ConfirmPin" component={wrapComponent(ConfirmPin)} />
        <Stack.Screen name="Manage" component={wrapComponent(Manage)} />
        <Stack.Screen name="Currency" component={wrapComponent(Currency)} />
        <Stack.Screen name="SelectCoin" component={wrapComponent(SelectCoin)} />
        <Stack.Screen name="Send" component={wrapComponent(Send)} />
        <Stack.Screen name="SendBtc" component={wrapComponent(SendBtc)} />
        <Stack.Screen name="SendBnbPol" component={wrapComponent(SendBnbPol)} />
        <Stack.Screen name="SendSol" component={wrapComponent(SendSol)} />
        <Stack.Screen name="Receive" component={wrapComponent(Receive)} />
        <Stack.Screen name="EnterPin" component={wrapComponent(EnterPin)} options={{ gestureEnabled: false }} />
        <Stack.Screen name="CreatePin" component={wrapComponent(CreatePin)} />
        <Stack.Screen name="WalletMain" component={wrapComponent(WalletMain)} />
        <Stack.Screen name="Swap" component={wrapComponent(Swap)} />
        <Stack.Screen name="Portfolio" component={wrapComponent(Portfolio)} />
        <Stack.Screen name="DefiAccessMain" component={wrapComponent(DefiAccessMain)} />
        <Stack.Screen name="ChainAbstraction" component={wrapComponent(ChainAbstraction)} />
        <Stack.Screen name="Settings" component={wrapComponent(Settings)} />
        <Stack.Screen name="VpnScreen" component={wrapComponent(VpnScreen)} />
        <Stack.Screen name="RecentSessionScreen" component={wrapComponent(RecentSessionScreen)} />
        <Stack.Screen name="ServersScreen" component={wrapComponent(ServiceProvider)} />
        <Stack.Screen name="VpnSettings" component={wrapComponent(VpnSettings)} />
        <Stack.Screen name="PrivacyPolicy" component={wrapComponent(PrivacyPolicy)} />
        <Stack.Screen name="AddContact" component={wrapComponent(AddContact)} />
        <Stack.Screen name="AddressBook" component={wrapComponent(AddressBook)} />
        <Stack.Screen name="TransactionHistory" component={wrapComponent(TransactionHistory)} />
        <Stack.Screen name="Security" component={wrapComponent(Security)} />
        <Stack.Screen name="AddCustomToken" component={wrapComponent(AddCustomToken)} />
        <Stack.Screen name="DetailTransaction" component={wrapComponent(DetailTransaction)} />
        <Stack.Screen name="EnterPinSecurity" component={wrapComponent(EnterPinSecurity)} options={{ gestureEnabled: false }} />
        <Stack.Screen name="CreatePinSecurity" component={wrapComponent(CreatePinSecurity)} />
        <Stack.Screen name="ConfirmPinSecurity" component={wrapComponent(ConfirmPinSecurity)} />
        <Stack.Screen name="UpdateWatchList" component={wrapComponent(UpdateWatchList)} />
        <Stack.Screen name="ToggleWalletNew" component={wrapComponent(ToggleWalletNew)} />
        <Stack.Screen name="DetailCrossChain" component={wrapComponent(DetailCrossChain)} />
        <Stack.Screen name="SendTrx" component={wrapComponent(SendTrx)} />
        <Stack.Screen name="NotificationsTab" component={wrapComponent(NotificationsTab)} />
        <Stack.Screen name="DappBrowserNew" component={wrapComponent(DappBrowserNew)} />
        <Stack.Screen name="ExportPrivateKeys" component={wrapComponent(ExportPrivateKeys)} />
        <Stack.Screen name="ShowRecoveryPhrase" component={wrapComponent(ShowRecoveryPhrase)} />
        <Stack.Screen name="MyWalletList" component={wrapComponent(MyWalletList)} />
        <Stack.Screen name="WalletConnection" component={wrapComponent(WalletConnection)} />
        <Stack.Screen name="Nft" component={wrapComponent(Nft)} />
        <Stack.Screen name="NftDetails" component={wrapComponent(NftDetails)} />
        <Stack.Screen name="SendNft" component={wrapComponent(SendNft)} />
        <Stack.Screen name="DappHistory" component={wrapComponent(DappHistory)} />
        <Stack.Screen name="AutoLock" component={wrapComponent(AutoLock)} />
        <Stack.Screen name="SendCosmos" component={wrapComponent(SendCosmos)} />
        <Stack.Screen name="WishlistServersScreen" component={wrapComponent(WishlistServersScreen)} />
        <Stack.Screen name="SelectServers" component={wrapComponent(SelectServers)} />
        <Stack.Screen name="VpnAccountDetails" component={wrapComponent(VpnAccountDetails)} />
        <Stack.Screen name="BuyCredit" component={wrapComponent(BuyCredit)} />
        <Stack.Screen name="RpcDetails" component={wrapComponent(RpcDetails)} />
        <Stack.Screen name="MpcWalletCoinList" component={wrapComponent(MpcWalletCoinList)} />
        <Stack.Screen name="VpnNodeAccess" component={wrapComponent(VpnNodeAccess)} />
        <Stack.Screen name="ServiceProvider" component={wrapComponent(ServiceProvider)} />
        <Stack.Screen name="SeverByProvider" component={wrapComponent(ServersScreen)} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="VpnTab" component={VpnTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Router;
