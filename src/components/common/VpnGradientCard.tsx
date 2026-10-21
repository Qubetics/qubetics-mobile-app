import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeManager } from '../../../ThemeManager';
import { heightDimen, widthDimen } from '../../Utils';

const VpnGradientCard = ({ children, isOutLine, gradient_View }: {children: any; isOutLine: any; gradient_View: any}) => {

  return (
    <>
      {isOutLine ?
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#73C9E2", "#6C8DC5", "#6456B2", "#6145EA"]} // gradient colors
          style={[styles.gradient_new, gradient_View]}
        >
          <View
            style={[
              styles.box,
              gradient_View,
              { backgroundColor: ThemeManager.colors.mnemonicsBg, padding: 1 },
            ]}
          >
            {children}
          </View>
        </LinearGradient>
        :
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#73C9E2", "#6C8DC5", "#6456B2", "#6145EA"]} // gradient colors
          style={[styles.gradient, gradient_View]}
        ><View style={{ paddingVertical: heightDimen(10) }}>
            {children}
          </View>
        </LinearGradient>}
    </>
  );
};

export default VpnGradientCard;

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 8,
    paddingHorizontal: widthDimen(14),


  },
  gradient_new: {
    borderRadius: 8,
  },
  box: {
    paddingHorizontal: widthDimen(14),
    paddingVertical: heightDimen(10),
    borderRadius: 8,
  }
});
