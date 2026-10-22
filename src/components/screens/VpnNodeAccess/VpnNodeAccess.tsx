import {useEffect, useState} from 'react';
import { BackHandler, View } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import {EventRegister} from 'react-native-event-listeners';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import {connect} from 'react-redux';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import {widthDimen} from '../../../Utils';
import {HeaderMain, LoaderView} from '../../common';
import VpnCard from '../../common/VpnCard';
import styles from './VpnNodeAccessStyle';
import {getUserSubscriptions} from '../../Api/VPN/api/getUserSubscriptions';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';

const VpnNodeAccess = (props: any) => {
  const {vpn} = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    initScreen();
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any).removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
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

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({type: ActionConst.RESET});
    return true;
  };

  const initScreen = async () => {
    setLoading(true);
    try {
      const subsResponse = await getUserSubscriptions({
        limit: 5,
        order: 'DESC',
      });
      consoleLogFunc('subsResponsesubsResponsesubsResponse->>', subsResponse);
      const subscriptions = subsResponse?.data?.subscriptions || [];
      setLoading(false);
      var remaining = '';
      if (subscriptions.length > 0) {
        const subscribedTo = subscriptions[0];
        consoleLogFunc('subscribedTo->>', subscribedTo);
        remaining = getDaysLeftText(subscribedTo?.inactive_at);
        consoleLogFunc(`⏳ Days left: ${remaining}`);
              setUserSubscription(remaining);

      }else{
      setUserSubscription('No Active Node');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('🔴 initScreen error:', error?.message);
    }
  };

  const getDaysLeftText = (inactive_at: any) => {
    if (!inactive_at) return 'No expiry date';

    const now = new Date();
    const inactiveDate = new Date(inactive_at);
    const diffMs = inactiveDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 1) return '1';

    return `${diffDays}`;
  };


  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.nodeAccess}
          customStyle={{paddingHorizontal: widthDimen(24)}}
        />
        {/* **********************************Card View*************************************** */}

        <View style={[styles.mainView_2]}>
          <VpnCard
            daysLeft={userSubscription}
          />
        </View>
        <LoaderView isLoading={loading} />
      </View>
    </BackgroundImage>
  );
};

export default connect(undefined, {})(VpnNodeAccess);
