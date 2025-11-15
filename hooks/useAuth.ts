import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import type { Bet } from '../types';

// Fix: Directly extend the imported AuthContextType to ensure all properties
// from the context are included in the hook's return type.
interface AuthHook extends AuthContextType {
    addBet: (bet: Omit<Bet, 'id' | 'userId' | 'timestamp' | 'status' | 'winnings'>) => void;
    getBets: () => Bet[];
}

// Renamed original hook to avoid naming collision and added explicit return type.
const useAuthBase = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = (): AuthHook => {
    const context = useAuthBase();

    const addBet = (bet: Omit<Bet, 'id' | 'userId' | 'timestamp' | 'status' | 'winnings'>) => {
        if (!context.user) return;
        
        const allBetsStr = localStorage.getItem('dessi-satta-bets');
        const allBets: Bet[] = allBetsStr ? JSON.parse(allBetsStr) : [];
        const newBet: Bet = {
            ...bet,
            id: `BET${Date.now()}${Math.random().toString(36).substring(2, 6)}`,
            userId: context.user.id,
            timestamp: Date.now(),
            status: 'Pending',
        };
        allBets.push(newBet);
        localStorage.setItem('dessi-satta-bets', JSON.stringify(allBets));

        // Note: The point deduction and transaction record are now handled
        // directly in the BettingPanel for better UX responsiveness.
        // This function is now just for creating the bet history record.
    };
    
    const getBets = (): Bet[] => {
        if (!context.user) return [];
        const allBetsStr = localStorage.getItem('dessi-satta-bets');
        const allBets: Bet[] = allBetsStr ? JSON.parse(allBetsStr) : [];
        return allBets.filter(b => b.userId === context.user.id).sort((a, b) => b.timestamp - a.timestamp);
    };

    return {
        ...context,
        addBet,
        getBets,
    };
}