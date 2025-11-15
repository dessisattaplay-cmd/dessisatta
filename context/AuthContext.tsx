import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, Transaction } from '../types';
import { getMonthIdentifier } from '../services/membershipService';

// Fix: Export AuthContextType to make it available for other modules.
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  register: (details: Omit<User, 'id' | 'points' | 'lastLogin' | 'role' | 'agentId' | 'commissionRate' | 'referralCode' | 'createdAt' | 'isBetLocked' | 'isProfileLocked' | 'agreementAcceptedAt' | 'membership' | 'lastTierCheck'>) => User | null;
  logout: () => void;
  updatePoints: (amount: number, type: Transaction['type'], description: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'> & { userId: string }) => void;
  getTransactions: () => Transaction[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get users from localStorage
const getUsers = (): User[] => {
  const usersStr = localStorage.getItem('dessi-satta-users');
  return usersStr ? JSON.parse(usersStr) : [];
};

// Helper to save users to localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem('dessi-satta-users', JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dessi-satta-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('dessi-satta-user');
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const users = getUsers();
    let foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
        if (foundUser.isProfileLocked) {
            alert("Your profile is currently locked by an administrator.");
            return false;
        }

        // Monthly Membership Tier Reset Logic
        const now = new Date();
        const lastCheck = new Date(foundUser.lastTierCheck || 0);
        if (now.getUTCMonth() !== lastCheck.getUTCMonth() || now.getUTCFullYear() !== lastCheck.getUTCFullYear()) {
            const lastMonthIdentifier = getMonthIdentifier(lastCheck);
            const userMembership = foundUser.membership;

            if (userMembership.currentTier !== 'none') {
                const historyExists = userMembership.history.some(h => h.month === lastMonthIdentifier);
                if (!historyExists) {
                    userMembership.history.push({ month: lastMonthIdentifier, tier: userMembership.currentTier });
                }
            }
            
            userMembership.currentTier = 'none';
            userMembership.monthlyDepositTotal = 0;
            foundUser.lastTierCheck = now.getTime();
            foundUser.membership = userMembership;
            
            const userIndex = users.findIndex(u => u.id === foundUser!.id);
            if (userIndex !== -1) {
                users[userIndex] = foundUser;
                saveUsers(users);
            }
        }

        const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
        localStorage.setItem('dessi-satta-user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
    }
    return false;
  };

  const register = (details: Omit<User, 'id' | 'points' | 'lastLogin' | 'role' | 'agentId' | 'commissionRate' | 'referralCode' | 'createdAt' | 'isBetLocked' | 'isProfileLocked' | 'agreementAcceptedAt' | 'membership' | 'lastTierCheck'>): User | null => {
    const users = getUsers();
    
    if (users.some(u => u.username === details.username || u.mobileNumber === details.mobileNumber)) {
        alert("Username or mobile number already exists.");
        return null;
    }
    
    const referrer = details.referredBy ? users.find(u => u.referralCode === details.referredBy) : undefined;
    const agentId = (referrer && referrer.role === 'agent') ? referrer.id : undefined;

    const newUser: User = {
        ...details,
        id: `IN${Math.floor(10000000 + Math.random() * 90000000)}`,
        referralCode: `DESSI${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        points: 20, // Welcome bonus updated to 20
        lastLogin: new Date().toISOString(),
        role: details.username === 'admin' ? 'admin' : 'user',
        agentId: agentId,
        commissionRate: 0,
        createdAt: Date.now(),
        isBetLocked: false,
        isProfileLocked: false,
        agreementAcceptedAt: Date.now(),
        membership: {
            currentTier: 'none',
            monthlyDepositTotal: 0,
            history: [],
        },
        lastTierCheck: Date.now(),
    };

    users.push(newUser);
    saveUsers(users);
    localStorage.setItem('dessi-satta-user', JSON.stringify(newUser));
    setUser(newUser);
    addTransaction({userId: newUser.id, userFullName: newUser.fullName, type: 'Bonus', amount: 20, status: 'Completed', description: 'Welcome Bonus'});
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('dessi-satta-user');
    setUser(null);
  };

  const updatePoints = (amount: number, type: Transaction['type'], description: string) => {
    if(user) {
        const newPoints = user.points + amount;
        const updatedUser = { ...user, points: newPoints };
        setUser(updatedUser);
        localStorage.setItem('dessi-satta-user', JSON.stringify(updatedUser));

        const users = getUsers();
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        saveUsers(updatedUsers);
        addTransaction({userId: user.id, userFullName: user.fullName, type, amount: Math.abs(amount), status: 'Completed', description});
    }
  }

  const getTransactions = (): Transaction[] => {
      if (!user) return [];
      const allTransactionsStr = localStorage.getItem('dessi-satta-transactions');
      const allTransactions: (Transaction & {userId: string})[] = allTransactionsStr ? JSON.parse(allTransactionsStr) : [];
      return allTransactions.filter(t => t.userId === user.id).sort((a, b) => b.timestamp - a.timestamp);
  }

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'> & {userId: string}) => {
      const allTransactionsStr = localStorage.getItem('dessi-satta-transactions');
      const allTransactions = allTransactionsStr ? JSON.parse(allTransactionsStr) : [];
      const newTransaction = {
          ...transaction,
          id: `TXN${Date.now()}${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now()
      };
      allTransactions.push(newTransaction);
      localStorage.setItem('dessi-satta-transactions', JSON.stringify(allTransactions));
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updatePoints, addTransaction, getTransactions }}>
      {children}
    </AuthContext.Provider>
  );
};