(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var critical = style.getPropertyValue('--critical').trim();
  var high = style.getPropertyValue('--high').trim();
  var medium = style.getPropertyValue('--medium').trim();
  var low = style.getPropertyValue('--low').trim();

  // --- Chart 1: Pain Points Distribution ---
  var chart1 = echarts.init(document.getElementById('chart-painpoints'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['交互可达性\n(触控误触)', '就诊沟通\n(展示失败)', '服药锚点\n(药效判断)', '认知负担\n(记忆/焦虑)', '数据完整性\n(记录断裂)', '阈值预警\n(缺失)'],
      axisLabel: { color: muted, fontSize: 12 },
      axisLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'value',
      max: 8,
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: '提及人数',
        type: 'bar',
        barWidth: '50%',
        data: [
          { value: 6, itemStyle: { color: critical } },
          { value: 5, itemStyle: { color: critical } },
          { value: 5, itemStyle: { color: critical } },
          { value: 4, itemStyle: { color: high } },
          { value: 5, itemStyle: { color: critical } },
          { value: 3, itemStyle: { color: high } }
        ],
        label: { show: true, position: 'top', color: ink, fontWeight: 'bold' }
      }
    ]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart 2: Mental Models ---
  var chart2 = echarts.init(document.getElementById('chart-mental'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    legend: { bottom: 0, textStyle: { color: muted } },
    series: [
      {
        name: '心智模型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}/8', color: ink },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: [
          { value: 5, name: '证据链/打官司', itemStyle: { color: accent } },
          { value: 4, name: '翻译官', itemStyle: { color: accent2 } },
          { value: 4, name: '行车记录仪', itemStyle: { color: '#10b981' } },
          { value: 3, name: '体温计红线', itemStyle: { color: critical } },
          { value: 3, name: '天气预报', itemStyle: { color: '#8b5cf6' } },
          { value: 2, name: '血糖仪/血压计', itemStyle: { color: medium } }
        ]
      }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });

  // --- Chart 3: Edge Cases Risk Matrix ---
  var chart3 = echarts.init(document.getElementById('chart-edges'), null, { renderer: 'svg' });
  chart3.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: function(p) {
        return '<strong>' + p.data[3] + '</strong><br/>严重程度: ' + p.data[1] + '<br/>提及频次: ' + p.data[0] + '/8';
      }
    },
    grid: { left: '8%', right: '8%', bottom: '12%', top: '8%' },
    xAxis: {
      name: '提及频次（参与者数）',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      min: 0, max: 8,
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLabel: { color: muted }
    },
    yAxis: {
      name: '严重程度',
      type: 'category',
      data: ['低', '中', '高', '致命'],
      axisLabel: { color: muted, fontWeight: 'bold' },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        name: '边缘案例',
        type: 'scatter',
        symbolSize: function(val) { return val[2]; },
        data: [
          [4, 3, 32, '开关现象无法操作'],
          [3, 3, 28, '就诊紧张误操作'],
          [3, 3, 28, '药效波动提醒失效'],
          [4, 2, 24, '忘记标记/确认'],
          [2, 2, 20, '设备更换阈值丢失'],
          [2, 2, 20, '电量耗尽丢数据'],
          [1, 1, 18, '家属代操作混淆'],
          [1, 1, 18, '夜间异动误记']
        ],
        itemStyle: {
          color: function(p) {
            var sev = p.data[1];
            if (sev === 3) return critical;
            if (sev === 2) return high;
            if (sev === 1) return medium;
            return low;
          }
        },
        label: {
          show: true,
          formatter: function(p) { return p.data[3]; },
          position: 'right',
          fontSize: 11,
          color: ink
        }
      }
    ]
  });
  window.addEventListener('resize', function() { chart3.resize(); });
})();
