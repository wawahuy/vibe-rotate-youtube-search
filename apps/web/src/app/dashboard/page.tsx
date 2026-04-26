'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

interface VideoResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  duration: string;
}

export default function DashboardPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/search', { params: { q: query } });
      setResults(res.data.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">YouTube Search</h1>
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube videos..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="space-y-4">
          {results.map((v) => (
            <div key={v.videoId} className="bg-white rounded-xl shadow p-4 flex gap-4">
              <img
                src={v.thumbnail}
                alt={v.title}
                className="w-40 h-24 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <a
                  href={`https://youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline line-clamp-2"
                >
                  {v.title}
                </a>
                <p className="text-sm text-gray-500 mt-1">{v.channelTitle}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{v.description}</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>{v.viewCount?.toLocaleString()} views</span>
                  <span>{v.duration}</span>
                  <span>{new Date(v.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
