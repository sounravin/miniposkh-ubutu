import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Printer, 
  CheckCircle, 
  Clock, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  Filter, 
  Check, 
  Trash2,
  Calendar,
  Smartphone
} from 'lucide-react';
import { Order } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';

interface OrdersManagerProps {
  orders: Order[];
  users?: any[];
  onViewReceipt: (order: Order) => void;
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void;
  onDeleteOrder?: (orderId: string) => void;
  onLoadOrderToPOS?: (order: Order) => void;
  language: 'en' | 'kh';
  khrRate: number;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  users = [],
  onViewReceipt,
  onUpdateOrderStatus,
  onDeleteOrder,
  onLoadOrderToPOS,
  language,
  khrRate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft' | 'pending_online' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const isKh = language === 'kh';

  // Helper date checker
  const isWithinDate = (dateStr: string, range: 'all' | 'today' | 'week' | 'month') => {
    if (range === 'all') return true;
    try {
      const itemTime = new Date(dateStr).getTime();
      const now = new Date();
      if (range === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return itemTime >= startOfDay;
      }
      if (range === 'week') {
        return itemTime >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
      }
      if (range === 'month') {
        return itemTime >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    } catch {
      return true;
    }
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchDate = isWithinDate(o.createdAt, dateFilter);
      const matchUser = selectedUserFilter === 'all' || 
        (selectedUserFilter === 'user-admin' ? (!o.userId || o.userId === 'user-admin') : o.userId === selectedUserFilter);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
        (o.cashierName && o.cashierName.toLowerCase().includes(q)) ||
        (o.paymentMethod && o.paymentMethod.toLowerCase().includes(q));
      return matchStatus && matchDate && matchUser && matchSearch;
    });
  }, [orders, statusFilter, dateFilter, selectedUserFilter, searchQuery]);

  // Summary Metrics
  const completedList = filtered.filter(o => o.status === 'completed');
  const draftList = filtered.filter(o => o.status === 'draft');
  const totalCompletedAmount = completedList.reduce((s, o) => s + o.total, 0);
  const totalDraftAmount = draftList.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = completedList.length > 0 ? totalCompletedAmount / completedList.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'ប្រវត្តិនៃការបញ្ជាទិញ (Orders History)' : 'Orders & Transactions History'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {orders.length} {isKh ? 'ប្រតិបត្តិការកត់ត្រាក្នុងប្រព័ន្ធ' : 'total recorded sales orders'}
          </p>
        </div>

        {/* Date Filter & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {(['all', 'today', 'week', 'month'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  dateFilter === d ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {d === 'all' ? (isKh ? 'ទាំងអស់' : 'All') :
                 d === 'today' ? (isKh ? 'ថ្ងៃនេះ' : 'Today') :
                 d === 'week' ? (isKh ? '៧ថ្ងៃ' : '7 Days') :
                 (isKh ? '៣០ថ្ងៃ' : '30 Days')}
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold overflow-x-auto max-w-full">
            {(['all', 'completed', 'pending_online', 'draft'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === s ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s === 'all' ? (isKh ? 'ទាំងអស់' : 'All') :
                 s === 'completed' ? (isKh ? 'បានទូទាត់' : 'Paid') :
                 s === 'pending_online' ? (isKh ? '📱 កុម្ម៉ង់អនឡាញ' : '📱 Online Orders') :
                 (isKh ? 'សេចក្តីព្រាង (Draft)' : 'Draft / Due')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Mini Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            {isKh ? 'ការកុម្ម៉ង់ក្នុងតម្រង' : 'Filtered Orders'}
          </span>
          <h4 className="text-xl font-bold font-mono text-slate-800">
            {filtered.length}
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {completedList.length} {isKh ? 'បានទូទាត់ជោគជ័យ' : 'completed paid'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 block mb-1">
            {isKh ? 'ចំណូលលក់បានទូទាត់' : 'Paid Sales Total'}
          </span>
          <h4 className="text-xl font-bold font-mono text-emerald-600">
            {formatUSD(totalCompletedAmount)}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {formatKHR(totalCompletedAmount, khrRate)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 block mb-1">
            {isKh ? 'មិនទាន់ទូទាត់ (Due / Draft)' : 'Pending Due (Drafts)'}
          </span>
          <h4 className="text-xl font-bold font-mono text-amber-600">
            {formatUSD(totalDraftAmount)}
          </h4>
          <span className="text-[10px] text-amber-700 mt-1 block">
            {draftList.length} {isKh ? 'វិក្កយបត្ររង់ចាំទូទាត់' : 'awaiting payment'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-600 block mb-1">
            {isKh ? 'មធ្យមភាគក្នុងមួយវិក្កយបត្រ' : 'Average Order Value'}
          </span>
          <h4 className="text-xl font-bold font-mono text-indigo-600">
            {formatUSD(avgOrderValue)}
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isKh ? 'ក្នុងមួយការកុម្ម៉ង់' : 'per completed transaction'}
          </span>
        </div>
      </div>

      {/* Search Input & User Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKh ? "ស្វែងរកលេខវិក្កយបត្រ, ឈ្មោះអតិថិជន, លេខតុ, បេឡាករ, ឬវិធីទូទាត់..." : "Search order #, customer name, table, cashier, payment..."}
            className="w-full bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {users && users.length > 0 && (
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="w-full sm:w-52 bg-white text-xs font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-indigo-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{isKh ? '👥 គណនីទាំងអស់ (All Users)' : '👥 All User Accounts'}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                👤 {u.fullName || u.username} (@{u.username})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order No</th>
                <th className="py-3 px-3">{isKh ? 'គណនីអ្នកលក់ (User)' : 'User / Cashier'}</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Customer / Table</th>
                <th className="py-3 px-3">Items Summary</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {isKh ? 'មិនមានទិន្នន័យការកុម្ម៉ង់ដែលត្រូវគ្នានោះទេ' : 'No matching orders found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                  const orderOwner = users.find(u => u.id === order.userId) || (order.userId === 'user-admin' || !order.userId ? { fullName: 'Admin', username: 'admin', role: 'admin' } : null);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          orderOwner?.role === 'admin' || order.userId === 'user-admin' || !order.userId
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          👤 {orderOwner ? `${orderOwner.fullName} (@${orderOwner.username})` : (order.cashierName || 'Admin')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{order.customerName || (isKh ? 'ភ្ញៀវទូទៅ' : 'Walk-in')}</div>
                        <span className="text-[11px] text-indigo-600 font-medium">{order.tableNumber || (isKh ? 'ខ្ចប់ទៅក្រៅ' : 'Takeaway')}</span>
                      </td>
                      <td className="py-3 px-3 max-w-[180px]">
                        <span className="text-slate-700 font-semibold">{itemCount} items</span>
                        <div className="text-[11px] text-slate-400 truncate">
                          {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentMethod === 'khqr' || order.paymentMethod === 'aba_pay' 
                            ? 'bg-rose-50 text-rose-700'
                            : order.paymentMethod === 'card'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {formatUSD(order.total)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatKHR(order.total, khrRate)}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          order.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : order.status === 'pending_online'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse'
                            : order.status === 'draft'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status === 'completed' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          {order.status === 'pending_online' && <Smartphone className="w-3 h-3 text-indigo-600" />}
                          {order.status === 'draft' && <Clock className="w-3 h-3" />}
                          {order.status === 'completed' ? (isKh ? 'បានទូទាត់' : 'Paid') :
                           order.status === 'pending_online' ? (isKh ? '📱 កុម្ម៉ង់អនឡាញ' : '📱 Online Order') :
                           order.status === 'draft' ? (isKh ? 'សេចក្តីព្រាង' : 'Draft') :
                           order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Push Online Order to POS Current Order */}
                          {order.status === 'pending_online' && onLoadOrderToPOS && (
                            <button
                              onClick={() => onLoadOrderToPOS(order)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                              title={isKh ? 'បញ្ចូលក្នុង Current Order ដើម្បីគិតលុយ' : 'Load into POS Current Order & Checkout'}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{isKh ? '📥 គិតលុយ (POS)' : '📥 Checkout'}</span>
                            </button>
                          )}

                          {/* Mark as paid button for drafts */}
                          {order.status === 'draft' && onUpdateOrderStatus && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title={isKh ? 'ទូទាត់រួចរាល់' : 'Mark as Paid'}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isKh ? 'ទូទាត់' : 'Pay'}</span>
                            </button>
                          )}

                          {/* Print / View Receipt */}
                          <button
                            onClick={() => onViewReceipt(order)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title={isKh ? 'មើលវិក្កយបត្រ' : 'Print / View Receipt'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete order */}
                          {onDeleteOrder && (
                            <button
                              onClick={() => setOrderToDelete(order)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={isKh ? 'លុបការកុម្ម៉ង់' : 'Delete order'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0 border border-rose-100">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {isKh ? 'បញ្ជាក់ការលុបការកុម្ម៉ង់' : 'Confirm Delete Order'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isKh ? 'តើអ្នកប្រាកដជាចង់លុបវិក្កយបត្រនេះចេញពីប្រព័ន្ធមែនទេ?' : 'Are you sure you want to permanently delete this order?'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-slate-800">#{orderToDelete.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Total Amount:</span>
                <span className="font-mono font-black text-rose-600">${orderToDelete.total.toFixed(2)} ({formatKHR(orderToDelete.total, khrRate)})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="text-slate-700 font-semibold">{orderToDelete.customerName || 'General Guest'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {isKh ? 'បោះបង់ (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder) onDeleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isKh ? 'លុបការកុម្ម៉ង់ (Delete)' : 'Delete Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

