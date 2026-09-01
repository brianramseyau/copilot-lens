import type { Kpis, DailyPoint, RankedItem, UserRankedItem, DateRange, CostKpis, DailyCostPoint, ModelEfficiencyItem, DailyModelUsage, LanguageModelBreakdown, UserTokenPaymentBreakdown } from '../data/aggregate';
import type { ConcernItem } from '../components/ConcernPanel.svelte';

export interface ExportData {
  range: DateRange;
  kpis: Kpis;
  trend: DailyPoint[];
  models: RankedItem[];
  languages: RankedItem[];
  modelUsageByLanguage: LanguageModelBreakdown;
  features: RankedItem[];
  ides: RankedItem[];
  topUsers: UserRankedItem[];
  dailyModelUsage: DailyModelUsage;
  concerns: ConcernItem[];
  sourceSummary: string;
  costKpis?: CostKpis;
  costByModel?: RankedItem[];
  costByUser?: RankedItem[];
  tokenPaymentByUser?: UserTokenPaymentBreakdown[];
  costTrend?: DailyCostPoint[];
  costEfficiencyByModel?: ModelEfficiencyItem[];
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString();
}

function fmtShare(sharePct: number): string {
  return sharePct > 0 && sharePct < 0.1 ? '<0.1%' : `${sharePct.toFixed(1)}%`;
}

function kpiIconHtml(icon: string, label: string): string {
  if (!icon) return '';
  if (icon === 'rubber-duck') {
    return `<span class="kpi-icon" role="img" aria-label="${esc(label)} icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 13V8a5 5 0 0 1 10 0v1"/><path d="M19 8h3l-2.5 3H17"/><path d="M17 11c0 2.8 1.8 4 4 4 0 3-3.1 5-8 5H8a5 5 0 0 1-5-5v-2h6"/><circle cx="15" cy="6.5" r=".5" fill="currentColor"/></svg></span>`;
  }
  return `<span class="kpi-icon" role="img" aria-label="${esc(label)} icon"><i data-lucide="${esc(icon)}"></i></span>`;
}

function kpiCardHtml(label: string, value: string, sublabel = '', tone: 'default' | 'warning' | 'good' = 'default', icon = ''): string {
  return `<div class="kpi-card tone-${tone}">
    ${kpiIconHtml(icon, label)}
    <div class="kpi-label">${esc(label)}</div>
    <div class="kpi-value">${esc(value)}</div>
    ${sublabel ? `<div class="kpi-sublabel">${esc(sublabel)}</div>` : ''}
  </div>`;
}

