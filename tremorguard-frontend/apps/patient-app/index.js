/**
 * TremorGuard Patient App - React Native Entry
 * 脚手架阶段：仅注册空壳 App，业务页面在 P0 阶段实现
 */
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
