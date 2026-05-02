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

  return (
    <>
      {/* Left agent */}
      <div className="fixed left-0 bottom-0 w-56 xl:w-64 pointer-events-none select-none hidden lg:block"
        style={{ zIndex: 0 }}>
        <div style={{ opacity: 0.18, maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)' }}>
          <Image
            src={portraitUrl(pair[0].uuid)}
            alt={pair[0].name}
            width={256}
            height={512}
            className="w-full h-auto object-contain object-bottom"
            unoptimized
            priority={false}
          />
        </div>
      </div>

      {/* Right agent */}
      <div className="fixed right-0 bottom-0 w-56 xl:w-64 pointer-events-none select-none hidden lg:block"
        style={{ zIndex: 0 }}>
        <div style={{ opacity: 0.18, maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)', transform: 'scaleX(-1)' }}>
          <Image
            src={portraitUrl(pair[1].uuid)}
            alt={pair[1].name}
            width={256}
            height={512}
            className="w-full h-auto object-contain object-bottom"
            unoptimized
            priority={false}
          />
        </div>
      </div>
    </>
  );
}
