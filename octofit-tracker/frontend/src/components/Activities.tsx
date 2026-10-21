import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    let active = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then(({ activities }) => {
        if (!active) return;
        setItems((activities ?? []).map((activity) => ({ ...activity })));
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load activities.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    loading={loading}
    error={error}
    emptyText="No activities"
    items={items}
    renderItem={(activity) => {
      const type = typeof activity.type === 'string' ? activity.type : 'activity';
      const minutes = typeof activity.minutes === 'number' ? activity.minutes : 0;
      return <div key={`${type}-${Math.random()}`}><span>{type}</span> <span>({minutes} minutes)</span></div>;
    }}
  />;
}
