import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users, Award, Briefcase, CheckCircle2, X, CreditCard } from 'lucide-react';
import { PARTNER_PRODUCTS } from '../constants';
import Logo from '../components/Logo';

const TERMOS_DE_USO = (
  <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
    <p><strong>1. Objeto.</strong> Estes Termos regem o uso da plataforma TILLIT Parceiro+, programa de indicação de parceiros da TILLIT Tecnologia.</p>
    <p><strong>2. Cadastro e Elegibilidade.</strong> Para participar, o parceiro deve cadastrar-se com dados verdadeiros (nome, e-mail, WhatsApp, CNPJ/CPF, empresa). A TILLIT reserva-se o direito de aprovar ou recusar cadastros.</p>
    <p><strong>3. Indicações.</strong> O parceiro indica leads qualificados. A TILLIT é responsável por negociar, fechar contrato e implantar as soluções (Hiper, TEF, Linx Empório). O bônus só é devido após pagamento da implantação pelo cliente indicado.</p>
    <p><strong>4. Valores e Pagamento.</strong> Indicação TEF: R$ 50,00 cada. Bônus progressivo: R$ 150,00 cada (indicações 1-5), R$ 200,00 cada (6-10), R$ 300,00 cada (11+). Pagamento via PIX em até 30 dias após confirmação.</p>
    <p><strong>5. Conduta.</strong> O parceiro compromete-se a indicar apenas leads legítimos, sem fraude ou abuso. O descumprimento pode resultar em exclusão e perda de bônus.</p>
    <p><strong>6. Propriedade.</strong> A plataforma, marcas e conteúdos são de propriedade da TILLIT. Uso não autorizado é vedado.</p>
  </div>
);

const POLITICA_PRIVACIDADE = (
  <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
    <p>Em conformidade com a LGPD (Lei 13.709/2018), a TILLIT Tecnologia informa:</p>
    <p><strong>Controlador:</strong> TILLIT Tecnologia.</p>
    <p><strong>Dados coletados:</strong> nome, e-mail, telefone (WhatsApp), CPF/CNPJ, nome da empresa, dados de indicações (leads) e informações de pagamento (chave PIX).</p>
    <p><strong>Finalidade:</strong> gestão do Programa Parceiro+, processamento de indicações, pagamento de bônus e comunicação com parceiros.</p>
    <p><strong>Base legal:</strong> execução de contrato, legítimo interesse e consentimento quando aplicável.</p>
    <p><strong>Compartilhamento:</strong> dados podem ser compartilhados com prestadores de serviços (ex.: processamento de pagamentos) e órgãos competentes quando exigido por lei.</p>
    <p><strong>Direitos do titular:</strong> acesso, correção, exclusão, portabilidade e revogação do consentimento, mediante solicitação ao e-mail de privacidade.</p>
  </div>
);

