import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { createPartnerRequest } from '../lib/users';

interface RegisterProps {
  onRegister?: (user: unknown) => void;
}

const Register: React.FC<RegisterProps> = () => {
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
      <div className="max-w-2xl w-full grid md:grid-cols-5 bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        <Link to="/" className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="md:col-span-2 bg-[#003366] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="space-y-6 relative z-10">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#003366] font-black text-xl">T</span>
            </div>
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

        <div className="md:col-span-3 p-10 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Criar Conta de Parceiro</h1>
            <p className="text-slate-500 text-sm">Preencha os dados abaixo para começar</p>
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
