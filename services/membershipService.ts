import type { User, MembershipTier } from '../types';
import { createUserNotification } from './notificationService';

export const MEMBERSHIP_TIERS: Record<Exclude<MembershipTier, 'none'>, { threshold: number; bonus: number }> = {
    diamond: { threshold: 100000, bonus: 1000 },
    platinum: { threshold: 50000, bonus: 500 },
    gold: { threshold: 20000, bonus: 200 },
    silver: { threshold: 10000, bonus: 100 },
};

export const getMonthIdentifier = (date: Date): string => {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const calculateUserTier = (monthlyDepositTotal: number): MembershipTier => {
    if (monthlyDepositTotal >= MEMBERSHIP_TIERS.diamond.threshold) return 'diamond';
    if (monthlyDepositTotal >= MEMBERSHIP_TIERS.platinum.threshold) return 'platinum';
    if (monthlyDepositTotal >= MEMBERSHIP_TIERS.gold.threshold) return 'gold';
    if (monthlyDepositTotal >= MEMBERSHIP_TIERS.silver.threshold) return 'silver';
    return 'none';
};

export const checkAndUpgradeMembership = (user: User, depositAmount: number): { updatedUser: User, bonusAwarded: number } => {
    const userMembership = user.membership;
    userMembership.monthlyDepositTotal += depositAmount;

    const oldTier = userMembership.currentTier;
    const newTier = calculateUserTier(userMembership.monthlyDepositTotal);

    let bonusAwarded = 0;

    if (newTier !== oldTier && newTier !== 'none') {
        const tierOrder: MembershipTier[] = ['none', 'silver', 'gold', 'platinum', 'diamond'];
        const oldIndex = tierOrder.indexOf(oldTier);
        const newIndex = tierOrder.indexOf(newTier);

        if (newIndex > oldIndex) {
            // User leveled up
            const tierData = MEMBERSHIP_TIERS[newTier as keyof typeof MEMBERSHIP_TIERS];
            bonusAwarded = tierData.bonus;
            user.points += bonusAwarded;
            
            userMembership.currentTier = newTier;
            
            // Send a notification to the user
            createUserNotification(user.id, 'tierUpgradeMessage', 'success', {
                tier: newTier.charAt(0).toUpperCase() + newTier.slice(1),
                amount: bonusAwarded,
            });
        }
    }

    return { updatedUser: { ...user, membership: userMembership }, bonusAwarded };
};
