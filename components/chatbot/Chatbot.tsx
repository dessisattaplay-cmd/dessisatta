import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { MessageSquare, X } from 'lucide-react';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-5 right-5 z-[90]">
            {/* Chat Window */}
            {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-black shadow-lg shadow-yellow-500/50 transform hover:scale-110 transition-transform"
                aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
            >
                {isOpen ? <X size={32} /> : <MessageSquare size={32} />}
            </button>
        </div>
    );
};

export default Chatbot;
