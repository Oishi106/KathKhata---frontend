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

export interface MeasurementItem {
  _id: string;
  mode: "round_log" | "size_cut";
  girth?: number;
  girthUnit?: "feet" | "inch";
  length?: number;
  width?: number;
  thickness?: number;
  quantity: number;
  cft: number;
  ruleUsed: string;
}

export interface Measurement {
  _id: string;
  slipNumber: string;
  customerName: string;
  operator?: string;
  items: MeasurementItem[];
  totalCFT: number;
  ratePerCFT: number;
  totalPrice: number;
  paidAmount: number;
  dueAmount: number;
  status: "open" | "closed";
  createdAt: string;
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

export interface MaintenanceRecord {
  date: string;
  type: "routine" | "repair";
  cost: number;
  description?: string;
  performedBy?: string;
}

export interface Machine {
  _id: string;
  name: string;
  type?: string;
  modelNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  location?: string;
  status: "operational" | "under_maintenance" | "out_of_order";
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceHistory?: MaintenanceRecord[];
  totalMaintenanceCost: number;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "half_day" | "leave";
  overtimeHours: number;
}

export interface EmployeePaymentRecord {
  date: string;
  type: "advance" | "bonus" | "salary" | "deduction";
  amount: number;
  note?: string;
}

export interface Employee {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  designation?: string;
  salaryType: "daily" | "weekly" | "monthly";
  salaryAmount: number;
  overtimeRatePerHour?: number;
  joiningDate: string;
  status: "active" | "inactive";
  advanceBalance: number;
  attendanceHistory?: AttendanceRecord[];
  paymentHistory?: EmployeePaymentRecord[];
  notes?: string;
  createdAt: string;
}

export interface Payroll {
  _id: string;
  employee: string | Employee;
  month: number;
  year: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  basePay: number;
  overtimePay: number;
  bonusTotal: number;
  deductionTotal: number;
  advanceDeducted: number;
  calculatedTotal: number;
  manualAdjustment: number;
  manualAdjustmentNote?: string;
  netPayable: number;
  status: "draft" | "paid";
  paidDate?: string;
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