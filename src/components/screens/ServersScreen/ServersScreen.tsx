import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { EventRegister } from 'react-native-event-listeners';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import { widthDimen } from '../../../Utils';
import {
  HeaderMain,
  InputtextSearch,
  DvpnLoader,
} from '../../common';
import RecentServers from '../../common/RecentServers';
import VpnGradientCard from '../../common/VpnGradientCard';
import styles from './ServersScreenStyle';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';
import { getVpnNodes } from '../../Api/VPN/api/getVpnNodes';

const filters1 = ["All", "Wireguard"];

const ServersScreen = (props: any) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected1, setSelected1] = useState('All');
  const [countryList, setCountryList] = useState<any[]>([]);
  const [filteredCountryList, setFilteredCountryList] = useState<any[]>([]);
  const [planId, setPlanId] = useState<any>(null)

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      gerUserSubscrption();
    });
    const blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
    gerUserSubscrption();
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

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({ type: ActionConst.RESET });
    return true;
  };

  const gerUserSubscrption = async (protocol = "all") => {
    let planId = props?.selectedProvider?.subscribedPlanIds?.[0];
      try {
        setPlanId(planId);
        consoleLogFunc('loadVpnNodes planId------>',props, planId);
        await loadVpnNodes(planId, protocol?.toLowerCase()); // ✅ pass planId (null if no subscription)
      } catch (err: any) {
        console.error('❌ loadVpnNodesa failed:', err.message);
      }
  };

  const loadVpnNodes = async (planId: any = null, protocol = "all") => {
    try {
      const params: any = {
        limit: 10,
        page: 1,
        order: 'DESC', // ✅ fixed typo (was 'DES')
        reverse: false,
        protocol: protocol,
      };

      if (planId) {
        params.planId = planId; // ✅ only add if available
      }
      consoleLogFunc('loadVpnNodes call param ----->>>', params)
      const result = await getVpnNodes(params);
      setLoading(false);
      if (!result.Error) {
        consoleLogFunc('✅ all VPN Nodes:', result);
        consoleLogFunc('✅ VPN Nodes:', result?.data?.countries);

        setCountryList(result?.data?.countries);
        setFilteredCountryList(result?.data?.countries);

        if (result?.data?.total) {
          consoleLogFunc('Total Nodes:', result?.data?.total);
        }
      } else {
        console.warn('⚠️ Failed to fetch nodes:', result.Message);
      }
    } catch (err: any) {
      setLoading(false);
      console.error('❌ Error fetching nodes:', err.message);
    }
  };

  const renderButton = (label: any, selected: any, setSelected: any) => {
    const isActive = label === selected;

    const ButtonContent = (
      <Text
        style={[
          isActive ? styles.activeText : styles.inactiveText,
          {
            color: isActive
              ? ThemeManager.colors.headersTextColor
              : ThemeManager.colors.legalGreyColor,
          },
        ]}>
        {label}
      </Text>
    );

    return (
      <Pressable
        key={label}
        onPress={() => {
          gerUserSubscrption(label)
          setSelected(label)}}
        style={{ marginRight: widthDimen(15) }}>
        <VpnGradientCard {...({ isOutLine: true, children: ButtonContent } as any)} />
      </Pressable>
    );
  };
  const updateSearch = (text: any) => {
    if (countryList?.length <= 0) {
      return;
    }
    let list = countryList?.filter(res =>
      res?.country?.toLowerCase().startsWith(text?.toLowerCase()),
    );
    setFilteredCountryList(list);
  };
  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.servers}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
        />
        <InputtextSearch
          style={{
            height: 50,
            marginHorizontal: widthDimen(22),
          }}
          placeholder={vpn.searchCountryCity}
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
          }}
          onSubmitEditing={() => updateSearch(search)}
        />

        <View style={{ marginTop: 20, marginHorizontal: widthDimen(24) }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.row}>
            {filters1.map(label =>
              renderButton(label, selected1, setSelected1),
            )}
          </ScrollView>


        <RecentServers
          fromServerScreen
          isFavShow={false}
          dataList={filteredCountryList}
          loading={loading}
          listType={'Country'}
          onBuyPlanPress={() => {
            props?.onBuyPlanPress && props?.onBuyPlanPress();
          }}
          onPress={(item: any) => {
            consoleLogFunc('item====>>>>>>>>>', planId);
            Actions.currentScene != 'WishlistServersScreen' &&
              (Actions as any).WishlistServersScreen({ country: item?.country || '', planId: planId, protocol: selected1?.toLowerCase() });
          }}
        />
        </View>
        <DvpnLoader isLoading={loading} />
      </View>
    </BackgroundImage>
  );
};

export default connect(undefined, {})(ServersScreen);
