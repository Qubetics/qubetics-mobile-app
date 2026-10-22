import styles from './RpcDetailsStyle';
import {
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import {useEffect, useState} from 'react';
import {HeaderMain} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {dimen} from '../../../Utils';
import LabelTextInput from '../../common/LabelTextInput';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';

const RpcDetails = (props: any) => {
  const {vpn, walletName} = LanguageManager;
  const [host, setHost] = useState('');
  const [activePort, setActivePort] = useState('');

  useEffect(() => {
    var url = Constants.COSMO_RPC_URL;
    consoleLogFunc('url--->', url);
    let urlObject = new URL(url!) // Constants key typed possibly undefined;

    consoleLogFunc('urlObject--->', urlObject);
    let rpcURL = urlObject.hostname;
    let port = urlObject.port;
    setHost(rpcURL);
    setActivePort(port ? port : '');
    return () => {};
  }, []);

  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain BackButtonText={vpn.rcpDetails} />
        <View
          style={{
            marginHorizontal: dimen(24),
          }}>
          <LabelTextInput
            label={vpn.host}
            placeholder={walletName.enterHere}
            value={host}
            isEnabled={false}
            onChangeText={(value: any) => {
              setHost(value)
            }}
            customViewStyle={{
              marginTop: 0,
            }}
          />
          {activePort && <LabelTextInput
            label={vpn.post}
            placeholder={walletName.enterHere}
            value={activePort}
            isEnabled={false}
            onChangeText={(value: any) => {}}
          />}
        </View>
      </View>
    </BackgroundImage>
  );
};

export default RpcDetails;
