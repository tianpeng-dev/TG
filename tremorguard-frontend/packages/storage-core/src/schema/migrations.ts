import type { Migration } from '../types';
import { TABLE_NAMES } from './tables';

/**
 * v0 → v1 初始迁移：创建所有核心表
 *
 * 注意：SQL 语法兼容 SQLite（react-native-sqlite-storage）
 */
export const migration_v1_initial: Migration = {
  version: 1,
  description: '创建初始数据库表结构',
  async up(db) {
    // 震颤数据表（高频写入）
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.tremorLevels} (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        severity INTEGER NOT NULL,
        frequency_hz REAL,
        amplitude REAL,
        source TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        client_version INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_tremor_timestamp ON ${TABLE_NAMES.tremorLevels}(timestamp);`,
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_tremor_patient ON ${TABLE_NAMES.tremorLevels}(patient_id);`,
    );

    // 服药事件表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.medicationEvents} (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        taken_at TEXT NOT NULL,
        medication_name TEXT NOT NULL,
        dosage_mg REAL NOT NULL,
        confirmed_by TEXT NOT NULL,
        missed INTEGER DEFAULT 0,
        client_version INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 阈值配置表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.thresholdConfigs} (
        patient_id TEXT PRIMARY KEY,
        severity_threshold INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        alert_channels TEXT NOT NULL,
        set_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        client_version INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 就诊报告表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.clinicReports} (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        metrics TEXT NOT NULL,
        patient_conclusions TEXT NOT NULL,
        doctor_conclusions TEXT NOT NULL,
        report_version INTEGER NOT NULL,
        client_version INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 患者档案表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.patientProfiles} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gender TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        phone TEXT,
        emergency_contact TEXT,
        diagnosis TEXT NOT NULL,
        medication_plan TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        client_version INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 设备状态表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.deviceStatus} (
        device_id TEXT PRIMARY KEY,
        patient_id TEXT,
        battery_level INTEGER NOT NULL,
        charging INTEGER NOT NULL DEFAULT 0,
        firmware_version TEXT NOT NULL,
        hardware_version TEXT NOT NULL,
        last_synced_at TEXT,
        status TEXT NOT NULL,
        last_error TEXT,
        rssi INTEGER
      );
    `);

    // 腕带绑定关系表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.wristbandBindings} (
        id TEXT PRIMARY KEY,
        wristband_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        bound_at TEXT NOT NULL,
        unbound_at TEXT,
        status TEXT NOT NULL,
        unbound_reason TEXT,
        client_version INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 同步队列表（待推送的 delta）
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.syncQueue} (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        client_timestamp TEXT NOT NULL,
        client_version INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
    `);

    // 同步元数据表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAMES.syncMetadata} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
  async down(db) {
    for (const table of Object.values(TABLE_NAMES)) {
      await db.execute(`DROP TABLE IF EXISTS ${table};`);
    }
  },
};

/**
 * 所有迁移按版本号排序
 */
export const ALL_MIGRATIONS: readonly Migration[] = [migration_v1_initial];
