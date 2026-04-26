'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

interface UserKey {
  _id: string;
  key: string;
  label: string;
  status: string;
  createdAt: string;
}

export default function UserKeysPage() {
  const [keys, setKeys] = useState<UserKey[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null); // shown once

  async function fetchKeys() {
    const res = await api.get('/api/user-keys');
    setKeys(res.data);
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/user-keys', { label });
      setNewKey(res.data.key); // show only once
      setLabel('');
      fetchKeys();
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this key? It will no longer work.')) return;
    await api.post(`/api/user-keys/${id}/revoke`);
    fetchKeys();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this key?')) return;
    await api.delete(`/api/user-keys/${id}`);
    fetchKeys();
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">User API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Distribute these keys to users. They can call <code className="bg-gray-100 px-1 rounded">/api/search</code> and <code className="bg-gray-100 px-1 rounded">/api/video-info</code> using the <code className="bg-gray-100 px-1 rounded">x-api-key</code> header.
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1">Label / Description</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My App, Client A..."
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Generating...' : '+ Generate Key'}
          </button>
        </form>

        {/* New key alert */}
        {newKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-green-700 mb-2">Key generated! Copy it now — it will not be shown again.</p>
            <div className="flex gap-3 items-center">
              <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono text-gray-800 break-all">{newKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(newKey); }}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 whitespace-nowrap"
              >
                Copy
              </button>
              <button onClick={() => setNewKey(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
          </div>
        )}

        {/* Keys table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Key (masked)</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{k.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {k.key.slice(0, 10)}••••••••
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${k.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(k.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {k.status === 'active' && (
                        <button onClick={() => handleRevoke(k._id)} className="text-yellow-600 hover:underline text-xs">Revoke</button>
                      )}
                      <button onClick={() => handleDelete(k._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No user keys yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
