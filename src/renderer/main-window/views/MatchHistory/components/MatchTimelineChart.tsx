import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { MatchPlayer } from '../matchMetadata.types';
import { getHero } from '../../../../../shared/data/heroes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

type MetricKey = 'damage' | 'healing' | 'self_healing';

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'damage', label: 'Damage' },
  { key: 'healing', label: 'Healing' },
  { key: 'self_healing', label: 'Self-Healing' },
];

// Team colors — Amber warm tones, Sapphire cool tones
const TEAM_COLORS: Record<number, string[]> = {
  0: [
    'rgba(255, 170, 60, 1)',
    'rgba(255, 130, 50, 1)',
    'rgba(255, 200, 90, 1)',
    'rgba(230, 150, 40, 1)',
    'rgba(255, 220, 120, 1)',
    'rgba(200, 120, 30, 1)',
  ],
  1: [
    'rgba(80, 160, 255, 1)',
    'rgba(60, 130, 230, 1)',
    'rgba(120, 190, 255, 1)',
    'rgba(50, 110, 200, 1)',
    'rgba(150, 210, 255, 1)',
    'rgba(40, 90, 180, 1)',
  ],
};

function getStatValue(
  stat: { player_damage: number; player_healing: number; self_healing: number },
  metric: MetricKey,
): number {
  switch (metric) {
    case 'damage':
      return stat.player_damage;
    case 'healing':
      return stat.player_healing;
    case 'self_healing':
      return stat.self_healing;
  }
}

interface MatchTimelineChartProps {
  players: MatchPlayer[];
  durationS: number;
}

const MatchTimelineChart: React.FC<MatchTimelineChartProps> = ({
  players,
  durationS,
}) => {
  const [metric, setMetric] = useState<MetricKey>('damage');
  const [collapsed, setCollapsed] = useState(true);

  const chartData = useMemo(() => {
    // Collect all unique timestamps across all players
    const timestampSet = new Set<number>();
    for (const p of players) {
      for (const s of p.stats ?? []) {
        timestampSet.add(s.time_stamp_s);
      }
    }
    const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

    const labels = timestamps.map((t) => {
      const m = Math.floor(t / 60);
      return `${m}m`;
    });

    // Track color index per team
    const teamColorIdx: Record<number, number> = { 0: 0, 1: 0 };

    const datasets = players.map((p) => {
      const hero = getHero(p.hero_id);
      const heroName = hero?.name ?? `Hero ${p.hero_id}`;
      const colors = TEAM_COLORS[p.team] ?? TEAM_COLORS[0];
      const colorIdx = teamColorIdx[p.team] ?? 0;
      teamColorIdx[p.team] = colorIdx + 1;
      const color = colors[colorIdx % colors.length];

      // Build a map for fast timestamp lookup
      const statMap = new Map<number, (typeof p.stats)[number]>();
      for (const s of p.stats ?? []) {
        statMap.set(s.time_stamp_s, s);
      }

      const data = timestamps.map((t) => {
        const stat = statMap.get(t);
        return stat ? getStatValue(stat, metric) : null;
      });

      return {
        label: heroName,
        data,
        borderColor: color,
        backgroundColor: color.replace(', 1)', ', 0.1)'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        spanGaps: true,
      };
    });

    return { labels, datasets };
  }, [players, metric]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: 'rgba(255,255,255,0.7)',
            font: { size: 10 },
            boxWidth: 12,
            padding: 8,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(20,20,30,0.95)',
          titleColor: 'rgba(255,255,255,0.9)',
          bodyColor: 'rgba(255,255,255,0.8)',
          bodyFont: { size: 11 },
          callbacks: {
            label: (ctx: {
              dataset: { label?: string };
              parsed: { y: number | null };
            }) => {
              const val = ctx.parsed.y;
              if (val == null) return '';
              const formatted =
                val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val);
              return `${ctx.dataset.label}: ${formatted}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            font: { size: 10 },
            callback: (val: string | number) => {
              const n = typeof val === 'string' ? parseFloat(val) : val;
              return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
            },
          },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
      },
    }),
    [],
  );

  // Don't render if no player has stats
  const hasStats = players.some((p) => p.stats && p.stats.length > 0);
  if (!hasStats) return null;

  return (
    <div className="match-timeline">
      <button
        className="match-timeline__toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? '▶' : '▼'} Performance Timeline
      </button>
      {!collapsed && (
        <div className="match-timeline__content">
          <div className="match-timeline__controls">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`match-timeline__metric-btn${metric === opt.key ? ' match-timeline__metric-btn--active' : ''}`}
                onClick={() => setMetric(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="match-timeline__chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchTimelineChart;
