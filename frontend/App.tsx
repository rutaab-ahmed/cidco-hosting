import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AuthState, UserRole } from './types';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Details } from './pages/Details';
import { Edit } from './pages/Edit';
import { AddUser } from './pages/AddUser';

// --- Auth Context Setup ---
interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: UserRole[] }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('cidco_user');
    if (storedUser) {
      setAuth({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
    } else {
      setAuth(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (user: User) => {
    localStorage.setItem('cidco_user', JSON.stringify(user));
    setAuth({ user, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('cidco_user');
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
  };

  if (auth.isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Add basic route to catch missing tokens gracefully in the component */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/details/:id" element={<ProtectedRoute><Details /></ProtectedRoute>} />
          
          <Route path="/add-user" element={
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <AddUser />
            </ProtectedRoute>
          } />
           <Route path="/edit/:id" element={
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <Edit />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;