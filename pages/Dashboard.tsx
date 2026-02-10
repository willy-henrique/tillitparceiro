
import React, { useState, useEffect } from 'react';
import { 
  LogOut, LayoutDashboard, PlusCircle, Users, 
  TrendingUp, Search, Bell, Filter, ChevronRight, 
  X, CheckCircle2, AlertCircle, RefreshCw, DollarSign, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Referral, ReferralStatus } from '../types';
import { getReferrals, addReferral } from '../lib/referrals';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newReferral, setNewReferral] = useState({
    companyName: '',
    cnpj: '',
    contactName: '',
    phone: '',
    email: ''
  });

  // Load referrals from Firebase
  useEffect(() => {
    let cancelled = false;
    getReferrals(user.id)
      .then((data) => {
        if (!cancelled) {
          setReferrals(data.length > 0 ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setReferrals([]);
      });
    return () => { cancelled = true; };
  }, [user.id]);

  const handleAddReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    const referralData = {
      partnerId: user.id,
      partnerName: user.name,
      companyName: newReferral.companyName,
      cnpj: newReferral.cnpj,
      contactName: newReferral.contactName,
      phone: newReferral.phone,
      email: newReferral.email,
      status: ReferralStatus.PENDENTE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bonusAmount: 150
    };
    try {
      const added = await addReferral(referralData);
      setReferrals([added, ...referrals]);
      setShowModal(false);
      setNewReferral({ companyName: '', cnpj: '', contactName: '', phone: '', email: '' });
    } catch {
      // fallback: show error or retry
    }
  };

  const stats = {
    total: referrals.length,
    converted: referrals.filter(r => r.status === ReferralStatus.CONVERTIDA || r.status === ReferralStatus.PAGO).length,
    pending: referrals.filter(r => r.status === ReferralStatus.PENDENTE).length,
    earnings: referrals
      .filter(r => r.status === ReferralStatus.CONVERTIDA || r.status === ReferralStatus.PAGO)
      .reduce((acc, curr) => acc + curr.bonusAmount, 0)
  };

  const progress = Math.min((stats.converted / 10) * 100, 100);
  const nextTier = stats.converted < 5 ? 5 : 11;
  const remainingForNext = nextTier - stats.converted;

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case ReferralStatus.PENDENTE:
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Pendente</span>;
      case ReferralStatus.EM_NEGOCIACAO:
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><RefreshCw size={12}/> Negociando</span>;
      case ReferralStatus.CONVERTIDA:
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Convertida</span>;
      case ReferralStatus.PAGO:
        // Fixed: DollarSign icon now correctly imported
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><DollarSign size={12}/> Pago</span>;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#003366] text-white hidden lg:flex flex-col p-6">
        <Link to="/" className="flex items-center gap-2 mb-10 text-white hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#003366] font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg">Parceiro+</span>
        </Link>
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-4 font-medium text-sm">
          <ArrowLeft size={18} /> Voltar ao site
        </Link>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-semibold">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <Users size={20} /> Minhas Indicações
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <TrendingUp size={20} /> Extrato de Bônus
          </button>
        </nav>

        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors mt-auto font-bold text-sm">
          <LogOut size={18} /> Sair do Portal
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative w-96 hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input type="text" placeholder="Buscar indicação..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#003366]" />
             </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-[#003366] transition-colors">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-[#003366]">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Membro Premium</p>
              </div>
              <img src="https://picsum.photos/seed/partner/100/100" className="w-10 h-10 rounded-full border-2 border-slate-100" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Welcome & CTA */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-[#003366]">Olá, {user.name.split(' ')[0]}!</h1>
              <p className="text-slate-500">Acompanhe seu progresso e faça novas indicações.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#00B050] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-green-500/20"
            >
              <PlusCircle size={20} /> Nova Indicação
            </button>
          </div>

          {/* Gamification Bar */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 relative z-10">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">Bônus Progressivo</span>
                    <h3 className="text-2xl font-black text-[#003366]">Nível Bronze</h3>
                  </div>
                  <span className="text-sm text-slate-500 font-medium">Faltam <span className="text-[#003366] font-bold">{remainingForNext} indicações</span> para o próximo nível</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>R$ 150/venda</span>
                  <span>R$ 200/venda</span>
                  <span>R$ 300/venda</span>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center min-w-[200px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ganhos Totais</p>
                <p className="text-3xl font-black text-[#003366]">R$ {stats.earnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#003366]">Acompanhamento em Tempo Real</h3>
              <button className="text-slate-400 hover:text-[#003366] transition-colors flex items-center gap-2 text-sm font-medium">
                <Filter size={16} /> Filtrar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Empresa / CNPJ</th>
                    <th className="px-8 py-4">Contato</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="font-bold text-[#003366] group-hover:text-[#00B050] transition-colors">{ref.companyName}</p>
                          <p className="text-xs text-slate-400">{ref.cnpj}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{ref.contactName}</p>
                          <p className="text-xs text-slate-400">{ref.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {getStatusBadge(ref.status)}
                      </td>
                      <td className="px-8 py-6 text-right text-xs font-medium text-slate-400">
                        {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400">
                        <p className="mb-2">Nenhuma indicação encontrada.</p>
                        <button onClick={() => setShowModal(true)} className="text-[#00B050] font-bold hover:underline">Começar agora</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Referral Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003366]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#003366] text-white">
              <div>
                <h3 className="text-xl font-bold">Nova Indicação</h3>
                <p className="text-white/60 text-sm">Gere valor para seus contatos.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddReferral} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Razão Social / Nome Fantasia</label>
                  <input 
                    type="text" required
                    value={newReferral.companyName}
                    onChange={(e) => setNewReferral({...newReferral, companyName: e.target.value})}
                    placeholder="Ex: Restaurante do Porto Ltda"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CNPJ (Opcional)</label>
                  <input 
                    type="text"
                    value={newReferral.cnpj}
                    onChange={(e) => setNewReferral({...newReferral, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Responsável</label>
                  <input 
                    type="text" required
                    value={newReferral.contactName}
                    onChange={(e) => setNewReferral({...newReferral, contactName: e.target.value})}
                    placeholder="Quem vamos procurar?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp/Telefone</label>
                  <input 
                    type="tel" required
                    value={newReferral.phone}
                    onChange={(e) => setNewReferral({...newReferral, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</label>
                  <input 
                    type="email"
                    value={newReferral.email}
                    onChange={(e) => setNewReferral({...newReferral, email: e.target.value})}
                    placeholder="email@empresa.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]" 
                  />
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 leading-relaxed">
                  <span className="font-bold">Dica:</span> Quanto mais informações você fornecer, mais rápida será nossa abordagem comercial.
                </p>
              </div>
              <button type="submit" className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20">
                Confirmar Indicação <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
