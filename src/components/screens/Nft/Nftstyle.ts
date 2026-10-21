import { StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';
import { heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  imgSecond: {
    height: heightDimen(30),
    width: widthDimen(30)
  },
  imgNew: {
    height: heightDimen(33),
    width: widthDimen(33),
  },
  card: {
    flex: 1,
    backgroundColor: ThemeManager.colors.mnemonicsBg,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    width: "100%",
    padding: 10,
  },
  image: {
    width: "100%",
    height: heightDimen(170),
    borderTopRightRadius: 14,
    borderTopLeftRadius: 14,
    resizeMode: "contain"
  },
  title: {
    fontSize: 14,
    marginTop: 5,
  },
  nftId: {
    fontSize: 14,

  },
  price: {
    fontSize: 14,
    marginLeft: 6

  },
  transactionHistoryTitle: {
    fontSize: 14,
    fontFamily: Fonts.dmMedium
  }
});
