export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'accountant' | 'viewer'
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: Address
  taxId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customer?: Customer
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: Date
  dueDate: Date
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  currency: string
  description: string
  date: Date
  invoiceId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DashboardMetrics {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  outstandingInvoices: number
  overdueInvoices: number
  customerCount: number
  recentTransactions: Transaction[]
  revenueByMonth: MonthlyRevenue[]
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
}