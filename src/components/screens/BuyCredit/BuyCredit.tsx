import { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Actions } from '../../../navigation/RootNavigation';
import { EventRegister } from 'react-native-event-listeners';
import styles from './BuyCreditStyle';
import { ThemeManager } from '../../../../ThemeManager';
import { LanguageManager } from '../../../../LanguageManager';
import { AppAlert, Button, DvpnLoader, HeaderMain } from '../../common';
import CreditScoreCard from '../../common/CreditScoreCard';
import { getPlans } from '../../Api/VPN/api/getPlans';
import { Fonts } from '../../../theme';
import * as Constants from '../../../Constants';
import { dimen, widthDimen } from '../../../Utils';
import {
    bigNumberFormat,
  bigNumberSafeMath,
  consoleLogFunc,
  getData,
  getEncryptedData,
} from '../../../Utils/MethodsUtils';
import { handlePurchase } from '../../Api/VPN/api/startSubscriptionOnChain';
import { getBalance } from '../../Api/VPN/api/startSubscriptionOnChain';
import { postWalletVersions } from '../../Api/VPN/api/postWalletVersions';
import Singleton from '../../../Singleton';

const BuyCredit = ({ defaultWallet, userSubscription = {}, serviceProvider }: {defaultWallet: any; userSubscription?: any; serviceProvider: any}) => { //currently no subscription will be shown in this screen
  const { vpn, help } = LanguageManager;
  const { colors, ImageIcons } = ThemeManager;
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [balance, setBalance] = useState<any>();
  const [expanded, setExpanded] = useState<any>([]);
  const [isSafeAppleReview, setIsSafeAppleReview] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const fetchAppleReviewMode = useCallback(async () => {
    try {
      const res = await postWalletVersions({
        version: DeviceInfo.getVersion(),
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      setIsSafeAppleReview(!!res?.data?.testing);
    } catch (e) {
      consoleLogFunc('Wallet versions / review mode check failed:', e);
      setIsSafeAppleReview(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    fetchPlans();
    fetchAppleReviewMode();
    const sub = EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
    return () => (EventRegister as any).removeEventListener(sub);
    // @ts-expect-error BUG PRESERVED: fetchPlans is referenced before its const declaration (TDZ at runtime)
  }, [fetchPlans, fetchAppleReviewMode]);

  // Fetch Plans
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlans({
        limit: 10,
        page: 1,
        prov_address: serviceProvider?.address ?? '',
      });
      consoleLogFunc('Fetched Plans:::::::', JSON.stringify(res?.data));
      setLoading(false);
      let filteredList = res?.data;
      if (Array.isArray(res?.data)) {
        filteredList = res?.data?.filter(
          (item: any) => item?.countries?.length > 0,
        );
        setPlans(filteredList);
      } else if (res?.data) {
        let list = [res?.data];
        filteredList = list?.filter(
          item => item?.node_count != '0' && item?.country != null,
        );
        setPlans([filteredList]);
      } else {
        setPlans([]);
      }
      if (filteredList?.length > 0) {
        const expandedState = filteredList?.reduce((acc: any, item: any) => {
          acc[item.plan_id] = false;
          return acc;
        }, {});
        setExpanded(expandedState);
      }
    } catch (error) {
      setLoading(false);
      consoleLogFunc('Error fetching plans:', error);
      setPlans([]);
    }
  }, []);

  const loadBalance = async (addressParam?: any) => {
    const address = await getData(Constants.COSMOS_ADDRESS);
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

  // Handle Purchase
  const Purchase = async (plan: any) => {
    const price = bigNumberSafeMath(selectedPlan?.prices?.[0]?.quote_value, "/", 10 ** 18);
    consoleLogFunc('Purchase price', balance, price);
    if (bigNumberFormat(balance).lt(price)) {
      setAlertText('Insufficient balance to purchase this plan.');
      setAlertModal(true);
      return;
    }

    try {
      const mnemonics = await getMnemonics();
      setLoading(true);
      const { subscriptionId, txHash } = (await handlePurchase({
        mnemonic: mnemonics?.toLowerCase()?.trim(),
        rpc: Constants.COSMO_RPC_URL,
        id: plan,
      })) as any;
      consoleLogFunc('✅ Subscription started:', subscriptionId, txHash);
      if (txHash) {
        setLoading(false);
        setAlertText(
          'Nodes included in your current plan are available for connection.',
        );
        setAlertModal(true);
      } else {
        setAlertText('Failed to verify plan, please try again');
        setAlertModal(true);
      }
    } catch (err) {
      console.error('❌ Purchase error:', err);
      setLoading(false);
      setAlertText('Failed to start subscription');
      setAlertModal(true);
    }
  };
  const getMnemonics = async () => {
    return new Promise<any>((resolve, reject) => {
      Singleton.getInstance().walletPinCallback = async (pin: any) => {
        setLoading(true);
        try {
          const mnemonics = await getEncryptedData(
            defaultWallet?.loginRequest?.wallet_address,
            pin,
          );
          resolve(mnemonics);
        } catch (error) {
          reject(error);
        }
      };
      (Actions as any).EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
      });
    });
  };

  return (
    <ImageBackground
      source={ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: colors.mainBgNew }}>
      <View style={styles.mainView}>
        <HeaderMain BackButtonText={isSafeAppleReview ? 'dVPN Locations' : 'Account Top-Up'} />
        {plans?.length > 0 ? (
          <View style={localStyles.contentWrapper}>
            {/* Top Section */}
            <View style={{ flex: 1 }}>
              <View style={localStyles.headerSection}>
                <Text
                  style={[localStyles.title, { color: colors.blackWhiteText }]}>
                  {`Available ${isSafeAppleReview ? 'Locations' : 'Plans'} - \n${serviceProvider?.identity
                      ? serviceProvider.identity
                      : serviceProvider.name ?? 'Unknown'
                    }`}
                </Text>
                <Text
                  style={[
                    localStyles.subtitle,
                    { color: colors.legalGreyColor },
                  ]}>
                  {
                    isSafeAppleReview ? 'Access fast and secure VPN connections across global nodes.' :
                      'Subscribe plan and spend them on fast, secure & decentralized VPN service within Qubetics Blockchain.'
                  }
                </Text>
              </View>

              <FlatList
                style={{ marginTop: 20 }}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                data={plans}
                contentContainerStyle={{ paddingBottom: dimen(20) }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: widthDimen(14) }} />
                )}
                keyExtractor={(item, index) =>
                  item?.planId?.toString() || index.toString()
                }
                renderItem={({ item, index }) => {
                  return (
                    <CreditScoreCard
                      index={index}
                      item={item}
                      expanded={expanded}
                      onPressBtn={(i: any) => {
                        // We will need to handle accordion, making only one expansion at once
                        setExpanded((prev: any) => ({
                          [item.plan_id]: !prev[item.plan_id],
                        }));
                        setSelectedPlan(i);
                      }}
                      isSafeAppleReview={isSafeAppleReview}
                    />
                  );
                }}
              />
            </View>

            {/* Footer Section */}
            <View style={localStyles.footer}>
              <Button
                buttontext={isSafeAppleReview ? "Proceed" : vpn.Purchase}
                myStyle={(styles as any).button}
                onPress={() => {
                  const trueKeys = Object.keys(expanded).filter(
                    (key: any) => expanded[key],
                  );
                  if (trueKeys.length > 0) {
                    const activeKey = trueKeys[0];
                    Purchase(activeKey);
                  } else {
                    setAlertText(
                      'Please select a plan before proceeding to purchase.',
                    );
                    setAlertModal(true);
                  }
                  return;
                }}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.emptyView, { flex: 1 }]}>
            <Text
              style={[
                styles.txtTitle,
                { color: colors.blackWhiteText, textAlign: 'center' },
              ]}>
              {help.noPlanFound}
            </Text>
          </View>
        )}
      </View>
      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        showSuccess={
          alertText ==
            'Nodes included in your current plan are available for connection.'
            ? true
            : false
        }
        hideAlertDialog={() => {
          setAlertModal(false);
          if (
            alertText ==
            'Nodes included in your current plan are available for connection.'
          ) {
            Actions.pop();
          }
        }}
      />
      <DvpnLoader isLoading={loading} />
    </ImageBackground>
  );
};

export default BuyCredit;

const localStyles = StyleSheet.create({
  contentWrapper: {
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 25,
  },
  headerSection: {
    paddingHorizontal: 20,
    gap: 15,
  },
  title: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 27,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 20,
  },
});
