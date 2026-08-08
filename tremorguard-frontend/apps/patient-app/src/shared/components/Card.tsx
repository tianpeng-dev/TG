/**
 * 卡片容器组件
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@tremorguard/ui-theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'none' | 'sm' | 'md' | 'floating';
}

export const Card: React.FC<CardProps> = ({ children, style, shadow = 'sm' }) => {
  const shadowStyle = shadow === 'none' ? {} : Shadows[shadow];

  return (
    <View style={[styles.card, shadowStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
});