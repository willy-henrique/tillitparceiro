import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, ArrowLeft, Chrome, MessageSquare } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createPartnerRequest, createPartnerRequestFromGoogle, getUserByEmail } from '../lib/users';
import Logo from '../components/Logo';

interface RegisterProps {
  onRegister?: (user: unknown) => void;
}

const Register: React.FC<RegisterProps> = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    terms: false
  });
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleUserPendingPhone, setGoogleUserPendingPhone] = useState<{ name: string; email: string } | null>(null);
  const [phoneForGoogle, setPhoneForGoogle] = useState('');

  const handleGoogleRegister = async () => {
    setLoadingGoogle(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email ?? '';
      const name = user.displayName ?? user.email ?? 'Usuário';
      const existing = await getUserByEmail(email);
      if (existing) {
        if (existing.status === 'REJECTED') {
          setError('Seu cadastro foi rejeitado. Entre em contato com o suporte.');
          return;
        }
        if (existing.status === 'APPROVED') {
          if (!existing.phone?.trim()) {
            setGoogleUserPendingPhone({ name, email });
            setPhoneForGoogle('');
            return;
          }
          navigate('/dashboard');
        } else {
          if (!existing.phone?.trim()) {
            setGoogleUserPendingPhone({ name, email });
            setPhoneForGoogle('');
            return;
          }
          navigate('/aguardando');
        }
        return;
      }
      setGoogleUserPendingPhone({ name, email });
      setPhoneForGoogle('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar com Google';
      setError(msg.includes('popup-closed') ? '' : 'Erro ao cadastrar com Google. Tente novamente.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmitPhoneForGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUserPendingPhone || !phoneForGoogle.trim()) return;
    const digits = phoneForGoogle.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    const phone = phoneForGoogle.trim();
    setLoading(true);
    setError('');
    try {
      const existing = await getUserByEmail(googleUserPendingPhone.email);
      if (existing) {
        const { updateUserPhone } = await import('../lib/users');
        await updateUserPhone(existing.id, phone);
        if (existing.status === 'APPROVED') navigate('/dashboard');
        else navigate('/aguardando');
      } else {
        await createPartnerRequestFromGoogle({
          name: googleUserPendingPhone.name,
          email: googleUserPendingPhone.email,
          phone,
        });
        window.location.href = '/#/aguardando';
        return;
      }
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createPartnerRequest({
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

  if (googleUserPendingPhone) {
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
          <form onSubmit={handleSubmitPhoneForGoogle} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp (com DDD)</label>
              <input
                type="tel"
                required
                value={phoneForGoogle}
                onChange={(e) => setPhoneForGoogle(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-all disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-pattern">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8">
          <div className="flex justify-start">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium">
              <ArrowLeft size={18} /> Voltar
            </Link>
          </div>
          <div className="w-24 h-24 bg-orange-50 text-[#FF8C00] rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-[#003366]">Cadastro em Análise</h1>
            <p className="text-slate-500 leading-relaxed">
              Olá <span className="font-bold text-[#003366]">{formData.name}</span>! Nossa equipe está validando seu perfil para garantir a melhor experiência na nossa rede.
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos passos:</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="text-[#00B050]" size={16} /> Verificação de dados básicos
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div> Liberação do acesso ao painel
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div> Início das indicações
              </li>
            </ul>
          </div>
          <p className="text-xs text-slate-400">Normalmente aprovamos em menos de 24 horas. Use o mesmo e-mail no login com Google para acessar após aprovação.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-pattern">
      <div className="max-w-2xl w-full grid md:grid-cols-5 bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative">
        <Link to="/" className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="md:col-span-2 bg-[#003366] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="space-y-6 relative z-10">
            <Logo size="md" variant="light" />
            <h2 className="text-3xl font-black leading-tight">Torne-se um <span className="text-[#00B050]">Embaixador</span> TILLIT.</h2>
            <p className="text-slate-300 text-sm">Transforme sua rede de contatos em uma fonte recorrente de ganhos.</p>
          </div>
          <div className="space-y-4 relative z-10">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-[#00B050]">
                 <CheckCircle2 size={18} />
               </div>
               <span className="text-sm font-medium">Painel Exclusivo</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-[#00B050]">
                 <CheckCircle2 size={18} />
               </div>
               <span className="text-sm font-medium">Bônus Progressivo</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-[#00B050]">
                 <CheckCircle2 size={18} />
               </div>
               <span className="text-sm font-medium">Suporte Venda+</span>
             </div>
          </div>
        </div>

        <div className="md:col-span-3 p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Criar Conta de Parceiro</h1>
            <p className="text-slate-500 text-sm">Preencha os dados abaixo ou use o Google para começar</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Chrome size={22} className="text-red-500" />
            {loadingGoogle ? 'Cadastrando...' : 'Cadastrar com Google'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white px-4 text-slate-400">ou com formulário</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input 
                  type="text" required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail Profissional</label>
                <input 
                  type="email" required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone/WhatsApp</label>
                  <input 
                    type="tel" required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                  <input 
                    type="password" required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <label className="flex gap-3 cursor-pointer group">
                <input 
                  type="checkbox" required
                  checked={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-[#00B050] focus:ring-[#00B050]" 
                />
                <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                  Li e aceito os <a href="#" className="text-[#003366] font-bold hover:underline">Termos do Programa Parceiro+</a> e concordo com a política de tratamento de dados conforme a LGPD.
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Enviando...' : 'Solicitar Acesso'} <ShieldCheck size={18} />
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Já tem uma conta? <Link to="/login" className="text-[#003366] font-bold hover:underline">Entrar agora</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
