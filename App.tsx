import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import PainelLogin from './pages/PainelLogin';
import AguardandoAprovacao from './pages/AguardandoAprovacao';
import SupportChat from './components/SupportChat';
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
        if (!dbUser || dbUser.status === 'REJECTED' || dbUser.status === 'BLOCKED') {
          setAuthState({ user: null, isAuthenticated: false });
        } else {
          const status: User['status'] = 'APPROVED';
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
        const fromStorage = localStorage.getItem('tillit_user') || sessionStorage.getItem('tillit_user');
        if (fromStorage) {
          try {
            const parsed = JSON.parse(fromStorage) as AuthState['user'];
            if (parsed?.id && parsed?.email && (parsed.role === 'ADMIN' || parsed.role === 'PARTNER')) {
              setAuthState({ user: parsed, isAuthenticated: true });
            } else {
              localStorage.removeItem('tillit_user');
              sessionStorage.removeItem('tillit_user');
              setAuthState({ user: null, isAuthenticated: false });
            }
          } catch {
            localStorage.removeItem('tillit_user');
            sessionStorage.removeItem('tillit_user');
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

  const login = (user: User, options?: { rememberMe?: boolean }) => {
    const storage = options?.rememberMe !== false ? localStorage : sessionStorage;
    storage.setItem('tillit_user', JSON.stringify(user));
    if (storage === sessionStorage) localStorage.removeItem('tillit_user');
    else sessionStorage.removeItem('tillit_user');
    setAuthState({ user, isAuthenticated: true });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('tillit_user');
    sessionStorage.removeItem('tillit_user');
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
      <SupportChat />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth onLogin={login} />} />
        <Route path="/registrar" element={<Register />} />
        <Route 
          path="/aguardando" 
          element={<Navigate to={authState.isAuthenticated ? "/dashboard" : "/login"} />} 
        />
        
        <Route 
          path="/dashboard/*" 
          element={
            authState.isAuthenticated && authState.user?.role === 'PARTNER' 
              ? <Dashboard user={authState.user} onLogout={logout} />
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
