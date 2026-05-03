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
