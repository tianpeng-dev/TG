/**
 * 患者档案
 */
export interface PatientProfile {
  readonly id: string;
  /** 真实姓名 */
  readonly name: string;
  /** 性别 */
  readonly gender: 'male' | 'female' | 'other';
  /** 出生年月日（ISO 8601 date） */
  readonly birthDate: string;
  /** 联系电话 */
  readonly phone?: string;
  /** 紧急联系人 */
  readonly emergencyContact?: {
    readonly name: string;
    readonly phone: string;
    readonly relationship: string;
  };
  /** 诊断信息 */
  readonly diagnosis: {
    /** 帕金森确诊日期 */
    readonly diagnosedAt: string;
    /** Hoehn & Yahr 分级 1-5 */
    readonly hoehnYahrStage: 1 | 2 | 3 | 4 | 5;
    /** 主治医生 ID */
    readonly primaryDoctorId?: string;
  };
  /** 当前用药方案 */
  readonly medicationPlan?: readonly MedicationPlanItem[];
  /** 创建时间 */
  readonly createdAt: string;
  /** 更新时间 */
  readonly updatedAt: string;
  readonly clientVersion: number;
}

/**
 * 用药方案条目
 */
export interface MedicationPlanItem {
  readonly medicationName: string;
  readonly dosageMg: number;
  /** 每日服药时间点（HH:mm） */
  readonly schedule: readonly string[];
  /** 是否启用 */
  readonly active: boolean;
}
