/**
 * GATT 服务/特征值 UUID 定义
 *
 * ⚠️ 待固件团队提供具体 UUID，此处为占位常量
 * 文档：嵌入式团队需提供 GATT 服务定义
 */

/**
 * TremorGuard 腕带 GATT 服务 UUID（占位）
 * 待固件团队提供真实 UUID
 */
export const TREMORGUARD_SERVICE_UUID = '0000xxxx-0000-1000-8000-00805f9b34fb' as const;

/**
 * 震颤数据流特征值 UUID（notify，50Hz）
 */
export const TREMOR_STREAM_CHARACTERISTIC_UUID =
  '0000xxxx-0000-1000-8000-00805f9b34fb' as const;

/**
 * 心跳特征值 UUID（write + notify）
 */
export const HEARTBEAT_CHARACTERISTIC_UUID =
  '0000xxxx-0000-1000-8000-00805f9b34fb' as const;

/**
 * 服药确认特征值 UUID（write）
 */
export const MEDICATION_CONFIRM_CHARACTERISTIC_UUID =
  '0000xxxx-0000-1000-8000-00805f9b34fb' as const;

/**
 * 设备信息特征值 UUID（read）
 */
export const DEVICE_INFO_CHARACTERISTIC_UUID =
  '0000xxxx-0000-1000-8000-00805f9b34fb' as const;

/**
 * GATT 服务声明
 */
export interface GattServiceDescriptor {
  readonly serviceUuid: string;
  readonly characteristics: readonly GattCharacteristicDescriptor[];
}

export interface GattCharacteristicDescriptor {
  readonly uuid: string;
  readonly name: string;
  readonly properties: {
    readonly read: boolean;
    readonly write: boolean;
    readonly notify: boolean;
    readonly indicate: boolean;
  };
}

/**
 * 完整的 GATT Profile（待固件团队补全）
 */
export const TREMORGUARD_GATT_PROFILE: GattServiceDescriptor = {
  serviceUuid: TREMORGUARD_SERVICE_UUID,
  characteristics: [
    {
      uuid: TREMOR_STREAM_CHARACTERISTIC_UUID,
      name: 'Tremor Stream',
      properties: { read: false, write: false, notify: true, indicate: false },
    },
    {
      uuid: HEARTBEAT_CHARACTERISTIC_UUID,
      name: 'Heartbeat',
      properties: { read: false, write: true, notify: true, indicate: false },
    },
    {
      uuid: MEDICATION_CONFIRM_CHARACTERISTIC_UUID,
      name: 'Medication Confirm',
      properties: { read: false, write: true, notify: false, indicate: false },
    },
    {
      uuid: DEVICE_INFO_CHARACTERISTIC_UUID,
      name: 'Device Info',
      properties: { read: true, write: false, notify: false, indicate: false },
    },
  ],
};
