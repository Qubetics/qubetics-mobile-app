
import { StyleSheet } from 'react-native';
import { getDimensionPercentage as dimen, heightDimen } from '../../../Utils';

export default StyleSheet.create({
  mainView: {
    flex: 1,
    paddingHorizontal: dimen(24),
    marginTop: heightDimen(30)
  },
  mainViewStyle: {
    flex: 1,

  },

  mainBtnView: {

    marginBottom: dimen(50)
  },

});