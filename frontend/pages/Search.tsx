import React, { useEffect, useState, useRef } from 'react';
import { ApiService } from '../services/api';
import { PlotRecord } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../App';

export const Search: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isMounted = useRef(false);
  
  const [nodes, setNodes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [plots, setPlots] = useState<string[]>([]);

  // Initialize form from session storage or URL params
  const [form, setForm] = useState(() => {
    let initial = { node: '', sector: '', block: '', plot: '' };
    
    // 1. Try Session Storage
    try {
      const saved = sessionStorage.getItem('cidco_search_form');
      if (saved) {
        initial = { ...initial, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to read session storage", e);
    }

    // 2. URL Params Override
    if (searchParams.get('node')) initial.node = searchParams.get('node') || '';
    if (searchParams.get('sector')) initial.sector = searchParams.get('sector') || '';
    
    return initial;
  });

  const [results, setResults] = useState<PlotRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Save to Session Storage on change
  useEffect(() => {
    sessionStorage.setItem('cidco_search_form', JSON.stringify(form));
  }, [form]);

  // Load initial nodes
  useEffect(() => {
    ApiService.getNodes().then(setNodes);
    isMounted.current = true;
  }, []);

  // Cascade Node -> Sector
  useEffect(() => {
    if (form.node) {
      ApiService.getSectors(form.node).then(setSectors);
    } else {
      setSectors([]);
    }
    
    // Only clear children if this is a user update, not the initial mount/restore
    if (isMounted.current) {
        setForm(p => ({ ...p, sector: '', block: '', plot: '' }));
    }
  }, [form.node]);

  // Cascade Sector -> Block/Plot
  useEffect(() => {
    if (form.node && form.sector) {
      ApiService.getBlocks(form.node, form.sector).then(setBlocks);
      ApiService.getPlots(form.node, form.sector).then(setPlots);
    } else {
      setBlocks([]);
      setPlots([]);
    }

    // Only clear children if this is a user update, not the initial mount/restore
    if (isMounted.current) {
        setForm(p => ({ ...p, block: '', plot: '' }));
    }
  }, [form.sector]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = await ApiService.searchRecords(form.node, form.sector, form.block, form.plot);
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Search Plot Records</h1>
        
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Node Name <span className="text-red-500">*</span></label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.node}
              onChange={e => setForm({ ...form, node: e.target.value })}
            >
              <option value="">Select Node</option>
              {nodes.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sector No. <span className="text-red-500">*</span></label>
            <select
              required
              disabled={!form.node}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={form.sector}
              onChange={e => setForm({ ...form, sector: e.target.value })}
            >
              <option value="">Select Sector</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Block / Road (Optional)</label>
            <select
              disabled={!form.sector}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={form.block}
              onChange={e => setForm({ ...form, block: e.target.value })}
            >
              <option value="">All Blocks</option>
              {blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Plot No. (Optional)</label>
            <select
              disabled={!form.sector}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              value={form.plot}
              onChange={e => setForm({ ...form, plot: e.target.value })}
            >
              <option value="">All Plots</option>
              {plots.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <Link to="/" className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!form.node || !form.sector || loading}
              className="px-8 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Records'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-800">Search Results ({results.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Node</th>
                  <th className="px-6 py-3">Sector</th>
                  <th className="px-6 py-3">Block</th>
                  <th className="px-6 py-3">Plot</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No records match your criteria.
                    </td>
                  </tr>
                ) : (
                  results.map(row => (
                    <tr key={row.ID} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">#{row.ID}</td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{row.NAME_OF_NODE}</td>
                      {/* Updated columns: SECTOR_NO_, PLOT_NO_ */}
                      <td className="px-6 py-4 text-gray-600">{row.SECTOR_NO_}</td>
                      <td className="px-6 py-4 text-gray-600">{row.BLOCK_ROAD_NAME || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-semibold">{row.PLOT_NO_}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Link 
                          to={`/details/${row.ID}`} 
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium transition"
                        >
                          <Eye size={14} /> View
                        </Link>
                        {user?.role === 'admin' && (
                          <Link 
                            to={`/edit/${row.ID}`} 
                            className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-sm font-medium transition"
                          >
                            <Edit2 size={14} /> Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};