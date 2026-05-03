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
