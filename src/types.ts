export interface User {
  uid: string;
  displayName: string;
  kycVerified: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  createdAt: string;
}
