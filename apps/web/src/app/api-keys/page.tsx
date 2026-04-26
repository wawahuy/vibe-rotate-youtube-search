'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

interface ApiKey {
  _id: string;
  key: string;
  provider: string;
  status: string;
  quotaUsed: number;
  quotaLimit: number;
  resetAt: string | null;
  label: string;
}

const emptyForm = { key: '', provider: 'youtube', label: '' };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState<string>('');
  const [error, setError] = useState('');

  async function fetchKeys() {
    const res = await api.get('/api/api-keys');
    setKeys(res.data);
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerifyInfo('Verifying key with provider...');
    try {
      if (editId) {
        const res = await api.put(`/api/api-keys/${editId}`, form);
        setVerifyInfo(res.data?.detail || '');
      } else {
        const res = await api.post('/api/api-keys', form);
        setVerifyInfo(`Quota loaded: ${res.data?.quotaLimit?.toLocaleString()} units${res.data?.detail ? ' — ' + res.data.detail : ''}`);
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchKeys();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save key');
      setVerifyInfo('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this API key?')) return;
    await api.delete(`/api/api-keys/${id}`);
    fetchKeys();
  }

  async function handleReset(id: string) {
    await api.post(`/api/api-keys/${id}/reset`);
    fetchKeys();
  }

  function startEdit(k: ApiKey) {
    setForm({ key: '', provider: k.provider, label: k.label });
    setEditId(k._id);
    setShowForm(true);
    setVerifyInfo('');
    setError('');
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Provider API Keys</h1>
          <button
            onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); setVerifyInfo(''); setError(''); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + Add Key
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">{editId ? 'Edit' : 'Add'} API Key</h2>
            <p className="text-xs text-gray-500 mb-4">Quota limit is automatically loaded from the provider when you save.</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-1">API Key {editId && <span className="text-gray-400">(leave blank to keep)</span>}</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  required={!editId}
                  className="w-full border rounded px-3 py-2 text-sm font-mono"
                  placeholder="Enter API key..."
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="youtube">YouTube Data API</option>
                  <option value="serpapi">SerpAPI</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Optional label"
                />
              </div>
              {verifyInfo && <p className="col-span-2 text-sm text-blue-600 bg-blue-50 rounded px-3 py-2">{verifyInfo}</p>}
              {error && <p className="col-span-2 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying & Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Label</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Quota Used</th>
                <th className="px-4 py-3 text-left">Reset At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{k.label || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${k.provider === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {k.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{k.key}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${k.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((k.quotaUsed / k.quotaLimit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{k.quotaUsed}/{k.quotaLimit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {k.resetAt ? new Date(k.resetAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(k)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      {k.status === 'exhausted' && (
                        <button onClick={() => handleReset(k._id)} className="text-green-600 hover:underline text-xs">Reset</button>
                      )}
                      <button onClick={() => handleDelete(k._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No keys found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