const Landing: React.FC = () => {
  const [modal, setModal] = useState<'termos' | 'privacidade' | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center gap-2 min-w-0">
              <Logo size="sm" variant="light" className="flex-shrink-0 sm:hidden" />
              <Logo size="md" variant="light" className="flex-shrink-0 hidden sm:flex" />
              <span className="font-tillit text-[#00B050] font-bold text-lg sm:text-2xl tracking-tighter truncate">
                Parceiro+
              </span>
            </div>
            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
              <a href="#programa" className="hover:text-[#003366] transition-colors">O Programa</a>
              <a href="#solucoes" className="hover:text-[#003366] transition-colors">Soluções</a>
              <a href="#ganhos" className="hover:text-[#003366] transition-colors">Ganhos</a>
              <a href="#faq" className="hover:text-[#003366] transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link to="/login" className="text-xs sm:text-sm font-semibold text-[#003366] hover:underline py-2">Entrar</Link>
              <Link to="/registrar" className="bg-[#00B050] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm hover:scale-105 transition-all shadow-lg shadow-green-500/20">
                Quero Indicar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-12 md:pb-14 px-4 bg-pattern relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00B050]/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
              <span className="text-[#00B050] font-bold text-xs uppercase tracking-widest">Tecnologia feita para pessoas</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Sua indicação vale <span className="text-[#00B050]">dinheiro vivo.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-md leading-relaxed">
              Ganhe até <strong className="text-white">R$ 300,00 por contrato</strong> fechado. Indique, gere valor e cresça com a gente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/registrar" className="bg-[#00B050] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-green-900/40">
                Seja um Parceiro+ <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${i+10}/40/40`} className="w-10 h-10 rounded-full border-2 border-[#003366]" alt="Partner" />
                  ))}
                </div>
                <span className="text-white/60 text-sm font-medium">+1.500 parceiros ativos</span>
              </div>
            </div>
          </div>
          <div className="relative hidden md:block flex justify-end">
            <div className="absolute -inset-10 bg-gradient-to-tr from-[#00B050]/20 to-transparent rounded-full blur-3xl opacity-50"></div>
            <img
              src="/hero-laptop.png"
              className="w-full max-w-[500px] h-auto object-contain rounded-3xl shadow-2xl relative z-10 border border-transparent translate-x-10"
              alt="Tecnologia e pagamentos digitais"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl z-20 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-[#FF8C00]">
                <Award size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">Ganhos em Dinheiro</p>
                <p className="text-[#003366] font-black text-xl">PIX Direto na Conta</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Solutions Grid */}
      <section id="solucoes" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-[#003366]">O que você pode indicar?</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Indique empresas, receba sua premiação — indicações válidas apenas para o mês corrente.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PARTNER_PRODUCTS.map((product) => {
            const isHiper = product.id === 'hiper';
            const logoWrapperClasses = `
              ${isHiper ? 'w-24 h-24 p-1' : 'w-20 h-20 p-2'}
              bg-slate-50 rounded-2xl flex items-center justify-center text-[#003366] mb-6
              group-hover:bg-[#003366] group-hover:text-white transition-colors overflow-hidden
            `;
            const logoImgClasses = isHiper
              ? 'w-full h-full object-contain scale-110'
              : 'w-full h-full object-contain';
            const CardContent = (
              <>
                <div className={logoWrapperClasses}>
                  {product.logo ? (
                    <img src={product.logo} alt={product.title} className={logoImgClasses} />
                  ) : product.icon ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {product.icon}
                    </svg>
                  ) : null}
                </div>
                <h3 className="text-xl font-black text-[#003366] mb-3">{product.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
                {product.href && (
                  <span className="inline-flex items-center gap-1 mt-4 text-[#00B050] font-semibold text-sm group-hover:underline">
                    Conhecer site <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </>
            );
            const className = "bg-white p-8 rounded-3xl border border-slate-100 hover:border-[#00B050]/30 hover:shadow-2xl hover:shadow-[#00B050]/5 transition-all group h-full flex flex-col";
            return product.href ? (
              <a key={product.id} href={product.href} target="_blank" rel="noopener noreferrer" className={className}>
                {CardContent}
              </a>
            ) : (
              <div key={product.id} className={className}>
                {CardContent}
              </div>
            );
          })}
        </div>
        <p className="text-center text-slate-500 text-sm mt-10 max-w-3xl mx-auto">
          Soluções para: Mercadinho, Material de Construção, Açougue, Padaria, Ferragista, Loja de Cosméticos
        </p>
      </section>

      {/* Earnings / Rules */}
      <section id="ganhos" className="py-24 bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[#00B050] font-bold text-sm tracking-widest uppercase">Regras do Jogo</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-8">Quanto mais você indica, <span className="text-orange-400 italic underline decoration-orange-400/30">mais você ganha.</span></h2>
            <div className="space-y-6">
              {[
                { label: 'Indicação TEF', value: 'R$ 50,00', icon: <CreditCard size={20} /> },
                { label: 'Indicações 1-5', value: 'R$ 150,00', icon: <Users size={20} /> },
                { label: 'Indicações 6-10', value: 'R$ 200,00', icon: <Briefcase size={20} /> },
                { label: 'Indicações 11+', value: 'R$ 300,00', icon: <Award size={20} /> },
              ].map((tier, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-[#00B050]">{tier.icon}</div>
                    <span className="font-medium text-lg">{tier.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-orange-400">{tier.value}</span>
                    <span className="text-sm text-orange-300 font-medium">cada</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-10 text-slate-900 shadow-2xl space-y-8">
            <h3 className="text-2xl font-bold border-b border-slate-100 pb-4">Como funciona?</h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[#00B050]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-bold">Cadastre o Lead</p>
                  <p className="text-slate-500 text-sm">Insira os dados da empresa no portal do parceiro.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[#00B050]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-bold">Nós negociamos</p>
                  <p className="text-slate-500 text-sm">Nosso time comercial assume o contato e demonstra as soluções.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[#00B050]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-bold">Contrato Assinado</p>
                  <p className="text-slate-500 text-sm">Assim que o cliente pagar a implantação, seu bônus é liberado.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[#00B050]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-bold">Receba em 30 dias</p>
                  <p className="text-slate-500 text-sm">Pagamento direto via PIX na sua conta após a confirmação.</p>
                </div>
              </li>
            </ul>
            <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="font-bold text-[#003366] flex items-center gap-2 mb-3">
                <span aria-hidden>📌</span> Importante – Validade das Indicações
              </p>
              <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
                <li>• Cada indicação é válida apenas no mês em que foi enviada.</li>
                <li>• Indicações não são acumulativas entre meses.</li>
                <li>• Envie sua indicação dentro do mês corrente para que seja considerada.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-[#003366] text-center mb-12">Perguntas Frequentes</h2>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="font-bold text-[#003366] mb-2">As indicações acumulam mês a mês?</p>
            <p className="text-slate-600 text-sm leading-relaxed">Não, cada indicação é válida somente no mês em que foi registrada.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="font-bold text-[#003366] mb-2">E se eu esquecer de enviar uma indicação em um mês?</p>
            <p className="text-slate-600 text-sm leading-relaxed">Você deve registrar novamente no mês seguinte para que seja válida.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="light" />
            <span className="font-tillit text-[#00B050] font-bold text-lg">Parceiro+</span>
          </div>
          <p className="text-slate-400 text-xs">© 2026 TILLIT Tecnologia. Todos os direitos reservados. LGPD Compliance.</p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <button type="button" onClick={() => setModal('privacidade')} className="hover:text-[#003366] transition-colors">Privacidade</button>
            <button type="button" onClick={() => setModal('termos')} className="hover:text-[#003366] transition-colors">Termos de Uso</button>
          </div>
        </div>
      </footer>

      {/* Modal Termos / Privacidade */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#003366]">{modal === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}</h3>
              <button type="button" onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {modal === 'termos' ? TERMOS_DE_USO : POLITICA_PRIVACIDADE}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
