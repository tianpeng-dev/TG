/**
 * 腕带绑定关系
 *
 * 生命周期：绑定 → 解绑（保留历史）→ 可重新绑定其他患者
 * 解绑后历史数据保留以维持临床审计链
 */
export interface WristbandBinding {
  readonly id: string;
  /** 腕带设备 ID */
  readonly wristbandId: string;
  /** 患者ID */
  readonly patientId: string;
  /** 绑定开始时间 */
  readonly boundAt: string;
  /** 解绑时间（存在则表示已解绑） */
  readonly unboundAt?: string;
  /** 绑定状态 */
  readonly status: 'active' | 'unbound';
  /** 解绑原因 */
  readonly unboundReason?: 'device_lost' | 'device_replaced' | 'patient_withdrawal' | 'other';
  readonly clientVersion: number;
}
