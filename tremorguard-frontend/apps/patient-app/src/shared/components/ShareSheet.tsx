/**
 * 分享弹窗组件
 * 用于分享报告给医生或其他渠道
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Sizes } from '@tremorguard/ui-theme';
import { MessageIcon, MailIcon, PrintIcon, ChevronRightIcon } from './icons/Icons';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface ShareOption {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

const SHARE_OPTIONS: ShareOption[] = [
  { icon: <MessageIcon size={20} color={Colors.primary} />, label: '短信发送链接' },
  { icon: <MailIcon size={20} color={Colors.primary} />, label: '邮件发送 PDF' },
  { icon: <PrintIcon size={20} color={Colors.primary} />, label: 'A4 打印' },
];

export const ShareSheet: React.FC<ShareSheetProps> = ({ visible, onClose }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* 背景遮罩 */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.backdropOverlay} />
      </Pressable>

      {/* 弹窗面板 */}
      <View style={[styles.sheetContainer, isDesktop && styles.sheetContainerDesktop]}>
        {/* 拖拽条 */}
        <View style={styles.handleBar}>
          <View style={styles.handleBarItem} />
        </View>

        {/* 标题 */}
        <Text style={styles.sheetTitle}>分享报告</Text>

        {/* 选项列表 */}
        <View style={styles.optionsContainer}>
          {SHARE_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={option.onPress}
            >
              <View style={styles.optionIconCircle}>{option.icon}</View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <ChevronRightIcon size={20} color={Colors.neutral400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 取消按钮 */}
        <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={onClose}>
          <Text style={styles.cancelLabel}>取消</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '50%',
    minHeight: 340,
  },
  sheetContainerDesktop: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -200 }, { translateY: -150 }],
    width: 400,
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    minWidth: 320,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  handleBarItem: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral300,
  },
  sheetTitle: {
    ...Typography.lg,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    paddingBottom: Spacing.sm,
  },
  optionsContainer: {
    paddingVertical: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minHeight: 60,
  },
  optionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.msgSystem,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  optionLabel: {
    flex: 1,
    ...Typography.base,
    color: Colors.foreground,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelLabel: {
    ...Typography.base,
    color: Colors.mutedForeground,
  },
});