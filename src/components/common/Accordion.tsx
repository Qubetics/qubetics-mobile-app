import {useRef, useEffect, useState} from 'react';
import {StyleSheet, View, Animated, Easing} from 'react-native';

function Accordion({isExpanded, children, style, duration = 500}: {isExpanded: any; children: any; style: any; duration?: any}) {
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? contentHeight : 0,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isExpanded, contentHeight, animatedHeight, duration]);

  return (
    <Animated.View
      style={[styles.animatedView, {height: animatedHeight}, style]}>
      <View
        style={styles.wrapper}
        onLayout={e => {
          if (contentHeight === 0)
            setContentHeight(e.nativeEvent.layout.height);
        }}>
        {children}
      </View>
    </Animated.View>
  );
}

export default Accordion;
const styles = StyleSheet.create({
  animatedView: {
    width: '100%',
    overflow: 'hidden',
  },
  wrapper: {
    width: '100%',
    position: 'absolute',
  },
});
