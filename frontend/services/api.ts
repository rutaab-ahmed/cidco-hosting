import { PlotRecord, SummaryData, User } from '../types';

// const API_BASE = 'http://localhost:8083/api';
// const API_BASE = import.meta.env.VITE_API_URL;
const API_BASE = "https://cidco-backend.onrender.com/api";


export const ApiService = {
  // --- Auth ---
  async login(username: string, password: string): Promise<{ user: User | null; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        return { user: null, error: err.error || 'Login failed' };
      }
      return { user: await res.json() };
    } catch (e) {
      console.error(e);
      return { user: null, error: 'Cannot connect to server (Is it running on port 8083?)' };
    }
  },

  async addUser(userData: Partial<User> & { password: string }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error };
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  },

  async updatePassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error };
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error };
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error };
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  },

  // --- Data Fetching ---

  async getNodes(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/nodes`);
    return await res.json();
  },

  async getSectors(node: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/sectors?node=${encodeURIComponent(node)}`);
    return await res.json();
  },

  async getBlocks(node: string, sector: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/blocks?node=${encodeURIComponent(node)}&sector=${encodeURIComponent(sector)}`);
    return await res.json();
  },

  async getPlots(node: string, sector: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/plots?node=${encodeURIComponent(node)}&sector=${encodeURIComponent(sector)}`);
    return await res.json();
  },

  async searchRecords(node: string, sector: string, block?: string, plot?: string): Promise<PlotRecord[]> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node, sector, block, plot })
    });
    return await res.json();
  },

  async getRecordById(id: string): Promise<PlotRecord | undefined> {
    const res = await fetch(`${API_BASE}/record/${id}`);
    if (!res.ok) return undefined;
    return await res.json();
  },

  // async updateRecord(id: string, updates: Record<string, any>): Promise<boolean> {
  //   try {
  //     const res = await fetch(`${API_BASE}/record/update`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ ID: id, ...updates })
  //     });
  //     return res.ok;
  //   } catch (e) {
  //     console.error(e);
  //     return false;
  //   }
  // },
  async updateRecord(id: string, data: any) {
    try {
      const res = await fetch(`http://localhost:8083/api/record/${id}`, 
        {method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return res.ok;
    } catch (err) {
      console.error("Update failed", err);
      return false;
    }
  },

  async getDashboardSummary(node?: string, sector?: string): Promise<SummaryData[]> {
    let url = `${API_BASE}/summary`;
    const params = new URLSearchParams();
    if (node) params.append('node', node);
    if (sector) params.append('sector', sector);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url);
    return await res.json();
  },

  async getDepartmentSummary(node?: string, sector?: string): Promise<SummaryData[]> {
    let url = `${API_BASE}/summary/department`;
    const params = new URLSearchParams();
    if (node) params.append('node', node);
    if (sector) params.append('sector', sector);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url);
    return await res.json();
  }
};


