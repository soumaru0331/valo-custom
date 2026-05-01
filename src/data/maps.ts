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
