import { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Image } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import styles from './ManageOnboardingStyles'
import { ThemeManager } from '../../../../ThemeManager';
import { LanguageManager } from '../../../../LanguageManager';
import { Button, HeaderMain } from '../../common';
import { Actions } from '../../../navigation/RootNavigation';
import { disableScreenshotPrevent, enableScreenshotPrevent, getDimensionPercentage, heightDimen } from '../../../Utils';
import images from '../../../theme/Images';
import { Images } from '../../../theme';
import Lottie from 'lottie-react-native';

const ManageOnboarding = (props: any) => {
  const lottieRef = useRef<any>(undefined)

  useEffect(() => {
    enableScreenshotPrevent()
    const focusListener = props.navigation.addListener('focus', () => {
      lottieRef?.current?.play()
    });
    const blurListener = props.navigation.addListener('blur', () => {
      lottieRef?.current?.pause()
    });

    return () => {
      disableScreenshotPrevent();
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
    };
  }, []);


  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{
        flex: 1, backgroundColor: ThemeManager.colors.mainBgNew
      }}>


      <HeaderMain BackButtonText={LanguageManager.manageWallet.manageWallet} />
      <View style={styles.mainView}>
        <View style={{ alignItems: "center", justifyContent: "center", flex: 1, }}>
          <Lottie
            ref={lottieRef}
            style={{ height: 280, width: 280 }}
            source={Images.welcomeAnimation}
            autoPlay
          />

          <View style={{ paddingHorizontal: 40 }}>
            <Text
              style={[
                styles.headerText,
                { color: ThemeManager.colors.blackWhiteText },
              ]}
            >{LanguageManager.onboarding.welcome}</Text>
            <Text style={[styles.boldText, { color: ThemeManager.colors.legalGreyColor }]}>{LanguageManager.onboarding.nonCustodial}</Text>
          </View>


        </View>


        <View style={{ marginBottom: getDimensionPercentage(50) }}>
          <TouchableOpacity
            style={{ marginBottom: heightDimen(10), alignSelf: "center" }}
            onPress={() => {
              (Actions as any).currentScene != "ManageImportWallet" &&
                (Actions as any).ManageImportWallet({});
            }}
          >
            <Image resizeMode="contain" source={images.alreadyWalletText} />
          </TouchableOpacity>
          <Button
            myStyle={{ marginBottom: heightDimen(0), marginTop: heightDimen(10) }}
            onPress={() => { (Actions as any).currentScene != 'WalletName' && (Actions as any).WalletName({ screen: props?.screen }) }}
            buttontext={LanguageManager.onboarding.createWallet}
          />


        </View>
      </View>
    </BackgroundImage>
  );
};

export default ManageOnboarding;