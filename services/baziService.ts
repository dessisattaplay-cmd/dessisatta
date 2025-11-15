import type { BaziResult, Bet, User, Transaction } from '../types';
import { BAZI_SCHEDULE } from '../constants';

const BAZI_HISTORY_KEY = 'dessi-satta-bazi-history';
const BETS_KEY = 'dessi-satta-bets';
const USERS_KEY = 'dessi-satta-users';
const TRANSACTIONS_KEY = 'dessi-satta-transactions';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const itemStr = localStorage.getItem(key);
    return itemStr ? JSON.parse(itemStr) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};


const processBetsForBazi = (baziResult: BaziResult) => {
    const allBets = getFromStorage<Bet[]>(BETS_KEY, []);
    const allUsers = getFromStorage<User[]>(USERS_KEY, []);
    const allTransactions = getFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);

    const betsToProcess = allBets.filter(bet => bet.baziNumber === baziResult.baziNumber && bet.status === 'Pending');

    if (betsToProcess.length === 0) return;

    const userMap = new Map(allUsers.map(u => [u.id, u]));
    let updatedBets = false;

    for (const bet of betsToProcess) {
        const user = userMap.get(bet.userId);
        if (!user) continue;

        let totalWinnings = 0;
        let winDescription = '';
        
        const isPattiBet = bet.betType === 'Patti' && bet.pattiNumbers;

        // Check for full patti match first (high reward)
        if (isPattiBet) {
            const sortedBetPatti = [...bet.pattiNumbers!].sort();
            const sortedResultPatti = [...baziResult.numbers].sort();
            // FIX: Corrected typo from 'sortedBetP Patti' to 'sortedBetPatti'.
            if (JSON.stringify(sortedBetPatti) === JSON.stringify(sortedResultPatti)) {
                // Full patti match gets the big prize: 18x
                totalWinnings = (bet.points * 9) * 2;
                winDescription = `Full Patti win on ${bet.pattiNumbers!.join('')}.`;
            } else if (bet.digit === baziResult.finalDigit) {
                // Patti bet was placed, but only the single digit matched.
                totalWinnings = bet.points * 9;
                winDescription = `Single digit win on ${bet.digit}.`;
            }
        } else {
            // This was a regular single digit bet.
            if (bet.digit === baziResult.finalDigit) {
                totalWinnings = bet.points * 9;
                winDescription = `Single digit win on ${bet.digit}.`;
            }
        }


        if (totalWinnings > 0) {
            user.points += totalWinnings;
            bet.winnings = totalWinnings;

            const winTransaction: Transaction = {
                id: `TXN-WIN-${Date.now()}-${bet.id}`,
                userId: user.id,
                userFullName: user.fullName,
                type: 'Win',
                amount: totalWinnings,
                status: 'Completed',
                timestamp: Date.now(),
                description: `Won on Bazi #${baziResult.baziNumber}. ${winDescription.trim()}`,
            };
            allTransactions.push(winTransaction);
            bet.status = 'Won';
        } else {
            bet.status = 'Lost';
        }
        updatedBets = true;
    }

    if (updatedBets) {
        const updatedAllBets = allBets.map(b => {
            const processedBet = betsToProcess.find(pb => pb.id === b.id);
            return processedBet || b;
        });

        saveToStorage(BETS_KEY, updatedAllBets);
        saveToStorage(USERS_KEY, Array.from(userMap.values()));
        saveToStorage(TRANSACTIONS_KEY, allTransactions);
        console.log(`Processed ${betsToProcess.length} bets for Bazi #${baziResult.baziNumber}.`);
    }
};

export const generateBaziResult = (baziNumber: number, timestamp: number): BaziResult => {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const num3 = Math.floor(Math.random() * 10);
  const total = num1 + num2 + num3;
  const finalDigit = total % 10;

  return {
    id: timestamp,
    baziNumber,
    timestamp,
    numbers: [num1, num2, num3],
    equation: `${num1} + ${num2} + ${num3} = ${total}`,
    total: total,
    finalDigit: finalDigit,
  };
};

