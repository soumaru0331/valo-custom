// src/components/HandicapBadge.tsx
import { HandicapItem } from '@/types';

interface Props {
  handicap: HandicapItem;
}

const STAR_COLORS: Record<1 | 2 | 3, string> = {
  1: 'text-green-400',
  2: 'text-yellow-400',
  3: 'text-red-400',
};

export function HandicapBadge({ handicap }: Props) {
  return (
    <div className="mt-2 bg-black/30 border border-white/10 rounded px-2 py-1 flex items-start gap-2">
      <span className={`font-bold flex-shrink-0 ${STAR_COLORS[handicap.star]}`}>
        {'★'.repeat(handicap.star)}
      </span>
      <span className="text-white text-sm">{handicap.description}</span>
    </div>
  );
}
