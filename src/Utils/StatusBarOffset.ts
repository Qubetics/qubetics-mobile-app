import { Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

// Space the app must leave for the Android status bar. The inset always reports the bar's
// height, but when the window already starts below the bar (frame.y > 0, e.g. Android 13)
// that space is already taken, so only the part still overlapping the bar is returned.
const getStatusBarOffset = () => {
  if (Platform.OS !== 'android' || !initialWindowMetrics) return 0;
  const { insets, frame } = initialWindowMetrics;
  return Math.max(0, insets.top - frame.y);
};

export const statusBarOffset = getStatusBarOffset();

// A translucent Modal is its own window and always draws behind the status bar, so it needs the
// whole bar height regardless of where the main window starts.
export const modalStatusBarOffset = Platform.OS === 'android' ? initialWindowMetrics?.insets.top ?? 0 : 0;
