import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { getChatbotTree } from '../../services/chatbotService';
import { getPaymentStatus, getBetById } from '../../services/adminService';
import { getTransactionById } from '../../services/paymentService';
import type { ChatbotMessage, ChatbotNode, PaymentStatus } from '../../types';
import RoyalButton from '../ui/RoyalButton';
import { Bot, User, X } from 'lucide-react';

interface ChatWindowProps {
    onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
    const { t } = useLocalization();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ depositsEnabled: true, withdrawalsEnabled: true });
    
    // Generate the tree dynamically based on real-time status
    const chatbotTree = getChatbotTree((key, options) => t(key, options), paymentStatus);
    
    const [currentNode, setCurrentNode] = useState<ChatbotNode>(chatbotTree['start']);
    const [history, setHistory] = useState<ChatbotMessage[]>([
        { sender: 'bot', text: chatbotTree['start'].text }
    ]);
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPaymentStatus(getPaymentStatus());
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    const handleOptionClick = (option: ChatbotNode['options'][0]) => {
        const userMessage: ChatbotMessage = { sender: 'user', text: option.text };
        
        if (option.link) {
            setHistory(prev => [...prev, userMessage]);
            if (option.link.startsWith('#/')) {
                 window.location.hash = option.link.substring(1);
                 onClose();
            } else {
                window.open(option.link, '_blank');
            }
            return;
        }

        if (option.nextId) {
            const nextNode = chatbotTree[option.nextId];
            if (nextNode) {
                const botMessage: ChatbotMessage = { sender: 'bot', text: nextNode.text };
                setHistory(prev => [...prev, userMessage, botMessage]);
                setCurrentNode(nextNode);
            }
        }
    };

    const handleInputSubmit = async () => {
        if (!userInput.trim() || !currentNode.awaitsInput) return;

        const userMessage: ChatbotMessage = { sender: 'user', text: userInput };
        let botResponseText = '';
        
        if (currentNode.awaitsInput === 'transactionId') {
            const tx = getTransactionById(userInput.trim());
            if (tx) {
                botResponseText = `${t('chatAnsTxDetailsTitle')}\n\n` +
                    `ID: ${tx.id}\n` +
                    `Type: ${t(tx.type.toLowerCase())}\n` +
                    `Amount: ${tx.amount}\n` +
                    `Status: ${tx.status}\n` +
                    `Date: ${new Date(tx.timestamp).toLocaleString()}`;
            } else {
                botResponseText = t('chatAnsTxNotFound');
            }
        } else if (currentNode.awaitsInput === 'betId') {
            const bet = getBetById(userInput.trim());
            if (bet) {
                botResponseText = `${t('chatAnsBetDetailsTitle')}\n\n` +
                    `ID: ${bet.id}\n` +
                    `Bazi #: ${bet.baziNumber}\n` +
                    `Amount: ${bet.points}\n` +
                    `Status: ${bet.status}\n` +
                    `Date: ${new Date(bet.timestamp).toLocaleString()}`;
            } else {
                botResponseText = t('chatAnsBetNotFound');
            }
        }

        const botMessage: ChatbotMessage = { sender: 'bot', text: botResponseText };
        
        const nextNode = chatbotTree['start'];
        const mainMenuMessage: ChatbotMessage = { sender: 'bot', text: nextNode.text };

        setHistory(prev => [...prev, userMessage, botMessage, mainMenuMessage]);
        setCurrentNode(nextNode);
        setUserInput('');
    };

    return (
        <div className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-[#0c1021] border-2 border-amber-500/50 rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center p-3 border-b-2 border-amber-500/50">
                <div className="flex items-center gap-2">
                    <Bot className="text-amber-400" />
                    <h3 className="font-cinzel text-lg text-yellow-400">{t('chatbotTitle')}</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-amber-400"/></div>}
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'bot' ? 'bg-gray-800 text-white' : 'bg-amber-600 text-black'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"><User size={18} className="text-white"/></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t-2 border-amber-500/50 space-y-2">
                {currentNode.awaitsInput ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
                            placeholder={t(currentNode.awaitsInput === 'transactionId' ? 'chatPromptTransactionId' : 'chatPromptBetId')}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            autoFocus
                        />
                        <RoyalButton onClick={handleInputSubmit} className="px-4 py-2 text-sm">Send</RoyalButton>
                    </div>
                ) : (
                    <div className="max-h-32 overflow-y-auto space-y-2">
                    {currentNode.options.map((option, index) => (
                        <button 
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className="w-full text-left p-2 bg-gray-800/50 hover:bg-gray-700 rounded-md text-sm text-amber-300 transition-colors font-semibold"
                        >
                            {option.text}
                        </button>
                    ))}
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ChatWindow;