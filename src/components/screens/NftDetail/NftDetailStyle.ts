import { StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';
import { dimen, hasNotchWithIOS, heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
    mainImg: {
        height: heightDimen(229),
        width: widthDimen(381),
        alignSelf: "center",
        borderRadius: dimen(14),
        resizeMode:"contain"
    },
    description: {
        fontFamily: Fonts.dmRegular,
        fontSize: 14,
        lineHeight: 24,
        marginHorizontal: 24,
        marginTop: 14
    },
    btnView:{
        marginHorizontal: 24,
         marginBottom: hasNotchWithIOS() ? dimen(52) : dimen(30)
    }

});
