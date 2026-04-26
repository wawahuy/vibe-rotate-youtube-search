'use client';
import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface UsageData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  byProvider: Record<string, number>;
  byStatus: Record<string, number>;
  hourlyStats: { time: string; count: number; success: number; failed: number }[];
  recentLogs: any[];
}

const STATUS_OPTIONS = ['', 'success', 'all_keys_exhausted'];
const PROVIDER_OPTIONS = ['', 'youtube', 'serpapi', 'none'];

function formatDateTimeLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function getDefaultEndDate() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return formatDateTimeLocal(end);
}

function getDefaultStartDateFromEnd(endDateTimeLocal: string) {
  const end = new Date(endDateTimeLocal);
  end.setDate(end.getDate() - 7);
  return formatDateTimeLocal(end);
}

export default function ReportPage() {
  const defaultEndDate = getDefaultEndDate();
  const defaultStartDate = getDefaultStartDateFromEnd(defaultEndDate);

  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 50 };
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (status) params.status = status;
      if (provider) params.provider = provider;
      const res = await api.get('/api/report/usage', { params });
      setData(res.data);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, status, provider]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    fetchData(1);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Usage Report</h1>

        {/* Filter bar */}
        <form onSubmit={handleFilter} className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-medium block mb-1 text-gray-600">From</label>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1 text-gray-600">To</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1 text-gray-600">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1 text-gray-600">Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
              {PROVIDER_OPTIONS.map((p) => <option key={p} value={p}>{p || 'All providers'}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">
            Apply
          </button>
          <button type="button" onClick={() => {
            const nextEnd = getDefaultEndDate();
            setEndDate(nextEnd);
            setStartDate(getDefaultStartDateFromEnd(nextEnd));
            setStatus('');
            setProvider('');
          }}
            className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50 text-gray-600">
            Reset
          </button>
        </form>

        {loading && <div className="text-center py-10 text-gray-400">Loading...</div>}

        {data && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{data.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Requests</p>
              </div>
              {Object.entries(data.byProvider).map(([prov, count]) => (
                <div key={prov} className="bg-white rounded-xl shadow p-5 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{(count as number).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{prov || 'none'}</p>
                </div>
              ))}
              <div className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-green-600">{data.byStatus['success'] ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Success</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-red-500">
                  {Object.entries(data.byStatus).filter(([s]) => s !== 'success').reduce((sum, [, v]) => sum + (v as number), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Failed</p>
              </div>
            </div>

            {/* Chart */}
            {data.hourlyStats.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold mb-4">Requests Over Time</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.hourlyStats} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#4ade80" name="Success" stackId="a" />
                    <Bar dataKey="failed" fill="#f87171" name="Failed" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Logs table with lazy pagination */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <span className="font-semibold">Logs</span>
                <span className="text-sm text-gray-500">Page {data.page} / {data.totalPages} ({data.total} total)</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Endpoint</th>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLogs.map((log, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{log.endpoint}</td>
                      <td className="px-4 py-2 text-sm">{log.providerUsed}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {data.recentLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No logs found</td></tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="px-6 py-4 border-t flex gap-2 items-center justify-center">
                  <button disabled={page <= 1} onClick={() => fetchData(page - 1)}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => fetchData(p)}
                        className={`px-3 py-1 border rounded text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    );
                  })}
                  {data.totalPages > 7 && <span className="text-gray-400 text-sm">...</span>}
                  <button disabled={page >= data.totalPages} onClick={() => fetchData(page + 1)}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
