import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Text,
  View,
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import {
  HeaderMain,
  DvpnLoader,
  AppAlert,
} from '../../common';
import styles from './ServiceProviderStyle';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { getUserSubscriptions } from '../../Api/VPN/api/getUserSubscriptions';
import ServerCards from '../../common/ServerCards';
import { getAllProviders } from '../../Api/VPN/api/getAllProviders';
import { Fonts } from '../../../theme';

const ServiceProvider = (props: any) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(true);
  const [defaultWallet, setDefaultWallet] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [filteredCountryList, setFilteredCountryList] = useState<any[]>([]);
  const [planLastId, setPlanLastId] = useState<any>(null)
  const [alertData, setAlertData] = useState({
    isShowAlert: false,
    alertTxt: '',
  });

  const fetchServiceProvider = async () => {
    try {
      const response = await getAllProviders();
      setLoading(false)
      consoleLogFunc('response--->>', JSON.stringify(response));
      if (response.status == 200) {
        setFilteredCountryList(response?.data);
        const lastPlanId = await getData(Constants.LAST_PLAN_ID_USED)
        if(lastPlanId != null) {
          setPlanLastId(lastPlanId)
        }else{
          const lastProvider = response?.data?.find((res: any) => res?.isUserSubscribed)
          setPlanLastId(lastProvider?.subscribedPlanIds?.[0])
        }
      } else {
        setAlertData({
          isShowAlert: true,
          alertTxt: 'Unable to fetch the provider list',
        });
      }
    } catch (error) {
      setLoading(false)
      consoleLogFunc('error--->>', error);
      setAlertData({
        isShowAlert: true,
        alertTxt: 'Unable to fetch the provider list',
      });
    }
  }

  const getDefaultWallet = async () => {
    getData(Constants.MULTI_WALLET_LIST).then(list => {
      let currentWallet = JSON.parse(list);
      currentWallet = currentWallet.find((res: any) => res?.defaultWallet);
      setDefaultWallet(currentWallet);
    });
  }
  useEffect(() => {
    if(props?.isFrom != "VPN_SCREEN"){
    fetchServiceProvider();
    getDefaultWallet();
    }
    const focusListener = props.navigation.addListener('focus', () => {
      fetchServiceProvider();
      getDefaultWallet();
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
    gerUserSubscrption();
    return () => {
      focusListener();

    };
  }, []);



  const gerUserSubscrption = async () => {
    let planId = null;

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
        setSubscriptions(validSubscriptions);
      }
      else {
        setSubscriptions([]);
      }
    } catch (err: any) {
    } finally {
      try {
        consoleLogFunc('loadVpnNodes planId------>', planId);
       
      } catch (err: any) {
        console.error('❌ loadVpnNodesa failed:', err.message);
      }
    }
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.serviceProvider}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          backCallBack={()=> {
            if(props?.isFrom == "VPN_SCREEN"){
              Actions.pop()
            }
          }}
          showBackBtn={props?.isFrom != "VPN_SCREEN"}
        />

        <FlatList
          data={filteredCountryList ?? []}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: widthDimen(24), paddingTop: heightDimen(20) }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            let name = item.identity ? item.identity : item.name ?? "Unknown";
            let subscribedPlans = item?.subscribedPlanIds?.length || 0
            let locationTxt = subscribedPlans > 1 ? vpn.countries : vpn.country
            return (
              <ServerCards
                name={name?.trim()}
                index={index}
                locations={subscribedPlans}
                isLastPlan={ planLastId != undefined && planLastId === item?.subscribedPlanIds?.[0]}
                locationTxt={locationTxt}
                isUserSubscribed={item?.isUserSubscribed}
                ping={''}
                isFavShow={false}
                chainAddress={item?.address}
                onPress={() => {
                  consoleLogFunc("subscribedPlans>>", subscribedPlans,item)
                  if(item?.isUserSubscribed){
                    Actions.currentScene != "SeverByProvider" && 
                    (Actions as any).SeverByProvider({
                      selectedProvider: item,
                      onBuyPlanPress: () => {
                        Actions.pop();
                        Actions.currentScene != 'BuyCredit' &&
                        (Actions as any).BuyCredit({
                          defaultWallet: defaultWallet,
                          userSubscription: subscriptions ?? {}, //currently no subscription will be shown in this screen
                          serviceProvider: item ?? {},
                        })
                      }
                    })
                  }else{
                    Actions.currentScene != 'BuyCredit' &&
                    (Actions as any).BuyCredit({
                      defaultWallet: defaultWallet,
                      userSubscription: subscriptions ?? {}, //currently no subscription will be shown in this screen
                      serviceProvider: item ?? {},
                  })        
                  }
                }}
              />
            )
          }}
          ListEmptyComponent={
            <View style={{ height: heightDimen(Dimensions.get('screen').height / 1.5), justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: dimen(16), fontFamily: Fonts.dmMedium, color: ThemeManager.colors.blackWhiteText }}>{loading ? "":"No provider found"}</Text>
            </View>
          }
        />


        <DvpnLoader isLoading={loading} />

       <AppAlert
          visible={!!alertData?.isShowAlert}
          alertTxt={alertData?.alertTxt}
          hideAlertDialog={() => {
            setAlertData({...alertData, isShowAlert: false});
          }}
        />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(ServiceProvider);
