import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI API Platform',
  description: 'Text summarization API powered by HuggingFace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
