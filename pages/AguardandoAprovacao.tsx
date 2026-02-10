import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

const AguardandoAprovacao: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-pattern">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-sm font-medium">
          <Logo size="sm" variant="default" />
          <ArrowLeft size={18} /> Voltar
        </Link>
        <div className="w-24 h-24 bg-orange-50 text-[#FF8C00] rounded-full flex items-center justify-center mx-auto">
          <Clock size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-[#003366]">Cadastro em Análise</h1>
          <p className="text-slate-500 leading-relaxed">
            Seu perfil está sendo validado pela nossa equipe. Assim que for aprovado, você terá acesso completo ao painel de parceiros.
          </p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4 border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos passos:</p>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>• Nossa equipe analisa seu cadastro</li>
            <li>• Você receberá a liberação em breve</li>
            <li>• Acesse novamente com Google para entrar no painel</li>
          </ul>
        </div>
        <p className="text-xs text-slate-400">Dúvidas? Entre em contato pelo suporte.</p>
      </div>
    </div>
  );
};

export default AguardandoAprovacao;
