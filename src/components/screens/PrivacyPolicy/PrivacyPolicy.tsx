import {useEffect, useState} from 'react';
import { Linking } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import {HeaderMain, LoaderView} from '../../common';
import {connect} from 'react-redux';
import {ThemeManager} from '../../../../ThemeManager';
import {WebView} from 'react-native-webview';
import {LanguageManager} from '../../../../LanguageManager';
import {consoleLogFunc} from '../../../Utils/MethodsUtils';

const PrivacyPolicy = (props: any) => {
  const {walletMain} = LanguageManager;
  const [isLoading, setisLoading] = useState(false);
  useEffect(() => {
    consoleLogFunc('Terms of Service', props);
    setisLoading(true);
  }, []);
  /******************************************************************************************/
  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <HeaderMain
        BackButtonText={
          props?.Viewtype == 'PrivacyPolicy'
            ? walletMain.privacyPolicy
            : walletMain.termandservices
        }
      />
      <WebView
        onLoadStart={() => {
          setisLoading(true);
        }}
        onLoadEnd={() => {
          setTimeout(() => {
            setisLoading(false);
          }, 1000);
        }}
        style={{flex: 1, backgroundColor: 'transparent'}}
        source={{
          uri: `${props?.url}`,
        }}
        originWhitelist={['*']}
        scalesPageToFit={false}
        cacheEnabled={false}
        onShouldStartLoadWithRequest={request => {
          const url = request?.url;

          // Check if the URL is a Gmail compose link and has a "to=" query
          if (
            url?.includes('mail.google.com/mail') &&
            url?.includes('view=cm') &&
            url?.includes('to=')
          ) {
            try {
              // Extract the "to" parameter value from the URL
              const toMatch = url.match(/[\?&]to=([^&]+)/);
              if (toMatch && toMatch[1]) {
                // Decode and split by commas in case there are multiple email addresses
                const decodedEmails = decodeURIComponent(toMatch[1]).split(',');

                // Use the second email if available, otherwise fall back to the first
                const emailToOpen = decodedEmails[1] || decodedEmails[0];

                Linking.openURL(`mailto:${emailToOpen}`).catch(err =>
                  console.error('Failed to open mail link:', err),
                );
                return false; // Prevent WebView from navigating
              }
            } catch (err) {
              console.error('Error parsing Gmail link:', err);
            }
          }

          return true; // allow normal WebView navigation
        }}
      />

      {isLoading == true && <LoaderView isLoading={isLoading} />}
    </BackgroundImage>
  );
};

export default connect(null)(PrivacyPolicy);
