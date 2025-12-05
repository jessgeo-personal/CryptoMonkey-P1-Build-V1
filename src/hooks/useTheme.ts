import { useColorScheme } from 'react-native';
import { Colors, ColorScheme } from '../constants/colors';

// ============================================
// THEME HOOK - Provides theme colors based on system preference
// ============================================

export const useTheme = () => {
  const systemColorScheme = useColorScheme() as ColorScheme | null;
  const colorScheme: ColorScheme = systemColorScheme || 'light';
  
  const colors = Colors[colorScheme];
  
  return {
    colors,
    colorScheme,
    isDark: colorScheme === 'dark',
  };
};
