import type { Transaction, User, Bet } from '../types';
import { getAllTransactions } from './paymentService';
import { getAllUsers, getAllBets } from './adminService';

const convertToCSV = (data: object[], headers: string[]): string => {
    if (data.length === 0) return '';
    
    const rows = data.map(obj => {
        return headers.map(header => {
            const key = header.toLowerCase().replace(/ /g, '');
            // A bit of magic to find the key in the object
            const objKey = Object.keys(obj).find(k => k.toLowerCase() === key);
            let val = objKey ? obj[objKey as keyof typeof obj] : '';
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

const downloadCSV = (csvContent: string, filename: string) => {
    if (!csvContent) {
        alert('No data to export.');
        return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportTransactionsCSV = (transactions: Transaction[], filename: string) => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Transaction ID', 'User ID', 'User Name', 'Type', 'Amount', 'Status', 'Timestamp', 'Description'];
    const csvData = transactions.map(tx => ({
        transactionid: tx.id,
        userid: tx.userId,
        username: tx.userFullName,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        timestamp: new Date(tx.timestamp).toISOString(),
        description: tx.description
    }));
    const csv = convertToCSV(csvData, headers);
    downloadCSV(csv, filename);
}


export const exportDailyReport = () => {
    const allTransactions = getAllTransactions();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const dailyData = allTransactions.filter(tx => tx.timestamp >= startOfDay.getTime());
    exportTransactionsCSV(dailyData, `Daily_Report_${now.toISOString().split('T')[0]}.csv`);
};

export const exportMonthlyReport = () => {
    const allTransactions = getAllTransactions();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const monthlyData = allTransactions.filter(tx => tx.timestamp >= startOfMonth.getTime());
    exportTransactionsCSV(monthlyData, `Monthly_Report_${now.getFullYear()}-${now.getMonth() + 1}.csv`);
};

export const exportUsersCSV = () => {
    const users = getAllUsers();
    const headers = ['User ID', 'Username', 'Full Name', 'Mobile Number', 'Address', 'Points', 'Referral Code', 'Last Login'];
    const csvData = users.map(u => ({
        userid: u.id,
        username: u.username,
        fullname: u.fullName,
        mobilenumber: u.mobileNumber,
        address: u.address,
        points: u.points,
        referralcode: u.referralCode,
        lastlogin: u.lastLogin
    }));
    const csv = convertToCSV(csvData, headers);
    downloadCSV(csv, `Users_Database_${new Date().toISOString().split('T')[0]}.csv`);
}

export const calculateUserPnl = (userId: string, allBets: Bet[]): { totalBet: number; totalWinnings: number; netPnl: number } => {
    const userBets = allBets.filter(bet => bet.userId === userId);

    const totalBet = userBets.reduce((sum, bet) => sum + bet.points, 0);

    const totalWinnings = userBets
        .filter(bet => bet.status === 'Won' && bet.winnings)
        .reduce((sum, bet) => sum + bet.winnings!, 0);
    
    // User's Net P/L = Winnings - Bets
    const netPnl = totalWinnings - totalBet;

    return { totalBet, totalWinnings, netPnl };
};