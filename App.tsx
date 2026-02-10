import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import PainelLogin from './pages/PainelLogin';
import AguardandoAprovacao from './pages/AguardandoAprovacao';
import { User, AuthState } from './types';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const { getUserByEmail } = await import('./lib/users');
        const dbUser = await getUserByEmail(fbUser.email ?? '');
        if (!dbUser || dbUser.status === 'REJECTED') {
          setAuthState({ user: null, isAuthenticated: false });
        } else {
          const status = dbUser.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'APPROVED';
          setAuthState({
            user: {
              id: fbUser.uid,
              name: dbUser.name ?? fbUser.displayName ?? fbUser.email ?? 'Usuário',
              email: fbUser.email ?? '',
              role: 'PARTNER',
              status,
            },
            isAuthenticated: true,
          });
        }
      } else {
        const saved = localStorage.getItem('tillit_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.role === 'ADMIN') {
            setAuthState({ user: parsed, isAuthenticated: true });
          } else {
            localStorage.removeItem('tillit_user');
            setAuthState({ user: null, isAuthenticated: false });
          }
        } else {
          setAuthState({ user: null, isAuthenticated: false });
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const login = (user: User) => {
    localStorage.setItem('tillit_user', JSON.stringify(user));
    setAuthState({ user, isAuthenticated: true });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('tillit_user');
    setAuthState({ user: null, isAuthenticated: false });
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-[#003366] font-bold">Carregando...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/registrar" element={<Register />} />
        <Route 
          path="/aguardando" 
          element={
            authState.isAuthenticated && authState.user?.status === 'PENDING_APPROVAL'
              ? <AguardandoAprovacao />
              : authState.isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/dashboard/*" 
          element={
            authState.isAuthenticated && authState.user?.role === 'PARTNER' 
              ? authState.user?.status === 'PENDING_APPROVAL'
                ? <Navigate to="/aguardando" />
                : <Dashboard user={authState.user} onLogout={logout} />
              : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/painel/*" 
          element={
            authState.isAuthenticated && authState.user?.role === 'ADMIN' 
              ? <Admin user={authState.user} onLogout={logout} /> 
              : <PainelLogin onLogin={login} />
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
