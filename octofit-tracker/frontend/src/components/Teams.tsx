import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name?: string; members?: Array<string | { toString: () => string }> };

export default function Teams() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    let active = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then(({ teams }) => {
        if (!active) return;
        setItems((teams ?? []).map((team) => ({ name: team.name, members: team.members ?? [] })));
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load teams.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} emptyText="No teams" items={items} renderItem={(team) => <div key={String(team.name ?? 'team')}><strong>{String(team.name ?? 'Unknown team')}</strong> {Array.isArray(team.members) ? <span>({team.members.length} members)</span> : null}</div>} />;
}
