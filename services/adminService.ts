import type { User, PaymentMethod, BroadcastMessage, Feedback, Transaction, PromotionalMessage, SocialLink, Bet, SupportInfo, PaymentStatus, BettingStatus, AutoPaymentSettings } from '../types';

const USERS_KEY = 'dessi-satta-users';
const PAYMENT_METHODS_KEY = 'dessi-satta-payment-methods';
const BROADCAST_KEY = 'dessi-satta-broadcast';
const FEEDBACK_KEY = 'dessi-satta-feedback';
const TRANSACTIONS_KEY = 'dessi-satta-transactions';
const PROMOTIONS_KEY = 'dessi-satta-promotions';
const SOCIALS_KEY = 'dessi-satta-socials';
const SUPPORT_INFO_KEY = 'dessi-satta-support-info';
const PAYMENT_STATUS_KEY = 'dessi-satta-payment-status';
const BETTING_STATUS_KEY = 'dessi-satta-betting-status';
const AUTO_PAYMENT_SETTINGS_KEY = 'dessi-satta-auto-payment-settings';
const BETS_KEY = 'dessi-satta-bets';


// Generic LocalStorage Getters/Setters
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Could not parse ${key} from localStorage`, e);
      return defaultValue;
    }
};

const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// User Management
export const getAllUsers = (): User[] => getFromStorage<User[]>(USERS_KEY, []);

export const updateUserDetails = (updatedUser: User): boolean => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex === -1) {
        console.error("User to update not found");
        return false;
    }
    users[userIndex] = updatedUser;
    saveToStorage(USERS_KEY, users);
    return true;
};


export const adjustUserPoints = (userId: string, amount: number, reason: string) => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    
    users[userIndex].points += amount;
    saveToStorage(USERS_KEY, users);

    // Log the transaction
    const transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    const newTransaction: Transaction = {
        id: `TXN${Date.now()}`,
        userId: users[userIndex].id,
        userFullName: users[userIndex].fullName,
        type: amount >= 0 ? 'Admin Credit' : 'Admin Debit',
        amount: Math.abs(amount), // store as positive number
        status: 'Completed',
        timestamp: Date.now(),
        description: reason
    };
    transactions.push(newTransaction);
    saveToStorage(TRANSACTIONS_KEY, transactions);
};

export const toggleUserBettingLock = (userId: string): boolean => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    
    users[userIndex].isBetLocked = !users[userIndex].isBetLocked;
    saveToStorage(USERS_KEY, users);
    return true;
};

export const toggleUserProfileLock = (userId: string): boolean => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    users[userIndex].isProfileLocked = !users[userIndex].isProfileLocked;
    saveToStorage(USERS_KEY, users);
    return true;
};

export const resetUserPassword = (userId: string, newPassword: string): boolean => {
    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters long.");
        return false;
    }
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    users[userIndex].password = newPassword;
    saveToStorage(USERS_KEY, users);
    return true;
};

export const deleteUser = (userId: string): boolean => {
    // Delete user
    const users = getAllUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    if (users.length === updatedUsers.length) {
        console.error("User to delete not found");
        return false;
    }
    saveToStorage(USERS_KEY, updatedUsers);

    // Delete associated transactions
    const transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
    const updatedTransactions = transactions.filter(t => t.userId !== userId);
    saveToStorage(TRANSACTIONS_KEY, updatedTransactions);

    // Delete associated bets
    const bets = getFromStorage<Bet[]>(BETS_KEY, []);
    const updatedBets = bets.filter(b => b.userId !== userId);
    saveToStorage(BETS_KEY, updatedBets);
    
    return true;
};

export const adminCreateUser = (details: Omit<User, 'id' | 'referralCode' | 'lastLogin' | 'role' | 'agentId' | 'commissionRate' | 'createdAt' | 'isBetLocked' | 'isProfileLocked' | 'agreementAcceptedAt' | 'membership' | 'lastTierCheck'> & { points: number }): { success: boolean, message: string, user?: User } => {
    const users = getAllUsers();
    
    if (users.some(u => u.username === details.username)) {
        return { success: false, message: 'Username already exists.' };
    }
    if (users.some(u => u.mobileNumber === details.mobileNumber)) {
        return { success: false, message: 'Mobile number already exists.' };
    }
    
    const newUser: User = {
        ...details,
        id: `IN${Math.floor(10000000 + Math.random() * 90000000)}`,
        referralCode: `DESSI${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        lastLogin: new Date().toISOString(),
        role: 'user',
        agentId: undefined,
        commissionRate: 0,
        createdAt: Date.now(),
        isBetLocked: false,
        isProfileLocked: false,
        agreementAcceptedAt: Date.now(), // Admin created users auto-accept
        membership: {
            currentTier: 'none',
            monthlyDepositTotal: 0,
            history: [],
        },
        lastTierCheck: Date.now(),
    };

    users.push(newUser);
    saveToStorage(USERS_KEY, users);
    
    // Log transaction for initial points
    if (details.points > 0) {
        const transactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
        const newTransaction: Transaction = {
            id: `TXN${Date.now()}`,
            userId: newUser.id,
            userFullName: newUser.fullName,
            type: 'Admin Credit',
            amount: details.points,
            status: 'Completed',
            timestamp: Date.now(),
            description: 'Initial points on account creation by admin.'
        };
        transactions.push(newTransaction);
        saveToStorage(TRANSACTIONS_KEY, transactions);
    }

    return { success: true, message: 'User created successfully.', user: newUser };
};

