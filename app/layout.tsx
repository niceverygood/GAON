import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '가온 (Gaon) — 상조 플래너 AI 업무 플랫폼',
    template: '%s | 가온',
  },
  description:
    '엔딩 시나리오, 해약 방지 AI, 장례 실행 매니저. 상조 플래너를 위한 올인원 엔딩 플래닝 SaaS.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: '가온 (Gaon)',
    description: '삶의 마지막을 준비하는 가장 따뜻한 기술.',
    type: 'website',
    locale: 'ko_KR',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
