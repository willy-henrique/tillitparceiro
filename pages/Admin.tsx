import React, { useState, useEffect } from 'react';
import { 
  LogOut, Shield, MessageSquare, CreditCard, 
  Bell, UserCheck, ExternalLink, Calendar, CheckCircle2, 
  ArrowLeft, UserPlus, XCircle, Copy, Banknote, X, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, Referral, ReferralStatus } from '../types';
import { getReferrals, updateReferralStatus } from '../lib/referrals';
import { getPendingPartners, approvePartner, rejectPartner, type PartnerRequest } from '../lib/users';
import { getPartnerPix, getPartnersPix, formatPixKeyDisplay, type PartnerPixData } from '../lib/partners';
import Logo from '../components/Logo';

type Tab = 'approval' | 'leads' | 'payments';

interface AdminProps {
  user: User;
  onLogout: () => void;
}

const Admin: React.FC<AdminProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<Tab>('approval');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [pendingPartners, setPendingPartners] = useState<PartnerRequest[]>([]);
  const [partnersPix, setPartnersPix] = useState<Map<string, PartnerPixData>>(new Map());
  const [filter, setFilter] = useState<ReferralStatus | 'ALL'>('ALL');
  const [paymentModal, setPaymentModal] = useState<Referral | null>(null);
  const [paymentPix, setPaymentPix] = useState<PartnerPixData | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const fetchPendingPartners = () => {
    setApprovalLoading(true);
    setApprovalError(null);
    getPendingPartners()
      .then((data) => setPendingPartners(data))
      .catch((err) => {
        setPendingPartners([]);
        setApprovalError(err?.message ?? 'Erro ao carregar solicitações. Verifique a conexão e as credenciais do Firebase.');
      })
      .finally(() => setApprovalLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    getReferrals()
      .then((data) => { if (!cancelled) setReferrals(data); })
      .catch(() => { if (!cancelled) setReferrals([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (tab !== 'approval') return;
    let cancelled = false;
    setApprovalLoading(true);
    setApprovalError(null);
    getPendingPartners()
      .then((data) => { if (!cancelled) setPendingPartners(data); })
      .catch((err) => {
        if (!cancelled) {
          setPendingPartners([]);
          setApprovalError(err?.message ?? 'Erro ao carregar solicitações.');
        }
      })
      .finally(() => { if (!cancelled) setApprovalLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  useEffect(() => {
    if (tab !== 'payments' && tab !== 'leads') return;
    const ids = [...new Set(referrals.filter(r => r.status === ReferralStatus.CONVERTIDA).map(r => r.partnerId))];
    if (ids.length === 0) return;
    let cancelled = false;
    getPartnersPix(ids).then((map) => { if (!cancelled) setPartnersPix(map); });
    return () => { cancelled = true; };
  }, [tab, referrals]);

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

  const handleWhatsAppPartner = (p: PartnerRequest) => {
    const message = encodeURIComponent(`Olá ${p.name}! Aqui é da equipe TILLIT Parceiro+. Recebemos seu cadastro e gostaríamos de conversar para liberar seu acesso ao painel. Podemos agendar uma breve conversa?`);
    window.open(`https://wa.me/${p.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePartner(id);
      setPendingPartners((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // error
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectPartner(id);
      setPendingPartners((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // error
    }
  };

  const filteredReferrals = filter === 'ALL' 
    ? referrals 
    : referrals.filter(r => r.status === filter);

  const toPayReferrals = referrals.filter(r => r.status === ReferralStatus.CONVERTIDA);
  const toPayTotal = toPayReferrals.reduce((acc, r) => acc + r.bonusAmount, 0);

  const openPaymentModal = async (ref: Referral) => {
    setPaymentModal(ref);
    const pix = await getPartnerPix(ref.partnerId);
    setPaymentPix(pix);
  };

  const closePaymentModal = () => {
    setPaymentModal(null);
    setPaymentPix(null);
    setConfirmingPayment(false);
  };

  const handleConfirmPayment = async () => {
    if (!paymentModal) return;
    setConfirmingPayment(true);
    try {
      await updateStatus(paymentModal.id, ReferralStatus.PAGO);
      closePaymentModal();
    } finally {
      setConfirmingPayment(false);
    }
  };

  const copyPix = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col p-6">
        <Link to="/" className="flex items-center gap-2 mb-10 text-white hover:opacity-90 transition-opacity">
          <Logo size="sm" variant="admin" />
          <span className="font-bold text-lg">Admin<span className="text-[#00B050]">+</span></span>
        </Link>
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-4 font-medium text-sm">
          <ArrowLeft size={18} /> Voltar ao site
        </Link>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setTab('approval')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${tab === 'approval' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <UserPlus size={20} /> Aprovar Utilização
          </button>
          <button 
            onClick={() => setTab('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${tab === 'leads' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Shield size={20} /> Indicações / Leads
          </button>
          <button 
            onClick={() => setTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${tab === 'payments' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
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
          <h2 className="text-xl font-bold text-slate-800">
            {tab === 'approval' && 'Aprovar Utilização do Site'}
            {tab === 'leads' && 'Gestão de Indicações'}
            {tab === 'payments' && 'Pagamento de Bônus'}
          </h2>
          <div className="flex items-center gap-4">
             {tab === 'leads' && (
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
             )}
             <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#00B050] transition-colors"><Bell size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {tab === 'approval' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-slate-600">Solicitações de parceiros aguardando liberação para utilizar o site completo.</p>
                <button
                  onClick={fetchPendingPartners}
                  disabled={approvalLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={16} className={approvalLoading ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>
              {approvalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {approvalError}
                </div>
              )}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Nome</th>
                      <th className="px-8 py-4">E-mail</th>
                      <th className="px-8 py-4">Telefone</th>
                      <th className="px-8 py-4">Data</th>
                      <th className="px-8 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingPartners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {p.name.charAt(0)}
                            </div>
                            <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-600">{p.email}</td>
                        <td className="px-8 py-6 text-sm text-slate-600">{p.phone}</td>
                        <td className="px-8 py-6 text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleWhatsAppPartner(p)}
                              title="Contatar no WhatsApp"
                              className="p-2.5 bg-[#00B050]/10 text-[#00B050] rounded-xl hover:bg-[#00B050] hover:text-white transition-all"
                            >
                              <MessageSquare size={18} />
                            </button>
                            <button
                              onClick={() => handleApprove(p.id)}
                              title="Aprovar"
                              className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              title="Rejeitar"
                              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingPartners.length === 0 && !approvalLoading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                          Nenhuma solicitação pendente.
                        </td>
                      </tr>
                    )}
                    {pendingPartners.length === 0 && approvalLoading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                          Carregando...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'leads' && (
          <>
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
              <p className="text-2xl font-black text-orange-500">R$ {toPayTotal.toFixed(2)}</p>
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
                               onClick={() => openPaymentModal(ref)}
                               title="Pagar Bônus via PIX"
                               className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                             >
                               <Banknote size={18} />
                             </button>
                           )}
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
          </>
          )}

          {tab === 'payments' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Aguardando Pagamento</p>
                  <p className="text-2xl font-black text-orange-500">{toPayReferrals.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                  <p className="text-2xl font-black text-[#003366]">R$ {toPayTotal.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Com PIX Cadastrado</p>
                  <p className="text-2xl font-black text-[#00B050]">
                    {toPayReferrals.filter(r => partnersPix.has(r.partnerId)).length}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-[#003366]">Indicações Convertidas - Prontas para Pagamento</h3>
                  <p className="text-sm text-slate-500 mt-1">Clique em "Pagar" para visualizar o PIX do parceiro e confirmar a transferência</p>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Parceiro</th>
                      <th className="px-8 py-4">Lead / Empresa</th>
                      <th className="px-8 py-4">Bônus</th>
                      <th className="px-8 py-4">PIX</th>
                      <th className="px-8 py-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {toPayReferrals.map((ref) => {
                      const hasPix = partnersPix.has(ref.partnerId);
                      return (
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
                            <p className="text-sm font-black text-slate-900">{ref.companyName}</p>
                            <p className="text-xs text-slate-500">{ref.contactName}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-lg font-black text-[#00B050]">R$ {ref.bonusAmount.toFixed(2)}</p>
                          </td>
                          <td className="px-8 py-6">
                            {hasPix ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                                <CheckCircle2 size={16} /> Cadastrado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                                <XCircle size={16} /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button
                              onClick={() => openPaymentModal(ref)}
                              disabled={!hasPix}
                              className="px-4 py-2 bg-[#00B050] text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                              <Banknote size={18} /> Pagar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {toPayReferrals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                          Nenhuma indicação aguardando pagamento.
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

      {/* Modal Pagamento PIX */}
      {paymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-[#003366] text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Pagamento via PIX</h3>
              <button onClick={closePaymentModal} className="text-white/60 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Indicação</p>
                <p className="text-lg font-bold text-slate-800">{paymentModal.companyName}</p>
                <p className="text-sm text-slate-500">Parceiro: {paymentModal.partnerName}</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-700 uppercase mb-1">Valor do Bônus</p>
                <p className="text-3xl font-black text-orange-600">R$ {paymentModal.bonusAmount.toFixed(2)}</p>
              </div>
              {paymentPix ? (
                <div className="space-y-4 bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Dados PIX do Parceiro</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Titular</p>
                      <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-slate-200">
                        <p className="font-semibold text-slate-800">{paymentPix.accountHolder}</p>
                        <button onClick={() => copyPix(paymentPix.accountHolder)} className="p-2 text-slate-400 hover:text-[#003366]">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Chave PIX ({paymentPix.pixKeyType})</p>
                      <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-slate-200 font-mono">
                        <p className="text-slate-800 break-all">{formatPixKeyDisplay(paymentPix)}</p>
                        <button onClick={() => copyPix(formatPixKeyDisplay(paymentPix))} className="p-2 text-slate-400 hover:text-[#003366] flex-shrink-0">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                  <p className="text-amber-800 font-medium">Parceiro ainda não cadastrou a chave PIX.</p>
                  <p className="text-sm text-amber-600 mt-2">Solicite que o parceiro cadastre em "Dados PIX" no painel.</p>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                {paymentPix && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={confirmingPayment}
                    className="flex-1 py-3 rounded-xl bg-[#00B050] text-white font-bold hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmingPayment ? 'Confirmando...' : 'Confirmar Pagamento'}
                    <CheckCircle2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
