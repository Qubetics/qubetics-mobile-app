import { BlurView } from '@react-native-community/blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ThemeManager } from '../../../ThemeManager';
import { getDimensionPercentage } from '../../Utils';
import { Colors, Fonts, Images } from '../../theme';
import images from '../../theme/Images';
import { GradientBorderView } from './GradientBorderView';

export const AddressModal = (props: any) => {
  const [, setThemeSelected] = useState('');
  const slideAnim = useRef(new Animated.Value(500)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
  }, []);

  const startSlideAnimation = () => {
    slideAnim.setValue(500);
    overlayAnim.setValue(0);
    contentOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  };

  /******************************************************************************************/
  return (
    <>
      <Modal
        statusBarTranslucent
        animationType="none"
        transparent={true}
        visible={props.openModel}
        onShow={startSlideAnimation}
        onRequestClose={() => { false }}>
        <Animated.View style={[styles.blurView, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: overlayAnim }]} />
        <BlurView
          style={styles.blurView}
          blurType="dark"
          blurAmount={4}
          reducedTransparencyFallbackColor="transparent"
        />
        <TouchableOpacity style={{ flex: 1 }} onPress={props.dismiss} />
        <Animated.View style={[styles.modalView, { backgroundColor: ThemeManager.colors.mainBgNew, position: 'absolute', bottom: 0, left: 0, right: 0, flex: undefined, transform: [{ translateY: slideAnim }], opacity: contentOpacity }]}>

          <View style={{ flexDirection: "row", justifyContent: "space-between", }}>
            <TouchableOpacity onPress={props.dismiss}>
              <View style={{ flexDirection: "row" }}>
                <Image resizeMode="contain" source={images.leftIcon} style={{ alignSelf: "center", tintColor: ThemeManager.colors.blackWhiteText }} />

                <Text style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText, marginLeft: 8 }]}>
                  Back
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={props.dismiss}>
              <Image resizeMode="contain" source={ThemeManager.ImageIcons.crossIconNew} />
            </TouchableOpacity>

          </View>

          <View style={{ justifyContent: 'center', }}>

            <GradientBorderView
              gradientStyle={{ height: 58, width: 58, alignSelf: 'center', marginBottom: 5 }}
              mainStyle={{ alignItems: "center", justifyContent: "center" }}
            >
              <Text style={[styles.textStyleNew, { color: ThemeManager.colors.blackWhiteText }]}>{props.item?.name?.charAt(0)}</Text>

            </GradientBorderView>

            <Text allowFontScaling={false} style={[styles.textStyleNew, { fontSize: 20, color: ThemeManager.colors.blackWhiteText }]}>{props.item?.name}</Text>
          </View>

          <View style={[styles.ViewStyle1, { backgroundColor: ThemeManager.colors.legalBg, paddingBottom: 8 }]}>
            {props.item?.wallet_data?.length > 0 && props.item?.wallet_data.map((item: any, index: any) => {
              return (
                <TouchableOpacity key={index + ''} onPress={() => props.onPressItem(item, index)} style={[styles.ViewStyle11, { paddingBottom: 0 }]}>
                  <View style={[styles.ViewStyle2]}>
                    {item.coin_data?.coin_image != null ? (
                      <Image style={[styles.iconStyle]} source={{ uri: item.coin_data?.coin_image }} />
                    ) : (
                      <Text allowFontScaling={false} style={[styles.textStyleNew, props.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{item.name?.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={[styles.ViewStyle3, { borderBottomWidth: index == props.item?.wallet_data.length - 1 ? 0 : 1, }]}>
                    <View style={{ marginLeft: 10 }}>
                      <Text allowFontScaling={false} style={[styles.textStyle1, { color: ThemeManager.colors.blackWhiteText }]}>{item.name}</Text>
                      <View>
                        <Text allowFontScaling={false} style={[styles.subTextStyle1, { color: ThemeManager.colors.legalGreyColor }]}>{item?.wallet_address?.substring(0, 23) + '...'}</Text>
                      </View>
                    </View>

                    {props.selected_Index == index && (
                      <View style={styles.ViewStyle4}>
                        <Image style={styles.imgStyle1} source={Images.completed} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

      </Modal >
    </>
  );
};

const styles = StyleSheet.create({
  ViewStyle4: {
    marginLeft: 10,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    padding: 15,
  },
  ViewStyle3: {
    width: '85%',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imgStyle1: {
    height: 9,
    width: 12,
    alignSelf: 'flex-end',
  },
  textStyle1: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  subTextStyle1: {
    fontFamily: Fonts.dmRegular,
    fontSize: 12,
    color: 'rgba(26, 32, 46, 0.8)',
    textAlign: 'center',
    paddingBottom: 10,
  },
  iconStyle: {
    height: 34,
    width: 34,
    borderRadius: 17,
  },
  ViewStyle11: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 10,
    width: '100%',
    alignItems: 'center',
  },
  ViewStyle2: {
    height: 34,
    width: 34,
    backgroundColor: 'white',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  textStyleNew: {
    fontFamily: Fonts.dmMedium,
    fontSize: 24,
    color: ThemeManager.colors.settingsText,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  ViewStyle1: {
    borderRadius: 20,
    marginTop: 20,
  },
  modalView: {
    backgroundColor: Colors.White,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,

    borderRadius: 10,
    elevation: 4,
    paddingHorizontal: 24,
    paddingVertical: 25,
    flex: 0.5,

  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  textStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: getDimensionPercentage(16),
    lineHeight: getDimensionPercentage(24),
  }
});
