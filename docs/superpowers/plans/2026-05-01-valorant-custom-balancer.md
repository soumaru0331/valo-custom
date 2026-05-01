# VALORANT Custom Balancer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app that takes VALORANT player names, fetches their competitive stats via Riot API, and splits them into balanced teams with 4 modes, a handicap system, agent banning, and random map selection.

**Architecture:** Next.js 14 App Router. All Riot API calls happen in server-side API routes so the API key never reaches the browser. Pure TypeScript functions handle scoring, balancing, and handicap logic (fully unit-testable). React components manage UI state. localStorage persists match history between sessions.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Jest, Riot Games API (val-match-v1 + account-v1), valorant-api.com (agent/rank icons), Render for hosting.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | All shared TypeScript types |
| `src/data/ranks.ts` | Riot tier number → our score value mapping |
| `src/data/maps.ts` | Current VALORANT map list |
| `src/data/handicaps.ts` | ☆1/☆2/☆3 handicap text lists |
| `src/lib/scoring.ts` | calcPerformanceScore, calcTotalScore, detectSmurf |
| `src/lib/team-balancer.ts` | balanceTeams (all 4 modes) |
| `src/lib/handicap.ts` | assignHandicaps |
| `src/lib/history.ts` | saveHistory, loadHistory, clearHistory (localStorage) |
| `src/lib/riot-api.ts` | Server-side Riot API client with rate-limit retry |
| `src/app/api/player/route.ts` | POST /api/player — returns PlayerData |
| `src/app/layout.tsx` | Root layout + Footer |
| `src/app/page.tsx` | Main page — app state machine |
| `src/app/globals.css` | VALORANT color theme + base styles |
| `src/components/PlayerInputForm.tsx` | Name+tag inputs, fetch button |
| `src/components/PlayerCard.tsx` | Rank icon, top 3 agents, smurf badge |
| `src/components/ModeSelector.tsx` | 4-mode selection cards |
| `src/components/TeamResult.tsx` | Team A / Team B result display |
| `src/components/HandicapBadge.tsx` | ☆ star badge + handicap text |
| `src/components/BanPhase.tsx` | Agent grid for BAN selection |
| `src/components/MapRoulette.tsx` | Random map button + display |
| `src/__tests__/scoring.test.ts` | Unit tests for scoring logic |
| `src/__tests__/team-balancer.test.ts` | Unit tests for team balancer |
| `src/__tests__/handicap.test.ts` | Unit tests for handicap assignment |
| `src/__tests__/history.test.ts` | Unit tests for history (mocked localStorage) |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.local`
- Create: `.gitignore`
- Create: `jest.config.js`
- Create: `jest.setup.js`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "C:\Users\solar\OneDrive\デスクトップ\valo bot"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
When prompted: No to "Would you like to use Turbopack?" (stability), Yes to all others.

- [ ] **Step 2: Install test dependencies**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Create jest.config.js**

```js
// jest.config.js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  testEnvironment: 'node',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathPattern: ['<rootDir>/src/__tests__/'],
})
```

- [ ] **Step 4: Create jest.setup.js**

```js
// jest.setup.js
// empty — add global mocks here as needed
```

- [ ] **Step 5: Create .env.local**

```env
RIOT_API_KEY=RGAPI-fa313fc9-dcf5-4b6a-9fcd-3e9028b2be24
```

- [ ] **Step 6: Ensure .gitignore includes secrets**

Open `.gitignore` and confirm it contains:
```
.env.local
.env*.local
```

- [ ] **Step 7: Run dev server to verify setup**

```bash
npm run dev
```
Expected: Server starts at http://localhost:3000 with default Next.js page.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: initial Next.js project scaffold"
```

---

## Task 2: Types & Static Data

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/ranks.ts`
- Create: `src/data/maps.ts`
- Create: `src/data/handicaps.ts`

- [ ] **Step 1: Create src/types/index.ts**

```typescript
// src/types/index.ts

export interface AgentInfo {
  id: string;
  name: string;
  iconUrl: string;
}

export interface PlayerData {
  gameName: string;
  tagLine: string;
  puuid: string;
  competitiveTier: number; // Riot's tier number (3=Iron1 ... 27=Radiant)
  rankValue: number;       // Our score value (1-40)
  performanceScore: number; // 0.0 to 1.0
  totalScore: number;      // Combined final score
  topAgents: AgentInfo[];  // Top 3 agents by usage count
  matchCount: number;      // Number of competitive matches found
  winRate: number;         // 0.0 to 1.0
  avgKda: number;
  isSmurf: boolean;
}

export type TeamMode =
  | 'simple'
  | 'handicap'
  | 'no-repeat-simple'
  | 'no-repeat-handicap';

export interface HandicapItem {
  star: 1 | 2 | 3;
  description: string;
}

export interface PlayerWithHandicap extends PlayerData {
  handicap?: HandicapItem;
}

export interface TeamResult {
  teamA: PlayerData[];
  teamB: PlayerData[];
  scoreDiff: number;
}

export interface TeamResultWithHandicaps {
  teamA: PlayerWithHandicap[];
  teamB: PlayerWithHandicap[];
  scoreDiff: number;
}

export interface HistoryEntry {
  teamAPuuids: string[];
  teamBPuuids: string[];
  timestamp: number;
}

export interface BanState {
  bannedAgentIds: string[];
  currentTeam: 'A' | 'B';
  bansPerTeam: number;
  teamABansLeft: number;
  teamBBansLeft: number;
}
```

- [ ] **Step 2: Create src/data/ranks.ts**

Riot's `competitiveTier` numbers (from match API):
- 0,1,2 = Unranked/Unknown
- 3-5 = Iron 1-3, 6-8 = Bronze 1-3, 9-11 = Silver 1-3
- 12-14 = Gold 1-3, 15-17 = Platinum 1-3, 18-20 = Diamond 1-3
- 21-23 = Ascendant 1-3, 24 = Immortal 1, 25 = Immortal 2
- 26 = Immortal 3, 27 = Radiant

```typescript
// src/data/ranks.ts

export const RANK_VALUES: Record<number, number> = {
  0: 0, 1: 0, 2: 0,
  3: 1, 4: 2, 5: 3,
  6: 4, 7: 5, 8: 6,
  9: 7, 10: 8, 11: 9,
  12: 10, 13: 11, 14: 12,
  15: 13, 16: 14, 17: 15,
  18: 16, 19: 17, 20: 18,
  21: 19, 22: 20, 23: 21,
  24: 22,
  25: 24,
  26: 27,
  27: 40,
};

export const RANK_NAMES: Record<number, string> = {
  0: 'アンランク', 1: 'アンランク', 2: 'アンランク',
  3: 'アイアン1', 4: 'アイアン2', 5: 'アイアン3',
  6: 'ブロンズ1', 7: 'ブロンズ2', 8: 'ブロンズ3',
  9: 'シルバー1', 10: 'シルバー2', 11: 'シルバー3',
  12: 'ゴールド1', 13: 'ゴールド2', 14: 'ゴールド3',
  15: 'プラチナ1', 16: 'プラチナ2', 17: 'プラチナ3',
  18: 'ダイヤ1', 19: 'ダイヤ2', 20: 'ダイヤ3',
  21: 'アセンダント1', 22: 'アセンダント2', 23: 'アセンダント3',
  24: 'イモータル1', 25: 'イモータル2', 26: 'イモータル3',
  27: 'レディアント',
};

