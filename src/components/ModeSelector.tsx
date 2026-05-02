'use client';
import { TeamMode } from '@/types';

interface ModeCardProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function ModeCard({ title, description, selected, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`valo-panel text-left w-full transition-colors duration-150 ${
        selected ? 'border-red-500' : 'hover:border-gray-500'
      }`}
    >
      <p className="font-bold text-white uppercase tracking-wider">{title}</p>
      <p className="text-[#768079] text-sm mt-1">{description}</p>
    </button>
  );
}

interface Props {
  selected: TeamMode;
  onSelect: (mode: TeamMode) => void;
  onConfirm: () => void;
}

const MODES: { mode: TeamMode; title: string; description: string }[] = [
  {
    mode: 'simple',
    title: 'シンプル',
    description: 'ランクとパフォーマンスで最も均等なチームに分割',
  },
  {
    mode: 'handicap',
    title: 'ハンデあり',
    description: '均等分割後、強いプレイヤーにハンデを付与',
  },
  {
    mode: 'no-repeat-simple',
    title: '前回被り少なめ',
    description: '前回同チームだった人が別チームになるよう考慮',
  },
  {
    mode: 'no-repeat-handicap',
    title: '前回被り少なめ + ハンデ',
    description: '前回被り考慮 + 強いプレイヤーにハンデ付与',
  },
];

export function ModeSelector({ selected, onSelect, onConfirm }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        チーム分けモード
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODES.map(({ mode, title, description }) => (
          <ModeCard
            key={mode}
            title={title}
            description={description}
            selected={selected === mode}
            onClick={() => onSelect(mode)}
          />
        ))}
      </div>
      <button className="valo-btn w-full" onClick={onConfirm}>
        チーム分け実行 →
      </button>
    </div>
  );
}
