import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { UserRole } from '../types';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AddUser: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    role: UserRole.USER
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    // This calls server /api/users/add which inserts into users_react
    const result = await ApiService.addUser(formData);
    if (result.success) {
      setMsg({ type: 'success', text: 'User added successfully to users_react!' });
      setFormData({ username: '', password: '', email: '', name: '', role: UserRole.USER });
    } else {
      setMsg({ type: 'error', text: result.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="mb-6">
        <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 font-medium mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
        <p className="text-gray-500">Create accounts in the <code>users_react</code> database table.</p>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {msg.text && (
            <div className={`p-4 rounded-lg text-center font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="jdoe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="user">User (Read Only)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <UserPlus size={20} />
            {loading ? 'Creating User...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
};