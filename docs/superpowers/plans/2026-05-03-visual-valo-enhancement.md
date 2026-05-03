# VALOCUSTOM ビジュアル強化（画像・キャラクター）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** valorant-api.com のエージェント全身画像・マップ画像を使い、サイト全体のVALO感を大幅に強化する。

**Architecture:** 新規コンポーネント2つ（MapBackground・HeroAgent）を作成し、既存3コンポーネント（AgentDecorations・PlayerCard・TeamResultView）を修正。page.tsx で統合する。画像はすべて `media.valorant-api.com`（next.config.js に登録済み）から取得。

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, valorant-api.com 画像アセット

---

## ファイル変更一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/components/MapBackground.tsx` | 新規 | ランダムマップ画像をページ全体固定背景に表示 |
| `src/components/HeroAgent.tsx` | 新規 | ランダムエージェント全身画像をヘッダー右に表示 |
| `src/app/page.tsx` | 修正 | MapBackground・HeroAgent を統合、ヘッダーを relative に |
| `src/components/AgentDecorations.tsx` | 修正 | opacity 0.18 → 0.40、マスク調整 |
| `src/components/PlayerCard.tsx` | 修正 | ランクアイコン 40px → 48px |
| `src/components/TeamResultView.tsx` | 修正 | PlayerRow にエージェント背景画像を追加、エージェントアイコン 22px → 32px |

---

## Task 1: MapBackground.tsx を新規作成

**Files:**
- Create: `src/components/MapBackground.tsx`

- [ ] **Step 1: MapBackground.tsx を作成**

```tsx
// src/components/MapBackground.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const MAPS = [
  { uuid: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319', name: 'Ascent' },
  { uuid: '2bee0dc9-4bbe-4166-96ae-12b28dd13769', name: 'Haven' },
  { uuid: '2c9d57ec-4431-9c5e-4a9a-9c51fffb8031', name: 'Bind' },
  { uuid: 'd960549e-485c-e861-8d71-aa9d1aed12a2', name: 'Split' },
  { uuid: 'e2ad5c54-4114-a870-9641-8ea21279579a', name: 'Icebox' },
  { uuid: 'b529448b-4d60-346e-e89e-00a4c527a405', name: 'Fracture' },
  { uuid: '33bb57b4-0a14-547c-8e4b-4d3fdc3e5a32', name: 'Pearl' },
  { uuid: '2fe4ed3a-450a-948b-9716-769a1bda6cc3', name: 'Lotus' },
  { uuid: '92584fbe-486a-b1b2-9faa-39a27d1f7523', name: 'Sunset' },
];

function splashUrl(uuid: string) {
  return `https://media.valorant-api.com/maps/${uuid}/splash.png`;
}

