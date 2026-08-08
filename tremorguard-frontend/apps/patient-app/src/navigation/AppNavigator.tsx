/**
 * 应用导航配置
 * 底部 Tab 导航 + Stack 全屏页面
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Sizes, Spacing } from '@tremorguard/ui-theme';

// 页面导入
import { HomeScreen } from '../features/Home';
import { ReportsScreen } from '../features/Reports';
import { ReportDetailScreen } from '../features/ReportDetail';
import { MedicationScreen } from '../features/Medication';
import { ProfileScreen } from '../features/Profile';

// 组件导入
import { HomeIcon, ReportIcon, ProfileIcon } from '../shared/components';

// 导航类型
export type RootStackParamList = {
  MainTabs: undefined;
  ReportDetail: { reportId?: string };
  Medication: undefined;
};

export type TabParamList = {
  Home: undefined;
  Reports: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 底部 Tab 导航
const TabNavigator: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={styles.tabContainer}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: isDesktop ? styles.tabBarDesktop : styles.tabBar,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.neutral400,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: '首页',
            tabBarIcon: ({ color }) => <HomeIcon size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: '报告',
            tabBarIcon: ({ color }) => <ReportIcon size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: '我的',
            tabBarIcon: ({ color }) => <ProfileIcon size={24} color={color} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// 根导航
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="ReportDetail" 
          component={ReportDetailScreen}
          options={{
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          }}
        />
        <Stack.Screen 
          name="Medication" 
          component={MedicationScreen}
          options={{
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    height: Sizes.bottomNavHeight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    paddingTop: Spacing.xs,
  },
  tabBarDesktop: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Sizes.bottomNavWidthDesktop,
    height: '100%',
    flexDirection: 'column',
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});