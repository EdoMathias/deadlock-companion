import React, { useMemo, useState } from 'react';
import type { MatchPlayer } from '../matchMetadata.types';

interface ComparisonMetric {
  label: string;
  left: number;
  right: number;
}

function formatValue(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

interface ComparisonBarProps {
  metric: ComparisonMetric;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({ metric }) => {
  const total = metric.left + metric.right;
  const leftPct = total > 0 ? (metric.left / total) * 100 : 50;
  const rightPct = total > 0 ? (metric.right / total) * 100 : 50;

  return (
    <div className="team-comparison__row">
      <span className="team-comparison__value team-comparison__value--left">
        {formatValue(metric.left)}
      </span>
      <div className="team-comparison__bar-group">
        <div className="team-comparison__bar-track">
          <div
            className="team-comparison__bar-fill team-comparison__bar-fill--left"
            style={{ width: `${leftPct}%` }}
          />
          <div
            className="team-comparison__bar-fill team-comparison__bar-fill--right"
            style={{ width: `${rightPct}%` }}
          />
        </div>
        <span className="team-comparison__label">{metric.label}</span>
      </div>
      <span className="team-comparison__value team-comparison__value--right">
        {formatValue(metric.right)}
      </span>
    </div>
  );
};

interface TeamComparisonProps {
  team0: MatchPlayer[];
  team1: MatchPlayer[];
  teamAmberName?: string;
  teamSapphireName?: string;
}

const TeamComparison: React.FC<TeamComparisonProps> = ({ team0, team1, teamAmberName = 'Amber', teamSapphireName = 'Sapphire' }) => {
  const [collapsed, setCollapsed] = useState(false);

  const metrics = useMemo<ComparisonMetric[]>(() => {
    const sum = (players: MatchPlayer[], fn: (p: MatchPlayer) => number) =>
      players.reduce((acc, p) => acc + fn(p), 0);

    const lastDamage = (p: MatchPlayer) =>
      p.stats?.[p.stats.length - 1]?.player_damage ?? 0;
    const lastHealing = (p: MatchPlayer) =>
      p.stats?.[p.stats.length - 1]?.player_healing ?? 0;
    const lastSelfHealing = (p: MatchPlayer) =>
      p.stats?.[p.stats.length - 1]?.self_healing ?? 0;

    return [
      {
        label: 'Hero Damage',
        left: sum(team0, lastDamage),
        right: sum(team1, lastDamage),
      },
      {
        label: 'Healing',
        left: sum(team0, lastHealing),
        right: sum(team1, lastHealing),
      },
      {
        label: 'Self-Healing',
        left: sum(team0, lastSelfHealing),
        right: sum(team1, lastSelfHealing),
      },
      {
        label: 'Net Worth',
        left: sum(team0, (p) => p.net_worth),
        right: sum(team1, (p) => p.net_worth),
      },
      {
        label: 'Souls',
        left: sum(team0, (p) => p.last_hits),
        right: sum(team1, (p) => p.last_hits),
      },
      {
        label: 'Kills',
        left: sum(team0, (p) => p.kills),
        right: sum(team1, (p) => p.kills),
      },
      {
        label: 'Deaths',
        left: sum(team0, (p) => p.deaths),
        right: sum(team1, (p) => p.deaths),
      },
      {
        label: 'Assists',
        left: sum(team0, (p) => p.assists),
        right: sum(team1, (p) => p.assists),
      },
    ].filter((m) => m.left > 0 || m.right > 0);
  }, [team0, team1]);

  if (metrics.length === 0) return null;

  return (
    <div className="team-comparison">
      <button
        className="team-comparison__toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? '▼' : '▶'} Team Comparison
      </button>
      {collapsed && (
        <div className="team-comparison__content">
          <div className="team-comparison__header">
            <span className="team-comparison__team-name team-comparison__team-name--left">
              {teamAmberName}
            </span>
            <span className="team-comparison__team-name team-comparison__team-name--right">
              {teamSapphireName}
            </span>
          </div>
          {metrics.map((m) => (
            <ComparisonBar key={m.label} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamComparison;