export const updateUserRoleAndCommission = (userId: string, role: User['role'], commissionRate: number): { success: boolean, message: string } => {
    const users = getAllUsers();
    
    const targetUserIndex = users.findIndex(u => u.id === userId);
    if (targetUserIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    if (users[targetUserIndex].username === 'admin' && role !== 'admin') {
        return { success: false, message: "cannotChangePrimaryAdminRole" };
    }

    users[targetUserIndex].role = role;
    users[targetUserIndex].commissionRate = role === 'agent' ? commissionRate : 0;
    
    // If a user is demoted from agent, disassociate their users
    if (role !== 'agent') {
        users.forEach(user => {
            if (user.agentId === userId) {
                user.agentId = undefined;
            }
        });
    }

    saveToStorage(USERS_KEY, users);
    return { success: true, message: 'roleUpdatedSuccess' };
};


// Bet Management
export const getAllBets = (): Bet[] => getFromStorage<Bet[]>(BETS_KEY, []);
export const getBetById = (id: string): Bet | null => getAllBets().find(b => b.id.toUpperCase() === id.toUpperCase()) || null;


// Payment Method Management
export const getPaymentMethods = (): PaymentMethod[] => getFromStorage<PaymentMethod[]>(PAYMENT_METHODS_KEY, []);
export const getActivePaymentMethods = (): PaymentMethod[] => getPaymentMethods().filter(m => m.isActive);

export const savePaymentMethod = (method: Omit<PaymentMethod, 'id'> & { id?: string }) => {
    const methods = getPaymentMethods();
    if (method.id) {
        const index = methods.findIndex(m => m.id === method.id);
        if (index > -1) methods[index] = method as PaymentMethod;
    } else {
        methods.push({ ...method, id: `PM${Date.now()}` } as PaymentMethod);
    }
    saveToStorage(PAYMENT_METHODS_KEY, methods);
};

export const deletePaymentMethod = (id: string) => {
    const methods = getPaymentMethods().filter(m => m.id !== id);
    saveToStorage(PAYMENT_METHODS_KEY, methods);
};

// Broadcast Management
export const sendBroadcastMessage = (message: string) => {
    const broadcast: BroadcastMessage = { id: Date.now(), message, timestamp: Date.now() };
    saveToStorage(BROADCAST_KEY, broadcast);
};

export const getBroadcastMessage = (): BroadcastMessage | null => getFromStorage<BroadcastMessage | null>(BROADCAST_KEY, null);

// Feedback Management
export const saveFeedback = (feedbackData: Omit<Feedback, 'id' | 'timestamp' | 'isRead'>) => {
    const feedback = getFromStorage<Feedback[]>(FEEDBACK_KEY, []);
    const newFeedback: Feedback = {
        ...feedbackData,
        id: Date.now(),
        timestamp: Date.now(),
        isRead: false,
    };
    feedback.push(newFeedback);
    saveToStorage(FEEDBACK_KEY, feedback);
};

export const getUnreadFeedback = (): Feedback[] => {
    const feedback = getFromStorage<Feedback[]>(FEEDBACK_KEY, []);
    return feedback.filter(f => !f.isRead).sort((a,b) => b.timestamp - a.timestamp);
};

export const markFeedbackAsRead = (id: number) => {
    const feedback = getFromStorage<Feedback[]>(FEEDBACK_KEY, []);
    const index = feedback.findIndex(f => f.id === id);
    if (index > -1) {
        feedback[index].isRead = true;
        saveToStorage(FEEDBACK_KEY, feedback);
    }
};

// Promotions Management
export const getPromotionalMessages = (): PromotionalMessage[] => getFromStorage<PromotionalMessage[]>(PROMOTIONS_KEY, []);
export const getActivePromotionalMessages = (): PromotionalMessage[] => getPromotionalMessages().filter(p => p.isActive);

export const savePromotionalMessage = (promo: Omit<PromotionalMessage, 'id'> & { id?: number }) => {
    const promos = getPromotionalMessages();
    if (promo.id) {
        const index = promos.findIndex(p => p.id === promo.id);
        if (index > -1) promos[index] = promo as PromotionalMessage;
    } else {
        promos.push({ ...promo, id: Date.now() } as PromotionalMessage);
    }
    saveToStorage(PROMOTIONS_KEY, promos);
};

export const deletePromotionalMessage = (id: number) => {
    const promos = getPromotionalMessages().filter(p => p.id !== id);
    saveToStorage(PROMOTIONS_KEY, promos);
};

// Social Links Management
const defaultSocials: SocialLink[] = [
    { platform: 'Facebook', url: '#' },
    { platform: 'Instagram', url: '#' },
    { platform: 'Youtube', url: '#' },
    { platform: 'Send', url: '#' },
    { platform: 'WhatsApp', url: '#' },
];
export const getSocialLinks = (): SocialLink[] => getFromStorage<SocialLink[]>(SOCIALS_KEY, defaultSocials);
export const saveSocialLinks = (links: SocialLink[]) => saveToStorage(SOCIALS_KEY, links);

// Support Info Management
const defaultSupportInfo: SupportInfo = {
    whatsapp: '+91 00000 00000',
    phone: '1800-ROYAL-00',
    email: 'support@dessisatta.sim'
};
export const getSupportInfo = (): SupportInfo => getFromStorage<SupportInfo>(SUPPORT_INFO_KEY, defaultSupportInfo);
export const saveSupportInfo = (info: SupportInfo) => saveToStorage(SUPPORT_INFO_KEY, info);

// Payment Status Management
export const getPaymentStatus = (): PaymentStatus => getFromStorage<PaymentStatus>(PAYMENT_STATUS_KEY, { depositsEnabled: true, withdrawalsEnabled: true });
export const savePaymentStatus = (status: PaymentStatus) => saveToStorage(PAYMENT_STATUS_KEY, status);

// Betting Status Management
export const getBettingStatus = (): BettingStatus => getFromStorage<BettingStatus>(BETTING_STATUS_KEY, { bettingEnabled: true });
export const saveBettingStatus = (status: BettingStatus) => saveToStorage(BETTING_STATUS_KEY, status);

// Auto Payment Settings Management
export const getAutoPaymentSettings = (): AutoPaymentSettings => getFromStorage<AutoPaymentSettings>(AUTO_PAYMENT_SETTINGS_KEY, { autoAcceptEnabled: false });
export const saveAutoPaymentSettings = (settings: AutoPaymentSettings) => saveToStorage(AUTO_PAYMENT_SETTINGS_KEY, settings);

// Withdrawal Types (from previous implementation)
export const getWithdrawalMethods = (): any[] => getFromStorage<any[]>('dessi-satta-withdraw-methods', []);
export const saveWithdrawalMethod = (method: any) => {
    const methods = getWithdrawalMethods();
    if (method.id) {
        const index = methods.findIndex(m => m.id === method.id);
        methods[index] = method;
    } else {
        method.id = `wm-${Date.now()}`;
        methods.push(method);
    }
    saveToStorage('dessi-satta-withdraw-methods', methods);
};
export const deleteWithdrawalMethod = (id: string) => {
    const methods = getWithdrawalMethods().filter(m => m.id !== id);
    saveToStorage('dessi-satta-withdraw-methods', methods);
}

// Referral Management
export const getActiveReferralsCount = (
    referrerId: string,
    allUsers: User[],
    allTransactions: Transaction[]
): number => {
    const referrer = allUsers.find(u => u.id === referrerId);
    if (!referrer || !referrer.referralCode) return 0;

    const referredUsers = allUsers.filter(u => u.referredBy === referrer.referralCode);
    if (referredUsers.length === 0) return 0;

    let activeReferralCount = 0;
    for (const referredUser of referredUsers) {
        const totalDeposited = allTransactions
            .filter(tx => tx.userId === referredUser.id && tx.type === 'Deposit' && tx.status === 'Approved')
            .reduce((sum, tx) => sum + tx.amount, 0);

        if (totalDeposited >= 100) {
            activeReferralCount++;
        }
    }
    return activeReferralCount;
};