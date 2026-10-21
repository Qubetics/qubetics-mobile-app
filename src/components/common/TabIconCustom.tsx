import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import colors from '../../theme/Colors';

const TabIconCustom = (props: any) => {
  const [, setThemeSelected] = useState(0);

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
  }, [props]);

  /******************************************************************************************/
  return (
    <View style={[styles.viewMainContainer, props.marginView]}>
      <Image source={props.activeImg} style={[props.ImgSize, { resizeMode: 'contain', tintColor: props?.focused ? colors.White : colors.placeHolderText }]} />
    </View>
  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  viewMainContainer: {
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { TabIconCustom };
