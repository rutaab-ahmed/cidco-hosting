import React from 'react';
import { useAuth } from '../App';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Hide header on login/forgot password pages
  if (['/login', '/forgot-password'].includes(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:bg-indigo-700 transition">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 leading-tight">PFEPL / CIDCO</span>
                <span className="text-xs text-gray-500 font-medium">Record Management System</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-semibold text-gray-800">{user?.username}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {user?.role === 'admin' && (
                <Link to="/add-user" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition" title="Add User">
                  <UserIcon size={20} />
                </Link>
              )}
              <button 
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition duration-200"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} PFEPL / CIDCO Records. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
