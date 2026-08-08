/**
 * 报告列表页
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Sizes, Shadows } from '@tremorguard/ui-theme';
import { TopNav, Card, ShareIcon } from '../../shared/components';
import { RootStackParamList } from '../../navigation';

type ReportType = '全部' | '日报' | '周报' | '复诊报告';

interface Report {
  id: string;
  date: string;
  type: ReportType;
  summary: string;
}

const MOCK_REPORTS: Report[] = [
  { id: '1', date: '7 月 24 日', type: '日报', summary: '震颤强度较昨日下降 12%，整体状态平稳' },
  { id: '2', date: '7 月 23 日', type: '日报', summary: '下午震颤频率增加，建议关注用药时间' },
  { id: '3', date: '7 月 21 日', type: '周报', summary: '本周震颤平均强度下降 8%，用药依从率 93%' },
  { id: '4', date: '7 月 20 日', type: '日报', summary: '运动功能评分较上周提升，步态稳定性改善' },
  { id: '5', date: '7 月 15 日', type: '复诊报告', summary: '复诊评估：UPDRS 评分 28，较上次下降 3 分' },
];

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export const ReportsScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ReportType>('全部');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const navigation = useNavigation<NavigationProp>();

  const filteredReports = activeFilter === '全部'
    ? MOCK_REPORTS
    : MOCK_REPORTS.filter(r => r.type === activeFilter);

  const handleReportPress = (reportId: string) => {
    navigation.navigate('ReportDetail', { reportId });
  };

  return (
    <View style={styles.container}>
      <TopNav title="我的报告" />

      {/* 筛选标签 */}
      <ScrollView
        horizontal
        style={[styles.filterBar, isDesktop && styles.filterBarDesktop]}
        contentContainerStyle={styles.filterBarContent}
        showsHorizontalScrollIndicator={false}
      >
        {(['全部', '日报', '周报', '复诊报告'] as ReportType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, activeFilter === type && styles.filterTabActive]}
            onPress={() => setActiveFilter(type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabLabel, activeFilter === type && styles.filterTabLabelActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 报告列表 */}
      <ScrollView
        style={[styles.content, isDesktop && styles.contentDesktop]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredReports.map((report) => (
          <ReportCard key={report.id} report={report} onPress={() => handleReportPress(report.id)} />
        ))}
      </ScrollView>
    </View>
  );
};

// 报告卡片组件
const ReportCard: React.FC<{ report: Report; onPress: () => void }> = ({ report, onPress }) => {
  const getBadgeStyle = (type: ReportType) => {
    switch (type) {
      case '周报':
        return { bg: Colors.infoLight, text: Colors.info };
      case '复诊报告':
        return { bg: Colors.successLight, text: Colors.success };
      default:
        return { bg: Colors.msgSystem, text: Colors.primary };
    }
  };

  const badgeStyle = getBadgeStyle(report.type);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.reportCard} shadow="sm">
        <View style={styles.reportCardContent}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportDate}>{report.date}</Text>
            <View style={[styles.typeBadge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.typeBadgeText, { color: badgeStyle.text }]}>{report.type}</Text>
            </View>
          </View>
          <Text style={styles.reportSummary} numberOfLines={2}>
            {report.summary}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
          <ShareIcon size={22} color={Colors.neutral400} />
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBar: {
    backgroundColor: Colors.card,
  },
  filterBarDesktop: {
    marginLeft: Sizes.bottomNavWidthDesktop,
    maxWidth: 648,
  },
  filterBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.muted,
    minHeight: Sizes.minTouchTarget,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabLabel: {
    ...Typography.sm,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  filterTabLabelActive: {
    color: Colors.primaryForeground,
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
    paddingBottom: Sizes.bottomNavHeight + Spacing.lg,
    gap: Spacing.md,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  reportCardContent: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  reportDate: {
    ...Typography.sm,
    fontWeight: '500',
    color: Colors.foreground,
  },
  typeBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    ...Typography.xs,
    fontWeight: '500',
  },
  reportSummary: {
    ...Typography.base,
    color: Colors.foreground,
    lineHeight: 27,
  },
  shareButton: {
    width: Sizes.minTouchTarget,
    height: Sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
});