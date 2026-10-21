import {useEffect, useState} from 'react';
import {
  BackHandler,
  Dimensions,
  ImageBackground,
  View,
} from 'react-native';
import {EventRegister} from 'react-native-event-listeners';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import {connect} from 'react-redux';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import {widthDimen} from '../../../Utils';
import {
  DvpnLoader,
  HeaderMain,
  InputtextSearch,
} from '../../common';
import styles from './WishlistServersScreenStyle';
import RecentServers from '../../common/RecentServers';
import {getVpnNodes} from '../../Api/VPN/api/getVpnNodes';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';


const WishlistServersScreen = (props: any) => {
  const {vpn} = LanguageManager;

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [countryList, setCountryList] = useState<any[]>([]);
  const [cityFlag, setCityFlag] = useState('');
  const [filteredCountryList, setFilteredCountryList] = useState<any[]>([]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      loadVpnNodes();
    });
    const blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    loadVpnNodes();

    return () => {
      focusListener();
      blurListener();
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);

  const loadVpnNodes = async () => {
    setLoading(true);
    try {
      const reqParams = {
        limit: 10,
        page: 1,
        order: 'ASC',
        reverse: false,
        country: props?.country,
        planId: props?.planId,
        protocol: props?.protocol,
      }
      consoleLogFunc('reqParams reqParams--->', reqParams);
      const result = await getVpnNodes(reqParams);
      setLoading(false);
      if (!result.Error) {
        consoleLogFunc('✅ all VPN Nodes:', result);
        consoleLogFunc('✅ VPN Nodes:', result?.data?.cities);
        setCountryList(result?.data?.cities);
        setFilteredCountryList(result?.data?.cities);
        setCityFlag(result?.data?.flag_url);

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

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({type: ActionConst.RESET});
    return true;
  };
  const updateSearch = (text: any) => {
    let list = countryList.filter(res =>
      res.city?.toLowerCase().startsWith(text.toLowerCase()),
    );
    setFilteredCountryList(list);
  };
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.servers}
          customStyle={{paddingHorizontal: widthDimen(24)}}
        />
        <InputtextSearch
          style={{
            height: 50,
            width: Dimensions.get('screen').width - widthDimen(48),
          }}
          placeholder={vpn.searchCity}
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
        <View style={{ marginHorizontal: widthDimen(24) }}>

        <RecentServers
          fromServerScreen
          isFavShow={false}
          dataList={filteredCountryList}
          listType={'City'}
          cityFlag={cityFlag}
          onPress={(item: any) => {
            Actions.currentScene != 'SelectServers' &&
              (Actions as any).SelectServers({data: item, planId: props?.planId, protocol: props?.protocol});
          }}
        />
        </View>
        <DvpnLoader isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(WishlistServersScreen);
