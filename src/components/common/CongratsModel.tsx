import Lottie from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import Video from 'react-native-video';
import { LanguageManager } from '../../../LanguageManager';
import { ThemeManager } from '../../../ThemeManager';
import { Images } from '../../theme';
import images from '../../theme/Images';
import { Button } from './Button';

export const CongratsModel = (props: any) => {
  const { pins } = LanguageManager;
  const [, setThemeSelected] = useState('');
  
  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
  }, []);

  //******************************************************************************************/
  return (
    <>
      <Modal
        statusBarTranslucent
        animationType="fade"
        transparent={true}
        visible={props.openModel}
        onRequestClose={() => { false }}>

        <View style={[styles.centeredView, { backgroundColor: ThemeManager.colors.mainBgNew }]}>

          <Video
            source={images.tickAnimation}
            style={styles.backgroundVideo}
            resizeMode="cover"
          />
          <View style={{ height: 60 }} />
          <View style={{ alignItems: 'center' }}>
            <View>
              <Lottie
                style={{ height: 280, width: 280 }}
                source={props?.importwallet ? images.tickAnimationTwo : Images.tickAnimationLottie}
                autoPlay
                loop={false}
              />
            </View>

          </View>
          <View style={{ width: '100%' }}>
            <Button
              disabled={props.disableCongratClick || false}
              buttontext={pins.Continue} onPress={props.onPress} />
          </View>
        </View>
      </Modal>
    </>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    paddingHorizontal: 18,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#00000077',
    paddingBottom: 50
  },
  backgroundVideo: {
    resizeMode: 'contain',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  }
});
