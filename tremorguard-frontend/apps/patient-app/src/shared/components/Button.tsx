/**
 * 按钮组件
 * 支持多种变体：primary、success、warning、outline、ghost
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, BorderRadius, Sizes, Spacing } from '@tremorguard/ui-theme';

export type ButtonVariant = 'primary' | 'success' | 'warning' | 'outline' | 'ghost';

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const variantStyles = getVariantStyles(variant);
  const disabledStyle = disabled ? styles.disabled : {};

  return (
    <TouchableOpacity
      style={[styles.button, variantStyles.button, disabledStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: variantStyles.textColor }, textStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return { button: styles.primary, textColor: Colors.primaryForeground };
    case 'success':
      return { button: styles.success, textColor: Colors.successForeground };
    case 'warning':
      return { button: styles.warning, textColor: Colors.warningForeground };
    case 'outline':
      return { button: styles.outline, textColor: Colors.primary };
    case 'ghost':
      return { button: styles.ghost, textColor: Colors.foreground };
    default:
      return { button: styles.primary, textColor: Colors.primaryForeground };
  }
};

const styles = StyleSheet.create({
  button: {
    minHeight: Sizes.minTouchTarget,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  label: {
    ...Typography.sm,
    fontWeight: '500',
  },
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  success: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  outline: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: Colors.neutral200,
    borderColor: Colors.neutral200,
  },
  disabled: {
    opacity: 0.5,
  },
});