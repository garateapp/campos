import React, { useState, useRef, useEffect } from 'react';
import { getGeminiChat } from '../Services/geminiService';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

const AIChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chatRef.current) {
            try {
                chatRef.current = getGeminiChat();
            } catch (e) {
                console.error("Failed to initialize Gemini Chat", e);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            if (!chatRef.current) {
                chatRef.current = getGeminiChat();
            }
            const result = await chatRef.current.sendMessage(input);
            const aiMessage: ChatMessage = { role: 'model', text: result.response.text() || "I'm sorry, I couldn't process that.", timestamp: new Date() };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'model', text: "Error: No se pudo conectar con el servidor de IA. Asegúrate de que VITE_GEMINI_API_KEY esté configurada en el archivo .env.", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-white dark:bg-gray-900 w-80 md:w-96 h-[550px] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="bg-green-600 p-4 flex items-center justify-between text-white shadow-md">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <div>
                                <span className="font-bold block leading-none">GreenexCampos AI</span>
                                <span className="text-[10px] text-green-100 font-medium">Asistente Agrónomo</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 rounded-full p-1.5 leading-none transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/30 scrollbar-hide">
                        {messages.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <span className="material-symbols-outlined text-3xl">spark</span>
                                </div>
                                <h4 className="text-gray-900 dark:text-white font-bold text-sm">¿En qué puedo ayudarte hoy?</h4>
                                <p className="text-xs text-gray-500 mt-2">Pregúntame sobre rotación de cuarteles, diagnóstico de plagas o eficiencia laboral.</p>

                                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                    <SuggestionButton onClick={() => setInput("¿Cómo puedo mejorar el rendimiento de mi suelo?")}>Mejorar suelo</SuggestionButton>
                                    <SuggestionButton onClick={() => setInput("¿Qué plagas son comunes en esta época?")}>Plagas comunes</SuggestionButton>
                                    <SuggestionButton onClick={() => setInput("Consejos para riego eficiente")}>Riego eficiente</SuggestionButton>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-green-600 text-white font-medium rounded-tr-none shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-tl-none whitespace-pre-wrap'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex gap-1.5 h-4 items-center">
                                        <div className="size-1.5 bg-green-500 rounded-full animate-bounce"></div>
                                        <div className="size-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="size-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-2.5 pr-12 text-sm focus:ring-2 focus:ring-green-500 transition-all dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="absolute right-1 top-1 p-1.5 bg-green-600 text-white rounded-full shadow-md disabled:opacity-50 hover:bg-green-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="size-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">auto_awesome</span>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-gray-900"></span>
                    </span>
                </button>
            )}
        </div>
    );
};

const SuggestionButton = ({ children, onClick }: { children: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="px-3 py-1.5 rounded-full border border-green-200 text-green-700 text-[10px] font-bold hover:bg-green-50 transition-colors bg-white shadow-sm"
    >
        {children}
    </button>
);

export default AIChatBot;
