/**
 * 全局状态管理 Context
 * 管理用药状态、聊天消息、用户信息等
 */
import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { MedicationStatus, ChatMessage, ActionButton } from '@tremorguard/shared-types';

// 状态类型定义
interface AppState {
  medications: MedicationStatus[];
  messages: ChatMessage[];
  userName: string;
  isLoading: boolean;
}

// Action 类型
type AppAction =
  | { type: 'UPDATE_MEDICATION_STATUS'; payload: { id: string; status: MedicationStatus['status'] } }
  | { type: 'ADD_MEDICATION'; payload: MedicationStatus }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'EXECUTE_ACTION'; payload: { action: ActionButton; messageId: string } };

// 初始状态
const initialState: AppState = {
  medications: [
    { id: '1', name: '左旋多巴', dosage: '250mg', time: '08:00', status: 'taken' },
    { id: '2', name: '恩他卡朋', dosage: '200mg', time: '08:00', status: 'taken' },
    { id: '3', name: '普拉克索', dosage: '0.5mg', time: '12:00', status: 'taken' },
    { id: '4', name: '左旋多巴', dosage: '250mg', time: '18:00', status: 'pending' },
    { id: '5', name: '恩他卡朋', dosage: '200mg', time: '14:00', status: 'skipped' },
  ],
  messages: [
    {
      id: '1',
      type: 'ai',
      content: '早安,张阿姨!昨晚睡眠期间震颤 2 次,每次约 15 分钟。晨起服药后 30 分钟已起效。',
      timestamp: '08:00',
    },
    {
      id: '2',
      type: 'user',
      content: '今天感觉怎么样?',
      timestamp: '08:05',
    },
    {
      id: '3',
      type: 'medication',
      content: '该服用左旋多巴 250mg 了',
      timestamp: '12:00',
      actions: [
        { label: '已服药', variant: 'success', actionType: 'mark-taken', medicationId: '4' },
        { label: '稍后提醒', variant: 'ghost' },
      ],
    },
    {
      id: '4',
      type: 'alert',
      content: '震颤水平升高(振幅 3.5cm),检测到剂末现象',
      timestamp: '14:32',
      actions: [
        { label: '已服药', variant: 'success', actionType: 'mark-taken' },
        { label: '通知照护者', variant: 'warning', actionType: 'notify-caregiver' },
        { label: '查看数据', variant: 'outline', actionType: 'view-data' },
      ],
    },
    {
      id: '5',
      type: 'ai',
      content: '今日报告已生成。本周震颤强度下降 18%,日均发作次数从 3.2 次降到 2.1 次。',
      timestamp: '20:00',
      actions: [
        { label: '查看完整报告', variant: 'primary', actionType: 'view-report' },
        { label: '分享给医生', variant: 'outline' },
      ],
    },
  ],
  userName: '张阿姨',
  isLoading: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_MEDICATION_STATUS':
      return {
        ...state,
        medications: state.medications.map(med =>
          med.id === action.payload.id ? { ...med, status: action.payload.status } : med
        ),
      };

    case 'ADD_MEDICATION':
      return {
        ...state,
        medications: [...state.medications, action.payload],
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'EXECUTE_ACTION':
      // 根据 actionType 执行相应逻辑
      const { action: actionButton } = action.payload;
      if (actionButton.actionType === 'mark-taken' && actionButton.medicationId) {
        return {
          ...state,
          medications: state.medications.map(med =>
            med.id === actionButton.medicationId ? { ...med, status: 'taken' } : med
          ),
        };
      }
      return state;

    default:
      return state;
  }
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  updateMedicationStatus: (id: string, status: MedicationStatus['status']) => void;
  addMedication: (medication: MedicationStatus) => void;
  sendMessage: (content: string) => void;
  executeAction: (action: ActionButton, messageId: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const updateMedicationStatus = useCallback((id: string, status: MedicationStatus['status']) => {
    dispatch({ type: 'UPDATE_MEDICATION_STATUS', payload: { id, status } });
  }, []);

  const addMedication = useCallback((medication: MedicationStatus) => {
    dispatch({ type: 'ADD_MEDICATION', payload: medication });
  }, []);

  const sendMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage });

    // 模拟 AI 回复(实际项目中应调用后端 API)
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '收到您的消息。我会持续监测您的震颤情况,如有异常会及时提醒您。',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: aiReply });
    }, 1000);
  }, []);

  const executeAction = useCallback((action: ActionButton, messageId: string) => {
    dispatch({ type: 'EXECUTE_ACTION', payload: { action, messageId } });
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    updateMedicationStatus,
    addMedication,
    sendMessage,
    executeAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};