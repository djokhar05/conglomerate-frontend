export type UserRole = 'admin' | 'member';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  slots?: number;
  active?: boolean;
}

export interface Member {
  _id: string;
  username: string;
  fullName: string;
  role: UserRole;
  slots: number;
  active: boolean;
}

export interface Payment {
  _id: string;
  user: Member;
  slots?: number;
  amount: number;
  paidAt: string;
  month: number;
  year: number;
  dueDate: string;
  status: 'on_time' | 'late';
  penaltyAmount: number;
}

export interface Investment {
  _id: string;
  title: string;
  amountInvested: number;
  currentValue: number;
  investedAt: string;
  notes?: string;
}

export interface Expense {
  _id: string;
  title: string;
  category: 'operations' | 'bank' | 'logistics' | 'welfare' | 'loan' | 'other';
  entryType: 'expense' | 'recovery';
  amount: number;
  incurredAt: string;
  notes?: string;
  createdBy?: {
    _id?: string;
    fullName?: string;
    username?: string;
  };
}

export interface DashboardSummary {
  year: number;
  metrics: {
    totalContributions: number;
    totalPenalties: number;
    totalExpenses: number;
    totalRecoveries: number;
    netExpenses: number;
    totalInvested: number;
    currentInvestmentValue: number;
    investmentProfit: number;
    overallPoolValue: number;
  };
  proportionalDistribution: Array<{
    memberId: string;
    fullName: string;
    slots: number;
    principal: number;
    ratio: number;
    projectedProfitShare: number;
  }>;
}
