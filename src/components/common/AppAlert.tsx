import { BlurView } from '@react-native-community/blur';
import { Image, Modal, Text, View } from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { Fonts, Images } from '../../theme';
import { getDimensionPercentage } from '../../Utils';
import { Button } from './Button';

export const AppAlert = ({
  hideAlertDialog,
  alertTxt,
  visible = true,
  text = 'Ok',
  restoreStyle,
  buttontext,
  customStyle,
  themeSelected,
  myStyle,
  showSuccess = false,
  isInfo = false,
  fromTheme,
  isvisible
}: any) => {

  /******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="none"
      transparent={true}
      hardwareAccelerated={true}
      visible={visible}
      onRequestClose={() => { hideAlertDialog() }}>
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={3}
        reducedTransparencyFallbackColor="white"
      />
      <View style={[styles.centeredView]}>
        <View style={[styles.modalView, { backgroundColor: ThemeManager.colors.whiteBlacktext, borderColor: ThemeManager.colors.whiteBlacktext }]}>

          <View style={{ alignItems: 'center' }}>
            {showSuccess ? (
              <Image style={{ height: getDimensionPercentage(20), width: getDimensionPercentage(20), resizeMode: 'contain' }} source={Images.icon_default} />
            ) : (
              <Image style={{ height: getDimensionPercentage(22), width: getDimensionPercentage(22) }} source={isInfo ? Images.infoIconPhrase : Images.tryAgain} />
            )}
            <Text allowFontScaling={false} style={[styles.modalTitle, { color: ThemeManager.colors.blackWhiteText }]}>{alertTxt}</Text>
          </View>

          <Button
            isNeedToClose={true}
            onPress={() => {
              hideAlertDialog()
            }}
            buttontext={text}
          />


        </View>
      </View>
    </Modal>
  );
};

/******************************************************************************************/
const styles: any = {
  sendBtnStyle: {
    marginTop: 10,
    height: getDimensionPercentage(50),
    borderRadius: 10,
    justifyContent: 'center',
  },
  sendBtnTextStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 16,
    textAlign: 'center',
  },
  btnTextStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 14,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  centeredView: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    elevation: 1,
  },
  modalView: {
    borderRadius: 12,
    padding: getDimensionPercentage(20),
    width: '90%',
    borderWidth: 1,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
  },
};
