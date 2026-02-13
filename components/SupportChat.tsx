import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { SUPPORT_AI_SYSTEM_PROMPT } from '../lib/supportAiPrompt';

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

/** Resposta simulada alinhada ao Parceiro+ e ao prompt da IA (use SUPPORT_AI_SYSTEM_PROMPT na API no Vercel). */
function getSimulatedReply(userText: string): string {
  const t = userText.toLowerCase().trim();

  const incentivo = ' Indique o próximo e aumente seus ganhos — quanto mais você indica, mais você ganha.';

  // Crédito ao criador — se perguntar quem criou / desenvolveu / Willy
  if (
    /\b(quem\s+criou|quem\s+fez|quem\s+desenvolveu|criador|desenvolvedor|willy|willy\s+dev)\b/.test(t) ||
    /(quem\s+criou|quem\s+fez\s+o\s+chat|quem\s+fez\s+o\s+site)/.test(t)
  ) {
    return 'Este assistente e a experiência deste chat foram criados pelo **Willy Dev**. Posso ajudar com dúvidas sobre o programa Parceiro+ — indicações, bônus ou cadastro.' + incentivo;
  }

  // Bônus e valores
  if (/\b(bônus|bonus|ganho|valor|quanto\s+ganho|r\$\s*50|150|200|300)\b/.test(t)) {
    return 'No Parceiro+ os bônus são: **Indicação TEF** R$ 50,00 cada; **indicações 1-5** R$ 150,00 cada; **6-10** R$ 200,00 cada; **11+** R$ 300,00 cada. Pagamento via PIX em até 30 dias após a conversão da indicação.' + incentivo;
  }

  // Validade mensal
  if (/\b(mês|mes|mensal|acumul|validade|vigente)\b/.test(t)) {
    return 'Cada indicação é válida **apenas no mês em que foi enviada**. Indicações não acumulam entre meses. Para ser considerada, envie dentro do mês corrente. Não deixe para depois: indique ainda este mês e garanta seu bônus.';
  }

  // Cadastro / como participar
  if (/\b(cadastr|registr|participar|como\s+entr|quero\s+indicar)\b/.test(t)) {
    return 'Para se cadastrar como parceiro, use o botão **Quero Indicar** no menu ou acesse a página de registro. Preencha seus dados e nossa equipe analisa em até 24h. Depois você acessa o painel e já pode começar a indicar — cada indicação pode virar bônus no seu PIX.';
  }

  // Soluções (Hiper, TEF, Linx)
  if (/\b(hiper|linx|tef|solução|solucao|o\s+que\s+posso\s+indicar)\b/.test(t)) {
    return 'Você pode indicar: **Hiper** (ERP para pequeno varejo), **Linx Empório** (gestão para varejo de pequenas e médias empresas) e **TEF** (automação de vendas, maquininhas e conformidade). Cada uma gera bônus quando o cliente fechar contrato. Pense em quem na sua rede se encaixa e indique o próximo.';
  }

  // Indicações em geral
  if (/\b(indicação|indicar|lead)\b/.test(t)) {
    return 'No painel do parceiro você cadastra os dados da empresa e do contato. Nosso time comercial entra em contato, apresenta as soluções e fecha o negócio. Quando o cliente pagar a implantação, seu bônus é liberado e pago via PIX em até 30 dias.' + incentivo;
  }

  // Suporte / contato
  if (/\b(contato|suporte|ajuda|falar\s+com|whatsapp|email)\b/.test(t)) {
    return 'Para questões específicas ou fora do que posso responder aqui, entre em contato pelo canal oficial da TILLIT (site ou e-mail de suporte). Enquanto isso, continue indicando — cada nova indicação é uma chance a mais de ganhar.';
  }

  // Saudação
  if (/\b(oi|olá|ola|bom\s+dia|boa\s+tarde|boa\s+noite|hey)\b/.test(t) && t.length < 30) {
    return 'Olá! Sou o assistente do Parceiro+. Posso tirar dúvidas sobre o programa de indicação, bônus, cadastro e soluções (Hiper, TEF, Linx Empório). Em que posso ajudar? E lembre-se: cada indicação pode valer dinheiro no seu bolso.';
  }

  // Despedida
  if (/\b(obrigad|tchau|até\s+mais|valeu)\b/.test(t)) {
    return 'Por nada! Qualquer dúvida sobre o Parceiro+, estarei por aqui. Indique o próximo e cresça com a gente.';
  }

  // Resposta padrão profissional
  return 'Posso ajudar com dúvidas sobre o **programa Parceiro+**: como funciona o cadastro, os bônus por indicação (TEF R$ 50, Hiper/Linx até R$ 300), validade mensal das indicações e as soluções que você pode indicar. Pergunte o que quiser — e não deixe de indicar o próximo.';
}

