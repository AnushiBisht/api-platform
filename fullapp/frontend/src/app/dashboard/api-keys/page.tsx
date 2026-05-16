'use client';
import { useEffect, useState } from 'react';
import { Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

interface ApiKey {
  id: string;
  label: string;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys]           = useState<ApiKey[]>([]);
  const [label, setLabel]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [newKey, setNewKey]       = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [error, setError]         = useState('');

  const fetchKeys = async () => {
    const res = await api.get('/keys');
    setKeys(res.data.keys);
  };

  useEffect(() => {
    fetchKeys().finally(() => setLoading(false));
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await api.post('/keys/generate', { label });
      setNewKey(res.data.key);
      setLabel('');
      fetchKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate key');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this key? Any apps using it will break immediately.')) return;
    await api.delete(`/keys/${id}`);
    fetchKeys();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-gray-500 text-sm mt-1">Generate keys to call the API programmatically.</p>
      </div>

      {/* New key revealed */}
      {newKey && (
        <div className="bg-green-950 border border-green-800 rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-green-300 font-medium text-sm mb-1">⚠️ Copy this key now — it will never be shown again</p>
              <code className="text-green-200 text-xs break-all font-mono">{newKey}</code>
            </div>
            <button
              onClick={() => copy(newKey)}
              className="shrink-0 flex items-center gap-1.5 bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-medium text-green-100 transition"
            >
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-green-600 text-xs mt-3 hover:text-green-400">
            I've saved it, dismiss
          </button>
        </div>
      )}

      {/* Generate form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium mb-4">Generate new key</h2>
        <form onSubmit={generate} className="flex gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Production server, Local dev..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit" disabled={creating || !label.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <Plus size={15} />
            {creating ? 'Generating...' : 'Generate'}
          </button>
        </form>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Keys list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-medium">Active keys ({keys.length})</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">No keys yet. Generate your first one above.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-medium text-sm">{k.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    aip_••••••••••••••••  ·  Created {new Date(k.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => revoke(k.id)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 text-xs transition px-2 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  <Trash2 size={13} />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
