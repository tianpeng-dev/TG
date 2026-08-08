/**
 * 加密 Provider 接口
 *
 * 约束：AES-128 链路加密
 * 密钥存储：iOS Keychain / Android Keystore（由 react-native-keychain 实现）
 */

export interface EncryptionProvider {
  /**
   * 生成新密钥（应存入 Keychain/Keystore）
   * @returns Base64 编码的密钥
   */
  generateKey(): Promise<string>;

  /**
   * 加密
   * @param plaintext 原始字节数据
   * @param key Base64 密钥
   * @returns 加密后的字节
   */
  encrypt(plaintext: Uint8Array, key: string): Promise<Uint8Array>;

  /**
   * 解密
   */
  decrypt(ciphertext: Uint8Array, key: string): Promise<Uint8Array>;

  /**
   * 计算哈希（用于同步 CRC 校验）
   * @returns 十六进制哈希字符串
   */
  hash(data: Uint8Array): Promise<string>;
}

/**
 * 加密算法枚举
 */
export enum EncryptionAlgorithm {
  /** AES-128-CBC（默认） */
  AES128CBC = 'AES-128-CBC',
  /** AES-256-GCM（v2 升级） */
  AES256GCM = 'AES-256-GCM',
}

/**
 * 加密配置
 */
export interface EncryptionConfig {
  readonly algorithm: EncryptionAlgorithm;
  /** IV 长度（字节） */
  readonly ivLength: number;
  /** 是否启用 HMAC */
  readonly enableHmac: boolean;
}

export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: EncryptionAlgorithm.AES128CBC,
  ivLength: 16,
  enableHmac: true,
} as const;