const EXPORT_CSS = `
:root {
  color-scheme: light; --bg: #f4f6f9; --card-bg: #ffffff; --text-color: #1a1f2b; --muted-text: #667085;
  --border-color: #e2e5ea; --warning-bg: #fff4ed; --warning-border: #f4a259; --warning-text: #b45309; --good-text: #15803d;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.4;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text-color); }
main { max-width: 1180px; margin: 0 auto; padding: 1.5rem 1.5rem 3rem; }
.report-header { margin-bottom: 1.25rem; }
.report-header h1 { margin: 0 0 0.2rem; font-size: 1.5rem; }
.subtitle { margin: 0; color: var(--muted-text); font-size: 0.85rem; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem; }
.kpi-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.25rem; position: relative; }
.kpi-icon { position: absolute; top: 0.8rem; right: 0.9rem; display: grid; place-items: center; width: 22px; height: 22px; color: var(--muted-text); }
.kpi-icon svg { width: 22px; height: 22px; stroke-width: 2; }
.kpi-card:has(.kpi-icon) .kpi-label { padding-right: 1.8rem; }
.kpi-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted-text); }
.kpi-value { font-size: 1.65rem; font-weight: 700; line-height: 1.1; }
.kpi-sublabel { font-size: 0.75rem; color: var(--muted-text); }
.cost-model-pair, .cost-user-pair { display: grid; grid-column: span 2; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
.tone-warning { border-color: var(--warning-border); background: var(--warning-bg); }
.tone-warning .kpi-value { color: var(--warning-text); }
.tone-good .kpi-value { color: var(--good-text); }
.concern-panel { border: 1px solid var(--warning-border); background: var(--warning-bg); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
.concern-panel h2 { margin: 0 0 0.6rem; font-size: 0.95rem; color: var(--warning-text); }
.concern-panel ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.concern-panel li { display: flex; gap: 0.6rem; align-items: flex-start; }
.concern-panel strong { display: block; font-size: 0.85rem; }
.concern-panel p { margin: 0.15rem 0 0; font-size: 0.8rem; color: var(--muted-text); }
.charts-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.chart-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem 1.25rem; }
.chart-card.wide { grid-column: 1 / -1; }
.chart-card h3 { margin: 0 0 0.75rem; font-size: 0.9rem; }
.legend-note { font-weight: 400; font-size: 0.75rem; color: var(--muted-text); }
.chart-wrap { position: relative; width: 100%; }
.chart-scroll { overflow-x: auto; }
.empty { color: var(--muted-text); font-size: 0.85rem; }
.report-footer { margin-top: 1.5rem; font-size: 0.75rem; color: var(--muted-text); text-align: center; }
@media (max-width: 720px) { .two-col, .cost-model-pair, .cost-user-pair { grid-template-columns: 1fr; } .cost-model-pair, .cost-user-pair { grid-column: 1 / -1; } }
@media print {
  :root { --bg: #fff; }
  .kpi-card, .chart-card, .concern-panel { break-inside: avoid; }
}
`;

