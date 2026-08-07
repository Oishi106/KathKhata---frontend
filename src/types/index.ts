export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "mill_owner" | "admin";
  businessName?: string;
  language: "bn" | "en";
  avatarUrl?: string;
}

export interface WoodInventoryItem {
  _id: string;
  woodType: string;
  supplier?: string;
  purchaseDate: string;
  purchasePrice: number;
  transportCost: number;
  totalCFT: number;
  availableCFT: number;
  location?: string;
  notes?: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  createdAt: string;
}

export interface CuttingOrder {
  _id: string;
  customerName: string;
  customerPhone?: string;
  woodType: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  cft: number;
  estimatedCost: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

export interface Expense {
  _id: string;
  category: "salary" | "electricity" | "transport" | "machine_repair" | "fuel" | "miscellaneous";
  amount: number;
  description?: string;
  date: string;
}

export interface Sale {
  _id: string;
  productName: string;
  customerName?: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  costOfGoods: number;
  profit: number;
  date: string;
}

export interface Supplier {
  _id: string;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  totalDue: number;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Purchase {
  _id: string;
  supplier: string | Supplier;
  purchaseDate: string;
  invoiceNumber?: string;
  woodType: string;
  quantity: number;
  totalCFT: number;
  purchasePrice: number;
  transportCost: number;
  loadingCost: number;
  unloadingCost: number;
  otherExpenses: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPaymentRecord {
  amount: number;
  date: string;
  method?: string;
  note?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDue: number;
  advanceBalance: number;
  paymentHistory?: CustomerPaymentRecord[];
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface DashboardSummary {
  todayRevenue: number;
  todayExpense: number;
  todayProfit: number;
  availableWoodCFT: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyProfit: number;
  lowStockAlerts: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}