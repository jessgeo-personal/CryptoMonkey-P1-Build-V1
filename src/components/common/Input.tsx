import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const { colors } = useTheme();

  const inputStyle: TextStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: error ? colors.error : colors.border,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: colors.text,
  };

  const labelStyle: TextStyle = {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: colors.text,
    marginBottom: Spacing.xs,
  };

  const errorStyle: TextStyle = {
    fontSize: Typography.fontSize.sm,
    color: colors.error,
    marginTop: Spacing.xs,
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <TextInput
        style={[inputStyle, style]}
        placeholderTextColor={colors.textSecondary}
        {...textInputProps}
      />
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};
