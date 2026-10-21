import { StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';
import {
  getDimensionPercentage as dimen,
  heightDimen,
  widthDimen,
} from '../../../Utils';
export default StyleSheet.create({
  ViewStyle1: {
    flex: 1,
    marginHorizontal: dimen(20),
    marginBottom: dimen(20),
  },
  wallet_item: {
  },
  touchableStyle: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: dimen(15),
    borderRadius: dimen(14),
  },
  imgStyle: {
    height: heightDimen(36),
    width: widthDimen(36),
    resizeMode: 'contain',
  },
  ViewStyle: {
    width: '100%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dimen(20),
    paddingHorizontal: dimen(16)
  },
  wallet_itemText: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(16),
    lineHeight: dimen(24),
    textAlign: 'center',
    marginLeft: dimen(9),

    alignSelf: 'center',
  },
});
