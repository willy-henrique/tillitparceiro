
import React, { useState, useEffect } from 'react';
import { 
  LogOut, Shield, MessageSquare, CreditCard, 
  Search, Bell, Filter, MoreVertical, 
  UserCheck, ExternalLink, Calendar, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Referral, ReferralStatus } from '../types';
import { getReferrals, updateReferralStatus } from '../lib/referrals';

interface AdminProps {
  user: User;
  onLogout: () => void;
}

const Admin: React.FC<AdminProps> = ({ user, onLogout }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filter, setFilter] = useState<ReferralStatus | 'ALL'>('ALL');

  useEffect(() => {
    let cancelled = false;
    getReferrals()
      .then((data) => { if (!cancelled) setReferrals(data); })
      .catch(() => { if (!cancelled) setReferrals([]); });
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (id: string, newStatus: ReferralStatus) => {
    try {
      await updateReferralStatus(id, newStatus);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: newStatus,
                updatedAt: new Date().toISOString(),
                implementationPaidAt:
                  newStatus === ReferralStatus.CONVERTIDA ? new Date().toISOString() : r.implementationPaidAt,
              }
            : r
        )
      );
    } catch {
      // handle error
    }
  };

  const handleWhatsApp = (ref: Referral) => {
    const message = encodeURIComponent(`Olá ${ref.contactName}, aqui é da equipe TILLIT Tecnologia! Recebemos uma indicação especial através do nosso parceiro ${ref.partnerName} e gostaríamos de apresentar nossas soluções para a ${ref.companyName}. Podemos agendar uma conversa rápida?`);
    window.open(`https://wa.me/${ref.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const filteredReferrals = filter === 'ALL' 
    ? referrals 
    : referrals.filter(r => r.status === filter);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col p-6">
        <Link to="/" className="flex items-center gap-2 mb-10 text-white hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 bg-[#00B050] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg">Admin<span className="text-[#00B050]">+</span></span>
        </Link>
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-4 font-medium text-sm">
          <ArrowLeft size={18} /> Voltar ao site
        </Link>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-semibold">
            <Shield size={20} /> Visão de Leads
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <UserCheck size={20} /> Parceiros
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <CreditCard size={20} /> Pagamentos
          </button>
        </nav>

        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors mt-auto font-bold text-sm border-t border-white/10 pt-6">
          <LogOut size={18} /> Logout Admin
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Admin */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Gestão de Indicações</h2>
          <div className="flex items-center gap-4">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setFilter('ALL')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  Tudo
                </button>
                <button 
                  onClick={() => setFilter(ReferralStatus.PENDENTE)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === ReferralStatus.PENDENTE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  Pendentes
                </button>
                <button 
                  onClick={() => setFilter(ReferralStatus.EM_NEGOCIACAO)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === ReferralStatus.EM_NEGOCIACAO ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  Negociando
                </button>
             </div>
             <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#00B050] transition-colors"><Bell size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Leads Novos</p>
              <p className="text-2xl font-black text-slate-800">{referrals.filter(r => r.status === ReferralStatus.PENDENTE).length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Em Funil</p>
              <p className="text-2xl font-black text-blue-600">{referrals.filter(r => r.status === ReferralStatus.EM_NEGOCIACAO).length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Conversões</p>
              <p className="text-2xl font-black text-[#00B050]">{referrals.filter(r => r.status === ReferralStatus.CONVERTIDA).length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">A pagar</p>
              <p className="text-2xl font-black text-orange-500">{referrals.filter(r => r.status === ReferralStatus.CONVERTIDA).length * 150}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Indicador</th>
                    <th className="px-8 py-4">Lead / Empresa</th>
                    <th className="px-8 py-4">Status Atual</th>
                    <th className="px-8 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                             {ref.partnerName.charAt(0)}
                           </div>
                           <p className="text-sm font-bold text-slate-800">{ref.partnerName}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900">{ref.companyName}</p>
                          <p className="text-xs text-slate-500">{ref.contactName} • {ref.phone}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={ref.status}
                          onChange={(e) => updateStatus(ref.id, e.target.value as ReferralStatus)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-slate-200 ${
                            ref.status === ReferralStatus.PENDENTE ? 'bg-yellow-50 text-yellow-600' :
                            ref.status === ReferralStatus.EM_NEGOCIACAO ? 'bg-blue-50 text-blue-600' :
                            'bg-green-50 text-green-600'
                          }`}
                        >
                          <option value={ReferralStatus.PENDENTE}>PENDENTE</option>
                          <option value={ReferralStatus.EM_NEGOCIACAO}>EM NEGOCIAÇÃO</option>
                          <option value={ReferralStatus.CONVERTIDA}>CONVERTIDA</option>
                          <option value={ReferralStatus.PAGO}>PAGAMENTO CONCLUÍDO</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => handleWhatsApp(ref)}
                             title="Abrir WhatsApp"
                             className="p-2.5 bg-[#00B050]/10 text-[#00B050] rounded-xl hover:bg-[#00B050] hover:text-white transition-all"
                           >
                             <MessageSquare size={18} />
                           </button>
                           {ref.status === ReferralStatus.CONVERTIDA && (
                             <button 
                               onClick={() => updateStatus(ref.id, ReferralStatus.PAGO)}
                               title="Confirmar Pagamento de Bônus"
                               className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                             >
                               <CreditCard size={18} />
                             </button>
                           )}
                           <button className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors">
                             <MoreVertical size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          {/* Logic of payment helper section */}
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div className="bg-[#003366] p-8 rounded-3xl text-white space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Calendar size={20} className="text-[#00B050]" /> Ciclo de Pagamentos
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                Ao marcar uma indicação como <span className="text-white font-bold">"Convertida"</span>, o sistema entende que o pagamento da implantação foi realizado. O bônus do parceiro entrará no cronômetro de 30 dias para liberação automática via financeiro.
              </p>
              <div className="pt-4 flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#00B050]">
                <CheckCircle2 size={16} /> LGPD Audit Log Ativo
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-center space-y-4">
               <h4 className="text-lg font-bold text-slate-800">Dica Comercial da IA</h4>
               <p className="text-slate-500 text-sm">
                 Com base no histórico da <strong>Padaria do Zé</strong>, o produto ideal para iniciar a demonstração é o <strong>Tillit PDV</strong> focado em frente de caixa rápido.
               </p>
               <button className="text-[#003366] text-xs font-bold flex items-center gap-1 hover:underline">
                 Gerar Proposta Inteligente <ExternalLink size={12}/>
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
