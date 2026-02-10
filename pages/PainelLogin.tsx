import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { verifyAdminCredentials } from '../lib/auth';
import { User } from '../types';

interface PainelLoginProps {
  onLogin: (user: User) => void;
}

const PainelLogin: React.FC<PainelLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const isValid = await verifyAdminCredentials(email, password);
      if (isValid) {
        const adminUser: User = {
          id: 'adm_tillit',
          name: 'Administrador',
          email: 'tillitparceiro@gmail.com',
          role: 'ADMIN',
          status: 'APPROVED',
        };
        onLogin(adminUser);
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch {
      setError('Erro ao verificar credenciais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 bg-pattern">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium mb-4">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366]">Painel Administrativo</h1>
          <p className="text-slate-500 text-sm">Acesso restrito à administração</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail administrativo"
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
                placeholder="Senha"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-xl shadow-blue-900/20 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Acessar Painel'} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Parceiros acessam pelo <Link to="/login" className="text-[#003366] font-bold hover:underline">login principal</Link>.
        </p>
      </div>
    </div>
  );
};

export default PainelLogin;
