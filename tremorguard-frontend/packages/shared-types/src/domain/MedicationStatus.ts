/**
 * 用药状态（用于前端展示）
 */
export interface MedicationStatus {
  readonly id: string;
  readonly name: string;
  readonly dosage: string;
  readonly time: string;
  readonly status: 'taken' | 'pending' | 'skipped';
}

/**
 * 聊天消息类型
 */
export type MessageType = 'ai' | 'user' | 'alert' | 'medication';

export interface ChatMessage {
  readonly id: string;
  readonly type: MessageType;
  readonly content: string;
  readonly timestamp: string;
  readonly actions?: readonly ActionButton[];
}

export interface ActionButton {
  readonly label: string;
  readonly variant: 'primary' | 'success' | 'warning' | 'outline' | 'ghost';
  readonly actionType?: 'mark-taken' | 'notify-caregiver' | 'view-report' | 'view-data';
  readonly medicationId?: string;
}

/**
 * 用药计划（前端展示）
 */
export interface MedicationPlan {
  readonly id: string;
  readonly name: string;
  readonly dosage: string;
  readonly times: readonly string[];
  readonly active: boolean;
}