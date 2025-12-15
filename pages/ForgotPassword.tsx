import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ApiService } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const result = await ApiService.forgotPassword(identifier);
    
    setIsError(!result.success);
    setMessage(result.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-800 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
             <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
          <p className="text-gray-300 mt-2">Enter your email or username to reset</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-3 rounded-lg text-center font-medium ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="Enter username or email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="text-center">
              <Link to="/login" className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};