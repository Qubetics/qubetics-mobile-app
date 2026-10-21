import { Dimensions, Platform, StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Colors, Fonts } from '../../../theme';
import { getDimensionPercentage } from '../../../Utils';

export default StyleSheet.create({
  imgStyle: {
    marginLeft: 15,
    height: 30,
    width: 30,
    borderRadius: 100,
    resizeMode: 'contain',
  },
  textStyle1: {
    fontFamily: Fonts.dmMedium,
    fontSize: 15,
    paddingVertical: 5,
  },
  dropdown: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
    top: 75,
    left: 0,
    right: 0,
    borderWidth: 1,
    zIndex: 16,
  },
  ViewStyle2: {
    backgroundColor: 'black',
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  cancelText: {
    fontFamily: Fonts.dmMedium,
    fontSize: 15,
    color: Colors.White,
    marginTop: 20,
    marginRight: Platform.OS == 'ios' ? getDimensionPercentage(30) : getDimensionPercentage(15),
    alignSelf: 'flex-end',
  },
  cameraStyle: {
    height: Dimensions.get('window').height / 2,
    width: '80%',
    alignSelf: 'center',
    backgroundColor: 'white',
  },
  txtTitle: {
    fontSize: 14,
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.whiteText,
  },
});
