// src/components/StepBar.tsx

export type AppStep = 'input' | 'mode' | 'result' | 'ban';

interface Props {
  current: AppStep;
}

const STEPS: { key: AppStep; label: string }[] = [
  { key: 'input',  label: 'プレイヤー追加' },
  { key: 'mode',   label: 'モード選択' },
  { key: 'result', label: 'チーム結果' },
  { key: 'ban',    label: 'BANフェーズ' },
];

const STEP_ORDER: AppStep[] = ['input', 'mode', 'result', 'ban'];

export function StepBar({ current }: Props) {
  const currentIdx = STEP_ORDER.indexOf(current);

  return (
    <div className="flex w-full mb-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider overflow-hidden">
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        const isLast = idx === STEPS.length - 1;
        const isFirst = idx === 0;

        const bg = active
          ? 'bg-red-500 text-white'
          : done
          ? 'bg-[#1a2530] text-[#768079]'
          : 'bg-[#0d151d] text-[#3a4050]';

        const clipPath = isFirst && isLast
          ? undefined
          : isFirst
          ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
          : isLast
          ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)'
          : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)';

        return (
          <div
            key={step.key}
            className={`flex-1 flex items-center justify-center py-2.5 gap-1 transition-colors ${bg}`}
            style={clipPath ? { clipPath } : undefined}
          >
            <span className={`flex-shrink-0 ${done ? 'text-green-400' : ''}`}>
              {done ? '✓' : `${idx + 1}`}
            </span>
            <span className="hidden sm:inline truncate">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
