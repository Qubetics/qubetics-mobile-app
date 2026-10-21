import {ImageBackground, Platform, SectionList, Text, View} from 'react-native';
import {useEffect, useState} from 'react';
import {ThemeManager} from '../../../../ThemeManager';
import {DvpnLoader, HeaderMain} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {dimen, widthDimen} from '../../../Utils';
import SettingCards from '../../common/SettingCards';
import styles from './VpnSettingsStyles';
import { Actions } from '../../../navigation/RootNavigation';
import {CURRENT_ANDROID_VERSION, CURRENT_IOS_VERSION, DVPN_PRIVACY_POLICY_LINK, DVPN_TERM_LINK, LAST_PLAN_ID_USED} from '../../../Constants';
import {useSelector} from 'react-redux';
import { getActiveroviders } from '../../Api/VPN/api/getAllProviders';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';

const VpnSettings = () => {
  const [sectionedData, setSectionedData] = useState<any>([]);
  const coinList = useSelector((state: any) => state.walletReducer.coinList);
  const [selectedCoin, setselectedCoin] = useState<any>();
  const [loading] = useState(false);
  const [lastProvider, setLastProvider] = useState<any>(null);

  useEffect(() => {
    const filteredCoins =
      coinList?.filter((coin: any) => coin.coin_name == 'Qubetics') || [];
    setselectedCoin(filteredCoins[0]);
    initScreen();

    return () => {};
  }, []);

  const initScreen = async () => {
    let lastProvider: any = null
    try {
      let activeProvider = await getActiveroviders();
      activeProvider = activeProvider.data
      consoleLogFunc('activeProvider--->>', activeProvider);
      const lastPlanId = await getData(LAST_PLAN_ID_USED)
      consoleLogFunc('lastPlanId--->>', lastPlanId);
      if(lastPlanId != null && activeProvider.length > 0) {
        // BUG PRESERVED: inner const activeProvider shadows outer one and is read in its own initializer (TDZ ReferenceError at runtime)
        // @ts-ignore
        const activeProvider = activeProvider.find((provider: any) => provider.plan_id == lastPlanId)
        if(activeProvider) {
          lastProvider = activeProvider.name
        }
      }else if(activeProvider.length > 0) {
        lastProvider = activeProvider[0]
      }
      setLastProvider(lastProvider);
      consoleLogFunc('lastProvider--->>', lastProvider);
    } catch (error: any) {
    } finally {
      // Always build sectionedData, even on failure

      const settingsData: any[] = [
        {
          title: 'Connectivity',
          data: [
            {
              id: 2,
              images: 'exchangeRpcIcon',
              title: 'RPC',
              showView: false,
            },
          ],
        },
        {
          title: 'Legal',
          data: [
            {
              id: 4,
              images: 'termsAndServiceIcon',
              title: 'Terms of Service',
              showView: false,
            },
            {
              id: 5,
              images: 'greyPrivacyPolicy',
              title: LanguageManager.setting.privacyPolicy,
              showView: false,
            },
            {
              id: 6,
              images: 'versionFrame',
              title: 'Version',
              showView: true,
              rightText: Platform.OS == 'android' ? CURRENT_ANDROID_VERSION : CURRENT_IOS_VERSION, // works even if failed
            },
          ],
        },
        {
          title: 'Account',
          data: [
            {
              id: 9,
              images: 'accountIcon',
              title: 'Account Details',
              showView: false,
            },
            {
              id: 10,
              images: 'accountManageIcon',
              title: 'Account Top-Up',
              showView: false,
            },
          ],
        },
      ]

      if (lastProvider != null) {
        settingsData.unshift({
          title: 'Choose Provider',
          data: [
            {
              id: 11,
              images: 'accountIcon',
              title: lastProvider?.name || lastProvider?.identity || "Unknown",
              showView: false,  
            },
          ],
        })
      }

      setSectionedData(settingsData);
    }
  };
  const renderSectionHeader = ({section: {title}}: {section: any}) => {
    if (!title) return null;

    return (
      <Text
        style={[
          styles.sectionHeaderText,
          {color: ThemeManager.colors.blackWhiteText},
        ]}>
        {title}
      </Text>
    );
  };

  const renderItem = ({item, index}: {item: any; index: any}) => {
    return (
      <SettingCards
        leftIcon={(ThemeManager.ImageIcons as any)?.[item.images]}
        leftText={item?.title}
        showRightText={item?.rightText}
        onPress={() => {
          consoleLogFunc('213123123123123123123', item, index);
          if (item?.title == 'Account Details') {
            (Actions as any).currentScene != 'VpnAccountDetails' &&
              (Actions as any).VpnAccountDetails();
          }
          if (item?.title == 'RPC') {
            (Actions as any).RpcDetails();
          }
          if (item?.title == 'Privacy Policy') {
            (Actions as any).currentScene != 'PrivacyPolicy' &&
              (Actions as any).PrivacyPolicy({
                Viewtype: 'PrivacyPolicy',
                url: DVPN_PRIVACY_POLICY_LINK,
              });
          }

          if (item?.title == 'Terms of Service') {
            (Actions as any).currentScene != 'PrivacyPolicy' &&
              (Actions as any).PrivacyPolicy({
                Viewtype: 'TermsofService',
                url: DVPN_TERM_LINK,
              });
          }

          if (item?.title == 'Node Access') {
            (Actions as any).currentScene != 'VpnNodeAccess' && (Actions as any).VpnNodeAccess();
          }

          if (item?.title == 'Account Top-Up') {
            (Actions as any).currentScene != 'Receive' &&
              (Actions as any).Receive({
                selectedCoin: selectedCoin,
                themeSelected: 2,
                accouttopup: 'cosmos',
              });
          }
          if (item?.id == 11) {
            (Actions as any).currentScene != "SeverByProvider" && 
                    (Actions as any).SeverByProvider({
                      selectedProvider: lastProvider,
                    })
          }
        }}
      />
    );
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={LanguageManager.setting.settings}
          customStyle={{paddingHorizontal: widthDimen(24)}}
          showBackBtn={true}
        />
        <View
          style={{
            flex: 1,
          }}>
          <SectionList
            sections={sectionedData}
            style={{
              marginHorizontal: dimen(24),
            }}
            showsVerticalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{
              paddingBottom: dimen(24),
            }}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={{height: dimen(8)}} />}
          />
        </View>
      </View>
      <DvpnLoader isLoading={loading} />
    </ImageBackground>
  );
};

export default VpnSettings;