const EXPORT_JS = `
(function () {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  var textColor = '#334155';
  var gridColor = 'rgba(0,0,0,0.06)';
  var tooltipBg = '#1a1f2b';
  var weekendColor = 'rgba(220,38,38,0.09)';

  if (typeof Chart === 'undefined') {
    document.querySelectorAll('.chart-wrap').forEach(function (el) {
      el.innerHTML = '<p class="empty">Charts could not load (this file needs internet access once, to fetch Chart.js).</p>';
    });
    return;
  }

  var data = window.__REPORT_DATA__;

  function fmtDay(day) {
    return new Date(day + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  var weekendShading = {
    id: 'weekendShading',
    beforeDraw: function (chart) {
      var chartArea = chart.chartArea;
      if (!chartArea) return;
      var xScale = chart.scales.x;
      var labels = chart.data.labels || [];
      var colWidth = xScale.width / Math.max(labels.length, 1);
      var ctx = chart.ctx;
      ctx.save();
      labels.forEach(function (_l, i) {
        if (!data.trend[i] || !data.trend[i].weekend) return;
        var center = xScale.getPixelForValue(i);
        ctx.fillStyle = weekendColor;
        ctx.fillRect(center - colWidth / 2, chartArea.top, colWidth, chartArea.bottom - chartArea.top);
      });
      ctx.restore();
    },
  };

  new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels: data.trend.map(function (p) { return fmtDay(p.day); }),
      datasets: [
        { label: 'Interactions', data: data.trend.map(function (p) { return p.interactions; }), borderColor: '#2563eb', backgroundColor: '#2563eb', tension: 0.25, pointRadius: 3 },
        { label: 'Suggestions', data: data.trend.map(function (p) { return p.suggestions; }), borderColor: '#7c3aed', backgroundColor: '#7c3aed', tension: 0.25, pointRadius: 3 },
        { label: 'Acceptances', data: data.trend.map(function (p) { return p.acceptances; }), borderColor: '#059669', backgroundColor: '#059669', tension: 0.25, pointRadius: 3 },
      ].concat(
        data.costByDay
          ? [{ label: 'Cost ($)', data: data.trend.map(function (p) { return data.costByDay[p.day] || 0; }), borderColor: '#f59e0b', backgroundColor: '#f59e0b', borderDash: [6, 4], tension: 0.25, pointRadius: 2, yAxisID: 'y1' }]
          : [],
      ),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: textColor } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.dataset.label === 'Cost ($)' ? ' Cost: $' + ctx.parsed.y.toFixed(2) : ' ' + ctx.dataset.label + ': ' + ctx.parsed.y;
            },
          },
        },
      },
      scales: Object.assign(
        {
          x: { ticks: { maxRotation: 0, autoSkip: true, color: textColor }, grid: { color: gridColor } },
          y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
        },
        data.costByDay ? { y1: { position: 'right', beginAtZero: true, ticks: { color: textColor, callback: function (v) { return '$' + v; } }, grid: { drawOnChartArea: false } } } : {},
      ),
    },
    plugins: [weekendShading],
  });

  function rankChart(canvasId, items, color, unit, limit, prefix) {
    var top = items.slice(0, limit);
    new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: top.map(function (i) { return i.name; }),
        datasets: [{ data: top.map(function (i) { return i.count; }), backgroundColor: color, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#ffffff',
            bodyColor: '#e7e9ee',
            callbacks: {
              label: function (ctx) {
                var item = top[ctx.dataIndex];
                return ' ' + (prefix || '') + item.count.toLocaleString() + (unit ? ' ' + unit : '') + ' (' + item.sharePct.toFixed(1) + '%)';
              },
            },
          },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { display: false } },
        },
      },
    });
  }

  function efficiencyChart(canvasId, items, limit) {
    var top = items.slice(0, limit);
    new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: top.map(function (i) { return i.name; }),
        datasets: [{ data: top.map(function (i) { return i.costPerAcceptance; }), backgroundColor: '#f59e0b', borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#ffffff',
            bodyColor: '#e7e9ee',
            callbacks: {
              label: function (ctx) {
                var item = top[ctx.dataIndex];
                return ' $' + item.costPerAcceptance.toFixed(2) + ' per accepted suggestion \u00b7 $' + item.totalCost.toFixed(2) + ' total \u00b7 ' + item.acceptedCount.toLocaleString() + ' accepted';
              },
            },
          },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: textColor, callback: function (v) { return '$' + v; } }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { display: false } },
        },
      },
    });
  }

  function dailyModelChart(canvasId, usage) {
    var colors = ['#2563eb', '#7c3aed', '#16a34a', '#0891b2', '#d97706'];
    new Chart(document.getElementById(canvasId), {
      type: 'line',
      data: {
        labels: usage.days.map(fmtDay),
        datasets: usage.series.map(function (series, index) {
          return {
            label: series.name,
            data: series.percentages,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '55',
            fill: true,
            pointRadius: 1.5,
            tension: 0.2,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: textColor } },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#ffffff',
            bodyColor: '#e7e9ee',
            callbacks: {
              label: function (ctx) {
                var requests = usage.series[ctx.datasetIndex].requests[ctx.dataIndex] || 0;
                return ' ' + ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '% (' + requests.toLocaleString() + ' requests)';
              },
            },
          },
        },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true, color: textColor }, grid: { color: gridColor } },
          y: { stacked: true, min: 0, max: 100, ticks: { color: textColor, callback: function (v) { return v + '%'; } }, grid: { color: gridColor } },
        },
      },
    });
  }

  function languageCharts() {
    var colors = ['#fb923c', '#f59e0b', '#d97706', '#b45309', '#ea580c', '#f97316', '#fdba74', '#c2410c', '#a16207', '#fbbf24', '#92400e', '#fed7aa'];
    new Chart(document.getElementById('languagesChart'), {
      type: 'doughnut',
      data: {
        labels: data.languages.map(function (item) { return item.name; }),
        datasets: [{ data: data.languages.map(function (item) { return item.count; }), backgroundColor: data.languages.map(function (_item, index) { return colors[index % colors.length]; }), borderColor: '#ffffff', borderWidth: 2 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: textColor, boxWidth: 12 } },
          tooltip: { callbacks: { label: function (ctx) { var item = data.languages[ctx.dataIndex]; return ' ' + item.name + ': ' + item.sharePct.toFixed(1) + '% (' + item.count.toLocaleString() + ' generations)'; } } },
        },
      },
    });

    var breakdown = data.modelUsageByLanguage;
    new Chart(document.getElementById('modelsByLanguageChart'), {
      type: 'bar',
      data: {
        labels: breakdown.languages,
        datasets: breakdown.models.map(function (model, index) { return { label: model, data: breakdown.percentages[model], backgroundColor: colors[index % colors.length], borderWidth: 0 }; }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } },
          tooltip: { callbacks: { label: function (ctx) { var model = breakdown.models[ctx.datasetIndex]; var count = breakdown.counts[model][ctx.dataIndex] || 0; return ' ' + model + ': ' + ctx.parsed.y.toFixed(1) + '% (' + count.toLocaleString() + ' generations)'; } } },
        },
        scales: {
          x: { stacked: true, ticks: { color: textColor, maxRotation: 45 }, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { color: textColor, callback: function (v) { return v + '%'; } }, grid: { color: gridColor } },
        },
      },
    });
  }

  function tokenPaymentChart(canvasId, items) {
    new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: items.map(function (item) { return item.username; }),
        datasets: [
          { label: 'Included / discount-covered', data: items.map(function (item) { return item.includedTokens; }), backgroundColor: '#16a34a', borderRadius: 3 },
          { label: 'Extra paid', data: items.map(function (item) { return item.paidTokens; }), backgroundColor: '#dc2626', borderRadius: 3 },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: textColor } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var item = items[ctx.dataIndex];
                var value = ctx.datasetIndex === 0 ? item.includedTokens : item.paidTokens;
                var share = item.totalTokens > 0 ? value / item.totalTokens * 100 : 0;
                return ' ' + ctx.dataset.label + ': ' + value.toLocaleString() + ' tokens (' + share.toFixed(1) + '%)';
              },
              afterBody: function (contexts) {
                var item = items[contexts[0].dataIndex];
                return ['Total: ' + item.totalTokens.toLocaleString() + ' tokens', 'Extra paid cost: $' + item.paidCost.toFixed(2)];
              },
            },
          },
        },
        scales: {
          x: { stacked: true, beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Tokens', color: textColor } },
          y: { stacked: true, ticks: { color: textColor }, grid: { display: false } },
        },
      },
    });
  }

  rankChart('modelsChart', data.models, '#7c3aed', 'generations', 8);
  rankChart('featuresChart', data.features, '#2563eb', 'activity', 8);
  rankChart('idesChart', data.ides, '#0891b2', 'activity', 8);
  dailyModelChart('dailyModelsChart', data.dailyModelUsage);
  rankChart('usersChart', data.topUsers, '#059669', 'activity', 10);
  languageCharts();

  if (data.costByModel && document.getElementById('costModelsChart')) {
    rankChart('costModelsChart', data.costByModel, '#dc2626', '', 8, '$');
  }
  if (data.costByUser && document.getElementById('costUsersChart')) {
    rankChart('costUsersChart', data.costByUser, '#0d9488', '', 10, '$');
  }
  if (data.costEfficiencyByModel && document.getElementById('costEfficiencyChart')) {
    efficiencyChart('costEfficiencyChart', data.costEfficiencyByModel, 8);
  }
  if (data.tokenPaymentByUser && document.getElementById('tokenPaymentChart')) {
    tokenPaymentChart('tokenPaymentChart', data.tokenPaymentByUser);
  }
})();
`;