export const getCurrentAndNextBazi = () => {
    const now = new Date();
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

    let currentBazi = null;
    let nextBazi = null;

    for (let i = 0; i < BAZI_SCHEDULE.length; i++) {
        const baziTime = new Date(nowUTC);
        baziTime.setUTCHours(BAZI_SCHEDULE[i].hour, BAZI_SCHEDULE[i].minute, 0, 0);

        if (baziTime <= nowUTC) {
            currentBazi = { number: i + 1, time: baziTime };
        } else {
            nextBazi = { number: i + 1, time: baziTime };
            break;
        }
    }

    // If all bazis for today are done, the next bazi is the first one of tomorrow
    if (!nextBazi && BAZI_SCHEDULE.length > 0) {
        const tomorrow = new Date(nowUTC);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(BAZI_SCHEDULE[0].hour, BAZI_SCHEDULE[0].minute, 0, 0);
        nextBazi = { number: 1, time: tomorrow };
    }
    
    // If it's before the first bazi of the day
    if (!currentBazi && nextBazi) {
        const yesterday = new Date(nowUTC);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const lastBaziYesterday = BAZI_SCHEDULE[BAZI_SCHEDULE.length - 1];
        yesterday.setUTCHours(lastBaziYesterday.hour, lastBaziYesterday.minute, 0, 0);
        currentBazi = { number: BAZI_SCHEDULE.length, time: yesterday };
    }
    
    return { currentBazi, nextBazi };
};

export const getLatestResult = (): BaziResult | null => {
  const { currentBazi } = getCurrentAndNextBazi();
  if (!currentBazi) return null;

  let history = getFromStorage<BaziResult[]>(BAZI_HISTORY_KEY, []);
  let latestResult = history.find(r => r.baziNumber === currentBazi.number && new Date(r.timestamp).getUTCDate() === new Date(currentBazi.time).getUTCDate());
  
  if (!latestResult) {
      // Result not generated yet for this slot, generate it now.
      latestResult = generateBaziResult(currentBazi.number, currentBazi.time.getTime());
      history.push(latestResult);
      // Keep history to a reasonable size, e.g., last 3 days (8 bazis/day)
      if(history.length > 3 * 8 * 2) { 
        history = history.slice(history.length - (3 * 8 * 2));
      }
      saveToStorage(BAZI_HISTORY_KEY, history);

      // IMPORTANT: Process bets after generating a new result
      processBetsForBazi(latestResult);
  }
  return latestResult;
};


export const getHistory = (): BaziResult[] => {
    const history = getFromStorage<BaziResult[]>(BAZI_HISTORY_KEY, []);
    return history.sort((a, b) => b.timestamp - a.timestamp);
};

export const getNextNBazis = (n: number): { number: number; time: Date }[] => {
    const now = new Date();
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

    const upcoming: { number: number; time: Date }[] = [];
    
    // Find the index of the first upcoming Bazi today
    const todayScheduleIndex = BAZI_SCHEDULE.findIndex(s => {
        const baziTime = new Date(nowUTC);
        baziTime.setUTCHours(s.hour, s.minute, 0, 0);
        return baziTime > nowUTC;
    });

    // Add remaining bazis for today
    if (todayScheduleIndex !== -1) {
        for (let i = todayScheduleIndex; i < BAZI_SCHEDULE.length && upcoming.length < n; i++) {
            const schedule = BAZI_SCHEDULE[i];
            const baziTime = new Date(nowUTC);
            baziTime.setUTCHours(schedule.hour, schedule.minute, 0, 0);
            upcoming.push({ number: i + 1, time: baziTime });
        }
    }

    // Add bazis from subsequent days if needed
    let dayOffset = 1;
    while(upcoming.length < n) {
        for (let i = 0; i < BAZI_SCHEDULE.length && upcoming.length < n; i++) {
            const schedule = BAZI_SCHEDULE[i];
            const baziTime = new Date(nowUTC);
            baziTime.setUTCDate(baziTime.getUTCDate() + dayOffset);
            baziTime.setUTCHours(schedule.hour, schedule.minute, 0, 0);
            upcoming.push({ number: i + 1, time: baziTime });
        }
        dayOffset++;
    }
    
    return upcoming;
};