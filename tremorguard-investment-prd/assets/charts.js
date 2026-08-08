// TremorGuard Investment-Grade PRD — Charts
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  document.addEventListener('DOMContentLoaded', function() {

    // --- Chart 1: AI Capability Radar (chart-priority) ---
    var chartPriority = echarts.init(document.getElementById('chart-priority'), null, { renderer: 'svg' });
    var optionPriority = {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: [
          { name: '震颤识别精度', max: 100 },
          { name: '实时响应', max: 100 },
          { name: '数据覆盖率', max: 100 },
          { name: '临床可解释性', max: 100 },
          { name: '隐私保护', max: 100 },
          { name: '自适应性', max: 100 }
        ],
        shape: 'circle',
        center: ['50%', '50%'],
        radius: '60%',
        axisName: { color: ink, fontSize: 12 },
        splitArea: {
          areaStyle: { color: [accent + '05', accent + '10'] }
        }
      },
      series: [{
        type: 'radar',
        animation: false,
        data: [
          {
            value: [96, 92, 98, 88, 94, 85],
            name: 'Tier 1 MCU',
            areaStyle: { color: accent2 + '40' },
            lineStyle: { color: accent2, width: 2 },
            itemStyle: { color: accent2 }
          },
          {
            value: [94, 88, 95, 82, 90, 90],
            name: 'Tier 2 Phone',
            areaStyle: { color: accent + '40' },
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent }
          },
          {
            value: [90, 75, 92, 96, 70, 98],
            name: 'Tier 3 Cloud',
            areaStyle: { color: '#0e7490' + '40' },
            lineStyle: { color: '#0e7490', width: 2 },
            itemStyle: { color: '#0e7490' }
          }
        ]
      }]
    };
    chartPriority.setOption(optionPriority);
    window.addEventListener('resize', function() { chartPriority.resize(); });

    // --- Chart 2: Architecture Maturity (chart-architecture) ---
    var chartArch = echarts.init(document.getElementById('chart-architecture'), null, { renderer: 'svg' });
    var optionArch = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['技术成熟度'],
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 }
      },
      xAxis: {
        type: 'category',
        data: ['展示层\nReact Native', '应用层\nNode.js', '数据层\nPostgreSQL', 'AI 引擎\nONNX Runtime', '设备层\nBLE 5.0', '离线架构\nSQLite'],
        axisLabel: { color: ink, fontSize: 11, interval: 0 },
        axisLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value',
        name: '评分 (%)',
        max: 100,
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '18%',
        top: '5%',
        containLabel: true
      },
      series: [{
        name: '技术成熟度',
        type: 'bar',
        animation: false,
        barWidth: '30%',
        data: [
          { value: 95, itemStyle: { color: accent } },
          { value: 92, itemStyle: { color: accent2 } },
          { value: 90, itemStyle: { color: '#0e7490' } },
          { value: 88, itemStyle: { color: '#155e75' } },
          { value: 93, itemStyle: { color: accent } },
          { value: 96, itemStyle: { color: accent2 } }
        ],
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: ink,
          fontSize: 11
        }
      }]
    };
    chartArch.setOption(optionArch);
    window.addEventListener('resize', function() { chartArch.resize(); });

  });
})();