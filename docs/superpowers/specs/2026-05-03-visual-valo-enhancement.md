# VALOCUSTOM ビジュアル強化（画像・キャラクター）設計ドキュメント

## 目標
valorant-api.com のエージェント全身画像・マップ画像を使い、サイト全体のVALO感を大幅に強化する。

## アーキテクチャ方針
- 新規: `HeroAgent.tsx`（ヘッダー専用エージェント画像）
- 新規: `MapBackground.tsx`（ページ全体背景マップ画像）
- 修正: `AgentDecorations.tsx`（opacity引き上げ）
- 修正: `PlayerCard.tsx`（アイコン拡大）
- 修正: `TeamResultView.tsx`（エージェント背景表示）
- 修正: `page.tsx`（HeroAgent・MapBackground統合）

## 画像アセット（valorant-api.com）
- エージェント全身: `https://media.valorant-api.com/agents/{uuid}/fullportrait.png`
- マップスプラッシュ: `https://media.valorant-api.com/maps/{uuid}/splash.png`
- 既に `next.config.js` の remotePatterns に `media.valorant-api.com` が設定済み

## マップUUID一覧（使用するもの）
- Ascent: `7eaecc1b-4337-bbf6-6ab9-04b8f06b3319`
- Haven: `2bee0dc9-4bbe-4166-96ae-12b28dd13769`
- Bind: `2c9d57ec-4431-9c5e-4a9a-9c51fffb8031`
- Split: `d960549e-485c-e861-8d71-aa9d1aed12a2`
- Icebox: `e2ad5c54-4114-a870-9641-8ea21279579a`
- Breeze: `2fb9a4fd-47b8-4e7d-a969-74b4046ebd53`（省略可）
- Fracture: `b529448b-4d60-346e-e89e-00a4c527a405`
- Pearl: `33bb57b4-0a14-547c-8e4b-4d3fdc3e5a32`
- Lotus: `2fe4ed3a-450a-948b-9716-769a1bda6cc3`
- Sunset: `92584fbe-486a-b1b2-9faa-39a27d1f7523`

---

## 1. HeroAgent.tsx（新規）

ヘッダー右側にランダムエージェントの全身画像を表示するコンポーネント。

```
VALOCUSTOM          [エージェント全身]
カスタムマッチ…      [グラデーションで消える]
```

- `useEffect` でマウント時にランダム選出
- `position: absolute`, `right: 0`, `bottom: 0`
- 高さ: `100%` (ヘッダーコンテナに合わせる)
- `opacity: 0.55`
- マスク: `linear-gradient(to left, black 40%, transparent 100%)` (右からフェードイン)
- 下マスク: `linear-gradient(to top, black 50%, transparent 100%)`
- PCのみ表示 (`hidden lg:block`)

使用エージェントUUID: AgentDecorationsと同じ15体のプール

---

## 2. MapBackground.tsx（新規）

ページ全体の固定背景にランダムマップ画像を表示。

- `position: fixed`, `inset: 0`, `z-index: 0`
- `object-fit: cover`, `width: 100%`, `height: 100%`
- `opacity: 0.06`
- マウント時にランダム選出（上記マップUUID10枚から）
- `pointer-events: none`

---

## 3. AgentDecorations.tsx（修正）

opacity `0.18` → `0.40` に引き上げ。
マスクのグラデーションも調整: `black 50%` → `black 60%`

---

## 4. PlayerCard.tsx（修正）

- ランクアイコン: `width={40} height={40}` → `width={48} height={48}`
- topAgents アイコン表示を `22px` → `32px` に拡大（TeamResultViewでも同様）

---

## 5. TeamResultView.tsx（修正）

PlayerRow に背景エージェント画像を追加:
- `player.topAgents[0]` が存在する場合、そのアイコンURLを行の右端背景に絶対配置
- `opacity: 0.08`, `width: 48px`, `height: 48px`
- `position: absolute`, `right: 4px`, `top: 50%`, `transform: translateY(-50%)`
- PlayerRow の外側div に `relative overflow-hidden` を追加

---

## 6. page.tsx（修正）

- `<MapBackground />` を最上位に追加（`<AgentDecorations />` の前）
- ヘッダーdivに `relative overflow-hidden min-h-[120px]` を追加
- `<HeroAgent />` をヘッダーdiv内に追加

---

## ファイル変更一覧

| ファイル | 変更種別 |
|---|---|
| `src/components/HeroAgent.tsx` | 新規作成 |
| `src/components/MapBackground.tsx` | 新規作成 |
| `src/components/AgentDecorations.tsx` | 修正（opacity引き上げ）|
| `src/components/PlayerCard.tsx` | 修正（アイコン拡大）|
| `src/components/TeamResultView.tsx` | 修正（エージェント背景）|
| `src/app/page.tsx` | 修正（MapBackground・HeroAgent統合）|
