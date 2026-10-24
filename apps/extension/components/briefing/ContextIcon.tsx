import type { ContextItem } from '@briefing/contracts';

const paths: Record<ContextItem['kind'], string> = {
  concern: 'M12 3 2.8 20h18.4L12 3ZM12 9v5m0 3v.1',
  commitment: 'M8 5H5v16h14V5h-3M9 3h6v5H9zM8 14l3 3 5-6',
  goal: 'M12 3v3m0 12v3M3 12h3m12 0h3M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  preference: 'M4 7h16M4 17h16M9 4v6m6 4v6',
  communication_signal: 'M4 4h16v12h-9l-5 4v-4H4V4Zm4 5h8m-8 3h5',
};

export function ContextIcon({ kind }: { kind: ContextItem['kind'] }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]} /></svg>;
}
