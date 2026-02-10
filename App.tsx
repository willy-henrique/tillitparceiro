
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { User, AuthState } from './types';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  // Persist session simple simulation
  useEffect(() => {
    const saved = localStorage.getItem('tillit_user');
    if (saved) {
      setAuthState({ user: JSON.parse(saved), isAuthenticated: true });
    }
  }, []);

  const login = (user: User) => {
    localStorage.setItem('tillit_user', JSON.stringify(user));
    setAuthState({ user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('tillit_user');
    setAuthState({ user: null, isAuthenticated: false });
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/registrar" element={<Register onRegister={login} />} />
        
        <Route 
          path="/dashboard/*" 
          element={
            authState.isAuthenticated && authState.user?.role === 'PARTNER' 
              ? <Dashboard user={authState.user} onLogout={logout} /> 
              : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/gestao-comercial/*" 
          element={
            authState.isAuthenticated && authState.user?.role === 'ADMIN' 
              ? <Admin user={authState.user} onLogout={logout} /> 
              : <Navigate to="/login" />
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
