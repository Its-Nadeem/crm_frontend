import React, { useState, useEffect, useRef } from 'react';
import { HomepageContent } from '../../types';
import { AppIcons } from '../ui/Icons';

interface HomepageChatbotProps {
    config: HomepageContent['chatbot'];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const HomepageChatbot: React.FC<HomepageChatbotProps> = ({ config }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [leadData, setLeadData] = useState<Record<string, string>>({});
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (isOpen) {
            setMessages([{ sender: 'bot', text: config.welcomeMessage }]);
            setCurrentQuestionIndex(0);
            setLeadData({});
            setIsFinished(false);
            setIsBotTyping(true);
            setTimeout(() => {
                if (config.questions.length > 0) {
                    setMessages(prev => [...prev, { sender: 'bot', text: config.questions[0].question }]);
                }
                setIsBotTyping(false);
            }, 500);
        }
    }, [isOpen, config.welcomeMessage, config.questions]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isBotTyping || isFinished) return;

        const userMessage = { sender: 'user' as const, text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
    };
    
    useEffect(() => {
        const processUserMessage = async () => {
            if (messages.length > 0 && messages[messages.length - 1].sender === 'user' && !isFinished && !isBotTyping) {
                setIsBotTyping(true);
    
                // Lead Capture
                if (currentQuestionIndex < config.questions.length) {
                    const currentQuestion = config.questions[currentQuestionIndex];
                    const userReply = messages[messages.length - 1].text;
                    const newLeadData = { ...leadData, [currentQuestion.crmField]: userReply };
                    setLeadData(newLeadData);
    
                    const nextQuestionIndex = currentQuestionIndex + 1;
                    
                    await sleep(1000);
    
                    if (nextQuestionIndex < config.questions.length) {
                        // Still have questions to ask
                        const nextQuestion = config.questions[nextQuestionIndex];
                        const botResponseText = nextQuestion.question.replace(/{{(.*?)}}/g, (_, key) => newLeadData[key.trim()] || '');
                        setMessages(prev => [...prev, { sender: 'bot', text: botResponseText }]);
                        setCurrentQuestionIndex(nextQuestionIndex);
                    } else {
                        // Done with questions, send thank you and end.
                        console.log("Chat completed. Captured lead data:", newLeadData);
                        setMessages(prev => [...prev, { sender: 'bot', text: config.thankYouMessage }]);
                        setIsFinished(true);
                    }
                }
                setIsBotTyping(false);
            }
        };
    
        processUserMessage();
    }, [messages, config.questions, config.thankYouMessage, currentQuestionIndex, isFinished, leadData, isBotTyping]);


    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Chat Window */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="w-80 h-[450px] bg-surface rounded-xl shadow-2xl flex flex-col border border-muted overflow-hidden">
                    <header className="p-4 text-white flex items-center justify-between flex-shrink-0" style={{ backgroundColor: config.color }}>
                        <h3 className="font-bold">Clienn CRM Assistant</h3>
                        <button onClick={() => setIsOpen(false)}><AppIcons.Close className="w-5 h-5" /></button>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                <p className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'bot' ? 'bg-muted text-on-surface' : 'text-white'}`} style={{ backgroundColor: msg.sender === 'user' ? config.color : undefined }}>
                                    {msg.text}
                                </p>
                            </div>
                        ))}
                         {isBotTyping && (
                            <div className="flex justify-start">
                                <div className="p-2 rounded-lg bg-muted flex items-center gap-1">
                                    <span className="h-2 w-2 bg-subtle rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-subtle rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-subtle rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="p-2 border-t border-muted flex-shrink-0">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isFinished || isBotTyping}
                                className="flex-1 bg-background border border-muted rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <button type="submit" className="p-2 rounded-full text-white" style={{ backgroundColor: config.color }} disabled={isFinished || isBotTyping}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                        </form>
                    </footer>
                </div>
            </div>
            
            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`transition-all duration-300 ease-in-out text-white shadow-lg flex items-center gap-2 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                style={{
                    backgroundColor: config.color,
                    borderRadius: config.style === 'icon' ? '50%' : '30px',
                    padding: config.style === 'icon' ? '1rem' : '1rem 1.5rem',
                }}
            >
                <AppIcons.ChatBubble className="w-6 h-6" />
                {config.style === 'button' && <span className="font-semibold">Chat with us</span>}
            </button>
        </div>
    );
};

export default HomepageChatbot;


