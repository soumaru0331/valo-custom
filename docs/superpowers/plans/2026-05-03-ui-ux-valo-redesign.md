# VALOCUSTOM UI/UX & VALO要素強化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プレイヤー入力の使いやすさ改善（フィールド分割・一括追加・スケルトン）とVALORANT公式風ビジュアル強化（ステップバー・ランクボーダー・ロール別BAN）を実装する。

**Architecture:** 既存コンポーネントを修正・拡張する方針。新規ファイルは `StepBar.tsx` のみ。CSSアニメーション基盤を `globals.css` に追加し、各コンポーネントから参照する。

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, valorant-api.com（エージェントロール取得）

---

## ファイル変更一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/app/globals.css` | 修正 | スケルトンアニメーション・斜線背景パターン追加 |
| `src/components/StepBar.tsx` | 新規作成 | 4ステップ進捗バー |
| `src/app/page.tsx` | 修正 | StepBar統合・ヘッダー強化 |
| `src/components/PlayerInputForm.tsx` | 修正 | フィールド分割・一括追加・スケルトンローディング |
| `src/components/PlayerCard.tsx` | 修正 | ランク帯ボーダーカラー・サブ垢バッジ強化 |
| `src/components/TeamResultView.tsx` | 修正 | チームカラー強化・KD/WR表示追加 |
| `src/components/BanPhase.tsx` | 修正 | ロール別グループ・BANエフェクト・ターン表示強化 |

---

## Task 1: globals.css にスケルトンアニメーションと斜線背景を追加

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: globals.css を開いて末尾に追加**

`src/app/globals.css` の末尾（`}` の後）に以下を追加する：

```css
/* スケルトンローディングアニメーション */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

.skeleton {
  background-color: #2a3540;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* VALO風斜線背景パターン */
.valo-diagonal-bg {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 10px,
    rgba(255, 70, 85, 0.03) 10px,
    rgba(255, 70, 85, 0.03) 11px
  );
}
```

- [ ] **Step 2: ビルドエラーがないか確認**

```bash
cd "C:\Users\solar\OneDrive\デスクトップ\valo bot"
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし（`__tests__` 以外）

- [ ] **Step 3: コミット**

```bash
git add src/app/globals.css
git commit -m "style: add skeleton animation and diagonal bg pattern"
```

---

## Task 2: StepBar コンポーネントを新規作成

**Files:**
- Create: `src/components/StepBar.tsx`

- [ ] **Step 1: StepBar.tsx を作成**

```tsx
// src/components/StepBar.tsx
import { AppStep } from '@/app/page';

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
```

- [ ] **Step 2: `AppStep` 型を `page.tsx` からエクスポートされるか確認**

`src/app/page.tsx` を開いて `type AppStep` の行を確認する。現在は:
```typescript
type AppStep = 'input' | 'mode' | 'result' | 'ban';
```
これを `export` に変更する必要がある（次のタスクで行う）。

- [ ] **Step 3: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: `AppStep` が未エクスポートのためエラーが出る（次タスクで修正）

- [ ] **Step 4: コミット**

```bash
git add src/components/StepBar.tsx
git commit -m "feat: add StepBar component"
```

---

## Task 3: page.tsx に StepBar 統合・AppStep エクスポート・ヘッダー強化

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx の `type AppStep` を export に変更し StepBar を import**

`src/app/page.tsx` の先頭を以下に書き換える：

```tsx
'use client';
import { useState } from 'react';
import { PlayerData, TeamMode, TeamResult, TeamResultWithHandicaps } from '@/types';
import { balanceTeams } from '@/lib/team-balancer';
import { assignHandicaps } from '@/lib/handicap';
import { loadHistory, saveHistory } from '@/lib/history';
import { PlayerInputForm } from '@/components/PlayerInputForm';
import { ModeSelector } from '@/components/ModeSelector';
import { TeamResultView } from '@/components/TeamResultView';
import { BanPhase } from '@/components/BanPhase';
import { AgentDecorations } from '@/components/AgentDecorations';
import { StepBar } from '@/components/StepBar';

