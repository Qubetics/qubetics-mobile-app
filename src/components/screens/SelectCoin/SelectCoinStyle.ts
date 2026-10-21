import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Fonts } from '../../../theme/';

export default StyleSheet.create({
  textStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 15,
    color: Colors.White,
    paddingHorizontal: 8,
    alignSelf: 'center',
    marginTop: Dimensions.get('screen').height / 2.5,
  },
});
