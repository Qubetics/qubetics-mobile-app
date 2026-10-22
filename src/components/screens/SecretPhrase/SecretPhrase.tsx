import { useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import styles from './SecretPhraseStyles';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import { AppAlert, Button, HeaderMain, OnboardingHeadings } from '../../common';
import CommonModal from '../../common/CommonModal';
import { Actions } from '../../../navigation/RootNavigation';
import Toast from 'react-native-easy-toast';
import images from '../../../theme/Images';
import { heightDimen } from '../../../Utils';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';
import Clipboard from "@react-native-clipboard/clipboard";

const SecretPhrase = (props: any) => {
  const { alertMessages } = LanguageManager;
  const toast = useRef<any>(null);
  const [mnemonics] = useState(props?.walletData?.mnemonics);

  const [isSecretPhrase, setIsSecretPhrase] = useState(false);
  const [isAgreeOne, setIsAgreeOne] = useState(false);
  const [isAgreeTwo, setIsAgreeTwo] = useState(false);
  const [alertData, setAlertData] = useState({
    isShow: false,
    title: '',
  });


  useEffect(() => {
    setIsAgreeTwo(false)
    setIsAgreeOne(false)
  }, []);


  const copyAction = () => {
    Clipboard.setString(mnemonics);
    toast.current?.show(alertMessages.copied)
  }
  return (
    <>

      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <HeaderMain />
        <View style={{ marginTop: heightDimen(30), paddingHorizontal: (20) }}>

          <OnboardingHeadings title={LanguageManager.secretPhrase.secretPhrase} subTitle={LanguageManager.secretPhrase.writeDown} />
          <View style={[styles.mnemonicsStyle,]}>
            <ScrollView style={{ flex: 1, maxHeight: Dimensions.get('window').height * 0.3 }}>
              <View style={styles.mnemonicsStyle}>
                {mnemonics?.split(' ')?.map((item: any, index: any) => {
                  return (
                    <View key={`key_${index}`} style={[styles.mnemonic, { backgroundColor: ThemeManager.colors.mnemonicsBg }]}>
                      <Text
                        style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}
                      >
                        <Text style={{ color: ThemeManager.colors.legalGreyColor }}>{index + 1}. </Text>
                        {item}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.copyMainView}>
            <TouchableOpacity
              onPress={() => { copyAction() }}
              style={[styles.copyView,]}
            >
              <Image
                style={styles.copyIconStyle}
                source={images.copyDarkButtonText}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.txtButtonContainer}>
          <View style={styles.styleMargin}>
            <TouchableOpacity
              onPress={() => {
                setIsAgreeOne(!isAgreeOne)
              }}
              style={styles.subView}>
              <View
                // BUG PRESERVED: styles.termsView does not exist (undefined style)
                style={(styles as any).termsView}>
                {isAgreeOne ? <Image
                  source={images.fillCheckBox}
                  style={{ ...styles.checkImg }}
                  resizeMode={'contain'}
                /> :
                  <View style={{ ...styles.checkImg, borderWidth: 1, borderColor: ThemeManager.colors.dropDownColor, borderRadius: 8 }} />}
              </View>

              <Text style={[styles.txtStyleOne, { color: ThemeManager.colors.legalGreyColor, }]}>{LanguageManager.secretPhrase.doNotShare}</Text>

            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsAgreeTwo(!isAgreeTwo)
              }}
              style={styles.subViewTwo}>
              <View

                // BUG PRESERVED: styles.termsView does not exist (undefined style)
                style={(styles as any).termsView}>
                {isAgreeTwo ? <Image
                  source={images.fillCheckBox}
                  style={{ ...styles.checkImg }}
                  resizeMode={'contain'}
                /> :
                  <View style={{ ...styles.checkImg, borderWidth: 1, borderColor: ThemeManager.colors.dropDownColor, borderRadius: 8 }} />}
              </View>


              <Text style={[styles.txtStyleTwo, { color: ThemeManager.colors.legalGreyColor, }]}>
                {LanguageManager.secretPhrase.walletSupportWarning}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.mainBtnView]}>
            <Button
              buttontext={LanguageManager.pins.Continue}
              iscreateWallet={true}
              isDisabled={!(isAgreeOne && isAgreeTwo)}
              disabled={!(isAgreeOne && isAgreeTwo)}
              onPress={() => {
                consoleLogFunc("props?.screen----- ", props?.screen)
                setIsSecretPhrase(false);
                if (props?.screen == 'managewallet') {
                  Actions.currentScene != 'ManageVerifySecretPhrase' && (Actions as any).ManageVerifySecretPhrase({ walletData: props?.walletData, walletName: props?.walletName })
                }
                else {
                  Actions.currentScene != 'VerifySecretPhrase' && (Actions as any).VerifySecretPhrase({ walletData: props?.walletData, walletName: props?.walletName })

                }
              }}


            />
          </View>
        </View>
        <Toast
          ref={toast}
          position="bottom"
          positionValue={250}
          {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)} // style not in Toast typings
        />
      </BackgroundImage >

      {isSecretPhrase && (
        <CommonModal
          visible={isSecretPhrase}
          onClose={() => setIsSecretPhrase(false)}
          button={true}>
          <View style={styles.mainStyle}>
            <Image style={styles.logo} source={ThemeManager.ImageIcons.alertsecret} />
            <Text style={[styles.headingStyle, { color: ThemeManager.colors.TextColor }]}>{LanguageManager.secretPhrase.neverShareYour}</Text>
            {/* ***************Text Container One************* */}
            <View style={styles.paraView}>
              <View style={styles.imagetextContainer}>
                <Image style={styles.dotStyle} source={ThemeManager.ImageIcons.bullet} />
                <Text style={styles.txt2}>{LanguageManager.secretPhrase.your12Word}</Text>
              </View>
              <View style={styles.lineStyle}></View>
            </View>

            {/* ***************Text Container Two************* */}
            <View style={styles.paraView}>
              <View style={styles.imagetextContainerTwo}>
                <Image
                  style={styles.dotStyleTwo}
                  source={ThemeManager.ImageIcons.bullet}
                />
                <Text style={styles.txt2}>{LanguageManager.secretPhrase.walletDoesNotKeepCopy}</Text>
              </View>
              <View style={styles.lineStyle}></View>
            </View>

            {/* ***************Text Container Three************* */}
            <View style={styles.paraView}>
              <View style={styles.imagetextContainerTwo}>
                <Image style={styles.dotStyle} source={ThemeManager.ImageIcons.bullet} />
                <Text style={styles.txt2}>{LanguageManager.secretPhrase.unencryptedDigital}</Text>
              </View>
              <View style={styles.lineStyle}></View>
            </View>

            {/* ***************Text Container four************* */}
            <View style={styles.paraView}>
              <View style={styles.imagetextContainerTwo}>
                <Image style={styles.dotStyle} source={ThemeManager.ImageIcons.bullet} />
                <Text style={styles.txt2}>{LanguageManager.secretPhrase.writeDown}</Text>
              </View>
              <View style={styles.lineStyle}></View>
            </View>

            {/* ***************Text Container five************* */}
            <View style={styles.paraView}>
              <View style={styles.imagetextContainerTwo}>
                <Image
                  style={styles.alertIconStyle}
                  source={ThemeManager.ImageIcons.smallAlert}
                />
                <Text style={styles.lastPara}>{LanguageManager.secretPhrase.your12WordSecret}</Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.btnViewModal]}>
            <Button
              buttontext={LanguageManager.pins.Continue}
              onPress={() => {

                setIsSecretPhrase(false);
                if (props?.screen == 'managewallet') {
                  Actions.currentScene != 'ManageVerifySecretPhrase' && (Actions as any).ManageVerifySecretPhrase({ walletData: props?.walletData, walletName: props?.walletName })
                }
                else {
                  Actions.currentScene != 'VerifySecretPhrase' && (Actions as any).VerifySecretPhrase({ walletData: props?.walletData, walletName: props?.walletName })

                }
              }}
            />
          </View>

        </CommonModal>
      )
      }
      <AppAlert
        visible={alertData.isShow}
        alertTxt={alertData.title}
        hideAlertDialog={() => {
          setAlertData({ isShow: false, title: '' })
        }} />
    </>
  );
};

export default SecretPhrase;
