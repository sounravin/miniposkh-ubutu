import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  X, 
  Maximize, 
  Minimize, 
  ExternalLink, 
  QrCode, 
  Banknote, 
  CreditCard, 
  ShoppingBag, 
  ShieldCheck, 
  Store, 
  Sparkles, 
  Clock, 
  Building2,
  Copy,
  Check,
  CheckCircle2,
  Package,
  Layers,
  Phone,
  MapPin
} from 'lucide-react';
import { CartItem, ShopSettings, User, PaymentMethod } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';
import { Logo } from './Logo';

interface CustomerDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  taxRate: number;
  total: number;
  selectedTable?: string;
  customerName?: string;
  orderNote?: string;
  cashierName?: string;
  khrRate: number;
  language: 'en' | 'kh';
  settings?: ShopSettings;
  currentUser?: User | null;
}

export const CustomerDisplayModal: React.FC<CustomerDisplayModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  discountType,
  tax,
  taxRate,
  total,
  selectedTable = 'Counter 01',
  customerName,
  orderNote,
  cashierName,
  khrRate,
  language: initialLanguage,
  settings,
  currentUser
}) => {
  const [language, setLanguage] = useState<'en' | 'kh'>(initialLanguage || 'kh');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('khqr');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isKh = language === 'kh';

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Toggle Fullscreen on the container or window
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Open in a detached second monitor / customer facing window
  const openInNewCustomerTab = () => {
    const url = window.location.href;
    window.open(url, '_blank', 'width=1200,height=800,menubar=no,status=no,titlebar=no');
  };

  // Isolated store / merchant branding based on currentUser / settings
  const shopTitleKh = currentUser?.invoiceShopNameKh || currentUser?.fullName || settings?.shopNameKh || settings?.shopName || 'MINI MART POS';
  const shopTitleEn = currentUser?.invoiceShopName || currentUser?.fullName || settings?.shopName || 'MINI MART POS';
  const displayShopName = isKh ? shopTitleKh : shopTitleEn;

  // KHQR config
  const khqrImg = currentUser?.khqrImage || settings?.khqrImage || '';
  const merchantName = currentUser?.khqrMerchantName || settings?.khqrMerchantName || displayShopName;
  const accountHolder = currentUser?.khqrAccountName || settings?.khqrAccountName || currentUser?.fullName || 'MERCHANT';
  const bankAccountNo = currentUser?.khqrAccountNumber || settings?.khqrAccountNumber || '';
  const bankName = currentUser?.khqrBankName || settings?.khqrBankName || 'ABA Bank (KHQR)';

  const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=KHQR-${total.toFixed(2)}-${encodeURIComponent(merchantName)}`;
  const displayQrSrc = khqrImg || fallbackQr;

  const totalItemsCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleCopyAccount = () => {
    if (!bankAccountNo) return;
    try {
      navigator.clipboard?.writeText(bankAccountNo);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      id="customer-facing-checkout-screen"
    >
      {/* Container: Sized to current screen size with maximum utility */}
      <div className="w-full h-full max-w-7xl bg-slate-900 text-white rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar: Dynamic Welcome Title per store/account */}
        <header className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Store className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isKh ? 'ផ្ទាំងអតិថិជន (Customer Display)' : 'Customer Facing Screen'}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-indigo-300 font-semibold truncate hidden sm:inline">
                  {selectedTable}
                </span>
              </div>
              {/* Dynamic Welcome Message */}
              <h1 className="text-sm sm:text-lg md:text-xl font-black text-white truncate flex items-center gap-1.5">
                <span className="text-indigo-400">
                  {isKh ? 'សូមស្វាគមន៍មកកាន់' : 'Welcome to'}
                </span>
                <span className="text-amber-300 drop-shadow-xs">
                  {displayShopName}
                </span>
              </h1>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {currentTime.toLocaleTimeString(isKh ? 'km-KH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'EN' : 'ខ្មែរ'}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
              title="Close"
              id="btn-close-customer-display"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Body Grid: 2 Columns on Desktop (Items Purchased on Left, Payment & QR on Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANEL: Purchased Items List (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900/60">
            {/* Header of Purchased List */}
            <div className="px-4 sm:px-6 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  {isKh ? 'បញ្ជីទំនិញដែលបានទិញ' : 'Items in Your Order'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totalItemsCount} {isKh ? 'មុខ' : 'items'}
                </span>
              </div>

              {cashierName && (
                <div className="text-xs text-slate-400">
                  {isKh ? 'អ្នកគិតលុយ:' : 'Cashier:'} <span className="text-slate-200 font-semibold">{cashierName}</span>
                </div>
              )}
            </div>

            {/* Scrollable Item Rows */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 touch-scroll">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-300">
                      {isKh ? 'មិនទាន់មានទំនិញក្នុងកន្ត្រកនៅឡើយទេ' : 'Your cart is currently empty'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {isKh 
                        ? 'រាល់ទំនិញដែលអ្នកគិតលុយស្កេន ឬជ្រើសរើស នឹងបង្ហាញនៅត្រង់នេះភ្លាមៗ' 
                        : 'Products scanned by the cashier will appear here in real-time'}
                    </p>
                  </div>
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const lineTotal = item.product.price * item.quantity;
                  return (
                    <div 
                      key={`${item.product.id}-${idx}`}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between gap-3 transition-colors shadow-2xs"
                    >
                      {/* Product Image & Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-700 border border-slate-600/70 shrink-0">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                            {isKh && item.product.nameKh ? item.product.nameKh : item.product.name}
                          </h4>
                          {isKh && item.product.nameKh && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.product.name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="font-mono text-indigo-300 font-semibold">
                              ${item.product.price.toFixed(2)}
                            </span>
                            <span>×</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-700 text-white font-mono font-bold">
                              {item.quantity}
                            </span>
                            {item.product.barcode && (
                              <span className="text-slate-500 font-mono hidden sm:inline">
                                #{item.product.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-black text-amber-300 font-mono">
                          {formatUSD(lineTotal)}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                          {formatKHR(lineTotal, khrRate)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subtotal / Summary Bar at bottom of Left Panel */}
            <div className="p-4 bg-slate-800/90 border-t border-slate-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{isKh ? 'សរុបបឋម (Subtotal):' : 'Subtotal:'}</span>
                <span className="font-mono font-bold text-white">{formatUSD(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>{isKh ? 'បញ្ចុះតម្លៃ (Discount):' : 'Discount:'}</span>
                  <span className="font-mono font-bold">
                    -{discountType === 'percent' ? `${discount}%` : formatUSD(discount)}
                  </span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isKh ? `ពន្ធអាករ (${(taxRate * 100).toFixed(0)}% Tax):` : `Tax (${(taxRate * 100).toFixed(0)}%):`}</span>
                  <span className="font-mono">{formatUSD(tax)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wide">
                    {isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់សរុប' : 'Total Amount Due'}
                  </div>
                  <div className="text-xs text-indigo-300 font-mono">
                    {formatKHR(total, khrRate)}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono drop-shadow-xs">
                  {formatUSD(total)}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Payment Methods & Scan KHQR (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900 p-4 sm:p-6 overflow-y-auto space-y-4">
            
            {/* Section Title */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                <span>{isKh ? 'វិធីសាស្ត្រទូទាត់ប្រាក់ (Payment Method)' : 'Payment Method'}</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live Checkout
              </span>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('khqr')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'khqr'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-xs'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-5 h-5 text-rose-400" />
                <span className="text-[11px] font-bold text-center">
                  {isKh ? 'ស្កេន KHQR' : 'Scan KHQR'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-xs'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-bold text-center">
                  {isKh ? 'សាច់ប្រាក់' : 'Cash'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold shadow-xs'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span className="text-[11px] font-bold text-center">
                  {isKh ? 'កាតធនាគារ' : 'Card'}
                </span>
              </button>
            </div>

            {/* Tab 1: KHQR Display */}
            {selectedMethod === 'khqr' && (
              <div className="bg-slate-800/60 rounded-3xl p-4 sm:p-5 border border-slate-700/80 flex flex-col items-center text-center space-y-3.5 animate-in fade-in">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bakong KHQR Payment</span>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-3xl shadow-xl border-4 border-rose-500/20 max-w-[220px] sm:max-w-[240px] w-full aspect-square flex flex-col items-center justify-center" data-preserve-white="true">
                  <img 
                    src={displayQrSrc} 
                    alt="Bakong KHQR" 
                    className="w-full h-full object-contain rounded-2xl"
                  />
                </div>

                {/* Bank and Account Details */}
                <div className="w-full space-y-1.5">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    {bankName}
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white truncate">
                    {merchantName}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold truncate">
                    {accountHolder}
                  </p>

                  {bankAccountNo && (
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <code className="text-xs font-mono font-bold bg-slate-900 px-3 py-1 rounded-xl text-slate-300 border border-slate-700">
                        {bankAccountNo}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer transition-colors"
                        title="Copy Account Number"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  {isKh 
                    ? 'សូមបើក App ធនាគារណាមួយ (ABA, Wing, ACLEDA, Bakong...) ដើម្បីស្កេនទូទាត់ប្រាក់' 
                    : 'Open any mobile banking app to scan and pay seamlessly'}
                </div>
              </div>
            )}

            {/* Tab 2: Cash Display */}
            {selectedMethod === 'cash' && (
              <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/80 flex flex-col items-center text-center space-y-4 animate-in fade-in flex-1 justify-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Banknote className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {isKh ? 'ទូទាត់ដោយសាច់ប្រាក់សុទ្ធ (Cash Payment)' : 'Cash Payment at Counter'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {isKh 
                      ? 'សូមប្រគល់ប្រាក់សុទ្ធជូនបុគ្គលិកគិតលុយនៅបញ្ជរ' 
                      : 'Please hand over cash to the cashier at the counter'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 w-full max-w-xs">
                  <div className="text-xs text-slate-400">{isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់:' : 'Amount to Pay:'}</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {formatUSD(total)}
                  </div>
                  <div className="text-xs text-indigo-300 font-mono">
                    {formatKHR(total, khrRate)}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Card / POS Terminal Display */}
            {selectedMethod === 'card' && (
              <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/80 flex flex-col items-center text-center space-y-4 animate-in fade-in flex-1 justify-center">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {isKh ? 'ទូទាត់ដោយកាតធនាគារ (Card Payment)' : 'Credit / Debit Card Terminal'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {isKh 
                      ? 'គាំទ្រកាត Visa, Mastercard, UnionPay តាមរយៈម៉ាស៊ីនឆូតកាត (POS)' 
                      : 'Accepting Visa, Mastercard, and UnionPay via counter POS terminal'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 w-full max-w-xs">
                  <div className="text-xs text-slate-400">{isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់:' : 'Total Charge:'}</div>
                  <div className="text-2xl font-black text-indigo-400 font-mono mt-0.5">
                    {formatUSD(total)}
                  </div>
                </div>
              </div>
            )}

            {/* Store Information / Thank you footer */}
            <div className="mt-auto p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKh ? 'អរគុណសម្រាប់ការគាំទ្រហាងរបស់យើងខ្ញុំ!' : 'Thank you for shopping with us!'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {currentUser?.phone || settings?.phone ? `Tel: ${currentUser?.phone || settings?.phone}` : 'MINI MART POS'}
              </p>
            </div>

          </div>
        </div>

        {/* Modal Footer: Quick Help & Controls */}
        <footer className="px-4 sm:px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isKh ? 'ប្រព័ន្ធកំពុងដំណើរការផ្សាយបន្តផ្ទាល់' : 'Display stream active'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer text-xs"
            >
              {isKh ? 'បិទផ្ទាំងនេះ' : 'Close Screen'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
