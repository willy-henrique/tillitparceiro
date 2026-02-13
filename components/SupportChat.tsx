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
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#003366] text-white px-5 py-3 rounded-full font-semibold text-sm shadow-xl shadow-[#003366]/30 hover:bg-[#002244] hover:scale-105 active:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#00B050] focus:ring-offset-2"
        aria-label="Abrir dúvidas"
      >
        <MessageCircle size={20} />
        Dúvidas
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed bottom-6 right-6 z-50 w-full max-w-md sm:max-w-[420px] h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#003366] text-white rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Dúvidas Parceiro+</h3>
              <p className="text-white/80 text-xs">Assistente com IA • TILLIT Tecnologia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <MessageCircle size={40} className="mx-auto mb-3 text-[#003366]/40" />
              <p className="font-semibold text-[#003366]">Como podemos ajudar?</p>
              <p className="mt-1 max-w-[260px] mx-auto">
                Tire dúvidas sobre o programa de indicação, bônus, cadastro e soluções. Respostas alinhadas ao Parceiro+.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[#00B050]' : 'bg-[#003366]'
                }`}
              >
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#00B050] text-white rounded-br-md'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sua dúvida sobre o Parceiro+..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B050]/30 focus:border-[#00B050] transition-all min-h-[44px] max-h-32"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-12 h-12 rounded-xl bg-[#00B050] text-white flex items-center justify-center hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
