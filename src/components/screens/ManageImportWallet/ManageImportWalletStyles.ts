import { StyleSheet } from 'react-native';
import {
  getDimensionPercentage as dimen,
  heightDimen,
} from '../../../Utils';


export default StyleSheet.create({
  mainView: {
    flex: 1,
    paddingHorizontal: dimen(24),
    marginTop: heightDimen(30)
  },
  mainViewStyle: {
    flex: 1,
  },

  btnView: {},
  btnContainer: {},

  placeHolderStyle: {
    textAlignVertical: "top",
    borderWidth: 1,
    borderRadius: dimen(14),
    paddingVertical: dimen(10),
    paddingTop: dimen(14),
  },
  inputPhraseStyle: {
    height: dimen(167),

    marginTop: dimen(20),
  },
});
