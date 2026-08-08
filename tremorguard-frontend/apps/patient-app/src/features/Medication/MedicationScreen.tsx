/**
 * 用药管理页
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius, Sizes, Shadows } from '@tremorguard/ui-theme';
import { TopNav, Card, StatusBadge, Button } from '../../shared/components';
import { useAppContext } from '../../store';
import { useToast } from '../../shared/hooks';
import type { MedicationStatus } from '@tremorguard/shared-types';

export const MedicationScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { state, updateMedicationStatus, addMedication } = useAppContext();
  const { medications } = state;
  const [showAddForm, setShowAddForm] = useState(false);
  const { showToast } = useToast();

  const takenCount = medications.filter(m => m.status === 'taken').length;
  const total = medications.length;

  const handleStatusToggle = (medication: MedicationStatus) => {
    const newStatus = medication.status === 'pending' ? 'taken' :
                      medication.status === 'taken' ? 'skipped' : 'pending';
    updateMedicationStatus(medication.id, newStatus);

    // 显示操作反馈
    const statusText = newStatus === 'taken' ? '已服用' :
                       newStatus === 'skipped' ? '已跳过' : '待服用';
    showToast(`${medication.name} ${medication.dosage} 已标记为${statusText}`, 'success');
  };

  const handleAddMedication = () => {
    // 简化版本：显示添加用药的提示
    // 实际项目中应弹出表单或跳转到添加页面
    Alert.alert(
      '添加用药计划',
      '此功能需要配合后端实现。\n\n将支持：\n• 选择药物名称\n• 设置剂量\n• 设置服药时间\n• 设置提醒方式',
      [{ text: '知道了', style: 'default' }]
    );
  };

  const handleMedicationPress = (medication: MedicationStatus) => {
    if (medication.status === 'pending') {
      // 待服用状态点击：询问是否标记为已服用
      Alert.alert(
        '确认服药',
        `是否将 ${medication.name} ${medication.dosage} 标记为已服用？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '已服药',
            onPress: () => {
              updateMedicationStatus(medication.id, 'taken');
              showToast(`${medication.name} ${medication.dosage} 已标记为已服用`, 'success');
            },
          },
        ]
      );
    } else {
      // 其他状态点击：循环切换状态
      handleStatusToggle(medication);
    }
  };

  return (
    <View style={styles.container}>
      <TopNav title="用药管理" />

      <ScrollView
        style={[styles.content, isDesktop && styles.contentDesktop]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 进度卡片 */}
        <Card style={styles.progressCard} shadow="sm">
          <Text style={styles.progressLabel}>今日用药进度</Text>
          <ProgressRing taken={takenCount} total={total} />
        </Card>

        {/* 用药列表 */}
        {medications.map((med) => (
          <MedicationCard
            key={med.id}
            medication={med}
            onPress={() => handleMedicationPress(med)}
          />
        ))}
      </ScrollView>

      {/* 底部按钮 */}
      <Button
        label="+ 添加用药计划"
        variant="primary"
        onPress={handleAddMedication}
        style={styles.floatingButton}
      />
    </View>
  );
};

// 进度环组件
const ProgressRing: React.FC<{ taken: number; total: number }> = ({ taken, total }) => {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (taken / total) * circumference : 0;

  return (
    <View style={styles.progressRingContainer}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* 背景环 */}
        <Circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={Colors.muted}
          strokeWidth={strokeWidth}
        />
        {/* 进度环 */}
        <Circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={Colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 60 60)"
        />
      </Svg>
      <View style={styles.progressText}>
        <Text style={styles.progressValue}>{taken}/{total}</Text>
      </View>
    </View>
  );
};

// 用药卡片组件
const MedicationCard: React.FC<{
  medication: MedicationStatus;
  onPress: () => void;
}> = ({ medication, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card style={styles.medicationCard} shadow="sm">
      <View style={styles.medHeader}>
        <Text style={styles.medName}>{medication.name}</Text>
        <Text style={styles.medDosage}>{medication.dosage}</Text>
      </View>
      <View style={styles.medFooter}>
        <Text style={styles.medTime}>{medication.time}</Text>
        <StatusBadge
          label={medication.status === 'taken' ? '已服用' : medication.status === 'pending' ? '待服用' : '已跳过'}
          variant={medication.status}
        />
      </View>
    </Card>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentDesktop: {
    marginLeft: Sizes.bottomNavWidthDesktop,
    maxWidth: 648,
    alignSelf: 'center',
    width: '100%',
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 80,
    gap: Spacing.md,
  },
  progressCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  progressLabel: {
    ...Typography.sm,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  progressRingContainer: {
    width: 120,
    height: 120,
    marginTop: Spacing.md,
    position: 'relative',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    ...Typography.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  medicationCard: {
    padding: Spacing.xl,
    minHeight: 64,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  medName: {
    ...Typography.base,
    fontWeight: '700',
    color: Colors.foreground,
  },
  medDosage: {
    ...Typography.sm,
    color: Colors.mutedForeground,
  },
  medFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medTime: {
    ...Typography.sm,
    color: Colors.mutedForeground,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    minHeight: 60,
  },
});