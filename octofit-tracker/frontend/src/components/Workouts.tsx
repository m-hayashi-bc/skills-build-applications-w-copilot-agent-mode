import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutRecord = { title?: string; reason?: string; focus?: string };

export default function Workouts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutRecord[] }>('/api/workouts/suggestions/mona@example.com')
      .then(({ suggestions }) => {
        if (!active) return;
        setItems((suggestions ?? []).map((suggestion) => ({ title: suggestion.title, reason: suggestion.reason, focus: suggestion.focus })));
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load suggestions.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    loading={loading}
    error={error}
    emptyText="No workout suggestions"
    items={items}
    renderItem={(suggestion) => {
      const title = typeof suggestion.title === 'string' ? suggestion.title : 'Workout';
      const reason = typeof suggestion.reason === 'string' ? suggestion.reason : undefined;
      return <div key={title}><strong>{title}</strong>{reason ? <span> — {reason}</span> : null}</div>;
    }}
  />;
}
