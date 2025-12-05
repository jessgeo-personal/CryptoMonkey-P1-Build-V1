import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

// ============================================
// BADGE COMPONENT
// ============================================

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
}) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: `${colors.success}26`, // 15% opacity
          border: `${colors.success}40`, // 25% opacity
          text: colors.success,
        };
      case 'error':
        return {
          bg: `${colors.error}26`,
          border: `${colors.error}40`,
          text: colors.error,
        };
      case 'warning':
        return {
          bg: `${colors.warning}26`,
          border: `${colors.warning}40`,
          text: colors.warning,
        };
      case 'info':
        return {
          bg: `${colors.info}26`,
          border: `${colors.info}40`,
          text: colors.info,
        };
      case 'neutral':
      default:
        return {
          bg: colors.secondary,
          border: colors.border,
          text: colors.text,
        };
    }
  };

  const badgeColors = getColors();

  const containerStyle: ViewStyle = {
    backgroundColor: badgeColors.bg,
    borderWidth: 1,
    borderColor: badgeColors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  };

  const textStyle: TextStyle = {
    color: badgeColors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};
