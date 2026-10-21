import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardRecord = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardRecord[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (!active) return;
        setItems((leaderboard ?? []).map((entry) => ({ teamName: entry.teamName, totalPoints: entry.totalPoints, rank: entry.rank })));
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load leaderboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    loading={loading}
    error={error}
    emptyText="No leaderboard"
    items={items}
    renderItem={(entry) => {
      const teamName = typeof entry.teamName === 'string' ? entry.teamName : 'Unknown team';
      const totalPoints = typeof entry.totalPoints === 'number' ? entry.totalPoints : 0;
      return <div key={teamName}><strong>{teamName}</strong> <span>{totalPoints}</span></div>;
    }}
  />;
}
