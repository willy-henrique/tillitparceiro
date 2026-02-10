import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, DollarSign, Users, Award, Briefcase, CheckCircle2 } from 'lucide-react';
import { MOCK_PRODUCTS, THEME } from '../constants';
import Logo from '../components/Logo';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <Logo size="md" variant="light" />
              <span className="text-[#003366] font-bold text-2xl tracking-tighter">TILLIT <span className="text-[#00B050]">Parceiro+</span></span>
            </div>
            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
              <a href="#programa" className="hover:text-[#003366] transition-colors">O Programa</a>
              <a href="#solucoes" className="hover:text-[#003366] transition-colors">Soluções</a>
              <a href="#ganhos" className="hover:text-[#003366] transition-colors">Ganhos</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-[#003366] hover:underline">Entrar</Link>
              <Link to="/registrar" className="bg-[#00B050] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-green-500/20">
                Quero Indicar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-4 bg-pattern relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00B050]/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
              <span className="text-[#00B050] font-bold text-xs uppercase tracking-widest">Tecnologia feita para pessoas</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
              Sua indicação vale <span className="text-[#00B050]">dinheiro vivo.</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-lg leading-relaxed">
              Ganhe até <strong className="text-white">R$ 300,00 por contrato</strong> fechado. Faça parte do ecossistema que mais cresce no Brasil.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="relative hidden md:block">
            <div className="absolute -inset-10 bg-gradient-to-tr from-[#00B050]/20 to-transparent rounded-full blur-3xl opacity-50"></div>
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              className="rounded-3xl shadow-2xl relative z-10 border border-white/10"
              alt="Team working"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl z-20 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-[#FF8C00]">
                <Award size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">Bônus Progressivo</p>
                <p className="text-[#003366] font-black text-xl">Top 1% Global</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Solutions Grid */}
      <section id="solucoes" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-[#003366]">O que você pode indicar?</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Soluções robustas de TI que resolvem problemas reais. Vender Tillit é entregar valor.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {MOCK_PRODUCTS.map((product, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-[#00B050]/30 hover:shadow-2xl hover:shadow-[#00B050]/5 transition-all group">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#003366] mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {product.icon}
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#003366] mb-3">{product.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings / Rules */}
      <section id="ganhos" className="py-24 bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[#00B050] font-bold text-sm tracking-widest uppercase">Regras do Jogo</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-8">Quanto mais você indica, <span className="text-orange-400 italic underline decoration-orange-400/30">mais você ganha.</span></h2>
            <div className="space-y-6">
              {[
                { label: 'Indicações 1-5', value: 'R$ 150,00', icon: <Users size={20} /> },
                { label: 'Indicações 6-10', value: 'R$ 200,00', icon: <Briefcase size={20} /> },
                { label: 'Indicações 11+', value: 'R$ 300,00', icon: <Award size={20} /> },
              ].map((tier, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-[#00B050]">{tier.icon}</div>
                    <span className="font-medium text-lg">{tier.label}</span>
                  </div>
                  <span className="text-2xl font-black text-orange-400">{tier.value}</span>
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="light" />
            <span className="text-[#003366] font-bold text-lg">TILLIT <span className="text-[#00B050]">Parceiro+</span></span>
          </div>
          <p className="text-slate-400 text-xs">© 2026 TILLIT Tecnologia. Todos os direitos reservados. LGPD Compliance.</p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-[#003366]">Privacidade</a>
            <a href="#" className="hover:text-[#003366]">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
