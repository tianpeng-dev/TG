/**
 * Loading 组件
 * 全屏加载状态指示器
 */
import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing } from '@tremorguard/ui-theme';

interface LoadingProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  visible,
  message = '加载中...',
  transparent = true,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={transparent}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  message: {
    ...Typography.base,
    color: Colors.mutedForeground,
  },
});