import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeManager } from '../../../ThemeManager';

const RadioButton = (props: any) => {
  return (
    <TouchableOpacity onPress={props.onPress} style={{ marginHorizontal: 5 }}>
      <View style={styles.ViewStyle}>
        <View style={[styles.ViewStyle1, { borderColor: ThemeManager.colors.activeTab }]}>
          <View style={[styles.ViewStyle2, { backgroundColor: props.status == 'checked' ? ThemeManager.colors.activeTab : 'transparent' }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle2: {
    height: 10,
    borderRadius: 7,
    width: 10,
  },
  ViewStyle1: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ViewStyle: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { RadioButton };
