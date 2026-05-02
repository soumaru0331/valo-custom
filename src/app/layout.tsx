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
        <footer className="mt-16 py-6 border-t border-[#2a3540] text-center text-xs text-[#768079] px-4">
          <p>
            このサイトはRiot Gamesが承認・後援・運営するものではなく、Riot Gamesおよびそのコンテンツ制作に関与した者の見解や意見を反映するものではありません。
            VALORANT及び関連するすべての名称・マーク・画像はRiot Games, Inc.の商標または登録商標です。
          </p>
        </footer>
      </body>
    </html>
  );
}
