import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  items?: Array<Record<string, unknown>>;
  renderItem?: (item: Record<string, unknown>, index: number) => ReactNode;
};

export function CapabilityCard({
  title,
  description,
  loading = false,
  error = null,
  emptyText,
  items = [],
  renderItem,
}: Props) {
  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="alert">{error}</p></div></section>;
  }

  if (items.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p>{emptyText ?? `No ${title.toLowerCase()}`}</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><div>{items.map((item, index) => renderItem ? renderItem(item, index) : <div key={index}>{String(Object.values(item)[0] ?? '')}</div>)}</div></div></section>;
}