export function MapBackground() {
  const [map, setMap] = useState<typeof MAPS[0] | null>(null);

  useEffect(() => {
    const idx = Math.floor(Math.random() * MAPS.length);
    setMap(MAPS[idx]);
  }, []);

  if (!map) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      <Image
        src={splashUrl(map.uuid)}
        alt={map.name}
        fill
        className="object-cover object-center"
        style={{ opacity: 0.06 }}
        unoptimized
        priority={false}
      />
    </div>
  );
}
```

- [ ] **Step 2: ビルドエラー確認**

```bash
cd "C:\Users\solar\OneDrive\デスクトップ\valo bot"
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/MapBackground.tsx
git commit -m "feat: add MapBackground component with random map splash"
```

---

## Task 2: HeroAgent.tsx を新規作成

**Files:**
- Create: `src/components/HeroAgent.tsx`

- [ ] **Step 1: HeroAgent.tsx を作成**

```tsx
// src/components/HeroAgent.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const AGENTS = [
  { uuid: 'add6443a-41bd-e414-f6ad-e58d267f4e95', name: 'Jett' },
  { uuid: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc', name: 'Reyna' },
  { uuid: '569fdd95-4d10-43ab-ca70-79becc718b46', name: 'Sage' },
  { uuid: '8e253930-4c05-31dd-1b6c-968525494517', name: 'Omen' },
  { uuid: 'bb2a4828-46eb-8cd1-e765-15848195d751', name: 'Neon' },
  { uuid: 'f94c3b30-42be-e959-889c-5aa313dba261', name: 'Raze' },
  { uuid: '1dbf2edd-4729-0984-3115-daa5eed44993', name: 'Killjoy' },
  { uuid: '707eab51-4836-f488-046a-cda6bf494859', name: 'Viper' },
  { uuid: 'eb93336a-449b-9c1e-0ac7-8e92c7a76604', name: 'Phoenix' },
  { uuid: '117ed9e3-49f3-6512-3ccf-0cada7e3823b', name: 'Cypher' },
  { uuid: '5f8d3a7f-467b-97f3-062c-13acf203c006', name: 'Breach' },
  { uuid: '320b2a48-4d9b-a075-30f1-1f93a9b638fa', name: 'Sova' },
  { uuid: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417', name: 'Brimstone' },
  { uuid: '7f94d92c-4234-0a36-9646-3a87eb8b5c89', name: 'Yoru' },
  { uuid: 'e370fa57-4757-3604-3648-499e1f642d3f', name: 'Gekko' },
];

function portraitUrl(uuid: string) {
  return `https://media.valorant-api.com/agents/${uuid}/fullportrait.png`;
}

export function HeroAgent() {
  const [agent, setAgent] = useState<typeof AGENTS[0] | null>(null);

  useEffect(() => {
    const idx = Math.floor(Math.random() * AGENTS.length);
    setAgent(AGENTS[idx]);
  }, []);

  if (!agent) return null;

  return (
    <div
      className="absolute right-0 bottom-0 h-full pointer-events-none select-none hidden sm:block"
      style={{ zIndex: 1 }}
    >
      <div
        style={{
          height: '100%',
          opacity: 0.55,
          maskImage: 'linear-gradient(to left, black 30%, transparent 85%), linear-gradient(to top, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 85%), linear-gradient(to top, black 50%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <Image
          src={portraitUrl(agent.uuid)}
          alt={agent.name}
          width={180}
          height={300}
          className="h-full w-auto object-contain object-bottom"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ビルドエラー確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/HeroAgent.tsx
git commit -m "feat: add HeroAgent component for header portrait"
```

---

## Task 3: page.tsx に MapBackground・HeroAgent を統合

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx を書き換える**

`src/app/page.tsx` を以下の内容に置き換える：

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
import { MapBackground } from '@/components/MapBackground';
import { HeroAgent } from '@/components/HeroAgent';
import { StepBar, AppStep } from '@/components/StepBar';

export default function Home() {
  const [step, setStep] = useState<AppStep>('input');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [mode, setMode] = useState<TeamMode>('simple');
  const [teamResult, setTeamResult] = useState<TeamResult | null>(null);
  const [resultWithHandicaps, setResultWithHandicaps] = useState<TeamResultWithHandicaps | null>(null);
  const [bansPerTeam, setBansPerTeam] = useState(1);

  function handleRunBalance() {
    const history = loadHistory();
    const result = balanceTeams(players, mode, history ?? undefined);
    const withHandicaps =
      mode === 'handicap' || mode === 'no-repeat-handicap'
        ? assignHandicaps(result)
        : { ...result, teamA: result.teamA.map(p => ({ ...p })), teamB: result.teamB.map(p => ({ ...p })) };
    setTeamResult(result);
    setResultWithHandicaps(withHandicaps);
    setStep('result');
  }

  function handleSaveAndBan() {
    if (teamResult) saveHistory(teamResult);
    setStep('ban');
  }

  return (
    <>
      <MapBackground />
      <AgentDecorations />
      <main className="min-h-screen bg-[#0F1923]/90 p-4 max-w-2xl mx-auto relative" style={{ zIndex: 1 }}>

        {/* ヘッダー */}
        <div className="relative overflow-hidden mb-6 pt-4 valo-diagonal-bg border-b border-red-500/40 pb-4 min-h-[100px]">
          <div className="relative" style={{ zIndex: 2 }}>
            <h1 className="text-5xl font-black uppercase tracking-widest text-white leading-none">
              VALO<span className="text-red-500">CUSTOM</span>
            </h1>
            <p className="text-[#768079] text-sm mt-1">カスタムマッチ チームバランサー</p>
          </div>
          <HeroAgent />
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
}
```

- [ ] **Step 2: ビルドエラー確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate MapBackground and HeroAgent into page header"
```

---

## Task 4: AgentDecorations.tsx の opacity を引き上げ

**Files:**
- Modify: `src/components/AgentDecorations.tsx`

- [ ] **Step 1: AgentDecorations.tsx を書き換える**

`src/components/AgentDecorations.tsx` を以下の内容に置き換える：

```tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const AGENTS = [
  { uuid: 'add6443a-41bd-e414-f6ad-e58d267f4e95', name: 'Jett' },
  { uuid: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc', name: 'Reyna' },
  { uuid: '569fdd95-4d10-43ab-ca70-79becc718b46', name: 'Sage' },
  { uuid: '8e253930-4c05-31dd-1b6c-968525494517', name: 'Omen' },
  { uuid: 'bb2a4828-46eb-8cd1-e765-15848195d751', name: 'Neon' },
  { uuid: 'f94c3b30-42be-e959-889c-5aa313dba261', name: 'Raze' },
  { uuid: '1dbf2edd-4729-0984-3115-daa5eed44993', name: 'Killjoy' },
  { uuid: '707eab51-4836-f488-046a-cda6bf494859', name: 'Viper' },
  { uuid: 'eb93336a-449b-9c1e-0ac7-8e92c7a76604', name: 'Phoenix' },
  { uuid: '117ed9e3-49f3-6512-3ccf-0cada7e3823b', name: 'Cypher' },
  { uuid: '5f8d3a7f-467b-97f3-062c-13acf203c006', name: 'Breach' },
  { uuid: '320b2a48-4d9b-a075-30f1-1f93a9b638fa', name: 'Sova' },
  { uuid: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417', name: 'Brimstone' },
  { uuid: '7f94d92c-4234-0a36-9646-3a87eb8b5c89', name: 'Yoru' },
  { uuid: 'e370fa57-4757-3604-3648-499e1f642d3f', name: 'Gekko' },
];

function portraitUrl(uuid: string) {
  return `https://media.valorant-api.com/agents/${uuid}/fullportrait.png`;
}

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function AgentDecorations() {
  const [pair, setPair] = useState<typeof AGENTS>([]);

  useEffect(() => {
    setPair(pick(AGENTS, 2));
  }, []);

  if (pair.length < 2) return null;

  const maskStyle = 'linear-gradient(to top, black 60%, transparent 100%)';

  return (
    <>
      {/* Left agent */}
      <div
        className="fixed left-0 bottom-0 w-56 xl:w-72 pointer-events-none select-none hidden lg:block"
        style={{ zIndex: 0 }}
      >
        <div style={{
          opacity: 0.40,
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle,
        }}>
          <Image
            src={portraitUrl(pair[0].uuid)}
            alt={pair[0].name}
            width={288}
            height={576}
            className="w-full h-auto object-contain object-bottom"
            unoptimized
            priority={false}
          />
        </div>
      </div>

      {/* Right agent */}
      <div
        className="fixed right-0 bottom-0 w-56 xl:w-72 pointer-events-none select-none hidden lg:block"
        style={{ zIndex: 0 }}
      >
        <div style={{
          opacity: 0.40,
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle,
          transform: 'scaleX(-1)',
        }}>
          <Image
            src={portraitUrl(pair[1].uuid)}
            alt={pair[1].name}
            width={288}
            height={576}
            className="w-full h-auto object-contain object-bottom"
            unoptimized
            priority={false}
          />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: ビルドエラー確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/AgentDecorations.tsx
git commit -m "feat: increase agent decoration opacity and size"
```

---

## Task 5: PlayerCard.tsx のランクアイコンを拡大

**Files:**
- Modify: `src/components/PlayerCard.tsx`

- [ ] **Step 1: ランクアイコンの width/height を変更**

`src/components/PlayerCard.tsx` の中の以下の部分を探す：

```tsx
        <Image
          src={rankIconUrl}
          alt={rankName}
          width={40}
          height={40}
          className="flex-shrink-0"
          unoptimized
        />
```

以下に変更する（width/height を 40 → 48 に）：

```tsx
        <Image
          src={rankIconUrl}
          alt={rankName}
          width={48}
          height={48}
          className="flex-shrink-0"
          unoptimized
        />
```

- [ ] **Step 2: ビルドエラー確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/PlayerCard.tsx
git commit -m "feat: enlarge rank icon in PlayerCard"
```

---

## Task 6: TeamResultView.tsx にエージェント背景画像を追加

**Files:**
- Modify: `src/components/TeamResultView.tsx`

- [ ] **Step 1: TeamResultView.tsx の PlayerRow 関数を書き換える**

`src/components/TeamResultView.tsx` の `function PlayerRow` 全体（`function PlayerRow` から closing `}` まで）を以下に置き換える：

```tsx
function PlayerRow({ player }: PlayerRowProps) {
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  const mainAgent = player.topAgents[0] ?? null;

  return (
    <div className="relative p-3 border-b border-white/5 last:border-0 overflow-hidden">
      {/* エージェント背景 */}
      {mainAgent && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ zIndex: 0 }}>
          <Image
            src={mainAgent.iconUrl}
            alt={mainAgent.name}
            width={44}
            height={44}
            className="rounded-full"
            style={{ opacity: 0.10 }}
            unoptimized
          />
        </div>
      )}
      <div className="relative flex items-center gap-2" style={{ zIndex: 1 }}>
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
              width={32}
              height={32}
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
```

- [ ] **Step 2: ビルドエラー確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__"
```

期待: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/TeamResultView.tsx
git commit -m "feat: add agent background and larger icons to TeamResultView"
```

---

## Task 7: GitHub にプッシュしてデプロイ

**Files:** なし（git操作のみ）

- [ ] **Step 1: 全変更がコミット済みか確認**

```bash
git status
```

期待: `nothing to commit, working tree clean`（または untracked の log ファイルのみ）

- [ ] **Step 2: GitHub にプッシュ**

```bash
git push origin master
```

期待: Render が自動ビルド開始
