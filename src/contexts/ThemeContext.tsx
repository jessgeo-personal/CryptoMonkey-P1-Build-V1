import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ColorScheme } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// THEME CONTEXT - Manual theme control
// ============================================

// Define a common type for both light and dark colors
type ColorPalette = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  border: string;
  cardBorder: string;
  shadow: string;
  bg1: string;
  bg2: string;
  bg3: string;
  bg4: string;
  bg5: string;
  bg6: string;
  bg7: string;
  bg8: string;
};

interface ThemeContextType {
  colors: ColorPalette;
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  isManualOverride: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = '@cryptomonkey:theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() as ColorScheme | null;
  const [manualTheme, setManualTheme] = useState<ColorScheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setManualTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (theme: ColorScheme | null) => {
    try {
      if (theme) {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      } else {
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const currentScheme = manualTheme || systemColorScheme || 'light';
    const newTheme: ColorScheme = currentScheme === 'light' ? 'dark' : 'light';
    setManualTheme(newTheme);
    saveThemePreference(newTheme);
  };

  const activeColorScheme: ColorScheme = manualTheme || systemColorScheme || 'light';
  const colors: ColorPalette = Colors[activeColorScheme];

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider
      value={{
        colors,
        colorScheme: activeColorScheme,
        isDark: activeColorScheme === 'dark',
        toggleTheme,
        isManualOverride: manualTheme !== null,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
