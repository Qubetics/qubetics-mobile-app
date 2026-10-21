import { StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../../theme';
import { getDimensionPercentage as dimen } from '../../../Utils';
import { ThemeManager } from '../../../../ThemeManager';

export default StyleSheet.create({
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  centeredView: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    elevation: 1,
  },
  modalView: {
    backgroundColor: Colors.successColor,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    borderWidth: 1,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
  },
  secreenshotText: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(18),
    marginTop: dimen(24),
    textAlign: 'center',
  },
  secreenshotsubText: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(14),
    marginTop: dimen(10),
    color: ThemeManager.colors.subTextColor,
    marginBottom: 20,
    textAlign: 'center'

  },
  screenmain: {
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    width: '100%',
  },
  safeAreaView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
    bottom: 0
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  subTitle:{
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 15,
  },
  line: {
    width: '100%',
  }
});
