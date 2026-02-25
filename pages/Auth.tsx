import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, ChevronRight, Chrome, ArrowLeft, MessageSquare,
  ShieldCheck, Clock, CheckCircle2, LogIn, UserPlus
} from 'lucide-react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from '../types';
import { createPartnerRequest, createPartnerRequestFromGoogle, getUserByEmail } from '../lib/users';
import Logo from '../components/Logo';

type Mode = 'login' | 'register';

const isTouchDevice =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 0);

interface AuthProps {
  onLogin: (user: User, options?: { rememberMe?: boolean }) => void;
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
  });
  const [rememberMe, setRememberMe] = useState(true);
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const forgotEmailRef = useRef<HTMLInputElement>(null);
  const registerCompanyRef = useRef<HTMLInputElement>(null);
  const registerNameRef = useRef<HTMLInputElement>(null);
  const registerEmailRef = useRef<HTMLInputElement>(null);
  const registerPhoneRef = useRef<HTMLInputElement>(null);
  const registerPasswordRef = useRef<HTMLInputElement>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  useEffect(() => {
    if (!showForgotPassword) return;
    const timer = setTimeout(() => {
      if (forgotEmailRef.current && loginEmailRef.current) {
        forgotEmailRef.current.value = loginEmailRef.current.value?.trim() ?? '';
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [showForgotPassword]);

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
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
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
        onLogin(appUser, { rememberMe });
        navigate('/painel');
        return;
      }

      const dbUser = await getUserByEmail(emailVal);
      if (dbUser?.status === 'REJECTED') {
        setError('Seu cadastro foi rejeitado. Entre em contato com o suporte.');
        return;
      }
      if (dbUser?.status === 'BLOCKED') {
        setError('Sua conta está bloqueada. Entre em contato com o suporte.');
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

      const status: User['status'] = 'APPROVED';
      onLogin({
        id: fbUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        role: 'PARTNER',
        status,
      }, { rememberMe });
      navigate('/dashboard');
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
        const status: User['status'] = 'APPROVED';
        onLogin({
          id: pendingPhone.fbUser.uid,
          name: pendingPhone.dbUser.name,
          email: pendingPhone.dbUser.email,
          role: 'PARTNER',
          status,
        }, { rememberMe });
        navigate('/dashboard');
      } else {
        const created = await createPartnerRequestFromGoogle({
          name: pendingPhone.fbUser.displayName ?? pendingPhone.fbUser.email ?? 'Usuário',
          email: pendingPhone.fbUser.email ?? '',
          phone,
        });
        const status: User['status'] = 'APPROVED';
        onLogin({
          id: pendingPhone.fbUser.uid,
          name: created.name,
          email: created.email,
          role: 'PARTNER',
          status,
        }, { rememberMe });
        navigate('/dashboard');
      }
      setPendingPhone(null);
      setGoogleUserPendingPhone(null);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = forgotEmailRef.current?.value?.trim() ?? '';
    if (!emailToUse) {
      setForgotError('Informe o e-mail da conta.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await sendPasswordResetEmail(auth, emailToUse);
      setForgotSuccess(true);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const code = error.code ?? '';
      if (code === 'auth/user-not-found') {
        setForgotError('Não encontramos uma conta com este e-mail. Verifique ou cadastre-se.');
      } else if (code === 'auth/invalid-email') {
        setForgotError('E-mail inválido. Verifique e tente novamente.');
      } else {
        setForgotError('Não foi possível enviar o link. Tente novamente em alguns minutos.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = loginEmailRef.current?.value?.trim() ?? '';
    const passwordVal = loginPasswordRef.current?.value ?? '';
    if (!emailVal || !passwordVal) {
      setError('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, emailVal, passwordVal);
      const fbUser = cred.user;
      const email = fbUser.email ?? emailVal;
      const name = fbUser.displayName ?? emailVal;

      const isAdmin = email.toLowerCase().includes('admin');
      if (isAdmin) {
        const appUser: User = {
          id: fbUser.uid,
          name,
          email,
          role: 'ADMIN',
          status: 'APPROVED',
        };
        onLogin(appUser, { rememberMe });
        navigate('/painel');
        return;
      }

      const dbUser = await getUserByEmail(email);
      if (!dbUser) {
        setError('Seu cadastro de parceiro ainda não foi encontrado. Conclua o cadastro ou fale com o suporte.');
        return;
      }
      if (dbUser.status === 'REJECTED') {
        setError('Seu cadastro foi rejeitado. Entre em contato com o suporte.');
        return;
      }
      if (dbUser.status === 'BLOCKED') {
        setError('Sua conta está bloqueada. Entre em contato com o suporte.');
        return;
      }

      const status: User['status'] = 'APPROVED';
      const appUser: User = {
        id: fbUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        role: 'PARTNER',
        status,
      };
      onLogin(appUser, { rememberMe });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const code = error.code ?? '';
      if (code === 'auth/user-not-found') {
        setError('Não encontramos uma conta com este e-mail. Verifique ou cadastre-se.');
      } else if (code === 'auth/wrong-password') {
        setError('Senha incorreta. Verifique e tente novamente.');
      } else if (code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
      } else {
        setError('Não foi possível entrar. Tente novamente em alguns instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyName = registerCompanyRef.current?.value?.trim() ?? '';
    const name = registerNameRef.current?.value?.trim() ?? '';
    const email = registerEmailRef.current?.value?.trim() ?? '';
    const phone = registerPhoneRef.current?.value?.trim() ?? '';
    const password = registerPasswordRef.current?.value ?? '';
    if (!name || !email || !phone || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await createPartnerRequest({ companyName, name, email, phone });
      setFormData((prev) => ({ ...prev, companyName, name, email, phone }));
      // Volta para a aba de login após cadastro
      if (loginEmailRef.current) {
        loginEmailRef.current.value = email;
      }
      setMode('login');
      setStep(1);
      setError('Cadastro criado com sucesso! Agora você já pode entrar com seu e-mail e senha.');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const code = error.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Tente entrar ou redefinir a senha.');
      } else if (code === 'auth/invalid-email') {
        setError('E-mail inválido. Verifique e tente novamente.');
      } else if (code === 'auth/weak-password') {
        setError('Sua senha é muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Erro ao enviar cadastro. Tente novamente.');
      }
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
          Torne-se um <span className="text-[#00B050]">Embaixador</span> <span className="font-tillit">TILLIT</span>.
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
          onClick={() => { setMode('login'); setError(''); setShowForgotPassword(false); setForgotError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LogIn size={18} /> Entrar
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(''); setShowForgotPassword(false); }}
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
        showForgotPassword ? (
          <div className="space-y-5">
            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-4 rounded-xl">
                  <p className="font-medium">E-mail enviado.</p>
                  <p className="mt-1 text-green-700">Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha. Verifique a caixa de entrada e o spam.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(''); if (forgotEmailRef.current) forgotEmailRef.current.value = ''; }}
                  className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold hover:bg-[#002244] transition-all shadow-xl shadow-blue-900/20"
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-5" autoComplete="off">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      E-mail
                    </label>
                    <input
                      ref={forgotEmailRef}
                      id="forgot-email"
                      name="forgot-email"
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="digite seu e-mail"
                      className="w-full px-4 py-3.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all placeholder:text-slate-400"
                      aria-label="E-mail"
                      onChange={() => setForgotError('')}
                    />
                  </div>
                </div>
                {forgotError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{forgotError}</p>}
                <div className="flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotError(''); }}
                    className="text-[#003366] font-bold hover:underline"
                  >
                    Voltar ao login
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-xl shadow-blue-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link de recuperação'} <ChevronRight size={18} />
                </button>
              </form>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleLoginSubmit}
            autoComplete="off"
            className="space-y-5"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  E-mail
                </label>
                <input
                  ref={loginEmailRef}
                  id="login-email"
                  name="login-email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="digite seu e-mail"
                  className="w-full px-4 py-3.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all placeholder:text-slate-400"
                  aria-label="E-mail"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Lock size={14} className="text-slate-400" />
                  Senha
                </label>
                <input
                  ref={loginPasswordRef}
                  id="login-password"
                  name="login-password"
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="digite sua senha"
                  className="w-full px-4 py-3.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all placeholder:text-slate-400"
                  aria-label="Senha"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#00B050] focus:ring-[#00B050]"
                />
                <span className="text-slate-500">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setForgotError(''); setForgotSuccess(false); }}
                className="text-[#003366] font-bold hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <button type="submit" className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-xl shadow-blue-900/20">
              Entrar no Portal <ChevronRight size={18} />
            </button>
          </form>
        )
      ) : (
        <form
          onSubmit={handleRegisterSubmit}
          onKeyDown={(e) => {
            if (isTouchDevice) return;
            if (e.key === 'Enter') {
              const target = e.target as HTMLElement;
              if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                e.preventDefault();
                const form = target.form;
                if (form) {
                  const inputs = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type="checkbox"]):not([type="submit"]):not([type="button"]), textarea'));
                  const i = inputs.indexOf(target as HTMLInputElement);
                  if (i >= 0 && i < inputs.length - 1) inputs[i + 1].focus();
                }
              }
            }
          }}
          className="space-y-4 flex-1"
        >
          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Empresa</label>
              <input
                ref={registerCompanyRef}
                type="text"
                autoComplete="off"
                placeholder="Nome fantasia ou razão social"
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <input
                ref={registerNameRef}
                type="text"
                required
                autoComplete="off"
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail Profissional</label>
              <input
                ref={registerEmailRef}
                type="email"
                required
                autoComplete="off"
                inputMode="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone/WhatsApp</label>
                <input
                  ref={registerPhoneRef}
                  type="tel"
                  required
                  autoComplete="off"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                <input
                  ref={registerPasswordRef}
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Sua senha"
                  className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
                />
              </div>
            </div>
          </div>
          <label className="flex gap-3 cursor-pointer group bg-slate-50 p-4 rounded-xl">
            <input
              type="checkbox"
              required
              className="mt-1 w-5 h-5 rounded border-slate-300 text-[#00B050] focus:ring-[#00B050]"
            />
            <span className="text-xs text-slate-500 leading-relaxed">
              Li e aceito os{' '}
              <a
                href="javascript:void(0)"
                role="button"
                onClick={(e) => e.preventDefault()}
                className="text-[#003366] font-bold hover:underline"
              >
                Termos do Programa Parceiro+
              </a>
              .
            </span>
          </label>
          <p className="text-xs font-bold text-slate-600 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
            Indicações somente para o mês vigente — após o mês, uma nova indicação deve ser enviada.
          </p>
          <button type="submit" disabled={loading} className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Enviando...' : 'Se cadastrar'} <ShieldCheck size={18} />
          </button>
        </form>
      )}

    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-4 px-4 sm:py-6 sm:px-6 bg-slate-50 bg-pattern">
      <div className="w-full max-w-2xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl grid grid-cols-1 lg:grid-cols-5 min-h-0 lg:min-h-[600px] overflow-visible lg:overflow-hidden">
        <div className="hidden lg:block lg:col-span-2">
          <PromoSection />
        </div>
        <div className="lg:col-span-3 lg:overflow-y-auto min-h-0 flex flex-col">
          <div className="lg:hidden py-6 px-4 bg-[#003366]">
            <div className="flex items-center gap-2 text-white">
              <Logo size="sm" variant="light" />
              <span className="font-tillit font-bold text-lg">TILLIT Parceiro+</span>
            </div>
          </div>
          <FormSection />
        </div>
      </div>
    </div>
  );
};

export default Auth;
