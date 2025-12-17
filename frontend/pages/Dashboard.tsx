import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { SummaryData, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search as SearchIcon, Filter, User as UserIcon, LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { Search } from './Search'; // Import existing Search Component
import { useAuth } from '../App';
import { useSearchParams } from 'react-router-dom';

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

// --- Sub Component: Summary View (Use of Plot & Dept) ---
const SummaryView = ({ 
  title, 
  data, 
  loading, 
  type,
  totalArea,
  totalAddCount
}: { 
  title: string, 
  data: SummaryData[], 
  loading: boolean, 
  type: 'use' | 'dept',
  totalArea: number,
  totalAddCount: number
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">{title} Data</h3>
            <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded">
              Total Area: {totalArea.toLocaleString()}
            </span>
          </div>
          <div className="w-full">
            <table className="w-full text-left relative table-fixed">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 font-semibold bg-gray-50 w-[40%] break-words align-bottom">
                    {type === 'use' ? 'Use of Plot' : 'Dept. Remarks'}
                  </th>
                  <th className="px-3 py-3 font-semibold text-right bg-gray-50 w-[20%] break-words align-bottom">
                    Sum of Add. Count
                  </th>
                  <th className="px-3 py-3 font-semibold text-right bg-gray-50 w-[25%] break-words align-bottom">
                    Sum of Area (SQM)
                  </th>
                  <th className="px-3 py-3 font-semibold text-right bg-gray-50 w-[15%] break-words align-bottom">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                   <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading data...</td></tr>
                ) : data.length === 0 ? (
                   <tr><td colSpan={4} className="p-8 text-center text-gray-500">No data found</td></tr>
                ) : (
                  Array.isArray(data) && data.map((row, i) => (
                    <React.Fragment key={i}>
                      {/* Check if this is the separator row */}
                      {row.category === '--- OTHERS ---' ? (
                        <tr className="bg-gray-100 font-bold text-gray-500 text-xs tracking-widest text-center">
                          <td colSpan={4} className="py-2">OTHERS</td>
                        </tr>
                      ) : (
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-3 py-3 font-medium text-gray-800 align-top">
                            <div className="flex items-start gap-2">
                              <span className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                              <span className="break-words whitespace-normal text-sm">{row.category}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-gray-600 align-top break-words text-sm">
                             {row.additionalCount.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-gray-600 align-top break-words text-sm">
                            {row.area.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-500 font-mono align-top text-sm">{row.percent}%</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              <tfoot className="bg-indigo-50 font-semibold border-t border-indigo-100">
                 <tr>
                    <td className="px-3 py-3 text-indigo-900 text-sm">Total</td>
                    <td className="px-3 py-3 text-right text-indigo-900 font-mono text-sm break-words">
                      {totalAddCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-900 font-mono text-sm break-words">
                      {totalArea.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-900 font-mono text-sm">100%</td>
                 </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[600px] flex flex-col sticky top-24">
           <div className="mb-4">
             <h3 className="font-semibold text-gray-800">Area Distribution Chart</h3>
           </div>
           <div className="flex-grow">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                 data={data.filter(d => d.category !== '--- OTHERS ---')} // Exclude separator from chart
                 margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
               >
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis 
                    dataKey="category" 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tick={{fontSize: 10}} 
                    height={100}
                 />
                 <YAxis 
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact" }).format(value)}
                 />
                 <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} SQM`, 'Area']}
                 />
                 <Bar dataKey="area" radius={[4, 4, 0, 0]} barSize={30}>
                    {Array.isArray(data) && data.filter(d => d.category !== '--- OTHERS ---').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub Component: User Profile ---
const UserProfile = () => {
  const { user } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpdatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user || !newPass) return;
    const res = await ApiService.updatePassword(user.id, newPass);
    setMsg(res.success ? 'Password updated successfully' : 'Failed to update');
    setNewPass('');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
       <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center text-white mb-4 backdrop-blur-sm">
             <UserIcon size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white">{user.name || 'User'}</h2>
          <span className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white uppercase tracking-wider">
             {user.role}
          </span>
       </div>
       
       <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                <div className="font-mono text-gray-800 mt-1">{user.username}</div>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-xs font-bold text-gray-500 uppercase">Email ID</label>
                <div className="font-medium text-gray-800 mt-1">{user.email}</div>
             </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
             <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Lock size={18} /> Security
             </h3>
             
             <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-sm text-yellow-800">
                Your password is securely hashed. It cannot be viewed, only reset.
             </div>

             <form onSubmit={handleUpdatePass} className="flex flex-col gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                   <div className="relative">
                      <input 
                        type={showPass ? "text" : "password"} 
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Enter new password to change"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                         {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className={`text-sm font-medium ${msg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{msg}</span>
                   <button 
                     type="submit" 
                     disabled={!newPass}
                     className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                   >
                      Update Password
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
};

// --- Main Dashboard Component ---
export const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'use' | 'dept' | 'search' | 'profile'>('use');
  
  // Update active tab if URL param exists
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'use' || tab === 'dept' || tab === 'search' || tab === 'profile') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'use' | 'dept' | 'search' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Filter States (Shared between Use & Dept tabs)
  const [nodes, setNodes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  // Data States
  const [useData, setUseData] = useState<SummaryData[]>([]);
  const [deptData, setDeptData] = useState<SummaryData[]>([]);
  const [loading, setLoading] = useState(false);

  // Load Filters
  useEffect(() => {
    ApiService.getNodes().then(setNodes);
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      ApiService.getSectors(selectedNode).then(setSectors);
    } else {
      setSectors([]);
      setSelectedSector('');
    }
  }, [selectedNode]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch both to keep tabs synced, or fetch on tab change. 
    // Fetching both is cleaner for "Apply Filter" logic.
    const [uData, dData] = await Promise.all([
      ApiService.getDashboardSummary(selectedNode, selectedSector),
      ApiService.getDepartmentSummary(selectedNode, selectedSector)
    ]);
    
    setUseData(processUseData(uData)); // Apply specific sorting
    setDeptData(dData); // Default sorting is okay (A-Z)
    
    setLoading(false);
  };

  // Specific Sorting Logic for Use of Plot
  const processUseData = (data: SummaryData[]) => {
    // UPDATED ORDER HERE
    const primaryOrder = [
      'COMMERCIAL', 
      'RESIDENTIAL', 
      'RESIDENTIAL + COMMERCIAL', 
      'SERVICE INDUSTRY'
    ];
    
    const primaryItems: SummaryData[] = [];
    const otherItems: SummaryData[] = [];
    
    data.forEach(item => {
      // Normalize comparison (handle case sensitivity if needed, though DB usually consistent)
      const catUpper = item.category.toUpperCase().trim();
      if (primaryOrder.includes(catUpper)) {
        primaryItems.push(item);
      } else {
        otherItems.push(item);
      }
    });

    // Sort Primary by fixed order
    primaryItems.sort((a, b) => {
      return primaryOrder.indexOf(a.category.toUpperCase().trim()) - primaryOrder.indexOf(b.category.toUpperCase().trim());
    });

    // Sort Others Alphabetically
    otherItems.sort((a, b) => a.category.localeCompare(b.category));

    // Combine with separator if both exist
    if (primaryItems.length > 0 && otherItems.length > 0) {
      return [
        ...primaryItems,
        { category: '--- OTHERS ---', area: 0, additionalCount: 0, percent: 0 }, // Separator
        ...otherItems
      ];
    }
    
    return [...primaryItems, ...otherItems];
  };

  const handleApplyFilter = () => fetchData();
  
  const handleClearFilter = () => {
    setSelectedNode('');
    setSelectedSector('');
    // Need timeout to allow state update before fetch (or pass empty args directly)
    setTimeout(async () => {
      setLoading(true);
      const [uData, dData] = await Promise.all([
        ApiService.getDashboardSummary('', ''),
        ApiService.getDepartmentSummary('', '')
      ]);
      setUseData(processUseData(uData));
      setDeptData(dData);
      setLoading(false);
    }, 0);
  };

  // Calculations
  const calcTotals = (data: SummaryData[]) => {
    const validRows = data.filter(d => d.category !== '--- OTHERS ---');
    return {
      area: validRows.reduce((sum, item) => sum + item.area, 0),
      count: validRows.reduce((sum, item) => sum + item.additionalCount, 0)
    };
  };

  const useTotals = calcTotals(useData);
  const deptTotals = calcTotals(deptData);

  return (
    <div className="space-y-6">
      
      {/* --- TAB NAVIGATION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex flex-wrap gap-1">
        <button 
          onClick={() => handleTabChange('use')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'use' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Use of Plot Summary
        </button>
        <button 
          onClick={() => handleTabChange('dept')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'dept' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Department Remarks
        </button>
        <button 
          onClick={() => handleTabChange('search')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <SearchIcon size={16} /> Advanced Search
        </button>
        <button 
          onClick={() => handleTabChange('profile')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <UserIcon size={16} /> User Info
        </button>
      </div>

      {/* --- SHARED FILTERS (Only for Tab 1 & 2) --- */}
      {(activeTab === 'use' || activeTab === 'dept') && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Node</label>
              <select 
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">All Nodes</option>
                {Array.isArray(nodes) && nodes.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sector</label>
              <select 
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                disabled={!selectedNode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">All Sectors</option>
                {Array.isArray(sectors) && sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleApplyFilter}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
              >
                <Filter size={16} /> Apply
              </button>
              <button 
                onClick={handleClearFilter}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT --- */}
      
      {activeTab === 'use' && (
        <SummaryView 
          title="Use of Plot" 
          type="use"
          data={useData} 
          loading={loading}
          totalArea={useTotals.area}
          totalAddCount={useTotals.count}
        />
      )}

      {activeTab === 'dept' && (
        <SummaryView 
          title="Department Remarks" 
          type="dept"
          data={deptData} 
          loading={loading}
          totalArea={deptTotals.area}
          totalAddCount={deptTotals.count}
        />
      )}

      {activeTab === 'search' && (
        <div className="animate-fade-in">
           <Search />
        </div>
      )}

      {activeTab === 'profile' && (
        <UserProfile />
      )}

    </div>
  );
};