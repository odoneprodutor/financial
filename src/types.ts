export interface Expense {
  id: string;
  category: string;
  amount: number;
  type: 'fixa' | 'variavel' | 'pontual';
}

export interface Reserve {
  id: string;
  name: string;
  amount: number;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  monthlyPayment: number;
  interestRate: number; // monthly interest rate in percentage
}

export interface MonthlyData {
  month: number; // 0-11
  year: number;
  income: number;
  expenses: Expense[];
}

export interface FinancialData {
  monthlyIncome: number; // Current/Default income
  expenses: Expense[]; // Default/Base expenses
  history: MonthlyData[]; // Historical monthly logs
  debts: Debt[];
  savings: number; // Total liquid savings
  reserves: Reserve[]; // Specific savings buckets
  goal: string;
  riskProfile: 'conservador' | 'moderado' | 'agressivo';
}

export interface MonthlySummary {
  income: number;
  expensesTotal: number;
  availableForDebts: number;
}

export interface BudgetCategory {
  category: string;
  limit: number;
}
