import { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import styles from "./OnboardingStyles";
import { ThemeManager } from "../../../../ThemeManager";
import { LanguageManager } from "../../../../LanguageManager";
import { Button } from "../../common";
import { Actions } from '../../../navigation/RootNavigation';
import images from "../../../theme/Images";
import { enableScreenshotPrevent, heightDimen } from "../../../Utils";
import Lottie from 'lottie-react-native';
import { Images } from "../../../theme";
import { consoleLogFunc, saveDataInStorage } from "../../../Utils/MethodsUtils";
import * as Constants from "../../../Constants";
import { EventRegister } from "react-native-event-listeners";

const Onboarding = (props: any) => {
  const lottieRef = useRef<any>(null)

  useEffect(() => {
    EventRegister.emit('fromscreen', 'onboarding')
    saveDataInStorage(Constants.NEW_USER, "true")
    enableScreenshotPrevent()
    const focusListener = props.navigation?.addListener('focus', () => {
      consoleLogFunc('focusListener---');

      lottieRef.current?.play()
    });
    const blurListener = props.navigation?.addListener('blur', () => {
      lottieRef.current?.pause()
    });

    return () => {
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
    }
  }, []);


  return (

    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1 }}
    >
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1, }}>
        <Lottie
          ref={lottieRef}
          style={{ height: 280, width: 280, zIndex: 1 }}
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

      <View style={{ ...styles.btnView }}>
        <TouchableOpacity
          style={{ paddingVertical: 10, alignSelf: "center" }}
          onPress={() => {
            Actions.currentScene != "Legal" &&
              (Actions as any).Legal({ from: "ImportWallet" });
          }}
        >

          <Image resizeMode="contain" source={images.alreadyWalletText} />

        </TouchableOpacity>
        <Button
          myStyle={{
            marginBottom: heightDimen(20),
            marginTop: heightDimen(10),
          }}
          onPress={() => {
            Actions.currentScene != "Legal" &&
              (Actions as any).Legal({ from: "createwallet" });
          }}

          buttontext={LanguageManager.onboarding.createWallet}
        />

      </View>

    </BackgroundImage>
  );
};

export default Onboarding;