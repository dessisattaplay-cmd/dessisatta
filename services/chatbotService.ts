import type { ChatbotNode, PaymentStatus } from '../types';
import { translations } from '../i18n';
import { getSocialLinks } from './adminService';

// This function dynamically builds the conversation tree using the translations
// so the chatbot's content is always in the currently selected language.
export const getChatbotTree = (t: (key: string, options?: Record<string, string | number>) => string, paymentStatus: PaymentStatus): Record<string, ChatbotNode> => {

    const whatsAppLink = getSocialLinks().find(s => s.platform === 'WhatsApp')?.url || '#';

    let paymentStatusAnswer = '';
    if (paymentStatus.depositsEnabled && paymentStatus.withdrawalsEnabled) {
        paymentStatusAnswer = t('chatAnsPaymentStatusYes');
    } else if (!paymentStatus.depositsEnabled && !paymentStatus.withdrawalsEnabled) {
        paymentStatusAnswer = t('chatAnsPaymentStatusNo');
    } else {
        paymentStatusAnswer = t('chatAnsPaymentStatusMixed', {
            deposits: paymentStatus.depositsEnabled ? 'open' : 'closed',
            withdrawals: paymentStatus.withdrawalsEnabled ? 'open' : 'closed',
        });
    }


    return {
        'start': {
            id: 'start',
            text: t('chatbotWelcome'),
            options: [
                { text: t('chatOptViewHistory'), nextId: 'viewHistory' },
                { text: t('chatOptCheckTransaction'), nextId: 'checkTransaction' },
                { text: t('chatOptCheckBet'), nextId: 'checkBet' },
                { text: t('chatOptMembership'), nextId: 'membership' },
                { text: t('chatOptProfile'), nextId: 'profile' },
                { text: t('chatOptBetTiming'), nextId: 'betTiming' },
                { text: t('chatOptPaymentStatus'), nextId: 'paymentStatus' },
                { text: t('chatOptDeposit'), nextId: 'deposit' },
                { text: t('chatOptWithdraw'), nextId: 'withdraw' },
                { text: t('chatOptWagering'), nextId: 'wagering' },
                { text: t('chatOptReferral'), nextId: 'referral' },
                { text: t('chatOptWhatIsPatti'), nextId: 'whatIsPatti' },
                { text: t('chatOptSupport'), nextId: 'support' },
            ]
        },
        'membership': {
            id: 'membership',
            text: t('chatAnsMembership'),
            options: [ { text: t('chatOptMainMenu'), nextId: 'start' } ]
        },
        'profile': {
            id: 'profile',
            text: t('chatAnsProfile'),
            options: [ { text: t('chatOptMainMenu'), nextId: 'start' } ]
        },
        'paymentStatus': {
            id: 'paymentStatus',
            text: paymentStatusAnswer,
            options: [ { text: t('chatOptMainMenu'), nextId: 'start' } ]
        },
        'wagering': {
            id: 'wagering',
            text: t('chatAnsWagering'),
            options: [ { text: t('chatOptMainMenu'), nextId: 'start' } ]
        },
        'referral': {
            id: 'referral',
            text: t('chatAnsReferral'),
            options: [ { text: t('chatOptMainMenu'), nextId: 'start' } ]
        },
        'login': {
            id: 'login',
            text: t('chatAnsLogin'),
            options: [
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'deposit': {
            id: 'deposit',
            text: t('chatAnsDeposit'),
            options: [
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'withdraw': {
            id: 'withdraw',
            text: t('chatAnsWithdraw'),
            options: [
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'bet': {
            id: 'bet',
            text: t('chatAnsBet'),
            options: [
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'betInfo': {
            id: 'betInfo',
            text: t('chatAnsBetInfo'),
            options: [
                { text: t('chatOptBetTiming'), nextId: 'betTiming' },
                { text: t('chatOptBetResult'), nextId: 'betResult' },
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
         'betTiming': {
            id: 'betTiming',
            text: t('chatAnsBetTiming'),
            options: [
                { text: t('chatOptBetResult'), nextId: 'betResult' },
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'betResult': {
            id: 'betResult',
            text: t('chatAnsBetResult'),
            options: [
                { text: t('chatOptWhatIsPatti'), nextId: 'whatIsPatti' },
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'whatIsPatti': {
             id: 'whatIsPatti',
            text: t('chatAnsWhatIsPatti'),
            options: [
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'download': {
            id: 'download',
            text: t('chatAnsDownload'),
            options: [
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'support': {
            id: 'support',
            text: t('chatAnsSupport'),
            options: [
                { text: t('chatBtnWhatsapp'), link: whatsAppLink },
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'viewHistory': {
            id: 'viewHistory',
            text: t('chatAnsViewHistory'),
            options: [
                { text: t('chatBtnViewHistory'), link: '#/points' },
                { text: t('chatOptMainMenu'), nextId: 'start' }
            ]
        },
        'checkTransaction': {
            id: 'checkTransaction',
            text: t('chatPromptTransactionId'),
            awaitsInput: 'transactionId',
        },
        'checkBet': {
            id: 'checkBet',
            text: t('chatPromptBetId'),
            awaitsInput: 'betId',
        },
    };
};