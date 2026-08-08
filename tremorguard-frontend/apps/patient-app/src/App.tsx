/**
 * TremorGuard 患者端应用入口
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './navigation';
import { AppProvider } from './store';
import { ToastProvider } from './shared/hooks';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
        <AppNavigator />
      </ToastProvider>
    </AppProvider>
  );
};