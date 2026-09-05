export interface Product {
  id: string;
  userId?: string; // Scoped to user/member account
  name: string;
  nameKh?: string;
  category: string;
  price: number; // in USD
  costPrice: number; // in USD
  stock: number;
  barcode: string;
  image: string;
  isPopular?: boolean;
  unit?: string;
  description?: string;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  itemNote?: string;
}

export type PaymentMethod = 'cash' | 'khqr' | 'card' | 'aba_pay';

export interface Order {
  id: string;
  userId?: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  taxRate: number;
  total: number;
  totalKhr: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeDue: number;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  status: 'completed' | 'draft' | 'cancelled' | 'pending_online';
  createdAt: string; // ISO string
  note?: string;
}

export interface Expense {
  id: string;
  userId?: string;
  title: string;
  category: 'Stock Purchase' | 'Utilities' | 'Rent' | 'Staff Salary' | 'Marketing' | 'Maintenance' | 'Other';
  amount: number;
  date: string;
  paidBy: string;
  notes?: string;
  note?: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  points: number;
  lastVisit: string;
}

export interface TableInfo {
  id: string;
  userId?: string;
  name: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export interface ShopSettings {
  shopName: string;
  shopNameKh: string;
  address: string;
  phone: string;
  email?: string;
  taxRate: number; // e.g. 0.08 for 8%
  currencySymbol: string;
  currency?: string;
  khrExchangeRate: number; // e.g. 4100
  enableSound: boolean;
  receiptFooterText: string;
  language: 'en' | 'kh';
  // KHQR Shop & POS Configuration
  khqrImage?: string; // Uploaded KHQR QR image (base64 data URL)
  khqrMerchantName?: string; // Store / Merchant Name on KHQR
  khqrAccountName?: string; // Account Holder Name (e.g. SOUN RAVIN)
  khqrAccountNumber?: string; // Bank Account No. / Bakong ID (e.g. 001 234 567 ABA)
  khqrBankName?: string; // Bank Name (e.g. ABA Bank, ACLEDA, Bakong, Wing)
  // Admin KHQR Settings for Membership Plan Upgrades
  adminUpgradeKhqr?: AdminUpgradeKhqrSettings;
}

export interface AdminUpgradeKhqrSettings {
  khqrImage?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  merchantName?: string;
  upgradePrice?: number;
  telegramUsername?: string;
  instructionsKh?: string;
  instructionsEn?: string;
}

export type UserRole = 'admin' | 'cashier' | 'manager';
export type UserStatus = 'active' | 'pending' | 'disabled';
export type UserPlan = 'free' | 'lifetime';

export interface UpgradeRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  phone?: string;
  currentPlan: UserPlan;
  targetPlan: 'lifetime';
  amount: number; // e.g. $19 or $29 USD
  paymentSlipImage: string; // Base64 proof of KHQR payment
  senderNote?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string; // ISO string
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // used for local/simulated validation if needed
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  plan?: UserPlan; // 'free' (limit 10 items) or 'lifetime' (unlimited items)
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  // Per-user custom KHQR overrides if applicable
  khqrImage?: string;
  khqrMerchantName?: string;
  khqrAccountName?: string;
  khqrAccountNumber?: string;
  khqrBankName?: string;
  // Per-user custom Invoice Branding overrides (isolated to each user/member)
  invoiceLogo?: string; // Custom invoice logo image (base64 or URL)
  invoiceShopName?: string; // Custom shop name on invoice (e.g. Sok Piseth Cafe)
  invoiceShopNameKh?: string; // Custom khmer shop name on invoice
  invoiceAddress?: string; // Custom address on invoice
  invoicePhone?: string; // Custom phone number on invoice
  invoiceFooterText?: string; // Custom footer message on invoice
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export type ActiveView = 
  | 'pos' 
  | 'products' 
  | 'orders' 
  | 'income_reports' 
  | 'member_breakdown'
  | 'expenses' 
  | 'tables' 
  | 'customers' 
  | 'settings'
  | 'admin_console'
  | 'customer_menu_preview';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'order' | 'stock' | 'system' | 'expense';
  read: boolean;
  timestamp: string; // ISO string
  linkView?: ActiveView;
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role: UserRole | string;
  avatar?: string;
  device: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  ip: string;
  activeView: string;
  loginTime: string;
  lastSeen: number;
  isOnline?: boolean;
}


