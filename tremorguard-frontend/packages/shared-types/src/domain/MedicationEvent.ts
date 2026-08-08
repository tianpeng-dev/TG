/**
 * 服药事件
 */
export interface MedicationEvent {
  readonly id: string;
  readonly patientId: string;
  /** 服药时间（ISO 8601） */
  readonly takenAt: string;
  /** 药品名称 */
  readonly medicationName: string;
  /** 剂量（mg） */
  readonly dosageMg: number;
  /** 确认方式：手环物理按键 / App 内确认 */
  readonly confirmedBy: 'wristband' | 'app';
  /** 是否漏服（系统判定） */
  readonly missed?: boolean;
  /** 同步版本号（乐观锁） */
  readonly clientVersion: number;
}