const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Bot: ao atualizar/recarregar a página, conversa sempre começa vazia (não persistir)
  useEffect(() => {
    sessionStorage.removeItem('parceiro_support_chat');
    localStorage.removeItem('parceiro_support_chat');
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Integração Vercel: envie SUPPORT_AI_SYSTEM_PROMPT como system e messages como histórico
      // Ex: fetch('/api/chat', { method: 'POST', body: JSON.stringify({ system: SUPPORT_AI_SYSTEM_PROMPT, messages: [...messages, userMessage] }) })
      const apiUrl = import.meta.env.VITE_SUPPORT_CHAT_API_URL;
      if (apiUrl) {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: SUPPORT_AI_SYSTEM_PROMPT,
            messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.reply ?? data.message ?? data.content ?? data.choices?.[0]?.message?.content;
          if (reply) {
            setMessages((prev) => [
              ...prev,
              { id: `a-${Date.now()}`, role: 'assistant', content: reply, createdAt: new Date() },
            ]);
            return;
          }
        }
      }

      // Resposta local alinhada ao “treino” (Parceiro+ + Willy Dev)
      await new Promise((r) => setTimeout(r, 500));
      const content = getSimulatedReply(text).replace(/\*\*(.*?)\*\*/g, '$1');
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content, createdAt: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro. Tente novamente em instantes ou entre em contato pelo canal oficial.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botão: canto inferior direito, área de toque ≥44px, safe-area em mobile */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed z-40 flex items-center gap-2 bg-[#003366] text-white rounded-full font-semibold shadow-xl shadow-[#003366]/30 hover:bg-[#002244] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#00B050] focus:ring-offset-2 text-sm min-h-[48px] px-4 py-3 sm:px-5 sm:py-3 touch-manipulation"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))', right: 'max(1rem, env(safe-area-inset-right))' }}
        aria-label="Abrir dúvidas"
      >
        <MessageCircle size={20} />
        <span>Dúvidas</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Painel: mobile = tela cheia | desktop = card no canto. z-[100] acima da nav do site. */}
      <div
        className={`fixed z-[100] flex flex-col bg-white border border-slate-200 transition-all duration-300 ease-out
          inset-0 max-h-[100dvh] rounded-none
          sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:w-full sm:max-w-[420px] sm:h-[560px] sm:max-h-[85vh] sm:rounded-2xl sm:shadow-2xl
          ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98] pointer-events-none'}`}
      >
        {/* Header com safe-area no topo (notch) para o X sempre visível no mobile */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-[#003366] text-white rounded-t-2xl shrink-0 min-h-[56px]"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg truncate">Dúvidas Parceiro+</h3>
              <p className="text-white/80 text-xs truncate">Assistente com IA • TILLIT</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-white/30 text-white hover:bg-white/50 active:bg-white/60 border-2 border-white/50 transition-colors touch-manipulation -mr-1"
            aria-label="Fechar"
          >
            <X size={26} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-slate-500 text-sm px-2">
              <MessageCircle size={36} className="mx-auto mb-2 sm:mb-3 text-[#003366]/40 sm:w-10 sm:h-10" />
              <p className="font-semibold text-[#003366]">Como podemos ajudar?</p>
              <p className="mt-1 max-w-[260px] mx-auto text-xs sm:text-sm">
                Tire dúvidas sobre o programa de indicação, bônus, cadastro e soluções.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[#00B050]' : 'bg-[#003366]'
                }`}
              >
                {msg.role === 'user' ? <User size={14} className="sm:w-4 sm:h-4 text-white" /> : <Bot size={14} className="sm:w-4 sm:h-4 text-white" />}
              </div>
              <div
                className={`max-w-[85%] min-w-0 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#00B050] text-white rounded-br-md'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
                <Bot size={14} className="sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          className="p-3 sm:p-4 border-t border-slate-200 bg-white rounded-b-2xl shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sua dúvida sobre o Parceiro+..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B050]/30 focus:border-[#00B050] transition-all min-h-[44px] max-h-28 sm:max-h-32 touch-manipulation"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 min-h-[44px] min-w-[44px] w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#00B050] text-white flex items-center justify-center hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
              aria-label="Enviar"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportChat;
