import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { useEffect, useRef, useState } from "react";
import { ThemeManager } from "../../../../ThemeManager";
import { HeaderMain, OnboardingHeadings } from "../../common";
import { LanguageManager } from "../../../../LanguageManager";
import styles from "./ShowRecoveryPhraseStyles";
import { clearGarbageCollection, consoleLogFunc, getEncryptedData } from "../../../Utils/MethodsUtils";
import images from "../../../theme/Images";
import {
  disableScreenshotPrevent,
  enableScreenshotPrevent,
  widthDimen,
} from "../../../Utils";
import Toast from "react-native-easy-toast";
import Clipboard from "@react-native-clipboard/clipboard";

const ShowRecoveryPhrase = ({ walletItem, pin }: { walletItem: any; pin: any }) => {
  consoleLogFunc("walletItem:::::", walletItem);
  const [mnemonics, setMnemonics] = useState<any>("");
  const toast = useRef<any>(null);
  useEffect(() => {
    enableScreenshotPrevent()
    generateMnemonics();
    return () => {
      disableScreenshotPrevent();
      setMnemonics("");
      clearGarbageCollection();
    }
  }, []);
  const generateMnemonics = async () => {
    getEncryptedData(walletItem.loginRequest.wallet_address, pin).then((mnemonics) => {
      setMnemonics(mnemonics?.split(" "));
    });
  };
  const onPressCopy = async () => {
    await Clipboard.setString(mnemonics?.join(" "));
    toast.current?.show("Copied");
  };
  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={[styles.mainView, { backgroundColor: ThemeManager.colors.mainBgNew }]}
    >
      <HeaderMain
        customStyle={{ paddingHorizontal: widthDimen(24) }}
      />
      <ScrollView style={styles.mainViewStyle}>

        <OnboardingHeadings title={LanguageManager.verifyPhrase.yourSecretPhrase} subTitle={LanguageManager.manageWallet.copyThePhrases} />


        <View
          style={[
            styles.itemContainerStyle,
          ]}
        >

          <FlatList
            scrollEnabled={false}
            data={mnemonics}
            numColumns={3}
            contentContainerStyle={[styles.containerStyle]}
            renderItem={({ item, index }: any) => {
              return (
                <View
                  style={{ ...styles.mnemonicBg, backgroundColor: ThemeManager.colors.mnemonicsBg }}
                >
                  <View key={index} style={styles.mnemonic}>
                    <Text
                      style={[
                        styles.textStyle,
                        { color: ThemeManager.colors.legalGreyColor },
                      ]}
                    >
                      {index + 1}.
                    </Text>
                    <Text
                      style={[
                        styles.textStyle,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {"  "}
                      {item}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
        <View style={styles.copyMainView}>
          <TouchableOpacity
            onPress={() => { onPressCopy(); }}
            style={[styles.copyView,]}
          >
            <Image
              style={styles.copyIconStyle}
              source={images.copyDarkButtonText}
            />
          </TouchableOpacity>
        </View>
        <View style={[styles.styleMargin]}>
          <View style={styles.subView}>
            <Image source={images.rightTick} style={{ ...styles.tickImgStyle, tintColor: ThemeManager.colors.legalGreyColor }} />
            <Text style={[styles.txtStyleOne, { color: ThemeManager.colors.legalGreyColor, }]}>{LanguageManager.secretPhrase.doNotShare}</Text>
          </View>
          <View style={styles.subViewTwo}>
            <Image source={images.rightTick} style={{ ...styles.tickImgStyle, tintColor: ThemeManager.colors.legalGreyColor }} />
            <Text style={[styles.txtStyleTwo, { color: ThemeManager.colors.legalGreyColor, }]}>
              {LanguageManager.secretPhrase.walletSupportWarning}
            </Text>
          </View>
        </View>
      </ScrollView>
      <Toast
        ref={toast}
        position="bottom"
        positionValue={250}
        {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)} // toast lib types lack `style`
      />
    </BackgroundImage>
  );
};

export default ShowRecoveryPhrase;
