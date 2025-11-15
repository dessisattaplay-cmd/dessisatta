export type MembershipTier = 'none' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserMembership {
    currentTier: MembershipTier;
    monthlyDepositTotal: number;
    history: { month: string; tier: MembershipTier }[]; // e.g., month: "2024-07"
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  mobileNumber: string;
  address: string;
  password: string;
  referralCode: string;
  referredBy?: string;
  points: number;
  lastLogin: string;
  role: 'user' | 'agent' | 'admin';
  agentId?: string; // ID of the agent this user is assigned to
  commissionRate?: number; // Percentage, only for agents
  createdAt: number; // Timestamp of registration
  isBetLocked: boolean;
  isProfileLocked: boolean;
  agreementAcceptedAt: number;
  membership: UserMembership;
  lastTierCheck: number;
}

export interface BaziResult {
  id: number;
  baziNumber: number;
  timestamp: number;
  numbers: [number, number, number];
  equation: string;
  total: number;
  finalDigit: number;
}

export interface WinnerComment {
    id: string;
    name: string;
    userId: string;
    comment: string;
    language: 'en' | 'hi' | 'bn';
}

export interface Tip {
    id: number;
    text: Record<'en' | 'hi' | 'bn', string>;
}

export interface Transaction {
  id: string;
  userId: string;
  userFullName: string;
  type: 'Deposit' | 'Withdrawal' | 'Selection' | 'Win' | 'Bet' | 'Admin Credit' | 'Admin Debit' | 'Bonus' | 'Commission';
  amount: number;
  status: 'Completed' | 'Pending' | 'Approved' | 'Rejected';
  timestamp: number;
  description: string;
  utrNumber?: string;
  receiptImageUrl?: string;
  withdrawalDetails?: {
    accountHolderName: string;
    contactNumber: string;
    paymentMethod: 'upi' | 'bank';
    upiId?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
  };
}

export interface GalleryImage {
    id: number;
    url: string;
    caption: string;
    uploader: string; // 'Admin' or username
    isApproved: boolean;
}

export interface UserSelection {
    userId: string;
    baziId: number;
    digit: number;
    points: number;
}

export interface Bet {
    id: string;
    userId: string;
    baziId: number;
    baziNumber: number;
    betType: 'Single' | 'Patti';
    pattiNumbers?: [number, number, number];
    digit: number;
    points: number;
    timestamp: number;
    status: 'Pending' | 'Won' | 'Lost';
    winnings?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank' | 'qr';
  details: {
    name: string;
    upiId?: string;
    qrCodeUrl?: string; // a data URL for the image
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  isActive: boolean;
}

export interface BroadcastMessage {
  id: number;
  message: string;
  timestamp: number;
}

export interface Feedback {
  id: number;
  name: string;
  email: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

export interface AdminNotification {
  id: number;
  message: string;
  timestamp: number;
  isRead: boolean;
}

export interface UserNotification {
    id: number;
    userId: string;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: number;
    isRead: boolean;
}

export interface PromotionalMessage {
  id: number;
  message: string;
  isActive: boolean;
}

export interface SocialLink {
  platform: 'Facebook' | 'Instagram' | 'Youtube' | 'Send' | 'WhatsApp';
  url: string;
}

export interface PaymentStatus {
    depositsEnabled: boolean;
    withdrawalsEnabled: boolean;
}

export interface BettingStatus {
    bettingEnabled: boolean;
}

export interface SupportInfo {
    whatsapp: string;
    phone: string;
    email: string;
}

export interface ChatbotMessage {
  sender: 'bot' | 'user';
  text: string;
}

export interface ChatbotNode {
  id: string;
  text: string;
  options?: {
    text: string;
    nextId?: string;
    link?: string;
  }[];
  awaitsInput?: 'transactionId' | 'betId';
}

export interface AutoPaymentSettings {
    autoAcceptEnabled: boolean;
}

// Admin Pages
export interface WithdrawalMethod {
    id: string;
    name: string;
    minAmount: number;
    maxAmount: number;
    remark: string;
    fields: WithdrawalField[];
}

export interface WithdrawalField {
    id: string;
    label: string;
    type: 'Text' | 'Number';
}