import React, { useState, useEffect } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  CheckCircle, 
  Printer, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Copy,
  Check,
  Building2,
  UserCheck,
  Tv
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, PaymentMethod, Order, ShopSettings, User } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';
import { sounds } from '../utils/audio';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  taxRate: number;
  total: number;
  selectedTable: string;
  customerName: string;
  orderNote: string;
  cashierName: string;
  khrRate: number;
  language: 'en' | 'kh';
  onOrderCompleted: (order: Order) => void;
  settings?: ShopSettings;
  currentUser?: User | null;
  onOpenCustomerDisplay?: () => void;
  onPaymentMethodChange?: (method: PaymentMethod, cashTendered?: number, changeUSD?: number, changeKHR?: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  discountType,
  tax,
  taxRate,
  total,
  selectedTable,
  customerName,
  orderNote,
  cashierName,
  khrRate,
  language,
  onOrderCompleted,
  settings,
  currentUser,
  onOpenCustomerDisplay,
  onPaymentMethodChange
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>(total.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);

  const isKh = language === 'kh';

  // Calculate change due
  const totalKhr = Math.round(total * khrRate);
  const numericTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericTendered - total);
  const changeDueKhr = Math.round(changeDue * khrRate);

  // Sync selected payment method with customer display screen
  useEffect(() => {
    if (isOpen && onPaymentMethodChange) {
      onPaymentMethodChange(selectedMethod, numericTendered, changeDue, changeDueKhr);
    }
  }, [isOpen, selectedMethod, numericTendered, changeDue, changeDueKhr, onPaymentMethodChange]);

  if (!isOpen) return null;

  // Determine KHQR configuration for current shop / user
  const khqrImg = settings?.khqrImage || currentUser?.khqrImage || '';
  const merchantName = settings?.khqrMerchantName || settings?.shopNameKh || settings?.shopName || 'MINI MART POS';
  const accountHolder = settings?.khqrAccountName || currentUser?.fullName || 'STORE MERCHANT';
  const bankAccountNo = settings?.khqrAccountNumber || currentUser?.khqrAccountNumber || '';
  const bankName = settings?.khqrBankName || 'ABA Bank (KHQR)';

  const dynamicFallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=KHQR-${total.toFixed(2)}-${encodeURIComponent(merchantName)}`;
  const displayQrSrc = khqrImg || dynamicFallbackQr;

  const handleCopyAccount = async () => {
    if (!bankAccountNo) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(bankAccountNo);
      }
      setAccountCopied(true);
      setTimeout(() => setAccountCopied(false), 2000);
    } catch {
      setAccountCopied(true);
      setTimeout(() => setAccountCopied(false), 2000);
    }
  };

  const quickCashOptions = [
    total,
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    50,
    100
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  const handleCompletePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      sounds.playCashRegister();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe catch
      }

      const completedOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        items: [...cartItems],
        subtotal,
        discount,
        discountType,
        tax,
        taxRate,
        total,
        totalKhr,
        paymentMethod: selectedMethod,
        amountPaid: selectedMethod === 'cash' ? numericTendered : total,
        changeDue: selectedMethod === 'cash' ? changeDue : 0,
        tableNumber: selectedTable,
        customerName: customerName || (isKh ? 'អតិថិជនទូទៅ' : 'Walk-in Guest'),
        cashierName,
        status: 'completed',
        createdAt: new Date().toISOString(),
        note: orderNote,
        userId: currentUser?.id
      };

      setIsProcessing(false);
      onOrderCompleted(completedOrder);
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[94vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/20">
                {selectedTable}
              </span>
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                {isKh ? 'ការទូទាត់ប្រាក់ (Checkout)' : 'Complete Payment'}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} items • Cashier: {cashierName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onOpenCustomerDisplay && (
              <button
                type="button"
                onClick={onOpenCustomerDisplay}
                title={isKh ? "បើកផ្ទាំងអេក្រង់អតិថិជន (Customer Display)" : "Open Customer Display Screen"}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{isKh ? 'អេក្រង់អតិថិជន' : 'Customer Screen'}</span>
              </button>
            )}

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {formatUSD(total)}
              </div>
              <div className="text-[11px] sm:text-xs text-indigo-300 font-mono">
                {formatKHR(total, khrRate)}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto overscroll-contain">
          {/* Payment Method Selector Pills */}
          <div>
            <label className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              {isKh ? 'វិធីសាស្ត្រទូទាត់ (Payment Method)' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Cash Option */}
              <button
                id="payment-method-cash"
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                <span className="text-[11px] sm:text-xs font-semibold text-center">
                  {isKh ? 'សាច់ប្រាក់ (Cash)' : 'Cash'}
                </span>
              </button>

              {/* KHQR / ABA Option */}
              <button
                id="payment-method-khqr"
                type="button"
                onClick={() => setSelectedMethod('khqr')}
                className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  selectedMethod === 'khqr'
                    ? 'border-rose-600 bg-rose-50/80 text-rose-700 font-bold shadow-xs ring-1 ring-rose-500/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
                <span className="text-[11px] sm:text-xs font-semibold text-center">
                  {isKh ? 'ស្កេន KHQR / ABA' : 'KHQR / Mobile'}
                </span>
              </button>

              {/* Credit Card Option */}
              <button
                id="payment-method-card"
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                <span className="text-[11px] sm:text-xs font-semibold text-center">
                  {isKh ? 'កាតធនាគារ (Card)' : 'Card / POS'}
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Method Details */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {isKh ? 'ចំនួនទឹកប្រាក់ទទួល (Cash Tendered)' : 'Amount Received ($ USD)'}
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total Due: {formatUSD(total)}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={total}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full text-lg sm:text-xl font-bold font-mono px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashTendered(amount.toFixed(2))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer border border-slate-200/60"
                  >
                    ${amount.toFixed(2)}
                  </button>
                ))}
              </div>

              {/* Change Calculation Box */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {isKh ? 'ប្រាក់អាប់ជូន (Change Due)' : 'Change Due'}
                  </span>
                  <div className="text-xs text-emerald-600 font-mono">
                    {changeDueKhr > 0 && formatKHR(changeDue, khrRate)}
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  {formatUSD(changeDue)}
                </div>
              </div>
            </div>
          )}

          {/* KHQR Section with Uploaded Image & Custom User/Store Config */}
          {selectedMethod === 'khqr' && (
            <div className="p-3.5 sm:p-5 bg-gradient-to-br from-rose-50/60 via-slate-50 to-white rounded-2xl border border-rose-100/90 space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                {/* QR Code Container with Zoom Action */}
                <div className="relative group p-2.5 bg-white rounded-2xl border border-rose-200 shadow-sm shrink-0 flex flex-col items-center" data-preserve-white="true">
                  <img
                    src={displayQrSrc}
                    alt="KHQR Code"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-xl cursor-pointer"
                    onClick={() => setIsQrZoomed(true)}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setIsQrZoomed(true)}
                    className="absolute bottom-4 right-4 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    title={isKh ? 'ពង្រីក QR Code' : 'Enlarge QR'}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase tracking-wider">
                    <span>{bankName}</span>
                  </div>
                </div>

                {/* KHQR Account Details */}
                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    <span>Bakong KHQR Payment</span>
                  </div>

                  <div>
                    <h5 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      {merchantName}
                    </h5>
                    <p className="text-xs text-slate-600 font-semibold truncate">
                      {accountHolder}
                    </p>
                  </div>

                  {/* Bank Account Number & Quick Copy */}
                  {bankAccountNo && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                      <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 select-all">
                        {bankAccountNo}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          accountCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        title={isKh ? 'ចម្លងលេខគណនី' : 'Copy account'}
                      >
                        {accountCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Amount to pay */}
                  <div className="pt-1">
                    <div className="text-lg sm:text-xl font-black text-rose-600 font-mono">
                      {formatUSD(total)}
                    </div>
                    <div className="text-xs text-slate-500 font-mono font-semibold">
                      {formatKHR(total, khrRate)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span>{isKh ? 'ស្កេនជាមួយ App ធនាគារណាក៏បាន (ABA, ACLEDA, Bakong...)' : 'Accepts scan from all Cambodia bank apps'}</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  ● Real-time
                </span>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">{isKh ? 'ស្ថានីយទូទាត់ POS កាត' : 'Terminal Status'}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  ● Ready for Tap / Insert
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Visa / Mastercard / UnionPay</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3.5 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {isKh ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            id="confirm-payment-btn"
            type="button"
            disabled={isProcessing || (selectedMethod === 'cash' && numericTendered < total)}
            onClick={handleCompletePayment}
            className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95"
          >
            {isProcessing ? (
              <span className="inline-block animate-spin">⟳</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isKh ? 'បញ្ជាក់ការបង់ប្រាក់ & បោះពុម្ពវិក្កយបត្រ' : 'Confirm Payment & Print Receipt'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Code Fullscreen Zoom Modal */}
      {isQrZoomed && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsQrZoomed(false)}
        >
          <div 
            className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-rose-600 uppercase tracking-wide">
                Bakong KHQR
              </span>
              <button
                type="button"
                onClick={() => setIsQrZoomed(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={displayQrSrc}
              alt="Enlarged KHQR"
              data-preserve-white="true"
              className="w-64 h-64 mx-auto object-contain rounded-2xl border border-slate-200 bg-white p-2"
            />

            <div>
              <div className="font-extrabold text-slate-900 text-base">{merchantName}</div>
              <div className="text-xs text-slate-500 font-mono">{accountHolder}</div>
              <div className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatUSD(total)} ({formatKHR(total, khrRate)})
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQrZoomed(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {isKh ? 'បិទផ្ទាំងពង្រីក' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

