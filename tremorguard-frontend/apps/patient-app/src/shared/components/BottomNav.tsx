/**
 * 底部导航栏组件
 * 支持 3 个 Tab：首页、报告、我的
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Sizes } from '@tremorguard/ui-theme';
import { HomeIcon, ReportIcon, ProfileIcon } from './icons/Icons';

export type TabKey = 'home' | 'reports' | 'profile';

interface BottomNavProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

interface TabItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ icon, label, isActive, onPress }) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="tab"
    accessibilityState={{ selected: isActive }}
  >
    <View style={styles.tabIcon}>{icon}</View>
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <TabItem
        icon={<HomeIcon size={24} color={activeTab === 'home' ? Colors.primary : Colors.neutral400} />}
        label="首页"
        isActive={activeTab === 'home'}
        onPress={() => onTabPress('home')}
      />
      <TabItem
        icon={<ReportIcon size={24} color={activeTab === 'reports' ? Colors.primary : Colors.neutral400} />}
        label="报告"
        isActive={activeTab === 'reports'}
        onPress={() => onTabPress('reports')}
      />
      <TabItem
        icon={<ProfileIcon size={24} color={activeTab === 'profile' ? Colors.primary : Colors.neutral400} />}
        label="我的"
        isActive={activeTab === 'profile'}
        onPress={() => onTabPress('profile')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Sizes.bottomNavHeight,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 0, // safe area handled by native
  },
  containerDesktop: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Sizes.bottomNavWidthDesktop,
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: Spacing.xxl,
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  tabItem: {
    minWidth: Sizes.minTouchTarget,
    minHeight: Sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tabIcon: {
    marginBottom: Spacing.xs,
  },
  tabLabel: {
    ...Typography.xs,
    color: Colors.neutral400,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
});