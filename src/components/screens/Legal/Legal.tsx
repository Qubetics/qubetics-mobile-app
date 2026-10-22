import { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import styles from './LegalStyles';
import { ThemeManager } from '../../../../ThemeManager';
import { LanguageManager } from '../../../../LanguageManager';
import { AppAlert, Button, HeaderMain, OnboardingHeadings } from '../../common';
import { Actions } from '../../../navigation/RootNavigation';
import images from '../../../theme/Images';
import { dimen, heightDimen } from '../../../Utils';
import LinearGradient from 'react-native-linear-gradient';
import Singleton from '../../../Singleton';
import { PRIVACY_POLICY_LINK } from '../../../Constants';

const CardRow = ({
  text,
  arrowIcon = false,
  shieldUser,
  privacyView,
  pressLink,
}: any) => {
  return (
    <LinearGradient
      colors={['#69DADB00', '#69DADB06']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7403, y: 0.6763 }}
      style={[
        styles.privacyView,
        { backgroundColor: ThemeManager.colors.mainBgNew },
        privacyView,
      ]}>
      <TouchableOpacity activeOpacity={1} onPress={pressLink}>
        <View style={[styles.subContent, { paddingVertical: dimen(13) }]}>
          <View style={{ ...styles.cardView }}>
            {shieldUser && <Image source={shieldUser} resizeMode={'contain'} />}
            <Text
              style={[
                styles.cardText,
                { color: ThemeManager.colors.blackWhiteText },
              ]}>
              {text}
            </Text>
          </View>
          {arrowIcon && <Image source={arrowIcon} resizeMode={'contain'} />}
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const Legal = (props: any) => {
  const [isCheck, setIsCheck] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');

  useEffect(() => {
    Singleton?.getInstance()?.isNewerVersion1();
  }, []);

  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <HeaderMain />
      <View style={[styles.mainView]}>
        <View style={styles.subView}>
          <OnboardingHeadings
            title={LanguageManager.legal.legal}
            subTitle={LanguageManager.legal.review}
          />
          <CardRow
            pressLink={() => {
              (Actions as any).currentScene != 'PrivacyPolicy' &&
                (Actions as any).PrivacyPolicy({
                  Viewtype: 'PrivacyPolicy',
                  url: PRIVACY_POLICY_LINK,
                });
            }}
            text={LanguageManager.legal.privacy}
            arrowIcon={ThemeManager.ImageIcons.rightArrowLong}
            shieldUser={images.shieldUser}
          />
        </View>
        <View style={{ marginBottom: heightDimen(50) }}>
          <TouchableOpacity
            activeOpacity={0.1}
            onPress={() => {
              setIsCheck(!isCheck);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}>
            <View style={styles.termsView}>
              {isCheck ? (
                <Image
                  source={images.fillCheckBox}
                  style={{ ...styles.checkImg }}
                  resizeMode={'contain'}
                />
              ) : (
                <View
                  style={{
                    ...styles.checkImg,
                    borderWidth: 1,
                    borderColor: ThemeManager.colors.dropDownColor,
                    borderRadius: 8,
                  }}
                />
              )}
            </View>

            <Text
              style={[
                styles.termsText,
                { color: ThemeManager.colors.blackWhiteText },
              ]}>
              {LanguageManager.legal.terms}
            </Text>
            <TouchableOpacity
              activeOpacity={0.1}
              onPress={() =>
                (Actions as any).PrivacyPolicy({
                  Viewtype: 'PrivacyPolicy',
                  url: PRIVACY_POLICY_LINK,
                })
              }>
              <Text
                style={[
                  styles.termsTextBold,
                  { color: ThemeManager.colors.primaryColor },
                ]}>
                {LanguageManager.legal.privacy}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <Button
            onPress={() => {
              if (!isCheck) {
                setAlertModal(true);
                setAlertText('Please accept the Privacy Policy'); // setAlertText('Please accept the Terms of Service and Privacy Policy')
              } else {
                props.from == 'createwallet'
                  ? (Actions as any).currentScene != 'WalletName' &&
                  (Actions as any).WalletName({ screen: props?.screen })
                  : (Actions as any).currentScene != 'ImportWallet' &&
                  (Actions as any).ImportWallet({ screen: props?.screen });
              }
            }}
            myStyle={{ marginTop: heightDimen(16) }}
            buttontext={LanguageManager.pins.Continue}
          />
        </View>
      </View>
      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        hideAlertDialog={() => {
          setAlertModal(false);
        }}
      />
    </BackgroundImage>
  );
};

export default Legal;
