/**
 * 个人中心页
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Sizes, Shadows } from '@tremorguard/ui-theme';
import {
  Card,
  ChevronRightIcon,
  PlusIcon,
  UsersIcon,
  DeviceIcon,
  BellIcon,
  HelpIcon,
} from '../../shared/components';
import { RootStackParamList } from '../../navigation';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface FunctionItem {
  icon: React.ReactNode;
  label: string;
  route?: keyof RootStackParamList;
}

const FUNCTION_ITEMS: FunctionItem[] = [
  { icon: <PlusIcon size={22} color={Colors.primary} />, label: '用药管理', route: 'Medication' },
  { icon: <UsersIcon size={22} color={Colors.primary} />, label: '照护者设置' },
  { icon: <DeviceIcon size={22} color={Colors.primary} />, label: '设备管理' },
  { icon: <BellIcon size={22} color={Colors.primary} />, label: '通知设置' },
  { icon: <HelpIcon size={22} color={Colors.primary} />, label: '帮助与反馈' },
];

export const ProfileScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const navigation = useNavigation<NavigationProp>();

  const handleFunctionPress = (item: FunctionItem) => {
    if (item.route) {
      // 导航到指定路由
      navigation.navigate(item.route as 'Medication');
    }
  };

  return (
    <View style={styles.container}>
      {/* 状态栏占位 */}
      <View style={styles.statusBarSpacer} />

      <ScrollView
        style={[styles.content, isDesktop && styles.contentDesktop]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 个人信息头部 */}
        <View style={[styles.profileHeader, isDesktop && styles.profileHeaderDesktop]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>张</Text>
          </View>
          <Text style={styles.userName}>张秀兰</Text>
          <View style={styles.connectionBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.connectionText}>设备已连接</Text>
          </View>
        </View>

        {/* 功能列表 */}
        <View style={styles.functionSection}>
          <Card style={styles.functionCard} shadow="sm">
            {FUNCTION_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.functionItem,
                  index < FUNCTION_ITEMS.length - 1 && styles.functionItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => handleFunctionPress(item)}
              >
                <View style={styles.iconCircle}>{item.icon}</View>
                <Text style={styles.functionLabel}>{item.label}</Text>
                <ChevronRightIcon size={24} color={Colors.neutral400} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* 版本号 */}
        <Text style={styles.versionText}>TremorGuard v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBarSpacer: {
    height: Sizes.statusBarHeight,
    backgroundColor: Colors.card,
  },
  content: {
    flex: 1,
  },
  contentDesktop: {
    marginLeft: Sizes.bottomNavWidthDesktop,
    maxWidth: 648,
    alignSelf: 'center',
    width: '100%',
  },
  contentContainer: {
    paddingBottom: Sizes.bottomNavHeight + Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
  },
  profileHeaderDesktop: {
    flexDirection: 'row',
    gap: Spacing.xl,
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    ...Typography.xl,
    fontWeight: '700',
    color: Colors.primaryForeground,
  },
  userName: {
    ...Typography.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  connectionText: {
    ...Typography.xs,
    fontWeight: '500',
    color: Colors.success,
  },
  functionSection: {
    padding: Spacing.lg,
  },
  functionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  functionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },
  functionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.msgSystem,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  functionLabel: {
    flex: 1,
    ...Typography.base,
    fontWeight: '500',
    color: Colors.foreground,
  },
  versionText: {
    ...Typography.xs,
    color: Colors.neutral400,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});