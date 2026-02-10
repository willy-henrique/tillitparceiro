import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, Chrome, ArrowLeft, MessageSquare } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from '../types';
import Logo from '../components/Logo';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [pendingPhone, setPendingPhone] = useState<{
    dbUser: { id: string; name: string; email: string; status: string } | null;
    fbUser: { uid: string; displayName: string | null; email: string | null };
    isAdmin: boolean;
  } | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const isAdmin = fbUser.email?.toLowerCase().includes('admin') ?? false;
      let status: 'APPROVED' | 'PENDING_APPROVAL' = 'APPROVED';
      if (!isAdmin) {
        const { getUserByEmail } = await import('../lib/users');
        const dbUser = await getUserByEmail(fbUser.email ?? '');
        if (dbUser?.status === 'PENDING_APPROVAL') status = 'PENDING_APPROVAL';
        if (dbUser && !dbUser.phone?.trim()) {
          setPendingPhone({
            dbUser: { id: dbUser.id, name: dbUser.name, email: dbUser.email, status: dbUser.status },
            fbUser: { uid: fbUser.uid, displayName: fbUser.displayName, email: fbUser.email },
            isAdmin: false,
          });
          setPhoneInput('');
          setError('');
          return;
        }
        if (!dbUser) {
          const { createPartnerRequestFromGoogle } = await import('../lib/users');
          setPendingPhone({
            dbUser: null,
            fbUser: { uid: fbUser.uid, displayName: fbUser.displayName, email: fbUser.email },
            isAdmin: false,
          });
          setPhoneInput('');
          setError('');
          return;
        }
      }
      const appUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName ?? fbUser.email ?? 'Usuário',
        email: fbUser.email ?? '',
        role: isAdmin ? 'ADMIN' : 'PARTNER',
        status,
      };
      onLogin(appUser);
      if (status === 'PENDING_APPROVAL') navigate('/aguardando');
      else navigate(isAdmin ? '/painel' : '/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar com Google';
      setError(message.includes('popup-closed') ? '' : message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPhone) return;
    const phone = phoneInput.trim();
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    setPhoneLoading(true);
    setError('');
    try {
      const { updateUserPhone, createPartnerRequestFromGoogle } = await import('../lib/users');
      if (pendingPhone.dbUser) {
        await updateUserPhone(pendingPhone.dbUser.id, phone);
        const status = pendingPhone.dbUser.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'APPROVED';
        onLogin({
          id: pendingPhone.fbUser.uid,
          name: pendingPhone.dbUser.name,
          email: pendingPhone.dbUser.email,
          role: 'PARTNER',
          status,
        });
        if (status === 'PENDING_APPROVAL') navigate('/aguardando');
        else navigate('/dashboard');
      } else {
        await createPartnerRequestFromGoogle({
          name: pendingPhone.fbUser.displayName ?? pendingPhone.fbUser.email ?? 'Usuário',
          email: pendingPhone.fbUser.email ?? '',
          phone,
        });
        onLogin({
          id: pendingPhone.fbUser.uid,
          name: pendingPhone.fbUser.displayName ?? pendingPhone.fbUser.email ?? 'Usuário',
          email: pendingPhone.fbUser.email ?? '',
          role: 'PARTNER',
          status: 'PENDING_APPROVAL',
        });
        navigate('/aguardando');
      }
      setPendingPhone(null);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth logic (email/password - use Google para parceiros)
    if (email.includes('admin')) {
      const adminUser: User = {
        id: 'adm_1',
        name: 'Carlos Admin',
        email: email,
        role: 'ADMIN',
        status: 'APPROVED'
      };
      onLogin(adminUser);
      navigate('/painel');
    } else {
      const partnerUser: User = {
        id: 'usr_1',
        name: 'João Parceiro',
        email: email,
        role: 'PARTNER',
        status: 'APPROVED'
      };
      onLogin(partnerUser);
      navigate('/dashboard');
    }
  };

  if (pendingPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-pattern">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#00B050]/10 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="text-[#00B050]" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-[#003366]">Informe seu WhatsApp</h1>
            <p className="text-slate-500 text-sm">
              Precisamos do seu número para contato da equipe e liberação do acesso ao painel.
            </p>
          </div>
          <form onSubmit={handleSubmitPhone} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp (com DDD)</label>
              <input
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={phoneLoading}
              className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-all disabled:opacity-60"
            >
              {phoneLoading ? 'Enviando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-pattern">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium mb-4">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Logo size="sm" variant="light" />
            <span className="text-[#003366] font-black text-xl tracking-tighter uppercase">Parceiro+</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-sm">Acesse sua conta para gerenciar indicações</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
        )}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Chrome size={20} className="text-red-500" />
          {loadingGoogle ? 'Entrando...' : 'Entrar com Google'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white px-4 text-slate-400">ou com e-mail</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#00B050] focus:ring-[#00B050]" />
              <span className="text-slate-500">Lembrar de mim</span>
            </label>
            <a href="#" className="text-[#003366] font-bold hover:underline">Esqueceu a senha?</a>
          </div>

          <button type="submit" className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-xl shadow-blue-900/20 group">
            Entrar no Portal <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Ainda não é parceiro? <Link to="/registrar" className="text-[#00B050] font-bold hover:underline">Cadastre-se grátis</Link>
        </p>
        <p className="text-center text-xs text-slate-400">
          <Link to="/painel" className="text-slate-500 hover:text-[#003366]">Acesso administrativo</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
