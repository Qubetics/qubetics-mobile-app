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

  subView: {
    flex: 1,
  },
  btnContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: heightDimen(50)
  },

  placeHolderStyle: {
    textAlignVertical: 'top',
    borderWidth: 1,
    borderRadius: dimen(14),
    paddingTop: dimen(14)
  },
  inputPhraseStyle: {
    height: dimen(228),
    marginTop: dimen(30),
  },
});