/** Builds a self-contained HTML document (Chart.js loaded from CDN) that reproduces the current report as a static, interactive snapshot. */
export function buildStandaloneHtml(d: ExportData): string {
  const kpiCards = [
    kpiCardHtml('Active Users', `${d.kpis.activeUsers} / ${d.kpis.totalUsers}`, 'users with activity in range', 'default', 'users'),
    kpiCardHtml(
      'Agent Adoption',
      `${d.kpis.agentAdoptionRate.toFixed(0)}%`,
      `${d.kpis.agentUsers} of ${d.kpis.activeUsers} active users used agent features`,
      'default',
      'bot',
    ),
    kpiCardHtml('Non-Agent Chat Adoption', `${d.kpis.chatAdoptionRate.toFixed(0)}%`, `${d.kpis.chatUsers} of ${d.kpis.activeUsers} active users used Ask, Plan, Custom, or Inline chat`, 'default', 'messages-square'),
    kpiCardHtml('CLI Adoption', `${d.kpis.cliAdoptionRate.toFixed(0)}%`, `${d.kpis.cliUsers} of ${d.kpis.activeUsers} active users used CLI`, 'default', 'terminal'),
    kpiCardHtml('Average Activity / User', fmtNum(d.kpis.averageActivityPerActiveUser), 'interactions + generations per active user', 'default', 'activity'),
    kpiCardHtml('Active Days', `${d.kpis.activeDays} / ${d.kpis.totalDaysInRange}`, 'calendar days with recorded activity', 'default', 'calendar-check-2'),
    kpiCardHtml('Total Interactions', fmtNum(d.kpis.totalInteractions), 'user-initiated interactions', 'default', 'message-square'),
    kpiCardHtml('Suggestions Generated', fmtNum(d.kpis.totalSuggestions), '', 'default', 'sparkles'),
    kpiCardHtml('Suggestions Accepted', fmtNum(d.kpis.totalAcceptances), '', 'default', 'circle-check-big'),
    kpiCardHtml(
      'Acceptance Rate',
      `${d.kpis.acceptanceRate.toFixed(1)}%`,
      '',
      d.kpis.totalSuggestions > 0 && d.kpis.acceptanceRate < 20 ? 'warning' : 'good',
      'gauge',
    ),
    kpiCardHtml('Net LOC Added', fmtNum(d.kpis.totalLocAdded), '', 'default', 'code-xml'),
    kpiCardHtml('Net LOC Deleted', fmtNum(d.kpis.totalLocDeleted), '', 'default', 'trash-2'),
    kpiCardHtml(
      'Weekend Activity Share',
      `${d.kpis.weekendSharePct.toFixed(1)}%`,
      'of total activity',
      d.kpis.weekendConcern ? 'warning' : 'default',
      'calendar-days',
    ),
    kpiCardHtml(
      'Most Used Model',
      d.kpis.topModel?.name ?? '—',
      d.kpis.topModel ? `${d.kpis.topModel.sharePct.toFixed(1)}% of model activity` : '',
      'default',
      'cpu',
    ),
    kpiCardHtml(
      'Most Used Feature',
      d.kpis.topFeature?.name ?? '—',
      d.kpis.topFeature ? `${d.kpis.topFeature.sharePct.toFixed(1)}% of feature activity` : '',
      'default',
      'zap',
    ),
  ].join('\n');

  const costKpiCards = d.costKpis
    ? [
        kpiCardHtml('Total AI Cost', `$${d.costKpis.totalNetCost.toFixed(2)}`, 'net spend in range', 'default', 'dollar-sign'),
        kpiCardHtml('Gross AI Cost', `$${d.costKpis.totalGrossCost.toFixed(2)}`, `$${d.costKpis.totalDiscount.toFixed(2)} discounted`, 'default', 'receipt-text'),
        kpiCardHtml('AI Credits Consumed', fmtNum(d.costKpis.totalCreditsUsed), 'ai-credits', 'default', 'coins'),
        kpiCardHtml('Discount Coverage', `${d.costKpis.discountCoverageRate.toFixed(1)}%`, `$${d.costKpis.totalDiscount.toFixed(2)} of gross cost covered`, 'default', 'percent'),
        kpiCardHtml(
          'Cost / Recorded Acceptance',
          `$${(d.kpis.totalAcceptances > 0 ? d.costKpis.totalNetCost / d.kpis.totalAcceptances : 0).toFixed(3)}`,
          'directional proxy; includes non-acceptance activity',
          'default',
          'badge-percent',
        ),
        `<div class="cost-model-pair">${kpiCardHtml(
          'Highest Cost Model',
          d.costKpis.topModelByCost?.name ?? '—',
          d.costKpis.topModelByCost ? `$${d.costKpis.topModelByCost.cost.toFixed(2)} · ${fmtShare(d.costKpis.topModelByCost.sharePct)}` : '',
          'default',
          'trending-up',
        )}${kpiCardHtml(
          'Lowest Cost Model',
          d.costKpis.lowestModelByCost?.name ?? '—',
          d.costKpis.lowestModelByCost ? `$${d.costKpis.lowestModelByCost.cost.toFixed(2)} · ${fmtShare(d.costKpis.lowestModelByCost.sharePct)}` : '',
          'default',
          'trending-down',
        )}</div>`,
        `<div class="cost-user-pair">${kpiCardHtml(
          'Highest Cost User',
          d.costKpis.topUserByCost?.name ?? '—',
          d.costKpis.topUserByCost ? `$${d.costKpis.topUserByCost.cost.toFixed(2)} · ${d.costKpis.topUserByCost.sharePct.toFixed(1)}%` : '',
          'default',
          'trophy',
        )}${kpiCardHtml(
          'Lowest Cost User',
          d.costKpis.lowestUserByCost?.name ?? '—',
          d.costKpis.lowestUserByCost ? `$${d.costKpis.lowestUserByCost.cost.toFixed(2)} · ${d.costKpis.lowestUserByCost.sharePct.toFixed(1)}%` : '',
          'default',
          'rubber-duck',
        )}</div>`,
        kpiCardHtml(
          'Cost per Active User',
          `$${(d.kpis.activeUsers > 0 ? d.costKpis.totalNetCost / d.kpis.activeUsers : 0).toFixed(2)}`,
          'net cost ÷ active users',
          'default',
          'user-round-check',
        ),
      ].join('\n')
    : '';

  const costSectionHtml = d.costKpis
    ? `<section class="kpi-grid">${costKpiCards}</section>
  <section class="charts-grid">
    <div class="two-col">
      <div class="chart-card"><h3>Cost by Model</h3><div class="chart-wrap" style="height:280px"><canvas id="costModelsChart"></canvas></div></div>
      <div class="chart-card"><h3>Cost by User</h3><div class="chart-wrap" style="height:280px"><canvas id="costUsersChart"></canvas></div></div>
    </div>
    <div class="chart-card wide"><h3>Included vs Extra-Paid Token Usage per User</h3><p class="legend-note">Tokens are allocated proportionally using each cost row's discount-covered and net-paid amounts; this is an estimate because the export does not tag individual tokens.</p><div class="chart-wrap" style="height:${Math.max(320, (d.tokenPaymentByUser?.length ?? 0) * 32)}px"><canvas id="tokenPaymentChart"></canvas></div></div>
    <div class="chart-card"><h3>Cost / Recorded Acceptance by Model (Proxy)</h3><p class="legend-note">Cost includes chat and agent activity that may not create an acceptance event.</p><div class="chart-wrap" style="height:280px"><canvas id="costEfficiencyChart"></canvas></div></div>
  </section>`
    : '';

  const concernsHtml = d.concerns.length
    ? `<section class="concern-panel"><h2>Areas of Concern</h2><ul>${d.concerns
        .map(
          (c) =>
            `<li><span>${c.severity === 'warning' ? '⚠' : 'ℹ'}</span><div><strong>${esc(c.title)}</strong><p>${esc(c.detail)}</p></div></li>`,
        )
        .join('')}</ul></section>`
    : '';

  const dataScript = `window.__REPORT_DATA__ = ${JSON.stringify({
    trend: d.trend,
    models: d.models,
    languages: d.languages,
    modelUsageByLanguage: d.modelUsageByLanguage,
    features: d.features,
    ides: d.ides,
    topUsers: d.topUsers,
    dailyModelUsage: d.dailyModelUsage,
    costByModel: d.costByModel,
    costByUser: d.costByUser,
    tokenPaymentByUser: d.tokenPaymentByUser,
    costEfficiencyByModel: d.costEfficiencyByModel,
    costByDay: d.costTrend ? Object.fromEntries(d.costTrend.map((p) => [p.date, p.cost])) : undefined,
  })};`;

  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>GitHub Copilot Usage Report — ${esc(d.range.start)} to ${esc(d.range.end)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.min.js"><\/script>
<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"><\/script>
<style>${EXPORT_CSS}</style>
</head>
<body>
<main>
  <header class="report-header">
    <h1>GitHub Copilot Usage Report</h1>
    <p class="subtitle">${esc(d.range.start)} → ${esc(d.range.end)} · ${d.kpis.activeUsers} of ${d.kpis.totalUsers} seats active · generated ${esc(new Date().toLocaleString())}</p>
  </header>

  ${concernsHtml}

  <section class="kpi-grid">
    ${kpiCards}
  </section>

  <section class="charts-grid">
    <div class="chart-card wide">
      <h3>Daily Activity Trend <span class="legend-note">(red shading = weekend)</span></h3>
      <div class="chart-wrap" style="height:320px"><canvas id="trendChart"></canvas></div>
    </div>
    <div class="two-col">
      <div class="chart-card"><h3>Model Usage</h3><div class="chart-wrap" style="height:280px"><canvas id="modelsChart"></canvas></div></div>
      <div class="chart-card"><h3>Feature Usage</h3><div class="chart-wrap" style="height:280px"><canvas id="featuresChart"></canvas></div></div>
    </div>
    <div class="chart-card wide"><h3>IDE Usage</h3><div class="chart-wrap" style="height:280px"><canvas id="idesChart"></canvas></div></div>
    <div class="chart-card wide"><h3>Model Usage per Day</h3><p class="legend-note">Daily share of model requests across chat modes, excluding code completions.</p><div class="chart-wrap" style="height:320px"><canvas id="dailyModelsChart"></canvas></div></div>
    <div class="chart-card wide"><h3>Top Users</h3><div class="chart-wrap" style="height:360px"><canvas id="usersChart"></canvas></div></div>
  </section>

  ${costSectionHtml}

  <section class="charts-grid">
    <div class="chart-card wide"><h3>Language Usage</h3><p class="legend-note">Distribution of all languages represented in model generation activity.</p><div class="chart-wrap" style="height:${Math.max(360, d.languages.length * 18)}px"><canvas id="languagesChart"></canvas></div></div>
    <div class="chart-card wide"><h3>Model Usage per Language</h3><p class="legend-note">Share of all generation activity by language and model; every language and model is shown.</p><div class="chart-scroll"><div style="min-width:${Math.max(760, d.modelUsageByLanguage.languages.length * 92)}px"><div class="chart-wrap" style="height:${Math.max(360, d.modelUsageByLanguage.models.length * 20)}px"><canvas id="modelsByLanguageChart"></canvas></div></div></div></div>
  </section>

  <footer class="report-footer">
    <p>Exported snapshot from the GitHub Copilot Usage Report app · ${esc(d.sourceSummary)}. Charts are interactive (hover for exact values); this file does not update with new data.</p>
  </footer>
</main>
<script>${dataScript}<\/script>
<script>${EXPORT_JS}<\/script>
</body>
</html>`;
}
