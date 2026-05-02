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
    const hashIndex = trimmed.indexOf('#');
    const gameName = trimmed.slice(0, hashIndex);
    const tagLine = trimmed.slice(hashIndex + 1);

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
      onPlayersChange([...players, data as PlayerData]);
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
        <span className="text-[#768079] text-base ml-2 normal-case tracking-normal font-normal">
          ({players.length}/10)
        </span>
      </h2>

      <div className="flex gap-2">
        <input
          className="valo-input flex-1"
          placeholder="ゲーム名#タグ (例: Player#JP1)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAdd()}
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

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

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
        <button className="valo-btn w-full mt-2" onClick={onNext}>
          チーム分けへ →
        </button>
      )}
    </div>
  );
}
