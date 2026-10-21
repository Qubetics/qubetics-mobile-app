import { Dimensions, Platform, StyleSheet } from 'react-native';
import { Fonts, Colors } from '../../../theme';
import { dimen } from '../../../Utils';

export default StyleSheet.create({
  imgStyle: {
    height: 12,
    width: 12,
    transform: [{ rotate: '270deg' }],
    resizeMode: 'contain',
  },
  touchableStyle: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ViewStyle4: {
    borderRadius: 14,
    height: 40,
    width: 40,
    justifyContent: 'center',

  },
  transactionHistoryTitle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 15,
    width: '90%',
    textAlign: 'center'
  },
  noData: {
    height: Dimensions.get('screen').height - 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ViewStyle1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: Platform.OS == 'ios' ? 0.2 : 1,
    width: '100%',
  },
  ViewStyle2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    width: '75%',
    justifyContent: 'flex-start',
  },
  ViewStyle: {
    shadowColor: Platform.OS == 'ios' ? '#404D61' : '#4825251A',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },

  listStyle: {
    borderRadius: dimen(14),
    width: '100%',
  },
  transtimeStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(14),
    lineHeight: dimen(18.9),
  },
  fromValueStyle: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(15.5),
    color: Colors.textColor,
    marginVertical: dimen(5),
  },
  fromAddressStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
    lineHeight: 18.9,
    color: Colors.textColor,
    marginTop: 8,
  },
  fromAddressStyleNew: {
    fontFamily: Fonts.dmMedium,
    fontSize: 14,
    lineHeight: 18.23,
  },
  transStatusStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 12,
    color: Colors.successColor,
  },
  container: {
    paddingTop: 10,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
});
