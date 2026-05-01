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
