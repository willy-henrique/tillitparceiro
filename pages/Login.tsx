
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, Chrome, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth logic
    if (email.includes('admin')) {
      const adminUser: User = {
        id: 'adm_1',
        name: 'Carlos Admin',
        email: email,
        role: 'ADMIN',
        status: 'APPROVED'
      };
      onLogin(adminUser);
      navigate('/gestao-comercial');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-pattern">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium mb-4">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
             <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="text-[#003366] font-black text-xl tracking-tighter uppercase">Parceiro+</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-sm">Acesse sua conta para gerenciar indicações</p>
        </div>

        <button className="w-full flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700">
          <Chrome size={20} className="text-red-500" /> Entrar com Google
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
      </div>
    </div>
  );
};

export default Login;
