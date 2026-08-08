/**
 * 顶部导航栏组件
 * 用于全屏页面的返回导航
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, Sizes } from '@tremorguard/ui-theme';
import { BackIcon } from './icons/Icons';

interface TopNavProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export const TopNav: React.FC<TopNavProps> = ({ title, onBack, rightContent }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />
      <View style={styles.content}>
        {/* 返回按钮 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="返回"
          accessibilityRole="button"
        >
          <BackIcon size={24} color={Colors.foreground} />
        </TouchableOpacity>

        {/* 标题 */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* 右侧内容（占位） */}
        <View style={styles.rightSpacer}>{rightContent}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Sizes.statusBarHeight,
  },
  content: {
    height: Sizes.topNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: Sizes.minTouchTarget,
    height: Sizes.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -Spacing.xs,
  },
  title: {
    flex: 1,
    ...Typography.lg,
    textAlign: 'center',
    color: Colors.foreground,
  },
  rightSpacer: {
    width: Sizes.minTouchTarget,
  },
});