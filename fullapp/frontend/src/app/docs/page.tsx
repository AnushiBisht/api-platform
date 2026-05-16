'use client';
import { useState } from 'react';
import { Copy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const curlExample = `curl -X POST ${BASE}/api/summarize \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Paste your long text here (min 50 chars)..."}'`;

const jsExample = `const response = await fetch('${BASE}/api/summarize', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text: 'Your long text here...' }),
});

const { summary, latency_ms } = await response.json();
console.log(summary);`;

const pythonExample = `import requests

res = requests.post(
    '${BASE}/api/summarize',
    headers={'x-api-key': 'YOUR_API_KEY'},
    json={'text': 'Your long text here...'}
)

print(res.json()['summary'])`;

export default function DocsPage() {
  const [tab, setTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const code = { curl: curlExample, js: jsExample, python: pythonExample }[tab];

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">API Reference</h1>
          <p className="text-gray-500 text-sm mt-1">Everything you need to integrate the summarization API.</p>
        </div>

        <Section title="Endpoint">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono text-sm">
            <span className="text-green-400 font-semibold">POST</span>{' '}
            <span className="text-gray-300">{BASE}/api/summarize</span>
          </div>
        </Section>

        <Section title="Authentication">
          <p className="text-gray-400 text-sm mb-3">All requests require an API key passed in the header:</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono text-sm text-gray-300">
            x-api-key: aip_your_key_here
          </div>
        </Section>

        <Section title="Request body">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden text-sm">
            <div className="grid grid-cols-3 gap-0 border-b border-gray-800 text-xs font-medium text-gray-500 px-4 py-2">
              <span>Field</span><span>Type</span><span>Description</span>
            </div>
            <div className="grid grid-cols-3 gap-0 px-4 py-3 text-sm">
              <span className="font-mono text-indigo-400">text</span>
              <span className="text-gray-400">string</span>
              <span className="text-gray-400">Text to summarize (min 50 chars)</span>
            </div>
          </div>
        </Section>

        <Section title="Rate limits">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden text-sm">
            <div className="grid grid-cols-2 gap-0 border-b border-gray-800 text-xs font-medium text-gray-500 px-4 py-2">
              <span>Plan</span><span>Limit</span>
            </div>
            {[['FREE', '100 requests / day'], ['PRO', '2,000 requests / day']].map(([plan, lim]) => (
              <div key={plan} className="grid grid-cols-2 gap-0 px-4 py-3 border-b border-gray-800 last:border-0">
                <span className={plan === 'PRO' ? 'text-indigo-400 font-medium' : 'text-gray-300'}>{plan}</span>
                <span className="text-gray-400">{lim}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Code examples">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex gap-1">
                {(['curl', 'js', 'python'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {t === 'js' ? 'JavaScript' : t === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
              <button onClick={copy} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition">
                <Copy size={12} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">{code}</pre>
          </div>
        </Section>

        <Section title="Response">
          <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 leading-relaxed">{`{
  "summary": "AI-generated summary of your text.",
  "latency_ms": 843
}`}</pre>
        </Section>

        <Section title="Error codes">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden text-sm">
            {[
              ['400', 'Text too short (min 50 chars)'],
              ['401', 'Missing or invalid API key'],
              ['429', 'Rate limit exceeded'],
              ['503', 'ML service temporarily unavailable'],
            ].map(([code, msg]) => (
              <div key={code} className="flex gap-4 px-4 py-3 border-b border-gray-800 last:border-0">
                <span className="font-mono text-red-400 text-xs font-semibold w-8">{code}</span>
                <span className="text-gray-400 text-sm">{msg}</span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
