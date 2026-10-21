import { useEffect, useRef, useState } from 'react';
import { BackHandler, ImageBackground } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { HeaderMain } from '../../common';
import Notifications from './Notifications';
import Announcements from './Announcements';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from '../../../navigation/RootNavigation';
import { getNotiStatus } from '../../../Redux/Actions';
import { useDispatch } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';
import { Images } from '../../../theme';
import colors from '../../../theme/Colors';
import { heightDimen, widthDimen } from '../../../Utils';

const NotificationsTab = (props: any) => {
  const dispatch = useDispatch<any>();
  const [notiEnabled] = useState('noti');
  const [isLoading, setLoading] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const backStateRef = useRef(false);
  const { notifications } = LanguageManager;

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('hitWalletApi', () => {
      consoleLogFunc('chk currrentscene::::::', Actions.currentScene);
      Actions.currentScene == 'NotificationsTab' && fetchNotiStatus();
    });
    let focusListener = props.navigation.addListener('focus', () => {
      setIsAnnouncement(false)
      fetchNotiStatus();
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    });
    let blurListener = props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any)?.removeEventListener('hardwareBackPress', handleBackButtonClick);
    });
    return () => {
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
    };
  }, []);



  /******************************************************************************************/
  const handleBackButtonClick = () => {
    consoleLogFunc('Backhandler NotificationsTab');
   
    if (backStateRef.current) {
      backStateRef.current = false
      setIsAnnouncement(false)
    }else{
      (Actions as any).pop()
    }
    return true;
  };

  /******************************************************************************************/
  useEffect(() => {
    (global as any).isPushNotificationEnabled = false;
    setLoading(!isLoading);
  }, [notiEnabled]);


  /******************************************************************************************/
  const backCallBack = () => {
    consoleLogFunc("backStateRef.current>>", backStateRef.current);
    
    if (backStateRef.current) {
      backStateRef.current = false
      setIsAnnouncement(false)
    }else{
      (Actions as any).pop()
    }

  };

  /******************************************************************************************/
  const fetchNotiStatus = () => {
    const data = {
      key: 0
    };
    dispatch(getNotiStatus({ data })).then((res: any) => {
      consoleLogFunc('chk noti res::::::', res);
    }).catch((err: any) => {
      consoleLogFunc('chk noti err::::::', err);
    });
  };

  /******************************************************************************************/
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <HeaderMain
        backCallBack={() => backCallBack()}
        BackButtonText={isAnnouncement ? 'Announcements' : notifications.notifications}
        imgSecond={Images.announce_New}
        onPressIcon={() => {
          setIsAnnouncement(true)
          backStateRef.current = true
        }}
        imgSecondStyle={{
          tintColor: colors.White, width: heightDimen(30),
          height: widthDimen(30),
        }}
        disableTouchDis={true}
      />
      {isAnnouncement ? <>
        <Announcements navigation={props.navigation} /></> : <>
        <Notifications navigation={props.navigation} />
      </>}

    </ImageBackground>
  );
};

export default NotificationsTab;
