import React, { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  MoreVertical, 
  ArrowRight, 
  Bookmark, 
  Receipt, 
  Percent, 
  MessageSquare,
  User,
  ShoppingBag,
  RotateCcw,
  Barcode,
  Tv,
  ExternalLink
} from 'lucide-react';
import { CartItem, TableInfo } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';
import { sounds } from '../utils/audio';

interface CartDrawerProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  tables: TableInfo[];
  discount: number;
  discountType: 'fixed' | 'percent';
  setDiscount: (val: number) => void;
  setDiscountType: (type: 'fixed' | 'percent') => void;
  taxRate: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  orderNote: string;
  setOrderNote: (note: string) => void;
  onOpenPayment: () => void;
  onOpenCustomerDisplay?: () => void;
  onSaveDraft: () => void;
  language: 'en' | 'kh';
  khrRate: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenMobile?: () => void;
  openBarcodeScanner?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedTable,
  setSelectedTable,
  tables,
  discount,
  discountType,
  setDiscount,
  setDiscountType,
  taxRate,
  customerName,
  setCustomerName,
  orderNote,
  setOrderNote,
  onOpenPayment,
  onOpenCustomerDisplay,
  onSaveDraft,
  language,
  khrRate,
  isMobileOpen = false,
  onCloseMobile,
  onOpenMobile,
  openBarcodeScanner
}) => {
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNoteField, setShowNoteField] = useState(false);
  const [showCustomerField, setShowCustomerField] = useState(false);
  const [customDiscountInput, setCustomDiscountInput] = useState(discount.toString());

  const isKh = language === 'kh';

  // Subtotal
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 
    0
  );

  // Computed Discount
  const computedDiscount = discountType === 'percent' 
    ? (subtotal * discount) / 100 
    : discount;

  const discountedSubtotal = Math.max(0, subtotal - computedDiscount);

  // Tax
  const tax = discountedSubtotal * taxRate;

  // Final Total
  const total = discountedSubtotal + tax;

  const handleApplyDiscount = () => {
    const val = parseFloat(customDiscountInput) || 0;
    setDiscount(val);
    setShowDiscountModal(false);
  };

  const totalItemsCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      {/* 1. DESKTOP STICKY SIDE PANEL (Visible ONLY on xl screens) */}
      <aside className="hidden xl:flex w-96 bg-white border border-slate-100 flex-col justify-between sticky top-20 select-none shrink-0 shadow-2xs rounded-2xl overflow-hidden min-h-[580px]">
        {/* Header: Current Order & Table Badge */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 tracking-tight">
              {isKh ? 'ការកុម្ម៉ង់បច្ចុប្បន្ន' : 'Current Order'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {totalItemsCount} {isKh ? 'មុខទំនិញ' : 'items selected'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Barcode Scanner Button in Cart Header */}
            {openBarcodeScanner && (
              <button
                onClick={openBarcodeScanner}
                title={isKh ? "ស្កេនបាកូដបញ្ចូលកន្ត្រក" : "Scan Barcode"}
                className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
              >
                <Barcode className="w-4 h-4" />
              </button>
            )}

            {/* Table Selector pill badge */}
            <div className="relative">
              <select
                id="cart-table-selector"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="appearance-none bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-100 pr-6 cursor-pointer focus:outline-none"
              >
                <option value="Takeaway">{isKh ? 'ខ្ចប់ (Takeaway)' : 'Takeaway'}</option>
                <option value="Delivery">{isKh ? 'ដឹកជញ្ជូន (Delivery)' : 'Delivery'}</option>
                {tables.map(tbl => (
                  <option key={tbl.id} value={tbl.name}>{tbl.name}</option>
                ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 pointer-events-none">▼</span>
            </div>

            {/* More actions menu */}
            <div className="relative">
              <button
                id="cart-more-options-btn"
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      onClearCart();
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isKh ? 'លុបការកុម្ម៉ង់ចោល' : 'Clear All Items'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomerField(!showCustomerField);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isKh ? 'ដាក់ឈ្មោះអតិថិជន' : 'Assign Customer'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional Customer info input */}
        {showCustomerField && (
          <div className="px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={isKh ? "ឈ្មោះអតិថិជន ឬលេខទូរស័ព្ទ..." : "Customer name or phone..."}
              className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
            />
          </div>
        )}

        {/* Order Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] xl:max-h-[calc(100vh-420px)]">
          {cartItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-300">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs text-slate-400 font-medium">
                {isKh ? 'មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ' : 'No items in current order'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isKh ? 'ចុចលើទំនិញ ឬស្កេនបាកូដដើម្បីបន្ថែម' : 'Click any product or scan barcode to add'}
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                />

                <div className="flex-1 min-w-0">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-snug">
                    {isKh ? (item.product.nameKh || item.product.name) : item.product.name}
                  </h5>
                  <p className="text-xs font-semibold text-slate-500 font-mono">
                    ${item.product.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100/90 rounded-xl p-0.5 border border-slate-200/60">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onUpdateQuantity(item.product.id, -1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center text-xs shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onUpdateQuantity(item.product.id, 1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center text-xs shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  title="Remove item"
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Note & Discount Toggles */}
        <div className="px-4 py-2 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setShowNoteField(!showNoteField)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isKh ? '+ បន្ថែមកំណត់សម្គាល់ (Note)' : '+ Add Note'}</span>
            </button>

            <button
              onClick={() => {
                setCustomDiscountInput(discount.toString());
                setShowDiscountModal(true);
              }}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>
                {discount > 0 
                  ? `${discountType === 'percent' ? `${discount}%` : `$${discount}`} Off`
                  : (isKh ? '+ បញ្ចុះតម្លៃ' : '+ Add Discount')}
              </span>
            </button>
          </div>

          {showNoteField && (
            <input
              type="text"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder={isKh ? "ចំណាំ៖ មិនសូវហឹរ, ស្ករតិច..." : "Note: e.g. Less spicy, no onions..."}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
            />
          )}
        </div>

        {/* Financial Calculations Breakdown */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>{isKh ? 'សរុបរង (Subtotal)' : 'Subtotal'}</span>
            <span className="font-semibold text-slate-700 font-mono">${subtotal.toFixed(2)}</span>
          </div>

          {computedDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>{isKh ? 'បញ្ចុះតម្លៃ (Discount)' : 'Discount'}</span>
              <span className="font-mono">-${computedDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span>{isKh ? `ពន្ធអាករ (${taxRate * 100}%)` : `Tax (${taxRate * 100}%)`}</span>
            <span className="font-semibold text-slate-700 font-mono">${tax.toFixed(2)}</span>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-sm font-bold text-slate-900">{isKh ? 'សរុប (Total)' : 'Total'}</span>
              <div className="text-[11px] text-slate-400 font-mono">
                {formatKHR(total, khrRate)}
              </div>
            </div>
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2">
            <button
              id="cart-charge-button"
              disabled={cartItems.length === 0}
              onClick={onOpenPayment}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
                cartItems.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{isKh ? `គិតលុយ $${total.toFixed(2)}` : `Charge $${total.toFixed(2)}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenCustomerDisplay && (
              <button
                id="cart-customer-display-btn"
                type="button"
                onClick={onOpenCustomerDisplay}
                title={isKh ? "បើកអេក្រង់អតិថិជនក្នុងផ្ទាំងថ្មី (New Tab / Dual Screen)" : "Open Customer Display in New Tab"}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Tv className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKh ? 'អេក្រង់អតិថិជន (New Page)' : 'Customer Screen (New Tab)'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 opacity-70" />
              </button>
            )}

            <button
              id="cart-save-draft-btn"
              disabled={cartItems.length === 0}
              onClick={onSaveDraft}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                cartItems.length > 0
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isKh ? 'រក្សាទុកសិន (Save as Draft)' : 'Save as Draft'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE FLOATING QUICK-BAR (Visible ONLY on mobile when cart has items and pop-up is closed) */}
      {!isMobileOpen && cartItems.length > 0 && (
        <div className="xl:hidden fixed bottom-safe left-3.5 right-3.5 sm:left-4 sm:right-4 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div 
            onClick={onOpenMobile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-between cursor-pointer border border-indigo-400/40 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center relative shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-indigo-100 flex items-center gap-1.5 truncate">
                  <span>{isKh ? 'កន្ត្រកទំនិញ' : 'Current Cart'}</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">{selectedTable}</span>
                </div>
                <div className="text-base font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1.5">
                  <span>${total.toFixed(2)}</span>
                  <span className="text-[10px] font-normal text-indigo-200 hidden xs:inline">{formatKHR(total, khrRate)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPayment();
                }}
                className="bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>{isKh ? 'គិតលុយ' : 'Pay'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE POP-UP BOTTOM-SHEET MODAL (Slides smoothly up when product is tapped or bar clicked) */}
      {isMobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to dismiss */}
          <div 
            className="absolute inset-0" 
            onClick={onCloseMobile} 
          />

          {/* Bottom Sheet Modal Container */}
          <div 
            className="relative bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col w-full z-10 animate-in slide-in-from-bottom-6 duration-200 border-t border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle Indicator */}
            <div className="pt-2.5 pb-1 flex justify-center cursor-pointer" onClick={onCloseMobile}>
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Mobile Sheet Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 leading-tight">
                    {isKh ? 'ការកុម្ម៉ង់បច្ចុប្បន្ន' : 'Current Order'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {totalItemsCount} {isKh ? 'មុខទំនិញ' : 'items selected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Table selector */}
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1.5 rounded-xl border border-emerald-100 focus:outline-none cursor-pointer"
                >
                  <option value="Takeaway">{isKh ? 'ខ្ចប់' : 'Takeaway'}</option>
                  <option value="Delivery">{isKh ? 'ដឹកជញ្ជូន' : 'Delivery'}</option>
                  {tables.map(tbl => (
                    <option key={tbl.id} value={tbl.name}>{tbl.name}</option>
                  ))}
                </select>

                {/* Clear Cart */}
                {cartItems.length > 0 && (
                  <button
                    onClick={() => {
                      onClearCart();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isKh ? 'សម្អាតកន្ត្រក' : 'Clear'}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Close X button */}
                <button
                  onClick={onCloseMobile}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Order Items List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[38vh]">
              {cartItems.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center text-slate-300">
                  <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">
                    {isKh ? 'មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ' : 'No items in cart'}
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-11 h-11 rounded-lg object-cover bg-white shrink-0 border border-slate-200/60"
                    />

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {isKh ? (item.product.nameKh || item.product.name) : item.product.name}
                      </h5>
                      <p className="text-xs font-semibold text-slate-500 font-mono">
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Touch-Friendly Stepper */}
                    <div className="flex items-center gap-1 bg-white rounded-xl p-0.5 border border-slate-200 shadow-2xs">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onUpdateQuantity(item.product.id, -1);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onUpdateQuantity(item.product.id, 1);
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Note & Discount Bar */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setShowNoteField(!showNoteField)}
                className="flex items-center gap-1 text-slate-600 font-medium cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{isKh ? '+ ចំណាំ (Note)' : '+ Add Note'}</span>
              </button>

              <button
                onClick={() => {
                  setCustomDiscountInput(discount.toString());
                  setShowDiscountModal(true);
                }}
                className="flex items-center gap-1 text-indigo-600 font-bold cursor-pointer"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>
                  {discount > 0 
                    ? `-${discountType === 'percent' ? `${discount}%` : `$${discount}`} Off` 
                    : (isKh ? '+ បញ្ចុះតម្លៃ' : '+ Discount')}
                </span>
              </button>
            </div>

            {showNoteField && (
              <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100">
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder={isKh ? "ចំណាំ៖ មិនសូវហឹរ, ស្ករតិច..." : "Note: e.g. Less sugar, takeaway..."}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            )}

            {/* Total Breakdown and Checkout Actions */}
            <div className="p-4 pb-safe border-t border-slate-100 bg-white space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-500 pb-1">
                <span>{isKh ? 'សរុបរង (Subtotal)' : 'Subtotal'}: <strong className="text-slate-700">${subtotal.toFixed(2)}</strong></span>
                {computedDiscount > 0 && (
                  <span className="text-emerald-600 font-medium">
                    {isKh ? 'ចុះ' : 'Disc'}: -${computedDiscount.toFixed(2)}
                  </span>
                )}
                <span>{isKh ? 'ពន្ធ' : 'Tax'}: <strong className="text-slate-700">${tax.toFixed(2)}</strong></span>
              </div>

              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-900">{isKh ? 'សរុប (Total)' : 'Total'}</span>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatKHR(total, khrRate)}
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-indigo-600 font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onSaveDraft}
                  disabled={cartItems.length === 0}
                  className="py-3 px-3.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden xs:inline">{isKh ? 'រក្សាទុក' : 'Draft'}</span>
                </button>

                <button
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onOpenPayment();
                  }}
                  disabled={cartItems.length === 0}
                  className="flex-1 py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.99] cursor-pointer disabled:opacity-40"
                >
                  <span>{isKh ? `គិតលុយ $${total.toFixed(2)}` : `Charge $${total.toFixed(2)}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Adjustment Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xs w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'កំណត់ការបញ្ចុះតម្លៃ' : 'Apply Discount'}
              </h4>
              <button 
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Discount Type Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  discountType === 'fixed' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Fixed Amount ($)
              </button>
              <button
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  discountType === 'percent' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Percentage (%)
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                {discountType === 'fixed' ? 'Discount Amount ($)' : 'Discount Rate (%)'}
              </label>
              <input
                type="number"
                min="0"
                step={discountType === 'fixed' ? '0.5' : '1'}
                value={customDiscountInput}
                onChange={(e) => setCustomDiscountInput(e.target.value)}
                className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDiscount(0);
                  setShowDiscountModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
              >
                Clear
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
