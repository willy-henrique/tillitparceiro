import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogOut, LayoutDashboard, PlusCircle, Users, 
  TrendingUp, Search, Bell, Filter, ChevronRight, 
  X, CheckCircle2, AlertCircle, RefreshCw, DollarSign, ArrowLeft, MessageSquare, CreditCard, Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Referral, ReferralStatus } from '../types';
import { getReferrals, addReferral } from '../lib/referrals';
import { getPartnerPix, savePartnerPix, formatPixKeyDisplay, type PartnerPixData, type PixKeyType } from '../lib/partners';
import Logo from '../components/Logo';

type Tab = 'dashboard' | 'indications' | 'extract' | 'payment';

const BONUS_TIERS = [
  { min: 0, max: 4, name: 'Bronze', amount: 150 },
  { min: 5, max: 9, name: 'Prata', amount: 200 },
  { min: 10, max: Infinity, name: 'Ouro', amount: 300 },
] as const;

function getBonusForConversion(convertedCount: number): number {
  const tier = BONUS_TIERS.find(t => convertedCount >= t.min && convertedCount <= t.max);
  return tier ? tier.amount : 150;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'ALL'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [newReferral, setNewReferral] = useState({
    companyName: '',
    cnpj: '',
    contactName: '',
    phone: '',
    email: ''
  });
  const [pixData, setPixData] = useState<PartnerPixData | null>(null);
  const [pixForm, setPixForm] = useState({
    pixKeyType: 'CPF' as PixKeyType,
    pixKey: '',
    accountHolder: ''
  });
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState('');
  const [pixSuccess, setPixSuccess] = useState(false);

  useEffect(() => {
    const closeDropdowns = () => { setShowFilterDropdown(false); setShowNotifications(false); };
    const timer = setTimeout(() => document.addEventListener('click', closeDropdowns), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', closeDropdowns); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPartnerPix(user.id).then((data) => { if (!cancelled) setPixData(data); });
    return () => { cancelled = true; };
  }, [user.id]);

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

  const stats = useMemo(() => ({
    total: referrals.length,
    converted: referrals.filter(r => r.status === ReferralStatus.CONVERTIDA || r.status === ReferralStatus.PAGO).length,
    pending: referrals.filter(r => r.status === ReferralStatus.PENDENTE).length,
    earnings: referrals
      .filter(r => r.status === ReferralStatus.CONVERTIDA || r.status === ReferralStatus.PAGO)
      .reduce((acc, curr) => acc + curr.bonusAmount, 0)
  }), [referrals]);

  const currentTier = useMemo(() => {
    const t = BONUS_TIERS.find(tier => stats.converted >= tier.min && stats.converted <= tier.max);
    return t ?? BONUS_TIERS[0];
  }, [stats.converted]);

  const nextTierInfo = useMemo(() => {
    const next = BONUS_TIERS.find(t => t.min > stats.converted);
    if (!next) return { target: stats.converted, remaining: 0, label: 'Máximo' };
    return { target: next.min, remaining: next.min - stats.converted, label: next.name };
  }, [stats.converted]);

  const progress = nextTierInfo.remaining === 0 
    ? 100 
    : Math.round(((stats.converted - (nextTierInfo.target - nextTierInfo.remaining)) / nextTierInfo.remaining) * 100);

  const handleAddReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);
    const bonusAmount = getBonusForConversion(stats.converted);
    const referralData = {
      partnerId: user.id,
      partnerName: user.name,
      companyName: newReferral.companyName.trim(),
      cnpj: newReferral.cnpj.trim(),
      contactName: newReferral.contactName.trim(),
      phone: newReferral.phone.trim(),
      email: newReferral.email.trim(),
      status: ReferralStatus.PENDENTE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bonusAmount
    };
    try {
      const added = await addReferral(referralData);
      setReferrals(prev => [added, ...prev]);
      setShowModal(false);
      setNewReferral({ companyName: '', cnpj: '', contactName: '', phone: '', email: '' });
    } catch {
      setSubmitError('Erro ao cadastrar. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = useMemo(() => {
    let list = referrals;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(r =>
        r.companyName.toLowerCase().includes(q) ||
        r.contactName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      );
    }
    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.status === statusFilter);
    }
    return list;
  }, [referrals, searchQuery, statusFilter]);

  const bonusExtract = useMemo(() =>
    referrals
      .filter(r => r.status === ReferralStatus.CONVERTIDA || r.status === ReferralStatus.PAGO)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [referrals]
  );

  const validatePixKey = (): boolean => {
    const { pixKeyType, pixKey, accountHolder } = pixForm;
    if (!accountHolder.trim()) { setPixError('Nome do titular é obrigatório.'); return false; }
    const key = pixKey.replace(/\D/g, '');
    if (pixKeyType === 'CPF' && key.length !== 11) { setPixError('CPF deve ter 11 dígitos.'); return false; }
    if (pixKeyType === 'CNPJ' && key.length !== 14) { setPixError('CNPJ deve ter 14 dígitos.'); return false; }
    if (pixKeyType === 'PHONE' && key.length < 10) { setPixError('Telefone inválido.'); return false; }
    if (pixKeyType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) { setPixError('E-mail inválido.'); return false; }
    if (pixKeyType === 'RANDOM' && pixKey.length < 20) { setPixError('Chave aleatória deve ter no mínimo 20 caracteres.'); return false; }
    if (pixKey.trim().length < 5) { setPixError('Chave PIX inválida.'); return false; }
    return true;
  };

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setPixError('');
    setPixSuccess(false);
    if (!validatePixKey()) return;
    setPixLoading(true);
    try {
      await savePartnerPix({
        partnerId: user.id,
        partnerName: user.name,
        pixKeyType: pixForm.pixKeyType,
        pixKey: pixForm.pixKey,
        accountHolder: pixForm.accountHolder,
      });
      const updated = await getPartnerPix(user.id);
      setPixData(updated);
      setPixSuccess(true);
      setPixForm({ pixKeyType: 'CPF', pixKey: '', accountHolder: '' });
      setTimeout(() => setPixSuccess(false), 3000);
    } catch {
      setPixError('Erro ao salvar. Tente novamente.');
    } finally {
      setPixLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleWhatsApp = (ref: Referral) => {
    const msg = encodeURIComponent(`Olá ${ref.contactName}! Aqui é ${user.name}, parceiro TILLIT. Indiquei a ${ref.companyName} para conversarmos sobre nossas soluções. Em breve nossa equipe entrará em contato!`);
    window.open(`https://wa.me/${ref.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

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
          <Logo size="sm" variant="light" />
          <span className="font-bold text-lg">Parceiro+</span>
        </Link>
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-4 font-medium text-sm">
          <ArrowLeft size={18} /> Voltar ao site
        </Link>
        
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('indications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'indications' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={20} /> Minhas Indicações
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'extract' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <TrendingUp size={20} /> Extrato de Bônus
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'payment' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard size={20} /> Dados PIX
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
               <input
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Buscar indicação..."
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#003366]"
               />
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowFilterDropdown(false); }}
                className="relative text-slate-400 hover:text-[#003366] transition-colors p-1"
              >
                <Bell size={22} />
                {referrals.filter(r => r.status === ReferralStatus.PENDENTE).length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {showNotifications && (
                <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Atividade recente</p>
                  {[...referrals].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4).map(r => (
                    <div key={r.id} className="px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0">
                      <p className="font-medium text-slate-800">{r.companyName}</p>
                      <p className={`text-xs ${r.status === ReferralStatus.CONVERTIDA || r.status === ReferralStatus.PAGO ? 'text-green-600' : r.status === ReferralStatus.PENDENTE ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {r.status === ReferralStatus.PAGO ? 'Bônus pago' : r.status === ReferralStatus.CONVERTIDA ? 'Convertida' : r.status === ReferralStatus.EM_NEGOCIACAO ? 'Em negociação' : 'Pendente'}
                      </p>
                    </div>
                  ))}
                  {referrals.length === 0 && (
                    <p className="px-4 py-6 text-slate-400 text-sm">Nenhuma atividade</p>
                  )}
                </div>
              )}
            </div>
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
              <p className="text-slate-500">
                {activeTab === 'dashboard' && 'Acompanhe seu progresso e faça novas indicações.'}
                {activeTab === 'indications' && 'Suas indicações e acompanhamento.'}
                {activeTab === 'extract' && 'Histórico de bônus recebidos.'}
                {activeTab === 'payment' && 'Configure sua chave PIX para receber os bônus.'}
              </p>
            </div>
            {(activeTab === 'dashboard' || activeTab === 'indications') && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-[#00B050] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-green-500/20"
              >
                <PlusCircle size={20} /> Nova Indicação
              </button>
            )}
          </div>

          {/* Gamification Bar - só no dashboard */}
          {(activeTab === 'dashboard' || activeTab === 'indications') && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 relative z-10">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">Bônus Progressivo</span>
                    <h3 className="text-2xl font-black text-[#003366]">Nível {currentTier.name}</h3>
                  </div>
                  <span className="text-sm text-slate-500 font-medium">
                    {nextTierInfo.remaining === 0 ? 'Nível máximo alcançado!' : `Faltam ${nextTierInfo.remaining} indicações`} para {nextTierInfo.label}
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>R$ 150/venda (1-5)</span>
                  <span>R$ 200/venda (6-10)</span>
                  <span>R$ 300/venda (11+)</span>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center min-w-[200px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ganhos Totais</p>
                <p className="text-3xl font-black text-[#003366]">R$ {stats.earnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
          )}

          {/* Dados PIX */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-[#003366]">Dados para Pagamento</h3>
                <p className="text-sm text-slate-500 mt-1">Cadastre sua chave PIX para receber os bônus das indicações convertidas.</p>
              </div>
              <div className="p-8">
                {pixData ? (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 size={20} />
                        <span className="font-bold">Chave PIX cadastrada</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Titular</p>
                          <p className="font-semibold text-slate-800">{pixData.accountHolder}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo / Chave</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm text-slate-800">{formatPixKeyDisplay(pixData)}</p>
                            <button onClick={() => copyToClipboard(formatPixKeyDisplay(pixData))} className="p-1.5 text-slate-400 hover:text-[#003366] rounded" title="Copiar">
                              <Copy size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{pixData.pixKeyType}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">Os pagamentos são realizados em até 30 dias após a conversão da indicação.</p>
                    <button
                      onClick={() => {
                        setPixForm({
                          pixKeyType: pixData.pixKeyType,
                          pixKey: pixData.pixKeyType === 'CPF' ? pixData.pixKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') :
                            pixData.pixKeyType === 'CNPJ' ? pixData.pixKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') :
                            pixData.pixKey,
                          accountHolder: pixData.accountHolder
                        });
                        setPixData(null);
                      }}
                      className="text-sm font-medium text-[#003366] hover:underline"
                    >
                      Alterar chave PIX
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSavePix} className="space-y-6 max-w-xl">
                    {pixError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{pixError}</p>}
                    {pixSuccess && <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl">Chave PIX cadastrada com sucesso!</p>}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do titular (como no banco)</label>
                      <input
                        type="text"
                        required
                        value={pixForm.accountHolder}
                        onChange={(e) => setPixForm({ ...pixForm, accountHolder: e.target.value })}
                        placeholder="Nome completo"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de chave PIX</label>
                      <select
                        value={pixForm.pixKeyType}
                        onChange={(e) => setPixForm({ ...pixForm, pixKeyType: e.target.value as PixKeyType })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366]"
                      >
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="PHONE">Telefone</option>
                        <option value="RANDOM">Chave aleatória</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {pixForm.pixKeyType === 'CPF' && 'CPF'}
                        {pixForm.pixKeyType === 'CNPJ' && 'CNPJ'}
                        {pixForm.pixKeyType === 'EMAIL' && 'E-mail'}
                        {pixForm.pixKeyType === 'PHONE' && 'Telefone (com DDD)'}
                        {pixForm.pixKeyType === 'RANDOM' && 'Chave aleatória'}
                      </label>
                      <input
                        type={pixForm.pixKeyType === 'EMAIL' ? 'email' : 'text'}
                        required
                        value={pixForm.pixKey}
                        onChange={(e) => setPixForm({ ...pixForm, pixKey: e.target.value })}
                        placeholder={
                          pixForm.pixKeyType === 'CPF' ? '000.000.000-00' :
                          pixForm.pixKeyType === 'CNPJ' ? '00.000.000/0000-00' :
                          pixForm.pixKeyType === 'PHONE' ? '(00) 00000-0000' :
                          pixForm.pixKeyType === 'EMAIL' ? 'seu@email.com' : 'Cole sua chave aleatória'
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003366] font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pixLoading}
                      className="bg-[#00B050] text-white px-6 py-3 rounded-xl font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-600 transition-all"
                    >
                      {pixLoading ? 'Salvando...' : 'Cadastrar chave PIX'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Extrato de Bônus */}
          {activeTab === 'extract' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-[#003366]">Extrato de Bônus</h3>
                <p className="text-sm text-slate-500 mt-1">Indicações convertidas e pagas</p>
              </div>
              <div className="p-8">
                {bonusExtract.length > 0 ? (
                  <div className="space-y-4">
                    {bonusExtract.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-[#003366]">{ref.companyName}</p>
                          <p className="text-sm text-slate-500">{new Date(ref.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-[#00B050]">R$ {ref.bonusAmount.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">{ref.status === ReferralStatus.PAGO ? 'Pago' : 'Convertida'}</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                      <p className="font-bold text-slate-700">Total</p>
                      <p className="text-2xl font-black text-[#003366]">R$ {stats.earnings.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum bônus recebido ainda</p>
                    <p className="text-sm mt-1">Suas indicações convertidas aparecerão aqui</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table - Dashboard e Indicações */}
          {(activeTab === 'dashboard' || activeTab === 'indications') && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#003366]">Acompanhamento em Tempo Real</h3>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFilterDropdown(!showFilterDropdown); setShowNotifications(false); }}
                  className="text-slate-400 hover:text-[#003366] transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Filter size={16} /> Filtrar {statusFilter !== 'ALL' && `(${statusFilter})`}
                </button>
                {showFilterDropdown && (
                  <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {(['ALL', ReferralStatus.PENDENTE, ReferralStatus.EM_NEGOCIACAO, ReferralStatus.CONVERTIDA, ReferralStatus.PAGO] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setShowFilterDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${statusFilter === s ? 'bg-slate-100 font-bold text-[#003366]' : 'text-slate-600'}`}
                      >
                        {s === 'ALL' ? 'Todos' : s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Empresa / CNPJ</th>
                    <th className="px-8 py-4">Contato</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                    <th className="px-8 py-4 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReferrals.map((ref) => (
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
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => handleWhatsApp(ref)}
                          title="Contatar no WhatsApp"
                          className="p-2 bg-[#00B050]/10 text-[#00B050] rounded-lg hover:bg-[#00B050] hover:text-white transition-all"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right text-xs font-medium text-slate-400">
                        {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                  {filteredReferrals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                        <p className="mb-2">
                          {referrals.length === 0 ? 'Nenhuma indicação encontrada.' : 'Nenhum resultado para a busca/filtro.'}
                        </p>
                        <button onClick={() => setShowModal(true)} className="text-[#00B050] font-bold hover:underline">Começar agora</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
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
              {submitError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{submitError}</p>}
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 leading-relaxed">
                  <span className="font-bold">Dica:</span> Quanto mais informações você fornecer, mais rápida será nossa abordagem comercial.
                </p>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#00B050] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Cadastrando...' : 'Confirmar Indicação'} <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
