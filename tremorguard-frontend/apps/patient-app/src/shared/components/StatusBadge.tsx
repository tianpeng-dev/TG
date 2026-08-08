/**
 * 状态徽章组件
 * 用于显示用药状态：已服用、待服用、已跳过
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '@tremorguard/ui-theme';

export type BadgeVariant = 'taken' | 'pending' | 'skipped' | 'info' | 'success';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'info' }) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <View style={[styles.badge, variantStyles.badge]}>
      <Text style={[styles.label, { color: variantStyles.textColor }]}>{label}</Text>
    </View>
  );
};

const getVariantStyles = (variant: BadgeVariant) => {
  switch (variant) {
    case 'taken':
    case 'success':
      return {
        badge: { backgroundColor: Colors.successLight },
        textColor: Colors.success,
      };
    case 'pending':
      return {
        badge: { backgroundColor: Colors.warningLight },
        textColor: Colors.warning,
      };
    case 'skipped':
      return {
        badge: { backgroundColor: Colors.muted },
        textColor: Colors.neutral400,
      };
    case 'info':
    default:
      return {
        badge: { backgroundColor: Colors.msgSystem },
        textColor: Colors.primary,
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.xs,
    fontWeight: '500',
  },
});