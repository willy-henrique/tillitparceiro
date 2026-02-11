import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, ChevronRight, Chrome, ArrowLeft, MessageSquare,
  ShieldCheck, Clock, CheckCircle2, LogIn, UserPlus
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from '../types';
import { createPartnerRequest, createPartnerRequestFromGoogle, getUserByEmail } from '../lib/users';
import Logo from '../components/Logo';

type Mode = 'login' | 'register';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode: Mode = location.pathname === '/registrar' ? 'register' : 'login';

  const [mode, setMode] = useState<Mode>(initialMode);
  useEffect(() => {
    setMode(location.pathname === '/registrar' ? 'register' : 'login');
  }, [location.pathname]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    terms: false,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [pendingPhone, setPendingPhone] = useState<{
    dbUser: { id: string; name: string; email: string; status: string } | null;
    fbUser: { uid: string; displayName: string | null; email: string | null };
  } | null>(null);
  const [googleUserPendingPhone, setGoogleUserPendingPhone] = useState<{ name: string; email: string } | null>(null);
  const [phoneInput, setPhoneInput] = useState('');

  const handleGoogleAuth = async () => {
    setLoadingGoogle(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const emailVal = fbUser.email ?? '';
      const nameVal = fbUser.displayName ?? fbUser.email ?? 'Usuário';
      const isAdmin = fbUser.email?.toLowerCase().includes('admin') ?? false;

      if (isAdmin) {
        const appUser: User = {
          id: fbUser.uid,
          name: nameVal,
          email: emailVal,
          role: 'ADMIN',
          status: 'APPROVED',
        };
        onLogin(appUser);
        navigate('/painel');
        return;
      }

      const dbUser = await getUserByEmail(emailVal);
      if (dbUser?.status === 'REJECTED') {
        setError('Seu cadastro foi rejeitado. Entre em contato com o suporte.');
        return;
      }

      if (dbUser && !dbUser.phone?.trim()) {
        setPendingPhone({
          dbUser: { id: dbUser.id, name: dbUser.name, email: dbUser.email, status: dbUser.status },
          fbUser: { uid: fbUser.uid, displayName: fbUser.displayName, email: fbUser.email },
        });
        setPhoneInput('');
        return;
      }

      if (!dbUser) {
        setGoogleUserPendingPhone({ name: nameVal, email: emailVal });
        setPendingPhone({
          dbUser: null,
          fbUser: { uid: fbUser.uid, displayName: fbUser.displayName, email: fbUser.email },
        });
        setPhoneInput('');
        return;
      }

      const status = dbUser.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'APPROVED';
      onLogin({
        id: fbUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        role: 'PARTNER',
        status,
      });
      if (status === 'PENDING_APPROVAL') navigate('/aguardando');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      setError(msg.includes('popup-closed') ? '' : msg);
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
    setLoading(true);
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
        window.location.href = '/#/aguardando';
        return;
      }
      setPendingPhone(null);
      setGoogleUserPendingPhone(null);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('admin')) {
      onLogin({
        id: 'adm_1',
        name: 'Carlos Admin',
        email,
        role: 'ADMIN',
        status: 'APPROVED',
      });
      navigate('/painel');
    } else {
      onLogin({
        id: 'usr_1',
        name: 'João Parceiro',
        email,
        role: 'PARTNER',
        status: 'APPROVED',
      });
      navigate('/dashboard');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createPartnerRequest({
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      setStep(2);
    } catch {
      setError('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step: WhatsApp obrigatório (Google)
  if (pendingPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 bg-pattern">
        <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#00B050]/10 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="text-[#00B050]" size={32} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#003366]">Informe seu WhatsApp</h1>
            <p className="text-slate-500 text-sm">Precisamos do seu número para contato da equipe e liberação do acesso ao painel.</p>
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
            <button type="submit" disabled={loading} className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-all disabled:opacity-60">
              {loading ? 'Enviando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step: Cadastro em análise
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 bg-pattern">
        <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 text-center space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] text-sm font-medium">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <div className="w-24 h-24 bg-orange-50 text-[#FF8C00] rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-black text-[#003366]">Cadastro em Análise</h1>
            <p className="text-slate-500 leading-relaxed">
              Olá <span className="font-bold text-[#003366]">{formData.name}</span>! Nossa equipe está validando seu perfil.
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos passos:</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="text-[#00B050]" size={16} /> Verificação de dados
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-slate-200" /> Liberação do acesso
              </li>
            </ul>
          </div>
          <p className="text-xs text-slate-400">Aproximadamente em 24h. Use o mesmo e-mail no login com Google.</p>
        </div>
      </div>
    );
  }

  // Layout principal: promo + form com abas
  const PromoSection = () => (
    <div className="bg-[#003366] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
      <div className="space-y-6 relative z-10">
        <Logo size="md" variant="light" />
        <h2 className="text-2xl sm:text-3xl font-black leading-tight">
          Torne-se um <span className="text-[#00B050]">Embaixador</span> TILLIT.
        </h2>
        <p className="text-slate-300 text-sm">Transforme sua rede de contatos em uma fonte recorrente de ganhos.</p>
      </div>
      <div className="space-y-3 sm:space-y-4 relative z-10 mt-6 sm:mt-0">
        {['Painel Exclusivo', 'Bônus Progressivo', 'Suporte Venda+'].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center text-[#00B050] flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const FormSection = () => (
    <div className="p-4 sm:p-6 lg:p-10 flex flex-col">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] text-sm font-medium">
          <ArrowLeft size={18} /> Voltar
        </Link>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LogIn size={18} /> Entrar
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <UserPlus size={18} /> Cadastrar
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}

      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loadingGoogle}
        className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <Chrome size={22} className="text-red-500" />
        {loadingGoogle ? 'Aguarde...' : 'Continuar com Google'}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white px-4 text-slate-400">ou com formulário</span></div>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all"
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
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all"
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
          <button type="submit" className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-xl shadow-blue-900/20">
            Entrar no Portal <ChevronRight size={18} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Empresa</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Nome fantasia ou razão social"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail Profissional</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone/WhatsApp</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" />
              </div>
            </div>
          </div>
          <label className="flex gap-3 cursor-pointer group bg-slate-50 p-4 rounded-xl">
            <input type="checkbox" required checked={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.checked })} className="mt-1 w-5 h-5 rounded border-slate-300 text-[#00B050] focus:ring-[#00B050]" />
            <span className="text-xs text-slate-500 leading-relaxed">Li e aceito os <a href="#" className="text-[#003366] font-bold hover:underline">Termos do Programa Parceiro+</a> e concordo com a LGPD.</span>
          </label>
          <button type="submit" disabled={loading} className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Enviando...' : 'Solicitar Acesso'} <ShieldCheck size={18} />
          </button>
        </form>
      )}

      <p className="text-center text-xs text-slate-400 mt-6">
        <Link to="/painel" className="text-slate-500 hover:text-[#003366]">Acesso administrativo</Link>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 bg-pattern">
      <div className="w-full max-w-2xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5 min-h-[500px] lg:min-h-[600px]">
        <div className="hidden lg:block lg:col-span-2">
          <PromoSection />
        </div>
        <div className="lg:col-span-3">
          <div className="lg:hidden py-6 px-4 bg-[#003366]">
            <div className="flex items-center gap-2 text-white">
              <Logo size="sm" variant="light" />
              <span className="font-bold text-lg">Parceiro+</span>
            </div>
          </div>
          <FormSection />
        </div>
      </div>
    </div>
  );
};

export default Auth;