export type AppStep = 'input' | 'mode' | 'result' | 'ban';
```

- [ ] **Step 2: return 内のヘッダーと StepBar を書き換える**

`return (` から `</main>` までを以下に置き換える：

```tsx
  return (
    <>
      <AgentDecorations />
      <main className="min-h-screen bg-[#0F1923] p-4 max-w-2xl mx-auto relative" style={{ zIndex: 1 }}>

        {/* ヘッダー */}
        <div className="mb-6 pt-4 valo-diagonal-bg border-b border-red-500/40 pb-4">
          <h1 className="text-5xl font-black uppercase tracking-widest text-white leading-none">
            VALO<span className="text-red-500">CUSTOM</span>
          </h1>
          <p className="text-[#768079] text-sm mt-1">カスタムマッチ チームバランサー</p>
        </div>

        {/* ステップバー */}
        <StepBar current={step} />

        {step === 'input' && (
          <PlayerInputForm
            players={players}
            onPlayersChange={setPlayers}
            onNext={() => setStep('mode')}
          />
        )}

        {step === 'mode' && (
          <div className="space-y-4">
            <button
              className="text-[#768079] text-sm hover:text-white"
              onClick={() => setStep('input')}
            >
              ← プレイヤー編集に戻る
            </button>
            <ModeSelector
              selected={mode}
              onSelect={setMode}
              onConfirm={handleRunBalance}
            />
          </div>
        )}

        {step === 'result' && resultWithHandicaps && (
          <TeamResultView
            result={resultWithHandicaps}
            onSaveAndBan={handleSaveAndBan}
            onReshuffle={handleRunBalance}
            onBack={() => setStep('mode')}
            bansPerTeam={bansPerTeam}
            onBansPerTeamChange={setBansPerTeam}
          />
        )}

        {step === 'ban' && resultWithHandicaps && (
          <BanPhase
            result={resultWithHandicaps}
            bansPerTeam={bansPerTeam}
            onComplete={() => setStep('input')}
          />
        )}
      </main>
    </>
  );
```

- [ ] **Step 3: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate StepBar and enhance header"
```

---

## Task 4: PlayerInputForm をリファクタリング（フィールド分割・一括追加・スケルトン）

**Files:**
- Modify: `src/components/PlayerInputForm.tsx`

- [ ] **Step 1: PlayerInputForm.tsx を全体置き換え**

`src/components/PlayerInputForm.tsx` を以下に置き換える：

```tsx
'use client';
import { useState, useRef } from 'react';
import { PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcTotalScore } from '@/lib/scoring';
import { PlayerCard } from './PlayerCard';

interface Props {
  players: PlayerData[];
  onPlayersChange: (players: PlayerData[]) => void;
  onNext: () => void;
}

function SkeletonCard() {
  return (
    <div className="valo-panel flex items-center gap-3 h-[72px]">
      <div className="skeleton w-10 h-10 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );
}

export function PlayerInputForm({ players, onPlayersChange, onNext }: Props) {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkProgress, setBulkProgress] = useState('');
  const tagRef = useRef<HTMLInputElement>(null);

  async function fetchPlayer(name: string, tag: string): Promise<PlayerData> {
    const res = await fetch('/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName: name, tagLine: tag }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました');
    return data as PlayerData;
  }

  async function handleAdd() {
    const name = gameName.trim();
    const tag = tagLine.trim();
    if (!name) { setError('プレイヤー名を入力してください'); return; }
    if (!tag)  { setError('タグを入力してください'); return; }
    if (players.length >= 10) { setError('最大10人まで追加できます'); return; }
    if (players.some(p => p.gameName === name && p.tagLine === tag)) {
      setError('このプレイヤーは既に追加されています');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const player = await fetchPlayer(name, tag);
      onPlayersChange([...players, player]);
      setGameName('');
      setTagLine('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkAdd() {
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.includes('#'));

    if (lines.length === 0) {
      setError('名前#タグ の形式で入力してください');
      return;
    }

    const errors: string[] = [];
    let current = [...players];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hashIdx = line.indexOf('#');
      const name = line.slice(0, hashIdx).trim();
      const tag = line.slice(hashIdx + 1).trim();

      if (!name || !tag) { errors.push(`${line}: 形式エラー`); continue; }
      if (current.length >= 10) { errors.push(`${line}: 上限10人に達しました`); break; }
      if (current.some(p => p.gameName === name && p.tagLine === tag)) {
        errors.push(`${line}: 既に追加済み`);
        continue;
      }

      setBulkProgress(`${i + 1}/${lines.length} 取得中...`);
      try {
        const player = await fetchPlayer(name, tag);
        current = [...current, player];
        onPlayersChange(current);
      } catch (err: unknown) {
        errors.push(`${line}: ${err instanceof Error ? err.message : 'エラー'}`);
      }
    }

    setBulkProgress('');
    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
      setBulkText('');
      setBulkOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        プレイヤー追加
        <span className="text-[#768079] text-base ml-2 normal-case tracking-normal font-normal">
          ({players.length}/10)
        </span>
      </h2>

      {/* 通常入力 */}
      <div className="flex gap-2">
        <input
          className="valo-input flex-1"
          placeholder="プレイヤー名"
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tagRef.current?.focus()}
          disabled={loading}
        />
        <div className="flex items-center text-[#768079] font-bold select-none">#</div>
        <input
          ref={tagRef}
          className="valo-input w-24"
          placeholder="タグ"
          value={tagLine}
          onChange={e => setTagLine(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdd()}
          disabled={loading}
        />
        <button
          className="valo-btn"
          onClick={handleAdd}
          disabled={loading || players.length >= 10}
        >
          {loading ? '取得中' : '追加'}
        </button>
      </div>

      {/* まとめて追加 */}
      <button
        className="text-[#768079] text-xs hover:text-white underline"
        onClick={() => { setBulkOpen(v => !v); setError(''); }}
      >
        {bulkOpen ? '▲ 閉じる' : '▼ まとめて追加（複数人）'}
      </button>

      {bulkOpen && (
        <div className="space-y-2">
          <textarea
            className="valo-input w-full h-28 resize-none font-mono text-sm"
            placeholder={'Faker#JP1\nTenZ#NA1\nshahzam#1234'}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
          />
          <button
            className="valo-btn w-full"
            onClick={handleBulkAdd}
            disabled={!!bulkProgress}
          >
            {bulkProgress || 'まとめて追加'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 p-3 rounded">
          {error.split('\n').map((line, i) => (
            <p key={i} className="text-red-400 text-sm">{line}</p>
          ))}
        </div>
      )}

      {loading && <SkeletonCard />}

      <div className="space-y-2">
        {players.map(p => (
          <PlayerCard
            key={p.puuid}
            player={p}
            onRemove={() => onPlayersChange(players.filter(x => x.puuid !== p.puuid))}
            onUpdateTier={(tier) => {
              const rankValue = RANK_VALUES[tier] ?? 0;
              const totalScore = calcTotalScore(rankValue, 0.5);
              onPlayersChange(players.map(x =>
                x.puuid === p.puuid
                  ? { ...x, competitiveTier: tier, rankValue, totalScore }
                  : x
              ));
            }}
          />
        ))}
      </div>

      {players.length >= 2 && (
        <button className="valo-btn w-full mt-2" onClick={onNext}>
          チーム分けへ →
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: 動作確認**

`npm run dev` で起動し:
1. 名前フィールドに入力 → Enter でタグフィールドにフォーカス移動すること
2. タグフィールドで Enter → 追加が実行されること
3. 「まとめて追加」ボタンでテキストエリアが展開すること
4. 取得中はスケルトンカードが表示されること
5. エラー時は赤いボックスで表示されること

- [ ] **Step 4: コミット**

```bash
git add src/components/PlayerInputForm.tsx
git commit -m "feat: split player input fields and add bulk add with skeleton loading"
```

---

## Task 5: PlayerCard にランク帯ボーダーカラーとサブ垢バッジ強化

**Files:**
- Modify: `src/components/PlayerCard.tsx`

- [ ] **Step 1: getRankBorderColor ヘルパー関数を追加して PlayerCard.tsx を更新**

`src/components/PlayerCard.tsx` を以下に置き換える：

```tsx
// src/components/PlayerCard.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { PlayerData } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE, RANK_VALUES } from '@/data/ranks';
import { calcTotalScore } from '@/lib/scoring';

interface Props {
  player: PlayerData;
  onRemove?: () => void;
  onUpdateTier?: (tier: number) => void;
}

const RANK_OPTIONS = [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27];

function getRankBorderColor(tier: number): string {
  if (tier <= 2)  return '#4a5060'; // アンランク
  if (tier <= 5)  return '#8B8B8B'; // アイアン
  if (tier <= 8)  return '#CD7F32'; // ブロンズ
  if (tier <= 11) return '#C0C0C0'; // シルバー
  if (tier <= 14) return '#FFD700'; // ゴールド
  if (tier <= 17) return '#5BC4D8'; // プラチナ
  if (tier <= 20) return '#4169E1'; // ダイヤ
  if (tier <= 23) return '#00C853'; // アセンダント
  if (tier <= 26) return '#FF1744'; // イモータル
  return '#FFE500'; // レディアント
}

export function PlayerCard({ player, onRemove, onUpdateTier }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  const rankIconUrl = `${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`;
  const noStats = player.matchCount === 0;
  const borderColor = getRankBorderColor(player.competitiveTier);

  return (
    <div
      className="valo-panel relative flex flex-col gap-2"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* サブ垢疑惑バナー */}
      {player.isSmurf && (
        <div className="bg-yellow-500/15 border border-yellow-500/40 rounded px-2 py-1 flex items-center gap-2 -mt-1 -mx-1">
          <span className="text-yellow-400 text-xs font-bold">⚠ サブ垢疑惑</span>
          <span className="text-yellow-300/60 text-xs">Lv{player.accountLevel} / KD {player.avgKda.toFixed(2)}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Image
          src={rankIconUrl}
          alt={rankName}
          width={40}
          height={40}
          className="flex-shrink-0"
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">
            {player.gameName}
            <span className="text-[#768079] text-sm ml-1">#{player.tagLine}</span>
          </p>
          <p className="text-sm" style={{ color: borderColor }}>{rankName}</p>
          <div className="flex gap-3 text-[#768079] text-xs items-center">
            {!noStats ? (
              <>
                <span>KD: {player.avgKda.toFixed(2)}</span>
                <span>WR: {(player.winRate * 100).toFixed(0)}%</span>
                <span>スコア: {player.totalScore.toFixed(1)}</span>
              </>
            ) : (
              <>
                <span>スコア: {player.totalScore.toFixed(1)}</span>
                {onUpdateTier && (
                  <button
                    onClick={() => setShowPicker(p => !p)}
                    className="text-yellow-500 hover:text-yellow-300 text-xs underline"
                  >
                    {showPicker ? '▲ 閉じる' : '⚠ ランク手動設定'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-[#768079] hover:text-red-400 text-xl ml-1 flex-shrink-0 leading-none"
            aria-label="削除"
          >
            ×
          </button>
        )}
      </div>

      {showPicker && onUpdateTier && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-[#768079]/20">
          {RANK_OPTIONS.map(tier => (
            <button
              key={tier}
              onClick={() => { onUpdateTier(tier); setShowPicker(false); }}
              title={RANK_NAMES[tier]}
              className={`rounded p-0.5 hover:bg-white/10 transition ${player.competitiveTier === tier ? 'ring-1 ring-red-400' : ''}`}
            >
              <Image
                src={`${RANK_ICON_BASE}${tier}/smallicon.png`}
                alt={RANK_NAMES[tier]}
                width={28}
                height={28}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/PlayerCard.tsx
git commit -m "feat: add rank border colors and improve smurf badge in PlayerCard"
```

---

## Task 6: TeamResultView のチームカラー強化と KD/WR 表示追加

**Files:**
- Modify: `src/components/TeamResultView.tsx`

- [ ] **Step 1: TeamResultView.tsx を全体置き換え**

`src/components/TeamResultView.tsx` を以下に置き換える：

```tsx
// src/components/TeamResultView.tsx
'use client';
import Image from 'next/image';
import { TeamResultWithHandicaps, PlayerWithHandicap } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE } from '@/data/ranks';
import { HandicapBadge } from './HandicapBadge';
import { MapRoulette } from './MapRoulette';

interface PlayerRowProps {
  player: PlayerWithHandicap;
}

function PlayerRow({ player }: PlayerRowProps) {
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  return (
    <div className="p-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Image
          src={`${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`}
          alt={rankName}
          width={28}
          height={28}
          unoptimized
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate text-sm">
            {player.gameName}
            <span className="text-[#768079] text-xs ml-1">#{player.tagLine}</span>
            {player.isSmurf && (
              <span className="ml-2 text-yellow-400 text-xs">⚠ サブ垢</span>
            )}
          </p>
          <div className="flex gap-2 text-[#768079] text-xs flex-wrap">
            <span>{rankName}</span>
            {player.matchCount > 0 && (
              <>
                <span className="text-[#4a5565]">|</span>
                <span>KD {player.avgKda.toFixed(2)}</span>
                <span>WR {(player.winRate * 100).toFixed(0)}%</span>
              </>
            )}
            <span className="text-[#4a5565]">|</span>
            <span>スコア <span className="text-white">{player.totalScore.toFixed(1)}</span></span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {player.topAgents.map(a => (
            <Image
              key={a.id}
              src={a.iconUrl}
              alt={a.name}
              width={22}
              height={22}
              className="rounded-full"
              unoptimized
            />
          ))}
        </div>
      </div>
      {player.handicap && <HandicapBadge handicap={player.handicap} />}
    </div>
  );
}

interface TeamScore {
  players: PlayerWithHandicap[];
}

function teamTotalScore({ players }: TeamScore): number {
  return players.reduce((sum, p) => sum + p.totalScore, 0);
}

interface Props {
  result: TeamResultWithHandicaps;
  onSaveAndBan: () => void;
  onReshuffle: () => void;
  onBack: () => void;
  bansPerTeam: number;
  onBansPerTeamChange: (n: number) => void;
}

export function TeamResultView({
  result,
  onSaveAndBan,
  onReshuffle,
  onBack,
  bansPerTeam,
  onBansPerTeamChange,
}: Props) {
  const scoreA = teamTotalScore({ players: result.teamA });
  const scoreB = teamTotalScore({ players: result.teamB });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
          チーム分け結果
        </h2>
        <button
          className="text-[#768079] text-sm hover:text-white"
          onClick={onBack}
        >
          ← 戻る
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* チームA */}
        <div className="valo-panel border-t-4 border-blue-500 overflow-hidden">
          <div className="bg-blue-500/10 -mx-4 -mt-4 px-4 pt-3 pb-2 mb-2 border-b border-blue-500/20">
            <h3 className="text-blue-400 font-bold uppercase tracking-wider text-lg">
              チーム A
            </h3>
            <p className="text-blue-300/60 text-xs">合計スコア: {scoreA.toFixed(1)}</p>
          </div>
          {result.teamA.map(p => (
            <PlayerRow key={p.puuid} player={p} />
          ))}
        </div>

        {/* チームB */}
        <div className="valo-panel border-t-4 border-red-500 overflow-hidden">
          <div className="bg-red-500/10 -mx-4 -mt-4 px-4 pt-3 pb-2 mb-2 border-b border-red-500/20">
            <h3 className="text-red-400 font-bold uppercase tracking-wider text-lg">
              チーム B
            </h3>
            <p className="text-red-300/60 text-xs">合計スコア: {scoreB.toFixed(1)}</p>
          </div>
          {result.teamB.map(p => (
            <PlayerRow key={p.puuid} player={p} />
          ))}
        </div>
      </div>

      {/* スコア差 */}
      <div className="text-center py-3 border border-[#2a3540] bg-[#1a2530]">
        <p className="text-[#768079] text-xs uppercase tracking-widest mb-1">スコア差</p>
        <p className="text-white text-3xl font-black">{result.scoreDiff.toFixed(1)}</p>
      </div>

      <MapRoulette />

      <div className="valo-panel flex items-center gap-3 flex-wrap">
        <span className="text-white text-sm">
          BANフェーズのBAN数（1チームあたり）:
        </span>
        {([1, 2, 3] as const).map(n => (
          <button
            key={n}
            onClick={() => onBansPerTeamChange(n)}
            className={`w-8 h-8 font-bold border transition-colors ${
              bansPerTeam === n
                ? 'border-red-500 text-red-400'
                : 'border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button className="valo-btn-outline flex-1" onClick={onReshuffle}>
          もう一度
        </button>
        <button className="valo-btn flex-1" onClick={onSaveAndBan}>
          保存 → BANフェーズ
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/TeamResultView.tsx
git commit -m "feat: enhance team result view with colors, KD/WR display, and score totals"
```

---

## Task 7: BanPhase にロール別グループ・BANエフェクト・ターン表示強化

**Files:**
- Modify: `src/components/BanPhase.tsx`

- [ ] **Step 1: BanPhase.tsx を全体置き換え**

`src/components/BanPhase.tsx` を以下に置き換える：

```tsx
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TeamResultWithHandicaps, AgentInfo } from '@/types';

interface Props {
  result: TeamResultWithHandicaps;
  bansPerTeam: number;
  onComplete: () => void;
}

interface AgentWithRole extends AgentInfo {
  role: string;
}

interface AgentApiItem {
  uuid: string;
  displayName: string;
  displayIcon: string;
  role: { displayName: string } | null;
}

const ROLE_ORDER = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
const ROLE_LABELS: Record<string, string> = {
  Duelist:   'デュエリスト',
  Initiator: 'イニシエーター',
  Controller:'コントローラー',
  Sentinel:  'センチネル',
};
const ROLE_COLORS: Record<string, string> = {
  Duelist:   'text-red-400 border-red-500/40',
  Initiator: 'text-green-400 border-green-500/40',
  Controller:'text-purple-400 border-purple-500/40',
  Sentinel:  'text-blue-400 border-blue-500/40',
};

export function BanPhase({ bansPerTeam, onComplete }: Props) {
  const [agents, setAgents] = useState<AgentWithRole[]>([]);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());
  const [currentTeam, setCurrentTeam] = useState<'A' | 'B'>('A');
  const [teamABans, setTeamABans] = useState(0);
  const [teamBBans, setTeamBBans] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string>('Duelist');

  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json())
      .then(data => {
        const list: AgentWithRole[] = (data.data as AgentApiItem[])
          .map(a => ({
            id: a.uuid,
            name: a.displayName,
            iconUrl: a.displayIcon,
            role: a.role?.displayName ?? 'Other',
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAgents(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleBan(agent: AgentWithRole) {
    if (bannedIds.has(agent.id) || done) return;

    const newBanned = new Set(bannedIds);
    newBanned.add(agent.id);
    setBannedIds(newBanned);

    const newABans = currentTeam === 'A' ? teamABans + 1 : teamABans;
    const newBBans = currentTeam === 'B' ? teamBBans + 1 : teamBBans;
    setTeamABans(newABans);
    setTeamBBans(newBBans);

    if (newABans >= bansPerTeam && newBBans >= bansPerTeam) {
      setDone(true);
      return;
    }

    const next = currentTeam === 'A' ? 'B' : 'A';
    const nextDone = next === 'A' ? newABans >= bansPerTeam : newBBans >= bansPerTeam;
    setCurrentTeam(nextDone ? currentTeam : next);
  }

  const roleGroups = ROLE_ORDER.map(role => ({
    role,
    agents: agents.filter(a => a.role === role),
  })).filter(g => g.agents.length > 0);

  const bannedAgents = agents.filter(a => bannedIds.has(a.id));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        BANフェーズ
      </h2>

      {loading ? (
        <div className="valo-panel text-center text-[#768079]">エージェント読み込み中...</div>
      ) : !done ? (
        <div className={`valo-panel text-center border-t-4 ${currentTeam === 'A' ? 'border-blue-500' : 'border-red-500'}`}>
          <p className="text-white text-xl font-black tracking-wider">
            <span className={currentTeam === 'A' ? 'text-blue-400' : 'text-red-400'}>
              チーム {currentTeam}
            </span>
            {' '}がBANを選択
          </p>
          <div className="flex justify-center gap-6 mt-2">
            <div className="text-center">
              <p className="text-blue-400 text-xs uppercase tracking-wider">チーム A</p>
              <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: bansPerTeam }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm border ${i < teamABans ? 'bg-blue-500 border-blue-400' : 'border-blue-500/30'}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-red-400 text-xs uppercase tracking-wider">チーム B</p>
              <div className="flex gap-1 justify-center mt-1">
                {Array.from({ length: bansPerTeam }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm border ${i < teamBBans ? 'bg-red-500 border-red-400' : 'border-red-500/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="valo-panel text-center border-t-4 border-green-500">
          <p className="text-green-400 font-black text-xl uppercase tracking-widest">BANフェーズ完了！</p>
        </div>
      )}

      {bannedAgents.length > 0 && (
        <div className="valo-panel">
          <p className="text-[#768079] text-xs mb-2 uppercase tracking-wider">BANされたエージェント</p>
          <div className="flex flex-wrap gap-3">
            {bannedAgents.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Image
                    src={a.iconUrl}
                    alt={a.name}
                    width={36}
                    height={36}
                    className="grayscale opacity-40 rounded-full"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-red-500 font-black text-lg leading-none">✕</span>
                  </div>
                </div>
                <span className="text-xs text-[#768079] text-center leading-tight">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ロールタブ */}
          <div className="flex gap-1 flex-wrap">
            {roleGroups.map(({ role }) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeRole === role
                    ? ROLE_COLORS[role] ?? 'text-white border-white/40'
                    : 'text-[#768079] border-[#2a3540] hover:border-gray-500'
                }`}
              >
                {ROLE_LABELS[role] ?? role}
              </button>
            ))}
          </div>

          {/* エージェントグリッド */}
          {roleGroups
            .filter(g => g.role === activeRole)
            .map(({ role, agents: roleAgents }) => (
              <div key={role} className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {roleAgents.map(agent => {
                  const isBanned = bannedIds.has(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleBan(agent)}
                      disabled={isBanned || done}
                      title={agent.name}
                      className={`flex flex-col items-center gap-1 p-1 rounded transition-all ${
                        isBanned || done
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/10 cursor-pointer hover:scale-105'
                      }`}
                    >
                      <div className="relative">
                        <Image
                          src={agent.iconUrl}
                          alt={agent.name}
                          width={48}
                          height={48}
                          className={isBanned ? 'grayscale' : ''}
                          unoptimized
                        />
                        {isBanned && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-red-500 font-black text-2xl leading-none drop-shadow">✕</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#768079] text-center leading-tight">
                        {agent.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
        </>
      )}

      {done && (
        <button className="valo-btn w-full" onClick={onComplete}>
          最初に戻る
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/BanPhase.tsx
git commit -m "feat: add role grouping, ban X overlay, and turn indicator to BanPhase"
```

---

## Task 8: GitHub にプッシュしてデプロイ

**Files:** なし（git操作のみ）

- [ ] **Step 1: 全変更がコミット済みか確認**

```bash
git status
```

期待: `nothing to commit, working tree clean`

- [ ] **Step 2: GitHub にプッシュ**

```bash
git push origin master
```

期待: Render が自動ビルド開始

- [ ] **Step 3: ビルドログ確認**

Render ダッシュボードでビルドが成功することを確認する。
