import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Download, 
  PieChart, 
  BarChart3,
  Receipt,
  CheckCircle2,
  Package,
  Layers,
  ShoppingBag,
  ArrowRightLeft,
  Filter,
  Search,
  Check,
  AlertCircle,
  Percent,
  Sparkles,
  Users,
  UserCheck,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Eye,
  Crown,
  Building2,
  Boxes
} from 'lucide-react';
import { Order, Expense, Product, User } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';
import { DEFAULT_USERS } from '../lib/firestoreService';

interface IncomeReportsProps {
  orders: Order[];
  expenses: Expense[];
  products: Product[];
  users?: User[];
  currentUser?: User | null;
  allProducts?: Product[];
  allOrders?: Order[];
  language: 'en' | 'kh';
  khrRate: number;
  initialTab?: 'overview' | 'sales_in_out' | 'member_breakdown';
}

export const IncomeReports: React.FC<IncomeReportsProps> = ({
  orders,
  expenses,
  products,
  users = DEFAULT_USERS,
  currentUser,
  allProducts,
  allOrders,
  language,
  khrRate,
  initialTab
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'sales_in_out' | 'member_breakdown'>(initialTab || 'overview');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Synchronize when initialTab changes (e.g. user clicks direct sidebar link)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Member Breakdown Tab Filters & States
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'admin' | 'manager' | 'cashier'>('all');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const isKh = language === 'kh';

  // Effective products & orders list for cross-member reports
  const effectiveAllProducts = allProducts && allProducts.length > 0 ? allProducts : products;
  const effectiveAllOrders = allOrders && allOrders.length > 0 ? allOrders : orders;

  // Helper to filter dates
  const isWithinTimeRange = (dateStr: string, range: 'today' | 'week' | 'month' | 'all') => {
    if (range === 'all') return true;
    try {
      const itemDate = new Date(dateStr).getTime();
      const now = new Date();
      
      if (range === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
        return itemDate >= startOfDay && itemDate <= endOfDay;
      }
      
      if (range === 'week') {
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return itemDate >= sevenDaysAgo;
      }
      
      if (range === 'month') {
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        return itemDate >= thirtyDaysAgo;
      }
      
      return true;
    } catch {
      return true;
    }
  };

  // Comprehensive Financial & In/Out Calculation Engine
  const financialData = useMemo(() => {
    const matchedOrders = orders.filter(o => isWithinTimeRange(o.createdAt, timeRange));
    const completed = matchedOrders.filter(o => o.status === 'completed');
    
    // 1. Sales Out (លក់ចេញ)
    const grossRevenue = completed.reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = completed.length;
    let totalItemsSold = 0;

    // 2. Cost of Goods Sold (COGS / ថ្លៃដើមទំនិញលក់ចេញ)
    let cogsCost = 0;
    const productSalesMap = new Map<string, {
      product: Product;
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    completed.forEach(o => {
      o.items.forEach(item => {
        const pId = item.product.id;
        const qty = item.quantity || 1;
        totalItemsSold += qty;

        // Accurate Cost Price
        const unitCost = typeof item.product.costPrice === 'number' && !isNaN(item.product.costPrice)
          ? item.product.costPrice
          : (item.product.price * 0.45);
        
        const unitPrice = item.product.price;
        const lineRevenue = unitPrice * qty;
        const lineCost = unitCost * qty;
        const lineProfit = lineRevenue - lineCost;

        cogsCost += lineCost;

        const existing = productSalesMap.get(pId);
        if (existing) {
          existing.unitsSold += qty;
          existing.revenue += lineRevenue;
          existing.cost += lineCost;
          existing.profit += lineProfit;
        } else {
          productSalesMap.set(pId, {
            product: item.product,
            unitsSold: qty,
            revenue: lineRevenue,
            cost: lineCost,
            profit: lineProfit
          });
        }
      });
    });

    // 3. Expenses & Stock Purchases (លក់ចូល / ទិញស្តុក & ចំណាយប្រតិបត្តិការ)
    const matchedExpenses = expenses.filter(e => isWithinTimeRange(e.date, timeRange));
    const stockPurchaseExpenses = matchedExpenses
      .filter(e => e.category === 'Stock Purchase')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const operatingExpenses = matchedExpenses
      .filter(e => e.category !== 'Stock Purchase')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = matchedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Profitability Math
    const grossProfit = grossRevenue - cogsCost;
    const grossMargin = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0';
    
    // Net profit = Gross Revenue - COGS - Operating Expenses
    const netProfit = grossProfit - operatingExpenses;
    const netMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';
    const avgOrderValue = totalOrdersCount > 0 ? grossRevenue / totalOrdersCount : 0;

    // 5. Payment Channel distribution
    const cash = completed
      .filter(o => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.total, 0);

    const khqr = completed
      .filter(o => o.paymentMethod === 'khqr' || o.paymentMethod === 'aba_pay')
      .reduce((sum, o) => sum + o.total, 0);

    const card = completed
      .filter(o => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + o.total, 0);

    const paySum = cash + khqr + card;

    // 6. Complete In/Out Product Matrix
    const allProductsMatrix = products.map(p => {
      const sales = productSalesMap.get(p.id);
      const unitsSold = sales ? sales.unitsSold : 0;
      const unitCost = typeof p.costPrice === 'number' && !isNaN(p.costPrice) ? p.costPrice : (p.price * 0.45);
      const unitPrice = p.price;
      const totalRevenueOut = sales ? sales.revenue : 0;
      const totalCostIn = unitsSold * unitCost;
      const profit = totalRevenueOut - totalCostIn;
      const margin = totalRevenueOut > 0 ? ((profit / totalRevenueOut) * 100).toFixed(1) : '0';

      return {
        product: p,
        currentStock: p.stock,
        unitsSold,
        unitCost,
        unitPrice,
        unitMargin: unitPrice - unitCost,
        unitMarginPercent: unitPrice > 0 ? (((unitPrice - unitCost) / unitPrice) * 100).toFixed(0) : '0',
        totalRevenueOut,
        totalCostIn,
        profit,
        margin
      };
    });

    const topSelling = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      grossRevenue,
      grossRevenueKhr: Math.round(grossRevenue * khrRate),
      totalOrdersCount,
      totalItemsSold,
      cogsCost,
      grossProfit,
      grossMargin,
      stockPurchaseExpenses,
      operatingExpenses,
      totalExpenses,
      netProfit,
      netMargin,
      avgOrderValue,
      cashTotal: cash,
      khqrTotal: khqr,
      cardTotal: card,
      totalPaymentSum: paySum > 0 ? paySum : 1,
      allProductsMatrix,
      topSelling
    };
  }, [orders, expenses, products, timeRange, khrRate]);

  // Comprehensive Per-Member Inventory & Sales Breakdown Engine
  const memberBreakdown = useMemo(() => {
    const matchedOrders = effectiveAllOrders.filter(o => isWithinTimeRange(o.createdAt, timeRange));
    const completedOrders = matchedOrders.filter(o => o.status === 'completed');

    // Ensure list contains all users plus default users
    const userPool = [...(users || [])];
    for (const defU of DEFAULT_USERS) {
      if (!userPool.some(u => u.id === defU.id || u.username.toLowerCase() === defU.username.toLowerCase())) {
        userPool.push(defU);
      }
    }

    const memberStats = userPool.map(user => {
      // Products owned/created by this member (or assigned to admin fallback)
      const userProducts = effectiveAllProducts.filter(p => 
        p.userId === user.id || 
        (!p.userId && (user.id === 'user-admin' || user.role === 'admin'))
      );

      const totalInventoryItems = userProducts.length;
      const totalInventoryStock = userProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
      const totalInventoryValuation = userProducts.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);

      // Orders handled by this user
      const userOrders = completedOrders.filter(o => 
        o.userId === user.id || 
        o.cashierName?.toLowerCase() === user.fullName?.toLowerCase() ||
        o.cashierName?.toLowerCase() === user.username?.toLowerCase() ||
        (!o.userId && (user.id === 'user-admin' || user.role === 'admin'))
      );

      const totalInvoices = userOrders.length;
      const grossSales = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      
      let unitsSold = 0;
      let totalCostOfSold = 0;

      // Product sales map for this specific user
      const userItemSales = new Map<string, { qty: number; revenue: number; cost: number; profit: number }>();

      userOrders.forEach(ord => {
        ord.items.forEach(it => {
          const qty = it.quantity || 1;
          unitsSold += qty;

          const unitCost = typeof it.product.costPrice === 'number' && !isNaN(it.product.costPrice)
            ? it.product.costPrice
            : (it.product.price * 0.45);
          
          const lineRevenue = it.product.price * qty;
          const lineCost = unitCost * qty;
          const lineProfit = lineRevenue - lineCost;

          totalCostOfSold += lineCost;

          const prev = userItemSales.get(it.product.id);
          if (prev) {
            prev.qty += qty;
            prev.revenue += lineRevenue;
            prev.cost += lineCost;
            prev.profit += lineProfit;
          } else {
            userItemSales.set(it.product.id, {
              qty,
              revenue: lineRevenue,
              cost: lineCost,
              profit: lineProfit
            });
          }
        });
      });

      const grossProfit = grossSales - totalCostOfSold;
      const profitMarginPercent = grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : '0';

      // Itemized breakdown for this user's inventory
      const detailedProducts = userProducts.map(p => {
        const sales = userItemSales.get(p.id);
        const soldQty = sales ? sales.qty : 0;
        const rev = sales ? sales.revenue : 0;
        const cost = sales ? sales.cost : 0;
        const itemProfit = rev - cost;
        const unitCost = typeof p.costPrice === 'number' && !isNaN(p.costPrice) ? p.costPrice : (p.price * 0.45);

        return {
          product: p,
          stock: p.stock,
          unitCost,
          unitPrice: p.price,
          soldQty,
          revenue: rev,
          cost,
          itemProfit,
          margin: rev > 0 ? ((itemProfit / rev) * 100).toFixed(1) : '0'
        };
      });

      return {
        user,
        totalInventoryItems,
        totalInventoryStock,
        totalInventoryValuation,
        totalInvoices,
        grossSales,
        grossSalesKhr: Math.round(grossSales * khrRate),
        unitsSold,
        totalCostOfSold,
        grossProfit,
        profitMarginPercent,
        detailedProducts
      };
    });

    // Summary aggregates across all members
    const totalMembersCount = memberStats.length;
    const totalMemberProducts = memberStats.reduce((sum, m) => sum + m.totalInventoryItems, 0);
    const totalMemberInvoices = memberStats.reduce((sum, m) => sum + m.totalInvoices, 0);
    const totalMemberGrossSales = memberStats.reduce((sum, m) => sum + m.grossSales, 0);
    const totalMemberGrossProfit = memberStats.reduce((sum, m) => sum + m.grossProfit, 0);

    return {
      memberStats,
      totalMembersCount,
      totalMemberProducts,
      totalMemberInvoices,
      totalMemberGrossSales,
      totalMemberGrossProfit
    };
  }, [users, effectiveAllProducts, effectiveAllOrders, timeRange, khrRate]);

  // Filtered members based on search and role
  const filteredMemberStats = useMemo(() => {
    return memberBreakdown.memberStats.filter(m => {
      const matchRole = memberRoleFilter === 'all' || m.user.role === memberRoleFilter;
      const q = memberSearchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        m.user.fullName?.toLowerCase().includes(q) ||
        m.user.username?.toLowerCase().includes(q) ||
        m.user.email?.toLowerCase().includes(q) ||
        m.user.phone?.includes(q);
      return matchRole && matchSearch;
    });
  }, [memberBreakdown.memberStats, memberRoleFilter, memberSearchQuery]);

  // Filtered Itemized Matrix for Tab 2
  const filteredMatrix = useMemo(() => {
    return financialData.allProductsMatrix.filter(row => {
      const matchesSearch = 
        row.product.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        (row.product.nameKh && row.product.nameKh.includes(itemSearchQuery)) ||
        row.product.barcode.includes(itemSearchQuery);
      
      const matchesCategory = categoryFilter === 'All' || row.product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [financialData.allProductsMatrix, itemSearchQuery, categoryFilter]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // CSV Exporter with Khmer UTF-8 BOM
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    let csvContent = `Report Type,MINI MART POS - Itemized Sales In/Out Matrix\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Time Range,${timeRange.toUpperCase()}\n\n`;

    csvContent += `Barcode,Product Name,Khmer Name,Category,Current Stock,Units Sold Out,Unit Cost ($),Unit Price ($),Margin ($),Margin (%),Total Revenue Out ($),Total Cost In ($),Gross Profit ($)\n`;

    filteredMatrix.forEach(row => {
      const cleanName = `"${row.product.name.replace(/"/g, '""')}"`;
      const cleanKh = `"${(row.product.nameKh || '').replace(/"/g, '""')}"`;
      const cleanCat = `"${row.product.category || ''}"`;

      csvContent += `${row.product.barcode},${cleanName},${cleanKh},${cleanCat},${row.currentStock},${row.unitsSold},${row.unitCost.toFixed(2)},${row.unitPrice.toFixed(2)},${row.unitMargin.toFixed(2)},${row.unitMarginPercent}%,${row.totalRevenueOut.toFixed(2)},${row.totalCostIn.toFixed(2)},${row.profit.toFixed(2)}\n`;
    });

    csvContent += `\nSUMMARY METRICS\n`;
    csvContent += `Gross Revenue ($),${financialData.grossRevenue.toFixed(2)}\n`;
    csvContent += `Cost of Goods Sold ($),${financialData.cogsCost.toFixed(2)}\n`;
    csvContent += `Gross Profit ($),${financialData.grossProfit.toFixed(2)}\n`;
    csvContent += `Operating Expenses ($),${financialData.operatingExpenses.toFixed(2)}\n`;
    csvContent += `Net Profit ($),${financialData.netProfit.toFixed(2)}\n`;

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `minipos_sales_in_out_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Per-Member Breakdown CSV
  const handleExportMemberCSV = () => {
    const BOM = '\uFEFF';
    let csvContent = `Report Type,MINI MART POS - Per-Member Inventory & Sales Breakdown\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Time Range,${timeRange.toUpperCase()}\n\n`;

    csvContent += `Member Name,Username,Role,Plan,Inventory Items,Total Stock Units,Valuation ($),Invoices Handled,Units Sold,Gross Sales ($),Gross Sales (KHR),COGS Cost ($),Gross Profit ($),Profit Margin (%)\n`;

    memberBreakdown.memberStats.forEach(m => {
      const cleanName = `"${m.user.fullName.replace(/"/g, '""')}"`;
      const cleanUsername = `"${m.user.username}"`;
      csvContent += `${cleanName},${cleanUsername},${m.user.role},${m.user.plan || 'standard'},${m.totalInventoryItems},${m.totalInventoryStock},${m.totalInventoryValuation.toFixed(2)},${m.totalInvoices},${m.unitsSold},${m.grossSales.toFixed(2)},${m.grossSalesKhr},${m.totalCostOfSold.toFixed(2)},${m.grossProfit.toFixed(2)},${m.profitMarginPercent}%\n`;
    });

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `minipos_member_breakdown_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <span>{isKh ? 'របាយការណ៍ហិរញ្ញវត្ថុ & ចំណូលចំណាយ' : 'Financial & Income Reports'}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live POS Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isKh 
              ? 'វិភាគថ្លៃដើម (Cost In), ចំណូលលក់ចេញ (Revenue Out), ប្រាក់ចំណេញសុទ្ធ និងស្ថិតិតាមគណនីសមាជិក (Per-Member Breakdown)' 
              : 'Deep analytics on COGS, Gross Revenue, Net Profit, Payment Channels & Per-Member Breakdown'}
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'today' && (isKh ? 'ថ្ងៃនេះ' : 'Today')}
                {range === 'week' && (isKh ? '៧ ថ្ងៃ' : '7 Days')}
                {range === 'month' && (isKh ? '៣០ ថ្ងៃ' : '30 Days')}
                {range === 'all' && (isKh ? 'ទាំងអស់' : 'All Time')}
              </button>
            ))}
          </div>

          {activeTab === 'member_breakdown' ? (
            <button
              onClick={handleExportMemberCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isKh ? 'ទាញយក CSV សមាជិក' : 'Export Member CSV'}</span>
            </button>
          ) : (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isKh ? 'ទាញយក CSV' : 'Export CSV'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ចំណូលលក់ចេញសរុប (Revenue Out)' : 'Gross Revenue Out'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatUSD(financialData.grossRevenue)}
            </h3>
            <p className="text-xs font-bold text-indigo-600 mt-0.5">
              {formatKHR(financialData.grossRevenueKhr)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>{financialData.totalOrdersCount} {isKh ? 'វិក្កយបត្រ' : 'Invoices'}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {financialData.totalItemsSold} {isKh ? 'ចំនួនមុខទំនិញលក់' : 'items sold'}
            </span>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ថ្លៃដើមទំនិញលក់ចេញ (Cost In)' : 'Cost of Goods Sold'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatUSD(financialData.cogsCost)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKh ? 'ថ្លៃដើមទិញចូលនៃទំនិញដែលបានលក់' : 'Inventory acquisition cost'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>{isKh ? 'ចំណាយស្តុកបន្ថែម' : 'Stock purchases'}:</span>
            <span className="font-bold text-slate-700">{formatUSD(financialData.stockPurchaseExpenses)}</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ប្រាក់ចំណេញដុល (Gross Profit)' : 'Gross Profit'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {formatUSD(financialData.grossProfit)}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-1.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800">
                {financialData.grossMargin}% Margin
              </span>
              <span className="text-xs text-slate-400">
                {isKh ? 'លើការលក់' : 'on sales'}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>{isKh ? 'មធ្យម/វិក្កយបត្រ' : 'Avg order value'}:</span>
            <span className="font-bold text-slate-700">{formatUSD(financialData.avgOrderValue)}</span>
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isKh ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Net Operating Profit'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black font-mono tracking-tight ${
              financialData.netProfit >= 0 ? 'text-purple-700' : 'text-rose-600'
            }`}>
              {formatUSD(financialData.netProfit)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKh ? 'កាត់ចំណាយប្រតិបត្តិការរួច' : 'After operating expenses'} ({formatUSD(financialData.operatingExpenses)})
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>{isKh ? 'អត្រាចំណេញសុទ្ធ' : 'Net margin'}:</span>
            <span className="font-black text-purple-700">{financialData.netMargin}%</span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs for Deep Analysis */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isKh ? 'ទិដ្ឋភាពទូទៅ & ឆានែលទូទាត់' : 'Overview & Payment Channels'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_in_out')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sales_in_out'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{isKh ? 'តារាងគណនាលក់ចេញ-លក់ចូលតាមមុខទំនិញ' : 'Itemized Sales In/Out Matrix'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-700 font-black">
            {products.length}
          </span>
        </button>

        {/* Per-Member Inventory & Sales Breakdown Tab */}
        <button
          onClick={() => setActiveTab('member_breakdown')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'member_breakdown'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>{isKh ? 'ស្ថិតិតាមគណនីសមាជិក (Per-Member Breakdown)' : 'Per-Member Inventory & Sales Breakdown'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-800 font-black">
            {memberBreakdown.totalMembersCount} {isKh ? 'គណនី' : 'Users'}
          </span>
        </button>
      </div>

      {/* 4. Tab 1: Overview & Channels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {isKh ? 'ការទូទាត់តាមមធ្យោបាយ (Payment Channels)' : 'Revenue by Payment Method'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isKh ? 'ការបែងចែកចំណូលតាម សាច់ប្រាក់, KHQR/ABA, និង កាតធនាគារ' : 'Distribution across Cash, KHQR, and Card transactions'}
                </p>
              </div>
              <PieChart className="w-5 h-5 text-indigo-600" />
            </div>

            {financialData.totalPaymentSum === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isKh ? 'មិនទាន់មានការទូទាត់ក្នុងកាលបរិច្ឆេទនេះនៅឡើយទេ' : 'No payments recorded in this time range.'}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* KHQR / ABA */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      {isKh ? 'KHQR / ធនាគារចល័ត (ABA & ACLEDA)' : 'KHQR / Mobile Banking (ABA & Bank)'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {formatUSD(financialData.khqrTotal)} ({((financialData.khqrTotal / financialData.totalPaymentSum) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(financialData.khqrTotal / financialData.totalPaymentSum) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Cash */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      {isKh ? 'សាច់ប្រាក់សុទ្ធ ($ & ៛)' : 'Cash Payments ($ & ៛)'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {formatUSD(financialData.cashTotal)} ({((financialData.cashTotal / financialData.totalPaymentSum) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(financialData.cashTotal / financialData.totalPaymentSum) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Credit Card */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      {isKh ? 'កាតធនាគារ (Visa / MasterCard)' : 'Bank Cards (Visa / MasterCard)'}
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {formatUSD(financialData.cardTotal)} ({((financialData.cardTotal / financialData.totalPaymentSum) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(financialData.cardTotal / financialData.totalPaymentSum) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Selling Items by Revenue */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {isKh ? 'មុខទំនិញលក់ដាច់បំផុត (Top Selling Items)' : 'Top Performing Products'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isKh ? 'ទំនិញដែលបង្កើតចំណូលខ្ពស់ជាងគេក្នុងកាលបរិច្ឆេទនេះ' : 'Ranked by gross sales volume'}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            {financialData.topSelling.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isKh ? 'មិនទាន់មានទិន្នន័យលក់ទំនិញទេ' : 'No sales records found.'}
              </div>
            ) : (
              <div className="space-y-3">
                {financialData.topSelling.map((top, idx) => (
                  <div key={top.product.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-indigo-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                        #{idx + 1}
                      </span>
                      <img 
                        src={top.product.image} 
                        alt={top.product.name} 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                          {isKh && top.product.nameKh ? top.product.nameKh : top.product.name}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {top.unitsSold} {isKh ? 'គ្រឿងបានលក់' : 'units sold'} • {isKh ? 'ចំណេញ' : 'Profit'}: {formatUSD(top.profit)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-slate-900">
                        {formatUSD(top.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Itemized Sales In/Out Matrix */}
      {activeTab === 'sales_in_out' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះ ឬបាកូដ...' : 'Search by name or barcode...'}
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? (isKh ? 'គ្រប់ប្រភេទទំនិញ' : 'All Categories') : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-bold">
              {isKh ? 'បង្ហាញមុខទំនិញ' : 'Showing'} {filteredMatrix.length} {isKh ? 'មុខ' : 'items'}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">{isKh ? 'មុខទំនិញ / Barcode' : 'Product & Barcode'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'ស្តុកបច្ចុប្បន្ន' : 'Stock'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'ចំនួនលក់ចេញ' : 'Sold Qty'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'ថ្លៃដើម (In)' : 'Unit Cost'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'តម្លៃលក់ (Out)' : 'Unit Price'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'Margin/ឯកតា' : 'Margin / Unit'}</th>
                  <th className="py-3 px-3">{isKh ? 'ចំណូលលក់ (Revenue)' : 'Total Revenue'}</th>
                  <th className="py-3 px-3">{isKh ? 'ថ្លៃដើមសរុប (COGS)' : 'Total Cost'}</th>
                  <th className="py-3 px-3.5 text-right">{isKh ? 'ប្រាក់ចំណេញសុទ្ធ' : 'Gross Profit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                      {isKh ? 'រកមិនឃើញមុខទំនិញដែលត្រូវនឹងការស្វែងរកទេ' : 'No matching products found.'}
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row) => (
                    <tr key={row.product.id} className="hover:bg-slate-50 transition-colors">
                      {/* Product details */}
                      <td className="py-2.5 px-3.5 font-sans">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={row.product.image} 
                            alt={row.product.name} 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs line-clamp-1">
                              {isKh && row.product.nameKh ? row.product.nameKh : row.product.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {row.product.barcode} • {row.product.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-2.5 font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                          row.currentStock <= 5 
                            ? 'bg-rose-100 text-rose-800 font-black' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.currentStock}
                        </span>
                      </td>

                      {/* Sold Qty */}
                      <td className="py-2.5 px-2.5 font-bold text-indigo-600">
                        {row.unitsSold > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            {row.unitsSold}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Unit Cost In */}
                      <td className="py-2.5 px-2.5 text-amber-700 font-bold">
                        {formatUSD(row.unitCost)}
                      </td>

                      {/* Unit Price Out */}
                      <td className="py-2.5 px-2.5 text-slate-900 font-bold">
                        {formatUSD(row.unitPrice)}
                      </td>

                      {/* Margin Per Unit */}
                      <td className="py-2.5 px-2.5">
                        <span className="text-emerald-700 font-bold">
                          +{formatUSD(row.unitMargin)} ({row.unitMarginPercent}%)
                        </span>
                      </td>

                      {/* Total Revenue Out */}
                      <td className="py-2.5 px-3 font-bold text-indigo-700">
                        {formatUSD(row.totalRevenueOut)}
                      </td>

                      {/* Total Cost In */}
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatUSD(row.totalCostIn)}
                      </td>

                      {/* Total Net Profit */}
                      <td className="py-2.5 px-3.5 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          row.profit > 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : row.profit < 0 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'text-slate-400'
                        }`}>
                          {row.profit > 0 ? `+${formatUSD(row.profit)}` : formatUSD(row.profit)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Per-Member Inventory & Sales Breakdown */}
      {activeTab === 'member_breakdown' && (
        <div className="space-y-6">
          {/* Member Overview Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  {isKh ? 'គណនីសមាជិកសរុប' : 'Total Registered Members'}
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {memberBreakdown.totalMembersCount} {isKh ? 'នាក់' : 'Users'}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  {isKh ? 'មុខទំនិញក្នុងស្តុកសមាជិក' : 'Member Inventory Items'}
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {memberBreakdown.totalMemberProducts} {isKh ? 'មុខ' : 'Products'}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  {isKh ? 'ការលក់សរុបតាមសមាជិក' : 'Total Member Sales'}
                </span>
                <h4 className="text-xl font-black text-emerald-700 mt-1 font-mono">
                  {formatUSD(memberBreakdown.totalMemberGrossSales)}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  {isKh ? 'ប្រាក់ចំណេញសមាជិកសរុប' : 'Total Member Profit'}
                </span>
                <h4 className="text-xl font-black text-purple-700 mt-1 font-mono">
                  {formatUSD(memberBreakdown.totalMemberGrossProfit)}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Member Search & Role Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isKh ? 'ស្វែងរកសមាជិកតាមឈ្មោះ, @username, ទូរស័ព្ទ...' : 'Search member by name, username, phone...'}
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                {(['all', 'admin', 'manager', 'cashier'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setMemberRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      memberRoleFilter === r
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'all' && (isKh ? 'ទាំងអស់' : 'All Roles')}
                    {r === 'admin' && 'Admin'}
                    {r === 'manager' && (isKh ? 'អ្នកគ្រប់គ្រង' : 'Manager')}
                    {r === 'cashier' && (isKh ? 'បេឡាធិការ' : 'Cashier')}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-bold">
              {isKh ? 'បង្ហាញសមាជិក' : 'Showing'} {filteredMemberStats.length} {isKh ? 'នាក់' : 'members'}
            </span>
          </div>

          {/* Member List Cards & Expandable Inventories */}
          <div className="space-y-4">
            {filteredMemberStats.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
                {isKh ? 'រកមិនឃើញសមាជិកដែលត្រូវនឹងការស្វែងរកទេ' : 'No matching member accounts found.'}
              </div>
            ) : (
              filteredMemberStats.map((item) => {
                const isExpanded = expandedMemberId === item.user.id;
                return (
                  <div 
                    key={item.user.id} 
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all hover:border-indigo-200"
                  >
                    {/* Member Top Bar */}
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
                      {/* Left: Avatar & Identity */}
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={item.user.fullName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {item.user.fullName}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : item.user.role === 'manager'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.user.role}
                            </span>
                            {item.user.plan && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                <Crown className="w-3 h-3" />
                                {item.user.plan}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            @{item.user.username} • {item.user.phone || item.user.email || 'No phone'}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Key Performance Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-slate-100 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                            {isKh ? 'មុខទំនិញក្នុងស្តុក' : 'Inventory Items'}
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            {item.totalInventoryItems} ({item.totalInventoryStock} {isKh ? 'ឯកតា' : 'units'})
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                            {isKh ? 'វិក្កយបត្រលក់' : 'Invoices Handled'}
                          </span>
                          <span className="font-black text-indigo-700 text-sm">
                            {item.totalInvoices} ({item.unitsSold} {isKh ? 'លក់' : 'sold'})
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                            {isKh ? 'ចំណូលលក់ចេញ' : 'Gross Sales'}
                          </span>
                          <span className="font-black text-emerald-700 text-sm">
                            {formatUSD(item.grossSales)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                            {isKh ? 'ចំណេញដុល' : 'Gross Profit'}
                          </span>
                          <span className="font-black text-purple-700 text-sm">
                            {formatUSD(item.grossProfit)} ({item.profitMarginPercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Right: Expand Toggle */}
                      <button
                        onClick={() => setExpandedMemberId(isExpanded ? null : item.user.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer self-start lg:self-center ${
                          isExpanded
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded 
                            ? (isKh ? 'បិទតារាងទំនិញ' : 'Hide Products') 
                            : (isKh ? `ពិនិត្យទំនិញ (${item.detailedProducts.length})` : `Inspect Products (${item.detailedProducts.length})`)}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expandable Member Product Inventory Table */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 bg-white space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-indigo-600" />
                            <span>{isKh ? `បញ្ជីមុខទំនិញ និងទិន្នន័យលក់របស់ ${item.user.fullName}` : `Inventory & Sales for ${item.user.fullName}`}</span>
                          </h5>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {isKh ? 'តម្លៃទំនិញក្នុងស្តុកសរុប' : 'Total Inventory Valuation'}: <strong className="text-slate-900">{formatUSD(item.totalInventoryValuation)}</strong>
                          </span>
                        </div>

                        {item.detailedProducts.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                            {isKh ? 'សមាជិកនេះមិនទាន់មានទំនិញផ្ទាល់ខ្លួនក្នុងស្តុកនៅឡើយទេ' : 'No inventory products associated with this member.'}
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="w-full text-left text-xs font-mono">
                              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="py-2.5 px-3 font-sans">{isKh ? 'មុខទំនិញ' : 'Product'}</th>
                                  <th className="py-2.5 px-2.5">{isKh ? 'ស្តុកបច្ចុប្បន្ន' : 'Stock'}</th>
                                  <th className="py-2.5 px-2.5">{isKh ? 'ថ្លៃដើម (In)' : 'Unit Cost'}</th>
                                  <th className="py-2.5 px-2.5">{isKh ? 'តម្លៃលក់ (Out)' : 'Unit Price'}</th>
                                  <th className="py-2.5 px-2.5">{isKh ? 'ចំនួនលក់ចេញ' : 'Sold Qty'}</th>
                                  <th className="py-2.5 px-3">{isKh ? 'ចំណូលលក់' : 'Revenue'}</th>
                                  <th className="py-2.5 px-3 text-right">{isKh ? 'ប្រាក់ចំណេញ' : 'Profit'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {item.detailedProducts.map((pRow) => (
                                  <tr key={pRow.product.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2 px-3 font-sans">
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={pRow.product.image}
                                          alt={pRow.product.name}
                                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                                        />
                                        <div>
                                          <div className="font-bold text-slate-900 text-xs line-clamp-1">
                                            {isKh && pRow.product.nameKh ? pRow.product.nameKh : pRow.product.name}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {pRow.product.barcode}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2.5 font-bold text-slate-700">
                                      {pRow.stock}
                                    </td>
                                    <td className="py-2 px-2.5 text-amber-700 font-bold">
                                      {formatUSD(pRow.unitCost)}
                                    </td>
                                    <td className="py-2 px-2.5 text-slate-900 font-bold">
                                      {formatUSD(pRow.unitPrice)}
                                    </td>
                                    <td className="py-2 px-2.5 font-bold text-indigo-600">
                                      {pRow.soldQty > 0 ? (
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                          {pRow.soldQty}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">0</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-indigo-700">
                                      {formatUSD(pRow.revenue)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold">
                                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                                        pRow.itemProfit > 0
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'text-slate-400'
                                      }`}>
                                        {pRow.itemProfit > 0 ? `+${formatUSD(pRow.itemProfit)}` : formatUSD(pRow.itemProfit)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