export const RANK_ICON_BASE = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/';
```

- [ ] **Step 3: Create src/data/maps.ts**

```typescript
// src/data/maps.ts

export interface MapInfo {
  name: string;
  displayName: string;
  imageUrl: string;
}

export const MAPS: MapInfo[] = [
  { name: 'Abyss', displayName: 'アビス', imageUrl: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png' },
  { name: 'Ascent', displayName: 'アセント', imageUrl: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png' },
  { name: 'Bind', displayName: 'バインド', imageUrl: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png' },
  { name: 'Breeze', displayName: 'ブリーズ', imageUrl: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png' },
  { name: 'Fracture', displayName: 'フラクチャー', imageUrl: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png' },
  { name: 'Haven', displayName: 'ヘイブン', imageUrl: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png' },
  { name: 'Icebox', displayName: 'アイスボックス', imageUrl: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png' },
  { name: 'Lotus', displayName: 'ロータス', imageUrl: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png' },
  { name: 'Pearl', displayName: 'パール', imageUrl: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821f316447/splash.png' },
  { name: 'Split', displayName: 'スプリット', imageUrl: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png' },
  { name: 'Sunset', displayName: 'サンセット', imageUrl: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39049ba7b7b2/splash.png' },
];

export function getRandomMap(): MapInfo {
  return MAPS[Math.floor(Math.random() * MAPS.length)];
}
```

- [ ] **Step 4: Create src/data/handicaps.ts**

```typescript
// src/data/handicaps.ts
import { HandicapItem } from '@/types';

export const HANDICAPS_1: HandicapItem[] = [
  { star: 1, description: '京言葉で話す' },
  { star: 1, description: '韓国人風に話す' },
  { star: 1, description: '中国人風に話す' },
  { star: 1, description: '常に味方がどんなプレイしても褒める' },
  { star: 1, description: '報告を全部別ゲームで行う' },
  { star: 1, description: '英語で話す' },
  { star: 1, description: '毎ラウンド待機時間に食べたいご飯の話をする' },
  { star: 1, description: '死んだら早口で言い訳する' },
  { star: 1, description: '味方が1v1になったら歌い出す' },
  { star: 1, description: 'リロードするたびに一言コメントを入れる' },
  { star: 1, description: 'キルしたら必ず自分を褒める' },
  { star: 1, description: 'デスしたらゲーム環境のせいにする' },
  { star: 1, description: 'ミニマップを見た情報を実況風に話す' },
  { star: 1, description: '毎ラウンド開始時に目標を宣言する' },
  { star: 1, description: '味方の名前を毎回フルで呼ぶ' },
  { star: 1, description: '武器を買うたびに理由を説明する' },
  { star: 1, description: 'スキルを使う前に宣言する' },
  { star: 1, description: '敵を倒したら軽く謝る' },
  { star: 1, description: 'スパイク設置中にカウントダウンする' },
];

export const HANDICAPS_2: HandicapItem[] = [
  { star: 2, description: 'ジャンプしながら移動' },
  { star: 2, description: 'リロードは必ずカバー中に宣言してから' },
  { star: 2, description: 'ミニマップを見たら必ず共有しないといけない' },
  { star: 2, description: 'ラウンド中に一度は無意味なフェイク報告をする' },
  { star: 2, description: '武器は拾い物を使う' },
  { star: 2, description: 'キルした武器は次ラウンドも使う' },
  { star: 2, description: '1キルするまでしゃべれない' },
  { star: 2, description: '逆に常に何か喋り続ける' },
  { star: 2, description: '味方の指示に従う、指示待ち人間になろう' },
  { star: 2, description: '毎回違う武器を買う' },
  { star: 2, description: 'ガーディアンのみ' },
  { star: 2, description: 'ブルドッグのみ' },
  { star: 2, description: 'オーディンとアレスのみ購入可能' },
];

export const HANDICAPS_3: HandicapItem[] = [
  { star: 3, description: 'センシを半分もしくは2倍にする' },
  { star: 3, description: 'シェリフのみ' },
  { star: 3, description: 'スキル購入禁止' },
  { star: 3, description: '各ラウンドキルするまで走りのみ' },
  { star: 3, description: '毎ラウンド開始20秒は購入以外何もしない' },
  { star: 3, description: 'プラントされるまでローテ禁止' },
  { star: 3, description: 'デスしたら毎ラウンド全チャで理由を書く' },
  { star: 3, description: 'キルしてきた相手を褒めるコメントをする（毎回同じはだめ）' },
  { star: 3, description: 'スティンガーのみ' },
  { star: 3, description: 'オペレーターのみ' },
  { star: 3, description: 'サイドアームのみ' },
];

export function getHandicapsByStars(star: 1 | 2 | 3): HandicapItem[] {
  if (star === 1) return HANDICAPS_1;
  if (star === 2) return HANDICAPS_2;
  return HANDICAPS_3;
}

export function pickRandomHandicap(star: 1 | 2 | 3): HandicapItem {
  const list = getHandicapsByStars(star);
  return list[Math.floor(Math.random() * list.length)];
}
```

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/data/ranks.ts src/data/maps.ts src/data/handicaps.ts
git commit -m "feat: add types and static data"
```

---

## Task 3: Scoring Logic (TDD)

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `src/__tests__/scoring.test.ts`

- [ ] **Step 1: Create test file first**

```typescript
// src/__tests__/scoring.test.ts
import { calcPerformanceScore, calcTotalScore, detectSmurf } from '@/lib/scoring';
import { RANK_VALUES } from '@/data/ranks';

describe('calcPerformanceScore', () => {
  it('returns 0 for zero stats', () => {
    expect(calcPerformanceScore(0, 0, 0)).toBe(0);
  });

  it('returns 1.0 for perfect stats', () => {
    // KDA=5 (normalized to 1.0), hsRate=1.0, winRate=1.0
    expect(calcPerformanceScore(5, 1.0, 1.0)).toBeCloseTo(1.0);
  });

  it('clamps KDA above 5 to 1.0', () => {
    const score = calcPerformanceScore(10, 0, 0);
    const scoreWith5 = calcPerformanceScore(5, 0, 0);
    expect(score).toBeCloseTo(scoreWith5);
  });

  it('returns correct weighted result', () => {
    // KDA=2.5 → normalized=0.5, hsRate=0.3, winRate=0.6
    // 0.5*0.4 + 0.3*0.3 + 0.6*0.3 = 0.2 + 0.09 + 0.18 = 0.47
    expect(calcPerformanceScore(2.5, 0.3, 0.6)).toBeCloseTo(0.47);
  });
});

describe('calcTotalScore', () => {
  it('combines rank value and performance score', () => {
    // rankValue=10, perfScore=0.5 → 10*0.7 + 0.5*0.3*40 = 7 + 6 = 13
    expect(calcTotalScore(10, 0.5)).toBeCloseTo(13);
  });

  it('returns rank value only when perf score is 0', () => {
    expect(calcTotalScore(20, 0)).toBeCloseTo(14);
  });

  it('scales correctly for Radiant', () => {
    // rankValue=40, perfScore=1.0 → 40*0.7 + 1.0*0.3*40 = 28 + 12 = 40
    expect(calcTotalScore(40, 1.0)).toBeCloseTo(40);
  });
});

describe('detectSmurf', () => {
  it('flags account with few matches + high winrate + high KDA', () => {
    expect(detectSmurf(15, 0.75, 3.5)).toBe(true);
  });

  it('does not flag normal account', () => {
    expect(detectSmurf(80, 0.52, 1.8)).toBe(false);
  });

  it('does not flag if only one condition met', () => {
    expect(detectSmurf(15, 0.52, 1.8)).toBe(false); // only low matches
    expect(detectSmurf(80, 0.80, 1.8)).toBe(false); // only high winrate
    expect(detectSmurf(80, 0.52, 4.0)).toBe(false); // only high KDA
  });
});
```

- [ ] **Step 2: Run test to confirm all fail**

```bash
npx jest src/__tests__/scoring.test.ts
```
Expected: All tests FAIL with "Cannot find module '@/lib/scoring'"

- [ ] **Step 3: Create src/lib/scoring.ts**

```typescript
// src/lib/scoring.ts

export function calcPerformanceScore(
  avgKda: number,
  hsRate: number,
  winRate: number
): number {
  const kdaNorm = Math.min(avgKda / 5.0, 1.0);
  return kdaNorm * 0.4 + hsRate * 0.3 + winRate * 0.3;
}

export function calcTotalScore(rankValue: number, performanceScore: number): number {
  return rankValue * 0.7 + performanceScore * 0.3 * 40;
}

export function detectSmurf(
  matchCount: number,
  winRate: number,
  avgKda: number
): boolean {
  const fewMatches = matchCount < 20;
  const highWinRate = winRate >= 0.70;
  const highKda = avgKda >= 3.0;
  const conditionsMet = [fewMatches, highWinRate, highKda].filter(Boolean).length;
  return conditionsMet >= 2;
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx jest src/__tests__/scoring.test.ts
```
Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/__tests__/scoring.test.ts
git commit -m "feat: scoring logic with tests"
```

---

## Task 4: Team Balancer Logic (TDD)

**Files:**
- Create: `src/lib/team-balancer.ts`
- Create: `src/__tests__/team-balancer.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// src/__tests__/team-balancer.test.ts
import { balanceTeams, getCombinations } from '@/lib/team-balancer';
import { PlayerData, HistoryEntry } from '@/types';

function makePlayer(id: string, score: number): PlayerData {
  return {
    gameName: id, tagLine: 'JP1', puuid: id,
    competitiveTier: 12, rankValue: score,
    performanceScore: 0, totalScore: score,
    topAgents: [], matchCount: 50,
    winRate: 0.5, avgKda: 2.0, isSmurf: false,
  };
}

describe('getCombinations', () => {
  it('returns correct combinations', () => {
    const result = getCombinations([1, 2, 3], 2);
    expect(result).toHaveLength(3);
    expect(result).toContainEqual([1, 2]);
    expect(result).toContainEqual([1, 3]);
    expect(result).toContainEqual([2, 3]);
  });

  it('handles k=0', () => {
    expect(getCombinations([1, 2], 0)).toEqual([[]]);
  });
});

describe('balanceTeams simple', () => {
  it('splits 4 players into 2 balanced teams', () => {
    const players = [
      makePlayer('a', 40), makePlayer('b', 30),
      makePlayer('c', 20), makePlayer('d', 10),
    ];
    const result = balanceTeams(players, 'simple');
    expect(result.teamA).toHaveLength(2);
    expect(result.teamB).toHaveLength(2);
    // best split: [40,10] vs [30,20] → diff=0
    expect(result.scoreDiff).toBe(0);
  });

  it('handles odd number of players (5)', () => {
    const players = [
      makePlayer('a', 10), makePlayer('b', 10),
      makePlayer('c', 10), makePlayer('d', 10), makePlayer('e', 10),
    ];
    const result = balanceTeams(players, 'simple');
    const total = result.teamA.length + result.teamB.length;
    expect(total).toBe(5);
    expect(Math.abs(result.teamA.length - result.teamB.length)).toBe(1);
  });
});

describe('balanceTeams no-repeat', () => {
  it('avoids previous teammates when possible', () => {
    const p1 = makePlayer('p1', 10);
    const p2 = makePlayer('p2', 10);
    const p3 = makePlayer('p3', 10);
    const p4 = makePlayer('p4', 10);
    const history: HistoryEntry = {
      teamAPuuids: ['p1', 'p2'],
      teamBPuuids: ['p3', 'p4'],
      timestamp: Date.now(),
    };
    // all scores equal, so no-repeat should prefer separating previous teammates
    const result = balanceTeams([p1, p2, p3, p4], 'no-repeat-simple', history);
    const teamAPuuids = result.teamA.map(p => p.puuid);
    const teamBPuuids = result.teamB.map(p => p.puuid);
    // p1 and p2 should NOT be on the same team
    const p1Team = teamAPuuids.includes('p1') ? 'A' : 'B';
    const p2Team = teamAPuuids.includes('p2') ? 'A' : 'B';
    expect(p1Team).not.toBe(p2Team);
  });
});
```

- [ ] **Step 2: Run test to confirm all fail**

```bash
npx jest src/__tests__/team-balancer.test.ts
```
Expected: All tests FAIL.

- [ ] **Step 3: Create src/lib/team-balancer.ts**

```typescript
// src/lib/team-balancer.ts
import { PlayerData, TeamMode, TeamResult, HistoryEntry } from '@/types';

export function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  const withHead = getCombinations(tail, k - 1).map(combo => [head, ...combo]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

function calcRepeatPenalty(
  teamA: PlayerData[],
  teamB: PlayerData[],
  history: HistoryEntry
): number {
  const prevA = new Set(history.teamAPuuids);
  const prevB = new Set(history.teamBPuuids);

  let penalty = 0;

  const checkTeam = (team: PlayerData[], prevTeam: Set<string>) => {
    const members = team.map(p => p.puuid).filter(id => prevTeam.has(id));
    if (members.length >= 2) {
      // count pairs of previous teammates now on same team
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          penalty += 5;
        }
      }
    }
  };

  checkTeam(teamA, prevA);
  checkTeam(teamA, prevB);
  checkTeam(teamB, prevA);
  checkTeam(teamB, prevB);

  return penalty;
}

export function balanceTeams(
  players: PlayerData[],
  mode: TeamMode,
  history?: HistoryEntry
): TeamResult {
  const n = players.length;
  const sizeA = Math.floor(n / 2);
  const combinations = getCombinations(players, sizeA);

  let bestResult: TeamResult | null = null;
  let bestEval = Infinity;

  for (const teamA of combinations) {
    const teamASet = new Set(teamA.map(p => p.puuid));
    const teamB = players.filter(p => !teamASet.has(p.puuid));

    const scoreA = teamA.reduce((s, p) => s + p.totalScore, 0);
    const scoreB = teamB.reduce((s, p) => s + p.totalScore, 0);
    const diff = Math.abs(scoreA - scoreB);

    let penalty = 0;
    if (history && (mode === 'no-repeat-simple' || mode === 'no-repeat-handicap')) {
      penalty = calcRepeatPenalty(teamA, teamB, history);
    }

    const evalScore = diff + penalty;
    if (evalScore < bestEval) {
      bestEval = evalScore;
      bestResult = { teamA, teamB, scoreDiff: diff };
    }
  }

  return bestResult!;
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx jest src/__tests__/team-balancer.test.ts
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/team-balancer.ts src/__tests__/team-balancer.test.ts
git commit -m "feat: team balancer with all 4 modes, tested"
```

---

## Task 5: Handicap Logic (TDD)

**Files:**
- Create: `src/lib/handicap.ts`
- Create: `src/__tests__/handicap.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// src/__tests__/handicap.test.ts
import { assignHandicaps, getHandicapStar } from '@/lib/handicap';
import { PlayerData, TeamResult } from '@/types';

function makePlayer(id: string, score: number): PlayerData {
  return {
    gameName: id, tagLine: 'JP1', puuid: id,
    competitiveTier: 12, rankValue: score,
    performanceScore: 0, totalScore: score,
    topAgents: [], matchCount: 50,
    winRate: 0.5, avgKda: 2.0, isSmurf: false,
  };
}

describe('getHandicapStar', () => {
  it('returns 1 for diff 5-9', () => {
    expect(getHandicapStar(5)).toBe(1);
    expect(getHandicapStar(9)).toBe(1);
  });
  it('returns 2 for diff 10-14', () => {
    expect(getHandicapStar(10)).toBe(2);
    expect(getHandicapStar(14)).toBe(2);
  });
  it('returns 3 for diff 15+', () => {
    expect(getHandicapStar(15)).toBe(3);
    expect(getHandicapStar(30)).toBe(3);
  });
  it('returns null for diff under 5', () => {
    expect(getHandicapStar(4)).toBeNull();
  });
});

describe('assignHandicaps', () => {
  it('assigns no handicap when score diff is small', () => {
    const result: TeamResult = {
      teamA: [makePlayer('a', 20), makePlayer('b', 10)],
      teamB: [makePlayer('c', 18), makePlayer('d', 12)],
      scoreDiff: 0,
    };
    const out = assignHandicaps(result);
    expect(out.teamA.every(p => !p.handicap)).toBe(true);
    expect(out.teamB.every(p => !p.handicap)).toBe(true);
  });

  it('assigns handicap to top player of stronger team when diff >= 5', () => {
    const result: TeamResult = {
      teamA: [makePlayer('a', 30), makePlayer('b', 10)],
      teamB: [makePlayer('c', 15), makePlayer('d', 10)],
      scoreDiff: 15, // teamA total=40, teamB total=25
    };
    const out = assignHandicaps(result);
    const handicappedA = out.teamA.filter(p => p.handicap);
    expect(handicappedA.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/__tests__/handicap.test.ts
```
Expected: All tests FAIL.

- [ ] **Step 3: Create src/lib/handicap.ts**

```typescript
// src/lib/handicap.ts
import { TeamResult, TeamResultWithHandicaps, PlayerWithHandicap } from '@/types';
import { pickRandomHandicap } from '@/data/handicaps';

export function getHandicapStar(scoreDiff: number): 1 | 2 | 3 | null {
  if (scoreDiff >= 15) return 3;
  if (scoreDiff >= 10) return 2;
  if (scoreDiff >= 5) return 1;
  return null;
}

function getHandicapCount(scoreDiff: number): number {
  if (scoreDiff >= 15) return 3;
  if (scoreDiff >= 10) return 2;
  if (scoreDiff >= 5) return 1;
  return 0;
}

export function assignHandicaps(result: TeamResult): TeamResultWithHandicaps {
  const { teamA, teamB, scoreDiff } = result;

  const scoreA = teamA.reduce((s, p) => s + p.totalScore, 0);
  const scoreB = teamB.reduce((s, p) => s + p.totalScore, 0);
  const strongerTeam = scoreA >= scoreB ? 'A' : 'B';

  const star = getHandicapStar(scoreDiff);
  const count = getHandicapCount(scoreDiff);

  const addHandicaps = (players: PlayerData[], isStronger: boolean): PlayerWithHandicap[] => {
    if (!star || !isStronger) return players.map(p => ({ ...p }));
    const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.map((p, i) => ({
      ...p,
      handicap: i < count ? pickRandomHandicap(star) : undefined,
    }));
  };

  return {
    teamA: addHandicaps(teamA, strongerTeam === 'A'),
    teamB: addHandicaps(teamB, strongerTeam === 'B'),
    scoreDiff,
  };
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx jest src/__tests__/handicap.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/handicap.ts src/__tests__/handicap.test.ts
git commit -m "feat: handicap assignment logic with tests"
```

---

## Task 6: History Management (TDD)

**Files:**
- Create: `src/lib/history.ts`
- Create: `src/__tests__/history.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// src/__tests__/history.test.ts
import { saveHistory, loadHistory, clearHistory } from '@/lib/history';
import { TeamResult, HistoryEntry } from '@/types';

const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function makeTeamResult(): TeamResult {
  const makePlayer = (id: string) => ({
    gameName: id, tagLine: 'JP1', puuid: id,
    competitiveTier: 12, rankValue: 10,
    performanceScore: 0.5, totalScore: 12,
    topAgents: [], matchCount: 50,
    winRate: 0.5, avgKda: 2.0, isSmurf: false,
  });
  return {
    teamA: [makePlayer('p1'), makePlayer('p2')],
    teamB: [makePlayer('p3'), makePlayer('p4')],
    scoreDiff: 0,
  };
}

describe('history', () => {
  beforeEach(() => { clearHistory(); });

  it('returns null when no history', () => {
    expect(loadHistory()).toBeNull();
  });

  it('saves and loads history', () => {
    const result = makeTeamResult();
    saveHistory(result);
    const loaded = loadHistory();
    expect(loaded).not.toBeNull();
    expect(loaded!.teamAPuuids).toEqual(['p1', 'p2']);
    expect(loaded!.teamBPuuids).toEqual(['p3', 'p4']);
  });

  it('overwrites previous history with new save', () => {
    const result1 = makeTeamResult();
    saveHistory(result1);
    const result2: TeamResult = {
      teamA: [{ ...result1.teamA[0], puuid: 'x1' }],
      teamB: [{ ...result1.teamB[0], puuid: 'x2' }],
      scoreDiff: 0,
    };
    saveHistory(result2);
    const loaded = loadHistory();
    expect(loaded!.teamAPuuids).toEqual(['x1']);
  });

  it('clears history', () => {
    saveHistory(makeTeamResult());
    clearHistory();
    expect(loadHistory()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm they fail**

```bash
npx jest src/__tests__/history.test.ts
```
Expected: All tests FAIL.

- [ ] **Step 3: Create src/lib/history.ts**

```typescript
// src/lib/history.ts
import { TeamResult, HistoryEntry } from '@/types';

const HISTORY_KEY = 'valo-custom-history';

export function saveHistory(result: TeamResult): void {
  const entry: HistoryEntry = {
    teamAPuuids: result.teamA.map(p => p.puuid),
    teamBPuuids: result.teamB.map(p => p.puuid),
    timestamp: Date.now(),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entry));
}

export function loadHistory(): HistoryEntry | null {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HistoryEntry;
  } catch {
    return null;
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx jest src/__tests__/history.test.ts
```
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/history.ts src/__tests__/history.test.ts
git commit -m "feat: localStorage history management with tests"
```

---

## Task 7: Riot API Client

**Files:**
- Create: `src/lib/riot-api.ts`

- [ ] **Step 1: Create src/lib/riot-api.ts**

```typescript
// src/lib/riot-api.ts
// SERVER-SIDE ONLY — do not import in client components

import { AgentInfo, PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcPerformanceScore, calcTotalScore, detectSmurf } from '@/lib/scoring';

const API_KEY = process.env.RIOT_API_KEY!;
const ACCOUNT_BASE = 'https://asia.api.riotgames.com';
const MATCH_BASE = 'https://ap.api.riotgames.com';
const AGENT_API = 'https://valorant-api.com/v1/agents?isPlayableCharacter=true';

interface RiotMatchListEntry {
  matchId: string;
  gameStartTimeMillis: number;
  queueId: string;
}

interface RiotMatchPlayer {
  puuid: string;
  characterId: string;
  teamId: string;
  competitiveTier: number;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
  };
}

interface RiotTeam {
  teamId: string;
  won: boolean;
}

interface RiotRoundPlayerStat {
  puuid: string;
  damage: Array<{ headshots: number; bodyshots: number; legshots: number }>;
}

interface RiotMatch {
  matchInfo: { matchId: string; queueId: string };
  players: RiotMatchPlayer[];
  teams: RiotTeam[];
  roundResults: Array<{ playerStats: RiotRoundPlayerStat[] }>;
}

async function riotFetch(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': API_KEY },
      next: { revalidate: 0 },
    });
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '2');
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }
    return res;
  }
  throw new Error('Rate limit exceeded after 3 retries');
}

async function getPuuid(gameName: string, tagLine: string): Promise<string> {
  const url = `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await riotFetch(url);
  if (!res.ok) throw new Error(`Player not found: ${gameName}#${tagLine}`);
  const data = await res.json();
  return data.puuid;
}

async function getMatchIds(puuid: string): Promise<string[]> {
  const url = `${MATCH_BASE}/val/match/v1/matchlists/by-puuid/${puuid}`;
  const res = await riotFetch(url);
  if (!res.ok) throw new Error('Failed to fetch match list');
  const data = await res.json();
  const history: RiotMatchListEntry[] = data.history ?? [];
  const competitive = history.filter(m => m.queueId === 'competitive');
  return competitive.slice(0, 50).map(m => m.matchId);
}

async function getMatchDetail(matchId: string): Promise<RiotMatch> {
  const url = `${MATCH_BASE}/val/match/v1/matches/${matchId}`;
  const res = await riotFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch match ${matchId}`);
  return res.json();
}

async function fetchMatchDetailsBatched(matchIds: string[]): Promise<RiotMatch[]> {
  const results: RiotMatch[] = [];
  const BATCH = 5;
  for (let i = 0; i < matchIds.length; i += BATCH) {
    const batch = matchIds.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(id => getMatchDetail(id)));
    results.push(...batchResults);
  }
  return results;
}

async function getAgentIconMap(): Promise<Record<string, AgentInfo>> {
  const res = await fetch(AGENT_API, { next: { revalidate: 3600 } });
  const data = await res.json();
  const map: Record<string, AgentInfo> = {};
  for (const agent of data.data) {
    map[agent.uuid.toLowerCase()] = {
      id: agent.uuid,
      name: agent.displayName,
      iconUrl: agent.displayIcon,
    };
  }
  return map;
}

function computeHeadshotRate(matches: RiotMatch[], puuid: string): number {
  let totalHS = 0, totalShots = 0;
  for (const match of matches) {
    for (const round of match.roundResults) {
      const pStat = round.playerStats.find(p => p.puuid === puuid);
      if (!pStat) continue;
      for (const dmg of pStat.damage) {
        totalHS += dmg.headshots;
        totalShots += dmg.headshots + dmg.bodyshots + dmg.legshots;
      }
    }
  }
  return totalShots > 0 ? totalHS / totalShots : 0;
}

export async function fetchPlayerData(gameName: string, tagLine: string): Promise<PlayerData> {
  const puuid = await getPuuid(gameName, tagLine);
  const matchIds = await getMatchIds(puuid);
  const matchCount = matchIds.length;

  if (matchCount === 0) {
    return {
      gameName, tagLine, puuid,
      competitiveTier: 0, rankValue: 0,
      performanceScore: 0, totalScore: 0,
      topAgents: [], matchCount: 0,
      winRate: 0, avgKda: 0, isSmurf: false,
    };
  }

  const matches = await fetchMatchDetailsBatched(matchIds);
  const agentMap = await getAgentIconMap();

  let wins = 0;
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  const agentUsage: Record<string, number> = {};
  let latestTier = 0;

  for (const match of matches) {
    const player = match.players.find(p => p.puuid === puuid);
    if (!player) continue;

    const team = match.teams.find(t => t.teamId === player.teamId);
    if (team?.won) wins++;

    totalKills += player.stats.kills;
    totalDeaths += player.stats.deaths;
    totalAssists += player.stats.assists;

    const agentId = player.characterId.toLowerCase();
    agentUsage[agentId] = (agentUsage[agentId] ?? 0) + 1;

    if (player.competitiveTier > latestTier) latestTier = player.competitiveTier;
  }

  const winRate = wins / matches.length;
  const avgKda = (totalKills + totalAssists) / Math.max(totalDeaths, 1);
  const hsRate = computeHeadshotRate(matches, puuid);
  const performanceScore = calcPerformanceScore(avgKda, hsRate, winRate);
  const rankValue = RANK_VALUES[latestTier] ?? 0;
  const totalScore = calcTotalScore(rankValue, performanceScore);

  const topAgents = Object.entries(agentUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => agentMap[id] ?? { id, name: id, iconUrl: '' });

  return {
    gameName, tagLine, puuid,
    competitiveTier: latestTier,
    rankValue,
    performanceScore,
    totalScore,
    topAgents,
    matchCount,
    winRate,
    avgKda,
    isSmurf: detectSmurf(matchCount, winRate, avgKda),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/riot-api.ts
git commit -m "feat: server-side Riot API client with rate limit retry"
```

---

## Task 8: Player API Route

**Files:**
- Create: `src/app/api/player/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/player/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlayerData } from '@/lib/riot-api';

export async function POST(req: NextRequest) {
  try {
    const { gameName, tagLine } = await req.json();

    if (!gameName || !tagLine) {
      return NextResponse.json({ error: 'gameName and tagLine are required' }, { status: 400 });
    }

    const playerData = await fetchPlayerData(
      gameName.trim(),
      tagLine.trim()
    );

    return NextResponse.json(playerData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test the route manually**

Start the dev server:
```bash
npm run dev
```

Test with curl (substitute a real player name):
```bash
curl -X POST http://localhost:3000/api/player \
  -H "Content-Type: application/json" \
  -d '{"gameName":"TestPlayer","tagLine":"JP1"}'
```
Expected: JSON with player data or error message.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/player/route.ts
git commit -m "feat: player data API route"
```

---

## Task 9: Player Input UI

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/PlayerInputForm.tsx`
- Create: `src/components/PlayerCard.tsx`

- [ ] **Step 1: Set up globals.css with VALORANT theme**

Replace the contents of `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0F1923;
  --red: #FF4655;
  --white: #ECE8E1;
  --gray: #768079;
  --panel: #1a2530;
}

body {
  background-color: var(--bg);
  color: var(--white);
  font-family: 'DIN Next', 'Rajdhani', ui-sans-serif, system-ui, sans-serif;
}

@layer components {
  .valo-btn {
    @apply bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-6 uppercase tracking-widest transition-colors duration-150;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .valo-btn-outline {
    @apply border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold py-2 px-6 uppercase tracking-widest transition-colors duration-150;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .valo-panel {
    @apply bg-[#1a2530] border border-[#2a3540] p-4;
  }
  .valo-input {
    @apply bg-[#0F1923] border border-[#2a3540] text-white px-3 py-2 focus:border-red-500 outline-none w-full;
  }
}
```

- [ ] **Step 2: Update tailwind.config.ts to include VALORANT colors**

Open `tailwind.config.ts` and verify `content` includes `./src/**/*.{ts,tsx}`. Add to the `theme.extend`:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        valo: {
          bg: '#0F1923',
          red: '#FF4655',
          white: '#ECE8E1',
          gray: '#768079',
          panel: '#1a2530',
        },
      },
      fontFamily: {
        valo: ['Rajdhani', 'DIN Next', 'ui-sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 3: Create PlayerCard component**

```tsx
// src/components/PlayerCard.tsx
'use client';
import { PlayerData } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE } from '@/data/ranks';
import Image from 'next/image';

interface Props {
  player: PlayerData;
  onRemove?: () => void;
}

export function PlayerCard({ player, onRemove }: Props) {
  const rankName = RANK_NAMES[player.competitiveTier] ?? 'アンランク';
  const rankIconUrl = `${RANK_ICON_BASE}${player.competitiveTier}/smallicon.png`;

  return (
    <div className="valo-panel relative flex items-center gap-3">
      {player.isSmurf && (
        <span className="absolute top-2 right-2 text-yellow-400 text-xs font-bold bg-yellow-900/40 px-1 rounded">
          ⚠ サブ垢疑惑
        </span>
      )}
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
          <span className="text-valo-gray text-sm">#{player.tagLine}</span>
        </p>
        <p className="text-red-400 text-sm">{rankName}</p>
        <p className="text-valo-gray text-xs">
          スコア: {player.totalScore.toFixed(1)} | KDA: {player.avgKda.toFixed(2)} | 勝率: {(player.winRate * 100).toFixed(0)}%
        </p>
      </div>
      <div className="flex gap-1">
        {player.topAgents.map(agent => (
          <Image
            key={agent.id}
            src={agent.iconUrl}
            alt={agent.name}
            width={28}
            height={28}
            title={agent.name}
            className="rounded-full"
            unoptimized
          />
        ))}
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-valo-gray hover:text-red-400 text-xl ml-1 flex-shrink-0"
          aria-label="削除"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create PlayerInputForm component**

```tsx
// src/components/PlayerInputForm.tsx
'use client';
import { useState } from 'react';
import { PlayerData } from '@/types';
import { PlayerCard } from './PlayerCard';

interface Props {
  players: PlayerData[];
  onPlayersChange: (players: PlayerData[]) => void;
  onNext: () => void;
}

export function PlayerInputForm({ players, onPlayersChange, onNext }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed.includes('#')) {
      setError('形式: ゲーム名#タグ (例: Player#JP1)');
      return;
    }
    const [gameName, tagLine] = trimmed.split('#');
    if (!gameName || !tagLine) {
      setError('ゲーム名とタグを正しく入力してください');
      return;
    }
    if (players.length >= 10) {
      setError('最大10人まで追加できます');
      return;
    }
    if (players.some(p => p.gameName === gameName && p.tagLine === tagLine)) {
      setError('このプレイヤーは既に追加されています');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName, tagLine }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました');
      onPlayersChange([...players, data]);
      setInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-white">
        プレイヤー追加
        <span className="text-valo-gray text-base ml-2 normal-case tracking-normal">
          ({players.length}/10)
        </span>
      </h2>

      <div className="flex gap-2">
        <input
          className="valo-input flex-1"
          placeholder="ゲーム名#タグ (例: Player#JP1)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          disabled={loading}
        />
        <button
          className="valo-btn"
          onClick={handleAdd}
          disabled={loading || players.length >= 10}
        >
          {loading ? '取得中...' : '追加'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-2">
        {players.map(p => (
          <PlayerCard
            key={p.puuid}
            player={p}
            onRemove={() => onPlayersChange(players.filter(x => x.puuid !== p.puuid))}
          />
        ))}
      </div>

      {players.length >= 2 && (
        <button className="valo-btn w-full mt-4" onClick={onNext}>
          チーム分けへ →
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css tailwind.config.ts src/components/PlayerCard.tsx src/components/PlayerInputForm.tsx
git commit -m "feat: player input UI with VALORANT theme"
```

---

## Task 10: Mode Selector & App State

**Files:**
- Create: `src/components/ModeSelector.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create ModeSelector component**

```tsx
// src/components/ModeSelector.tsx
'use client';
import { TeamMode } from '@/types';

interface ModeCardProps {
  mode: TeamMode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function ModeCard({ title, description, selected, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`valo-panel text-left transition-colors duration-150 w-full ${
        selected ? 'border-red-500' : 'hover:border-gray-500'
      }`}
    >
      <p className="font-bold text-white uppercase tracking-wider">{title}</p>
      <p className="text-valo-gray text-sm mt-1">{description}</p>
    </button>
  );
}

interface Props {
  selected: TeamMode;
  onSelect: (mode: TeamMode) => void;
  onConfirm: () => void;
}

const MODES: { mode: TeamMode; title: string; description: string }[] = [
  { mode: 'simple', title: 'シンプル', description: 'ランクとパフォーマンスで最も均等なチームに分割' },
  { mode: 'handicap', title: 'ハンデあり', description: '均等分割後、強いプレイヤーにハンデを付与' },
  { mode: 'no-repeat-simple', title: '前回被り少なめ', description: '前回同チームだった人が同じチームにならないよう考慮' },
  { mode: 'no-repeat-handicap', title: '前回被り少なめ + ハンデ', description: '前回被り考慮 + 強いプレイヤーにハンデ付与' },
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
            mode={mode}
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
```

- [ ] **Step 2: Rewrite src/app/page.tsx with app state machine**

```tsx
// src/app/page.tsx
'use client';
import { useState } from 'react';
import { PlayerData, TeamMode, TeamResult, TeamResultWithHandicaps, BanState } from '@/types';
import { balanceTeams } from '@/lib/team-balancer';
import { assignHandicaps } from '@/lib/handicap';
import { loadHistory, saveHistory } from '@/lib/history';
import { PlayerInputForm } from '@/components/PlayerInputForm';
import { ModeSelector } from '@/components/ModeSelector';
import { TeamResult as TeamResultComponent } from '@/components/TeamResult';
import { BanPhase } from '@/components/BanPhase';

type AppStep = 'input' | 'mode' | 'result' | 'ban';

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
    const withHandicaps = (mode === 'handicap' || mode === 'no-repeat-handicap')
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

  function handleReShuffle() {
    handleRunBalance();
  }

  return (
    <main className="min-h-screen bg-valo-bg p-4 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-widest text-white">
          VALO<span className="text-red-500">CUSTOM</span>
        </h1>
        <p className="text-valo-gray text-sm">カスタムマッチ チームバランサー</p>
      </div>

      {step === 'input' && (
        <PlayerInputForm
          players={players}
          onPlayersChange={setPlayers}
          onNext={() => setStep('mode')}
        />
      )}

      {step === 'mode' && (
        <>
          <button className="text-valo-gray mb-4 text-sm hover:text-white" onClick={() => setStep('input')}>
            ← プレイヤー編集に戻る
          </button>
          <ModeSelector
            selected={mode}
            onSelect={setMode}
            onConfirm={handleRunBalance}
          />
        </>
      )}

      {step === 'result' && resultWithHandicaps && (
        <TeamResultComponent
          result={resultWithHandicaps}
          onSaveAndBan={handleSaveAndBan}
          onReshuffle={handleReShuffle}
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
  );
}
```

- [ ] **Step 3: Update src/app/layout.tsx with footer**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VALO CUSTOM — チームバランサー',
  description: 'VALORANTカスタムマッチ用チーム分けツール',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <footer className="mt-16 py-6 border-t border-[#2a3540] text-center text-xs text-valo-gray px-4">
          <p>
            このサイトはRiot Gamesが承認・後援・運営するものではなく、Riot Gamesおよびそのコンテンツ制作に関与した者の見解や意見を反映するものではありません。
            VALORANT及び関連するすべての名称・マーク・画像はRiot Games, Inc.の商標または登録商標です。
          </p>
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ModeSelector.tsx src/app/page.tsx src/app/layout.tsx
git commit -m "feat: mode selector and app state machine"
```

---

## Task 11: Team Result UI

**Files:**
- Create: `src/components/TeamResult.tsx`
- Create: `src/components/HandicapBadge.tsx`
- Create: `src/components/MapRoulette.tsx`

- [ ] **Step 1: Create HandicapBadge component**

```tsx
// src/components/HandicapBadge.tsx
import { HandicapItem } from '@/types';

interface Props {
  handicap: HandicapItem;
}

const STAR_COLORS = { 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-red-400' };

export function HandicapBadge({ handicap }: Props) {
  return (
    <div className="mt-2 bg-black/30 border border-white/10 rounded px-2 py-1">
      <span className={`font-bold ${STAR_COLORS[handicap.star]}`}>
        {'★'.repeat(handicap.star)}
      </span>
      <span className="text-white text-sm ml-2">{handicap.description}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create MapRoulette component**

```tsx
// src/components/MapRoulette.tsx
'use client';
import { useState } from 'react';
import { getRandomMap, MapInfo } from '@/data/maps';
import Image from 'next/image';

export function MapRoulette() {
  const [map, setMap] = useState<MapInfo | null>(null);

  return (
    <div className="valo-panel space-y-3">
      <button className="valo-btn-outline w-full" onClick={() => setMap(getRandomMap())}>
        🎲 ランダムマップ
      </button>
      {map && (
        <div className="text-center space-y-2">
          <p className="text-white font-bold text-xl uppercase tracking-widest">{map.displayName}</p>
          <Image
            src={map.imageUrl}
            alt={map.displayName}
            width={400}
            height={200}
            className="w-full object-cover rounded"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create TeamResult component**

```tsx
// src/components/TeamResult.tsx
'use client';
import { TeamResultWithHandicaps, PlayerWithHandicap } from '@/types';
import { RANK_NAMES, RANK_ICON_BASE } from '@/data/ranks';
import { HandicapBadge } from './HandicapBadge';
import { MapRoulette } from './MapRoulette';
import Image from 'next/image';

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
        <div className="flex-1">
          <p className="text-white font-bold">
            {player.gameName}
            <span className="text-valo-gray text-xs">#{player.tagLine}</span>
            {player.isSmurf && <span className="ml-2 text-yellow-400 text-xs">⚠ サブ垢</span>}
          </p>
          <p className="text-valo-gray text-xs">{rankName} | スコア: {player.totalScore.toFixed(1)}</p>
        </div>
        <div className="flex gap-1">
          {player.topAgents.map(a => (
            <Image key={a.id} src={a.iconUrl} alt={a.name} width={22} height={22} className="rounded-full" unoptimized />
          ))}
        </div>
      </div>
      {player.handicap && <HandicapBadge handicap={player.handicap} />}
    </div>
  );
}

interface Props {
  result: TeamResultWithHandicaps;
  onSaveAndBan: () => void;
  onReshuffle: () => void;
  onBack: () => void;
  bansPerTeam: number;
  onBansPerTeamChange: (n: number) => void;
}

export function TeamResult({ result, onSaveAndBan, onReshuffle, onBack, bansPerTeam, onBansPerTeamChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">チーム分け結果</h2>
        <button className="text-valo-gray text-sm hover:text-white" onClick={onBack}>← 戻る</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="valo-panel border-t-2 border-blue-500">
          <h3 className="text-blue-400 font-bold uppercase tracking-wider mb-2">チーム A</h3>
          {result.teamA.map(p => <PlayerRow key={p.puuid} player={p} />)}
        </div>
        <div className="valo-panel border-t-2 border-red-500">
          <h3 className="text-red-400 font-bold uppercase tracking-wider mb-2">チーム B</h3>
          {result.teamB.map(p => <PlayerRow key={p.puuid} player={p} />)}
        </div>
      </div>

      <p className="text-center text-valo-gray text-sm">
        スコア差: <span className="text-white font-bold">{result.scoreDiff.toFixed(1)}</span>
      </p>

      <MapRoulette />

      <div className="valo-panel flex items-center gap-3">
        <span className="text-white text-sm">BANフェーズのBAN数（1チームあたり）:</span>
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onClick={() => onBansPerTeamChange(n)}
            className={`w-8 h-8 font-bold border transition-colors ${
              bansPerTeam === n ? 'border-red-500 text-red-400' : 'border-gray-600 text-gray-400 hover:border-gray-400'
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

- [ ] **Step 4: Commit**

```bash
git add src/components/TeamResult.tsx src/components/HandicapBadge.tsx src/components/MapRoulette.tsx
git commit -m "feat: team result UI with handicap badges and map roulette"
```

---

## Task 12: BAN Phase UI

**Files:**
- Create: `src/components/BanPhase.tsx`

- [ ] **Step 1: Fetch agent list hook**

The BanPhase needs the full agent list. Create a utility to fetch from valorant-api.com:

```tsx
// src/components/BanPhase.tsx
'use client';
import { useState, useEffect } from 'react';
import { TeamResultWithHandicaps, AgentInfo } from '@/types';
import Image from 'next/image';

interface Props {
  result: TeamResultWithHandicaps;
  bansPerTeam: number;
  onComplete: () => void;
}

interface AgentApiItem {
  uuid: string;
  displayName: string;
  displayIcon: string;
}

export function BanPhase({ result, bansPerTeam, onComplete }: Props) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());
  const [currentTeam, setCurrentTeam] = useState<'A' | 'B'>('A');
  const [teamABans, setTeamABans] = useState(0);
  const [teamBBans, setTeamBBans] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true')
      .then(r => r.json())
      .then(data => {
        const list: AgentInfo[] = (data.data as AgentApiItem[]).map(a => ({
          id: a.uuid,
          name: a.displayName,
          iconUrl: a.displayIcon,
        }));
        setAgents(list.sort((a, b) => a.name.localeCompare(b.name)));
      });
  }, []);

  function handleBan(agent: AgentInfo) {
    if (bannedIds.has(agent.id) || done) return;

    const newBanned = new Set(bannedIds);
    newBanned.add(agent.id);
    setBannedIds(newBanned);

    let newABans = teamABans;
    let newBBans = teamBBans;
    if (currentTeam === 'A') newABans++;
    else newBBans++;

    setTeamABans(newABans);
    setTeamBBans(newBBans);

    if (newABans >= bansPerTeam && newBBans >= bansPerTeam) {
      setDone(true);
      return;
    }

    // Alternate teams
    if (currentTeam === 'A' && newABans < bansPerTeam) {
      setCurrentTeam('B');
    } else if (currentTeam === 'B' && newBBans < bansPerTeam) {
      setCurrentTeam('A');
    } else if (currentTeam === 'A') {
      setCurrentTeam('B');
    } else {
      setCurrentTeam('A');
    }
  }

  const bannedAgents = agents.filter(a => bannedIds.has(a.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-white">BANフェーズ</h2>
      </div>

      {!done ? (
        <div className="valo-panel text-center">
          <p className="text-white text-lg font-bold">
            <span className={currentTeam === 'A' ? 'text-blue-400' : 'text-red-400'}>
              チーム {currentTeam}
            </span> がBANを選択
          </p>
          <p className="text-valo-gray text-sm mt-1">
            チームA: {teamABans}/{bansPerTeam} | チームB: {teamBBans}/{bansPerTeam}
          </p>
        </div>
      ) : (
        <div className="valo-panel text-center">
          <p className="text-green-400 font-bold">BANフェーズ完了！</p>
        </div>
      )}

      {bannedAgents.length > 0 && (
        <div className="valo-panel">
          <p className="text-valo-gray text-sm mb-2 uppercase tracking-wider">BANされたエージェント</p>
          <div className="flex flex-wrap gap-2">
            {bannedAgents.map(a => (
              <div key={a.id} className="flex flex-col items-center opacity-50">
                <Image src={a.iconUrl} alt={a.name} width={40} height={40} className="grayscale" unoptimized />
                <span className="text-xs text-valo-gray">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
        {agents.map(agent => {
          const isBanned = bannedIds.has(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => handleBan(agent)}
              disabled={isBanned || done}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-opacity ${
                isBanned ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
              title={agent.name}
            >
              <Image
                src={agent.iconUrl}
                alt={agent.name}
                width={48}
                height={48}
                className={isBanned ? 'grayscale' : ''}
                unoptimized
              />
              <span className="text-xs text-valo-gray text-center leading-tight">{agent.name}</span>
            </button>
          );
        })}
      </div>

      {done && (
        <button className="valo-btn w-full" onClick={onComplete}>
          最初に戻る
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BanPhase.tsx
git commit -m "feat: agent BAN phase UI"
```

---

## Task 13: next.config & image domains

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Allow external image domains**

Next.js requires explicit allowlist for external images:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.valorant-api.com' },
      { protocol: 'https', hostname: 'valorant-api.com' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Run dev server and verify images load**

```bash
npm run dev
```
Open http://localhost:3000. Enter a test player name and verify rank icon and agent icons appear.

- [ ] **Step 3: Run all tests**

```bash
npx jest
```
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: allow valorant-api.com image domains"
```

---

## Task 14: Render Deployment

**Files:**
- Create: `render.yaml`

- [ ] **Step 1: Create render.yaml**

```yaml
# render.yaml
services:
  - type: web
    name: valo-custom
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: RIOT_API_KEY
        sync: false
      - key: NODE_ENV
        value: production
```

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/valo-custom.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Deploy on Render**

1. https://dashboard.render.com → "New Web Service"
2. Connect GitHub repo
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment variable: `RIOT_API_KEY` = your key
6. Click "Deploy"

- [ ] **Step 4: Verify production URL works**

Open the Render-provided URL, add a player, run team balancing, verify all features work.

---

## Progress Checkpoint

Save current state to `docs/superpowers/progress.md` if context limit is approaching (see memory: feedback_token_limit).

### Summary of all tasks:
- [x] Task 1: Project setup
- [x] Task 2: Types & static data
- [x] Task 3: Scoring logic (TDD)
- [x] Task 4: Team balancer (TDD)
- [x] Task 5: Handicap logic (TDD)
- [x] Task 6: History management (TDD)
- [x] Task 7: Riot API client
- [x] Task 8: Player API route
- [x] Task 9: Player input UI
- [x] Task 10: Mode selector & app state
- [x] Task 11: Team result UI
- [x] Task 12: BAN phase UI
- [x] Task 13: next.config & image domains
- [x] Task 14: Render deployment
