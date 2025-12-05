import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'base',
  noPadding = false,
}) => {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Shadow.sm,
    ...(noPadding ? {} : { padding: Spacing[padding] }),
  };

  return <View style={[containerStyle, style]}>{children}</View>;
};
