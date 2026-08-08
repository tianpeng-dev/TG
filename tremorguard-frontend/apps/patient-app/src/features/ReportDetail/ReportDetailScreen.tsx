/**
 * 报告详情页
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Polyline, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius, Sizes, Shadows } from '@tremorguard/ui-theme';
import { TopNav, Card, Button } from '../../shared/components';

export const ReportDetailScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <ScrollView
      style={[styles.container, isDesktop && styles.containerDesktop]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <TopNav title="今日报告" />

      <Card style={isDesktop ? styles.reportCardDesktop : styles.reportCard} shadow="sm">
        {/* 结论 */}
        <Text style={styles.conclusion}>
          本周震颤强度下降 18%，{'\n'}整体状况良好
        </Text>

        {/* 关键指标 */}
        <View style={styles.metricsRow}>
          <MetricBlock value="2.1" label="日均发作次数" />
          <View style={styles.metricDivider} />
          <MetricBlock value="↓18%" label="震颤强度变化" isSuccess />
          <View style={styles.metricDivider} />
          <MetricBlock value="6.2h" label="日均有效控制" />
        </View>

        {/* 趋势图 */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>7 日震颤趋势</Text>
          <TrendChart />
        </View>

        {/* 用药依从性 */}
        <View style={styles.medicationSection}>
          <Text style={styles.medicationTitle}>用药依从性</Text>
          <View style={styles.doseDots}>
            <View style={[styles.doseDot, styles.doseDotTaken]} />
            <View style={[styles.doseDot, styles.doseDotTaken]} />
            <View style={[styles.doseDot, styles.doseDotTaken]} />
            <View style={[styles.doseDot, styles.doseDotLate]} />
            <View style={[styles.doseDot, styles.doseDotMissed]} />
          </View>
          <Text style={styles.doseLabel}>本周服药率 87%</Text>
        </View>

        {/* 展开更多 */}
        <Button
          label="展开更多"
          variant="outline"
          onPress={() => {}}
          style={styles.expandButton}
        />
      </Card>

      {/* 分享按钮 */}
      <Button
        label="分享给医生"
        variant="primary"
        onPress={() => {}}
        style={styles.shareButton}
      />
    </ScrollView>
  );
};

// 指标块组件
const MetricBlock: React.FC<{ value: string; label: string; isSuccess?: boolean }> = ({
  value,
  label,
  isSuccess,
}) => (
  <View style={styles.metricBlock}>
    <Text style={[styles.metricValue, isSuccess && styles.metricValueSuccess]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

// 趋势图组件
const TrendChart: React.FC = () => {
  const chartWidth = 280;
  const chartHeight = 140;

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={Colors.msgSystem} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {/* 参考线 */}
        <Line x1="30" y1="20" x2={chartWidth - 20} y2="20" stroke={Colors.neutral200} strokeWidth={1} strokeDasharray="4,4" />
        <Line x1="30" y1="55" x2={chartWidth - 20} y2="55" stroke={Colors.neutral200} strokeWidth={1} strokeDasharray="4,4" />
        <Line x1="30" y1="90" x2={chartWidth - 20} y2="90" stroke={Colors.neutral200} strokeWidth={1} strokeDasharray="4,4" />
        <Line x1="30" y1="120" x2={chartWidth - 20} y2="120" stroke={Colors.neutral200} strokeWidth={1} />

        {/* 区域填充 */}
        <Polyline
          points="50,42 90,54 130,36 170,68 210,80 250,92 270,100 270,120 50,120"
          fill="url(#chartFill)"
        />

        {/* 折线 */}
        <Polyline
          points="50,42 90,54 130,36 170,68 210,80 250,92 270,100"
          fill="none"
          stroke={Colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {[
          [50, 42], [90, 54], [130, 36], [170, 68], [210, 80], [250, 92], [270, 100],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={4} fill={Colors.card} stroke={Colors.primary} strokeWidth={2.5} />
        ))}

        {/* X 轴标签 - 使用 View overlay */}
      </Svg>

      {/* X 轴标签 */}
      <View style={styles.chartLabels}>
        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => (
          <Text key={i} style={styles.chartLabel}>
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerDesktop: {
    marginLeft: Sizes.bottomNavWidthDesktop,
    maxWidth: 648,
    alignSelf: 'center',
    width: '100%',
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  reportCard: {
    margin: Spacing.lg,
    padding: Spacing.xxl,
  },
  reportCardDesktop: {
    marginHorizontal: Spacing.xxl,
    padding: Spacing.xxl,
  },
  conclusion: {
    ...Typography.lg,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: Spacing.xxl,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricValueSuccess: {
    color: Colors.success,
  },
  metricLabel: {
    ...Typography.xs,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  metricDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.neutral200,
  },
  chartSection: {
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chartTitle: {
    ...Typography.sm,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    height: 160,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.xs,
  },
  chartLabel: {
    ...Typography.xs,
    color: Colors.neutral500,
  },
  medicationSection: {
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  medicationTitle: {
    ...Typography.base,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  doseDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  doseDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  doseDotTaken: {
    backgroundColor: Colors.success,
  },
  doseDotLate: {
    backgroundColor: Colors.warning,
  },
  doseDotMissed: {
    backgroundColor: Colors.neutral300,
  },
  doseLabel: {
    ...Typography.sm,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },
  expandButton: {
    marginTop: Spacing.xl,
  },
  shareButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
});