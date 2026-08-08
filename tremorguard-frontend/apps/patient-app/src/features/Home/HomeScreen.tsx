/**
 * 首页 - 聊天式交互界面
 * 面向帕金森患者的高可访问性设计
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Sizes, Shadows } from '@tremorguard/ui-theme';
import { Card, Button, RobotIcon, WatchIcon, SettingsIcon, MicIcon, SendIcon } from '../../shared/components';
import { useAppContext } from '../../store';
import { useDebounce } from '../../shared/hooks';
import { RootStackParamList } from '../../navigation';
import type { ChatMessage, ActionButton, MessageType } from '@tremorguard/shared-types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const QUICK_ACTIONS = [
  { label: '查看今日报告', route: 'ReportDetail' as const },
  { label: '用药记录', route: 'Medication' as const },
  { label: '最近一周趋势', route: 'Reports' as const },
  { label: '联系医生', route: null },
];

export const HomeScreen: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const navigation = useNavigation<NavigationProp>();
  const { state, sendMessage, executeAction } = useAppContext();
  const { messages, userName } = state;

  // 使用防抖优化消息发送
  const debouncedSendMessage = useDebounce((content: string) => {
    sendMessage(content);
  }, 300);

  const handleSend = () => {
    if (inputValue.trim()) {
      const content = inputValue.trim();
      setInputValue('');
      debouncedSendMessage(content);
    }
  };

  // 使用防抖优化快捷操作点击
  const handleQuickAction = useDebounce((action: typeof QUICK_ACTIONS[0]) => {
    if (action.route) {
      if (action.route === 'ReportDetail') {
        navigation.navigate('ReportDetail', { reportId: 'latest' });
      } else if (action.route === 'Reports') {
        navigation.navigate('MainTabs');
      } else {
        navigation.navigate(action.route);
      }
    }
  }, 500);

  const handleActionPress = useCallback((action: ActionButton, messageId: string) => {
    executeAction(action, messageId);

    if (action.actionType === 'view-report') {
      navigation.navigate('ReportDetail', { reportId: 'latest' });
    } else if (action.actionType === 'view-data') {
      navigation.navigate('MainTabs');
    }
  }, [executeAction, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* 顶部导航 */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <View style={styles.connectionDot} />
          <WatchIcon size={22} color={Colors.primary} />
        </View>
        <Text style={styles.topNavTitle}>TremorGuard</Text>
        <TouchableOpacity style={styles.topNavRight} activeOpacity={0.7}>
          <SettingsIcon size={24} color={Colors.foreground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 聊天消息区域 */}
        <ScrollView
          ref={scrollViewRef}
          style={[styles.chatArea, isDesktop && styles.chatAreaDesktop]}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onActionPress={handleActionPress} />
          ))}
        </ScrollView>

        {/* 快捷操作 */}
        <ScrollView
          horizontal
          style={styles.quickActions}
          contentContainerStyle={styles.quickActionsContent}
          showsHorizontalScrollIndicator={false}
        >
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionChip}
              activeOpacity={0.7}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 输入栏 */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputIconButton} activeOpacity={0.7}>
            <MicIcon size={22} color={Colors.neutral500} />
          </TouchableOpacity>
          <TextInput
            style={styles.inputField}
            placeholder="输入消息..."
            placeholderTextColor={Colors.neutral400}
            value={inputValue}
            onChangeText={setInputValue}
            multiline
          />
          <TouchableOpacity style={styles.inputIconButton} onPress={handleSend} activeOpacity={0.7}>
            <SendIcon size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// 消息气泡组件
const MessageBubble: React.FC<{
  message: ChatMessage;
  onActionPress: (action: ActionButton, messageId: string) => void;
}> = ({ message, onActionPress }) => {
  const isUser = message.type === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {/* AI 头像 */}
      {!isUser && (
        <View style={styles.avatar}>
          <RobotIcon size={20} color={Colors.primaryForeground} />
        </View>
      )}

      <View style={[styles.messageContent, isUser && styles.messageContentUser]}>
        <View style={[styles.bubble, getBubbleStyle(message.type)]}>
          {/* 用药提醒头部 */}
          {message.type === 'medication' && (
            <View style={styles.medicationHeader}>
              <Text style={styles.medicationTitle}>{message.timestamp} 用药提醒</Text>
            </View>
          )}

          {/* 警报头部 */}
          {message.type === 'alert' && (
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>异常警报</Text>
              <View style={styles.pulseIndicator}>
                <View style={styles.pulseDot} />
              </View>
            </View>
          )}

          <Text style={[styles.messageText, { color: getTextColor(message.type) }]}>
            {message.content}
          </Text>

          {/* 操作按钮 */}
          {message.actions && (
            <View style={styles.actionsContainer}>
              {message.actions.map((action, index) => (
                <Button
                  key={index}
                  label={action.label}
                  variant={action.variant}
                  onPress={() => onActionPress(action, message.id)}
                  style={styles.actionButton}
                />
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
};

// 样式工具函数
const getBubbleStyle = (type: MessageType) => {
  switch (type) {
    case 'user':
      return styles.bubbleUser;
    case 'alert':
      return styles.bubbleAlert;
    default:
      return styles.bubbleAI;
  }
};

const getTextColor = (type: MessageType) => {
  switch (type) {
    case 'user':
      return Colors.primaryForeground;
    case 'alert':
      return Colors.foreground;
    default:
      return Colors.foreground;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topNav: {
    height: Sizes.topNavHeight,
    paddingTop: Sizes.statusBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: Sizes.minTouchTarget,
  },
  topNavTitle: {
    ...Typography.lg,
    color: Colors.foreground,
    fontWeight: '500',
  },
  topNavRight: {
    minWidth: Sizes.minTouchTarget,
    minHeight: Sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  keyboardView: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatAreaDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  chatContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    alignSelf: 'flex-start',
  },
  messageContent: {
    flex: 1,
  },
  messageContentUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopLeftRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.msgSystem,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: 4,
  },
  bubbleAlert: {
    backgroundColor: Colors.msgAlert,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  messageText: {
    ...Typography.sm,
    lineHeight: 27,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  medicationTitle: {
    ...Typography.sm,
    fontWeight: '600',
    color: Colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  alertTitle: {
    ...Typography.base,
    fontWeight: '700',
    color: Colors.error,
  },
  pulseIndicator: {
    width: 14,
    height: 14,
  },
  pulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.error,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  timestamp: {
    ...Typography.xs,
    color: Colors.neutral400,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  timestampUser: {
    textAlign: 'right',
    marginRight: Spacing.xs,
    marginLeft: 0,
  },
  quickActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  quickActionsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  quickActionChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
    minHeight: Sizes.minTouchTarget,
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...Typography.xs,
    fontWeight: '500',
    color: Colors.primary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  inputIconButton: {
    width: Sizes.minTouchTarget,
    height: Sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  inputField: {
    flex: 1,
    minHeight: Sizes.minTouchTarget,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.input,
    ...Typography.sm,
    color: Colors.foreground,
  },
});