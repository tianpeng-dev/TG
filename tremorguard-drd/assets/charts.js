// TremorGuard DRD — Charts
// Framework comparison radar chart (3 schemes × 8 dimensions)
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#0f766e';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#0891b2';
  var accent3 = style.getPropertyValue('--accent3').trim() || '#d97706';
  var ink = style.getPropertyValue('--ink').trim() || '#1a1d23';
  var muted = style.getPropertyValue('--muted').trim() || '#6b7280';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#ffffff';

  var dom = document.getElementById('chart-framework-compare');
  if (!dom || typeof echarts === 'undefined') return;

  var chart = echarts.init(dom);

  // 8 evaluation dimensions (higher = better)
  // Scores derived from the qualitative comparison table in Section 6
  var indicators = [
    { name: '认知负荷\n(低=高分)', max: 10 },
    { name: '信息检索\n效率', max: 10 },
    { name: '震颤\n适配性', max: 10 },
    { name: '功能覆盖\n完整度', max: 10 },
    { name: '被动监测\n契合度', max: 10 },
    { name: '家属/照护者\n理解度', max: 10 },
    { name: '开发效率\n(低复杂=高分)', max: 10 },
    { name: '可扩展性', max: 10 },
  ];

  // 方案 A: 日历时间轴驱动 — high info retrieval & extensibility, mid cognitive load & tremor
  var schemeA = [4, 9, 5, 8, 5, 8, 6, 8];
  // 方案 B: 单屏状态聚焦 — best cognitive & dev simplicity, high tremor fit & passive monitoring
  var schemeB = [9, 6, 8, 6, 8, 8, 9, 6];
  // 方案 C: 对话式交互 — best tremor fit & passive monitoring, high extensibility, high dev complexity
  var schemeC = [8, 4, 10, 5, 10, 5, 4, 8];

  var option = {
    title: {
      text: '三方案八维度综合评分',
      left: 'center',
      top: 10,
      textStyle: {
        color: ink,
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: bg2,
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: ink, fontSize: 13 },
      formatter: function (params) {
        var labels = indicators.map(function (d) {
          return d.name.replace('\n', ' ');
        });
        var html = '<strong style="color:' + params.color + '">' + params.name + '</strong><br/>';
        for (var i = 0; i < params.value.length; i++) {
          html += labels[i] + ': <strong>' + params.value[i] + '</strong> / 10<br/>';
        }
        return html;
      },
    },
    legend: {
      data: ['方案 A：日历时间轴', '方案 B：单屏状态聚焦', '方案 C：对话式交互'],
      bottom: 5,
      left: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: muted, fontSize: 13 },
    },
    radar: {
      indicator: indicators,
      center: ['50%', '52%'],
      radius: '62%',
      splitNumber: 5,
      axisName: {
        color: muted,
        fontSize: 11,
        lineHeight: 14,
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          width: 1,
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(15,118,110,0.02)', 'rgba(15,118,110,0.04)', 'rgba(15,118,110,0.06)', 'rgba(15,118,110,0.08)', 'rgba(15,118,110,0.10)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#d1d5db',
        },
      },
    },
    series: [
      {
        name: '框架对比',
        type: 'radar',
        emphasis: {
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.35 },
        },
        data: [
          {
            value: schemeA,
            name: '方案 A：日历时间轴',
            itemStyle: { color: accent3 },
            lineStyle: { color: accent3, width: 2 },
            areaStyle: { color: accent3, opacity: 0.15 },
            symbol: 'circle',
            symbolSize: 6,
          },
          {
            value: schemeB,
            name: '方案 B：单屏状态聚焦',
            itemStyle: { color: accent },
            lineStyle: { color: accent, width: 2.5 },
            areaStyle: { color: accent, opacity: 0.2 },
            symbol: 'circle',
            symbolSize: 7,
          },
          {
            value: schemeC,
            name: '方案 C：对话式交互',
            itemStyle: { color: accent2 },
            lineStyle: { color: accent2, width: 2 },
            areaStyle: { color: accent2, opacity: 0.15 },
            symbol: 'circle',
            symbolSize: 6,
          },
        ],
      },
    ],
  };

  chart.setOption(option);

  // Responsive resize
  window.addEventListener('resize', function () {
    chart.resize();
  });
})();
