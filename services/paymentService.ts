import { GoogleGenAI } from "@google/genai";
import type { Transaction, User } from '../types';
import { createUserNotification, createAdminNotification } from './notificationService';
import { getActiveReferralsCount, getAutoPaymentSettings } from './adminService';
import { checkAndUpgradeMembership } from './membershipService';

const TRANSACTIONS_KEY = 'dessi-satta-transactions';
const USERS_KEY = 'dessi-satta-users';

// Helper to get all transactions from localStorage
export const getAllTransactions = (): Transaction[] => {
    const transactionsStr = localStorage.getItem(TRANSACTIONS_KEY);
    return transactionsStr ? JSON.parse(transactionsStr) : [];
};

// Helper to save all transactions to localStorage
const saveAllTransactions = (transactions: Transaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

// Helper to get users from localStorage
const getUsers = (): User[] => {
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

// Helper to save users to localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const createAndSaveTransaction = (transactionData: Omit<Transaction, 'id' | 'timestamp'>): Transaction => {
    const allTransactions = getAllTransactions();
    const newTransaction: Transaction = {
        ...transactionData,
        id: `TXN${Date.now()}${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now()
    };
    allTransactions.push(newTransaction);
    saveAllTransactions(allTransactions);
    return newTransaction;
};

export const submitDepositRequest = async (
    userId: string,
    userFullName: string,
    amount: number,
    utrNumber: string,
    receiptDataUrl: string | null
): Promise<void> => {
    // 1. Create a pending transaction immediately
    const pendingTx = createAndSaveTransaction({
        userId,
        userFullName,
        type: 'Deposit',
        amount,
        status: 'Pending',
        description: `Deposit request for ${amount} points`,
        utrNumber,
        receiptImageUrl: receiptDataUrl || undefined,
    });
    
    // 2. Check if auto-approval is enabled and if there's a receipt
    const settings = getAutoPaymentSettings();
    if (!settings.autoAcceptEnabled || !receiptDataUrl) {
        createAdminNotification(`New deposit request from ${userFullName} for ${amount} points.`);
        return;
    }

    // 3. Perform OCR verification
    // TODO: The OCR feature is temporarily disabled. The use of `process.env.API_KEY` is not directly 
    // supported in a browser environment and was causing the app to crash on load. A secure method 
    // for providing the API key to the frontend is required to re-enable this feature.
    /*
    try {
        // This line causes a crash in the browser because `process` is not defined.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const mimeType = receiptDataUrl.substring(receiptDataUrl.indexOf(':') + 1, receiptDataUrl.indexOf(';'));
        const base64Data = receiptDataUrl.substring(receiptDataUrl.indexOf(',') + 1);

        const imagePart = {
            inlineData: {
                mimeType,
                data: base64Data,
            },
        };

        const textPart = {
            text: `Analyze this payment receipt. Extract the transaction ID/UTR number and the total amount paid. Respond ONLY with a valid JSON object like this: {"utr": "EXTRACTED_UTR_HERE", "amount": EXTRACTED_AMOUNT_AS_NUMBER}. Be precise. If you cannot find a value, use null for that key.`,
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("OCR response was empty or invalid.");
        }

        const cleanedJsonText = jsonText.replace(/```json|```/g, '');
        const ocrResult = JSON.parse(cleanedJsonText);
        
        const extractedAmount = ocrResult.amount ? parseFloat(ocrResult.amount) : null;
        const extractedUtr = ocrResult.utr ? String(ocrResult.utr).replace(/\s/g, '') : null;
        const userUtr = utrNumber.replace(/\s/g, '');

        // 4. Compare and approve if match
        if (extractedAmount === amount && extractedUtr && (userUtr.includes(extractedUtr) || extractedUtr.includes(userUtr))) {
            processTransaction(pendingTx.id, 'approve', { approvalRemark: 'Auto-Approved via OCR verification.' });
        } else {
            createAdminNotification(`New deposit request from ${userFullName} for ${amount} points (OCR mismatch).`);
        }

    } catch (error) {
        console.error("OCR Auto-Approval Error:", error);
        createAdminNotification(`New deposit request from ${userFullName} for ${amount} points (OCR error).`);
    }
    */

    // Fallback: always notify admin for now until OCR is fixed.
    createAdminNotification(`New deposit request from ${userFullName} for ${amount} points.`);
};


export const getPendingTransactions = (): Transaction[] => {
    return getAllTransactions()
        .filter(t => t.status === 'Pending')
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const getTransactionById = (id: string): Transaction | null => {
    return getAllTransactions().find(tx => tx.id === id) || null;
}

export const processTransaction = (
    transactionId: string, 
    action: 'approve' | 'reject', 
    options: { bonusAmount?: number; rejectionReason?: string; approvalRemark?: string } = {}
): boolean => {
    const allTransactions = getAllTransactions();
    const transactionIndex = allTransactions.findIndex(t => t.id === transactionId);

    if (transactionIndex === -1) {
        console.error("Transaction not found");
        return false;
    }

    const transaction = allTransactions[transactionIndex];
    if (transaction.status !== 'Pending') {
        console.error("Transaction is not pending and cannot be processed.");
        return false;
    }
    
    // Automatic Duplicate Transaction Check for Deposits
    if (transaction.type === 'Deposit' && transaction.utrNumber) {
        const hasBeenUsed = allTransactions.some(tx => 
            tx.id !== transaction.id &&
            tx.utrNumber === transaction.utrNumber &&
            tx.status === 'Approved'
        );
        if (hasBeenUsed) {
            transaction.status = 'Rejected';
            transaction.description = "Rejected: Duplicate transaction number already used and approved.";
            allTransactions[transactionIndex] = transaction;
            saveAllTransactions(allTransactions);
            createUserNotification(transaction.userId, 'duplicateTransaction', 'error');
            return true;
        }
    }


    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === transaction.userId);
    if (userIndex === -1) {
        console.error("User associated with transaction not found");
        return false;
    }
    let user = users[userIndex];

    if (action === 'approve') {
        transaction.status = 'Approved';
        if(options.approvalRemark) {
            transaction.description = options.approvalRemark;
        }
        
        if (transaction.type === 'Deposit') {
            const totalAmount = transaction.amount + (options.bonusAmount || 0);
            user.points += totalAmount;

            const { updatedUser, bonusAwarded } = checkAndUpgradeMembership(user, transaction.amount);
            user = updatedUser; 
            
            if (bonusAwarded > 0) {
                 const bonusTransaction: Transaction = {
                    id: `TXN-BONUS-${Date.now()}`,
                    userId: user.id,
                    userFullName: user.fullName,
                    type: 'Bonus',
                    amount: bonusAwarded,
                    status: 'Completed',
                    timestamp: Date.now(),
                    description: `Bonus for reaching ${user.membership.currentTier} tier.`,
                };
                allTransactions.push(bonusTransaction);
            }

            if (user.referredBy) {
                const referrer = users.find(u => u.referralCode === user.referredBy);
                if (referrer) {
                    const activeReferralsBefore = getActiveReferralsCount(referrer.id, users, allTransactions);
                    
                    const totalDepositedByUser = allTransactions
                        .filter(tx => tx.userId === user.id && tx.type === 'Deposit' && tx.status === 'Approved')
                        .reduce((sum, tx) => sum + tx.amount, 0) + transaction.amount;
                    
                    if (totalDepositedByUser >= 100 && totalDepositedByUser - transaction.amount < 100) {
                        const activeReferralsAfter = activeReferralsBefore + 1;
                        let bonus = 0;
                        let desc = '';

                        if (activeReferralsAfter === 100) {
                            bonus = 1000;
                            desc = `Milestone bonus for 100 active referrals.`;
                        } else if (activeReferralsAfter > 0 && activeReferralsAfter % 10 === 0) {
                            bonus = 100;
                            desc = `Bonus for ${activeReferralsAfter} active referrals.`;
                        }

                        if (bonus > 0) {
                            const referrerIndex = users.findIndex(u => u.id === referrer.id);
                            if (referrerIndex > -1) {
                                users[referrerIndex].points += bonus;
                                const bonusTx: Transaction = { id: `TXN-REF-${Date.now()}`, userId: referrer.id, userFullName: referrer.fullName, type: 'Bonus', amount: bonus, status: 'Completed', timestamp: Date.now(), description: desc };
                                allTransactions.push(bonusTx);
                                createUserNotification(referrer.id, 'bonusAdded', 'success', { amount: bonus });
                            }
                        }
                    }
                }
            }

            createUserNotification(user.id, 'depositSuccess', 'success', { amount: transaction.amount });
            if (options.bonusAmount) {
                createUserNotification(user.id, 'bonusAdded', 'success', { amount: options.bonusAmount });
            }

        } else if (transaction.type === 'Withdrawal') {
            if (user.points < transaction.amount) {
                transaction.status = 'Rejected';
                transaction.description = 'Rejected due to insufficient points at time of approval.';
                createUserNotification(user.id, 'paymentRejected', 'error');
            } else {
                user.points -= transaction.amount;
                createUserNotification(user.id, 'withdrawalSuccess', 'success', { amount: transaction.amount });
            }
        }
    } else { // Reject
        transaction.status = 'Rejected';
        transaction.description = options.rejectionReason || 'Request rejected by admin.';
        createUserNotification(user.id, 'paymentRejected', 'error');
    }

    allTransactions[transactionIndex] = transaction;
    users[userIndex] = user;

    saveAllTransactions(allTransactions);
    saveUsers(users);
    return true;
};