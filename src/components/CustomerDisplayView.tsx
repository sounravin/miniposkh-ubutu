import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Maximize, 
  Minimize, 
  Copy, 
  Check, 
  RefreshCw,
  HelpCircle,
  Hourglass,
  ArrowRight,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  CustomerDisplayState, 
  getSavedCustomerDisplayState, 
  subscribeToCustomerDisplay, 
  requestPOSCurrentState 
} from '../utils/customerDisplaySync';
import { formatUSD, formatKHR } from '../utils/currency';
import { User, ShopSettings } from '../types';

interface CustomerDisplayViewProps {
  storeId?: string;
  defaultUser?: User | null;
  defaultSettings?: ShopSettings | null;
}

export const CustomerDisplayView: React.FC<CustomerDisplayViewProps> = ({
  storeId,
  defaultUser,
  defaultSettings
}) => {
  const [language, setLanguage] = useState<'en' | 'kh'>('kh');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  // Initialize display state from saved state or defaults
  const [displayState, setDisplayState] = useState<CustomerDisplayState>(() => {
    const saved = getSavedCustomerDisplayState(storeId);
    if (saved) return saved;

    const shopNameKh = defaultUser?.invoiceShopNameKh || defaultUser?.fullName || defaultSettings?.shopNameKh || defaultSettings?.shopName || 'MINI MART POS';
    const shopNameEn = defaultUser?.invoiceShopName || defaultUser?.fullName || defaultSettings?.shopName || 'MINI MART POS';

    return {
      storeId: storeId || defaultUser?.id || 'admin',
      storeName: shopNameEn,
      storeNameKh: shopNameKh,
      phone: defaultUser?.phone || defaultSettings?.phone || '',
      email: defaultUser?.email || defaultSettings?.email || '',
      cartItems: [],
      subtotal: 0,
      discount: 0,
      discountType: 'percent',
      tax: 0,
      taxRate: defaultSettings?.taxRate || 0,
      total: 0,
      khrRate: defaultSettings?.khrExchangeRate || 4100,
      selectedTable: 'Counter 01',
      cashierName: defaultUser?.fullName || 'Cashier',
      isCheckingOut: false,
      selectedPaymentMethod: null,
      khqrImage: defaultUser?.khqrImage || defaultSettings?.khqrImage || '',
      khqrMerchantName: defaultUser?.khqrMerchantName || defaultSettings?.khqrMerchantName || shopNameKh,
      khqrAccountName: defaultUser?.khqrAccountName || defaultSettings?.khqrAccountName || defaultUser?.fullName || '',
      khqrAccountNumber: defaultUser?.khqrAccountNumber || defaultSettings?.khqrAccountNumber || '',
      khqrBankName: defaultUser?.khqrBankName || defaultSettings?.khqrBankName || 'ABA Bank (KHQR)',
      updatedAt: Date.now()
    };
  });

  const isKh = language === 'kh';

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time updates from Counter POS
  useEffect(() => {
    const unsubscribe = subscribeToCustomerDisplay((newState) => {
      setDisplayState(newState);
      setIsConnected(true);

      // Trigger celebration if order just completed
      if (newState.isOrderCompleted) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // Ignore
        }
      }
    });

    // Request initial state from any open counter tab
    requestPOSCurrentState();

    return () => {
      unsubscribe();
    };
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleCopyAccount = () => {
    const account = displayState.khqrAccountNumber;
    if (!account) return;
    try {
      navigator.clipboard?.writeText(account);
      setAccountCopied(true);
      setTimeout(() => setAccountCopied(false), 2000);
    } catch {
      setAccountCopied(true);
      setTimeout(() => setAccountCopied(false), 2000);
    }
  };

  // Dynamic store name
  const currentShopName = isKh 
    ? (displayState.storeNameKh || displayState.storeName || 'MINI MART POS')
    : (displayState.storeName || displayState.storeNameKh || 'MINI MART POS');

  const totalItemsCount = displayState.cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Dynamic KHQR fallback generator
  const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=KHQR-${displayState.total.toFixed(2)}-${encodeURIComponent(displayState.khqrMerchantName || currentShopName)}`;
  const displayQrSrc = displayState.khqrImage || fallbackQr;

  return (
    <div 
      className="min-h-screen w-full bg-slate-950 text-white flex flex-col font-sans select-none antialiased"
      id="customer-display-full-screen"
    >
      {/* 1. Header Bar: Personalized Welcome Title per store/account */}
      <header className="px-4 sm:px-8 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-md">
            <Store className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isKh ? 'អេក្រង់អតិថិជន (Customer Display)' : 'Customer Display Screen'}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs text-indigo-300 font-bold truncate hidden sm:inline">
                {displayState.selectedTable || 'Counter 01'}
              </span>
            </div>

            {/* Dynamic Welcome Title requested by user */}
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white truncate flex items-center gap-2 mt-0.5">
              <span className="text-indigo-400 font-medium">
                {isKh ? 'សូមស្វាគមន៍មកកាន់' : 'Welcome to'}
              </span>
              <span className="text-amber-300 drop-shadow-sm font-black">
                {currentShopName}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Tools & Clock */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Clock */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm font-mono text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>
              {currentTime.toLocaleTimeString(isKh ? 'km-KH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Sync Request Button */}
          <button
            type="button"
            onClick={() => requestPOSCurrentState()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title={isKh ? 'ធ្វើបច្ចុប្បន្នភាពទិន្នន័យ (Sync)' : 'Sync with Counter'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(l => l === 'en' ? 'kh' : 'en')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'EN' : 'ខ្មែរ'}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden lg:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Layout: 2 Columns */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT COLUMN: Purchased Items (7 cols on lg) */}
        <section className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900/60">
          {/* Header of Item List */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-black text-slate-200 uppercase tracking-wider">
                {isKh ? 'បញ្ជីទំនិញដែលបានទិញ' : 'Purchased Items'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {totalItemsCount} {isKh ? 'មុខ' : 'items'}
              </span>
            </div>

            {displayState.cashierName && (
              <div className="text-xs text-slate-400">
                {isKh ? 'អ្នកគិតលុយ:' : 'Cashier:'} <span className="text-slate-200 font-bold">{displayState.cashierName}</span>
              </div>
            )}
          </div>

          {/* List of Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 touch-scroll">
            {displayState.cartItems.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-inner">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-300">
                    {isKh ? 'មិនទាន់មានទំនិញក្នុងកន្ត្រកនៅឡើយទេ' : 'No items currently in order'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {isKh 
                      ? 'រាល់ពេលអ្នកគិតលុយស្កេន ឬបញ្ចូលទំនិញ វានឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ។' 
                      : 'Items scanned or added by the cashier will appear here in real time.'}
                  </p>
                </div>
              </div>
            ) : (
              displayState.cartItems.map((item, idx) => {
                const lineTotal = item.product.price * item.quantity;
                return (
                  <div 
                    key={`${item.product.id}-${idx}`}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 flex items-center justify-between gap-4 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Product Image */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-700 border border-slate-600/70 shrink-0 shadow-xs">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Product Names & Quantities */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate leading-snug">
                          {isKh && item.product.nameKh ? item.product.nameKh : item.product.name}
                        </h4>
                        {isKh && item.product.nameKh && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {item.product.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400">
                          <span className="font-mono text-indigo-300 font-bold">
                            ${item.product.price.toFixed(2)}
                          </span>
                          <span>×</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-white font-mono font-black text-xs">
                            {item.quantity}
                          </span>
                          {item.product.barcode && (
                            <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
                              #{item.product.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-black text-amber-300 font-mono">
                        {formatUSD(lineTotal)}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {formatKHR(lineTotal, displayState.khrRate)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Subtotal & Total Summary Bottom Bar */}
          <div className="p-5 bg-slate-800/90 border-t border-slate-800 space-y-2.5 shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
              <span>{isKh ? 'សរុបបឋម (Subtotal):' : 'Subtotal:'}</span>
              <span className="font-mono font-bold text-white text-sm sm:text-base">
                {formatUSD(displayState.subtotal)}
              </span>
            </div>

            {displayState.discount > 0 && (
              <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-400">
                <span>{isKh ? 'បញ្ចុះតម្លៃ (Discount):' : 'Discount:'}</span>
                <span className="font-mono font-bold">
                  -{displayState.discountType === 'percent' ? `${displayState.discount}%` : formatUSD(displayState.discount)}
                </span>
              </div>
            )}

            {displayState.taxRate > 0 && (
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
                <span>{isKh ? `ពន្ធអាករ (${(displayState.taxRate * 100).toFixed(0)}% Tax):` : `Tax (${(displayState.taxRate * 100).toFixed(0)}%):`}</span>
                <span className="font-mono">{formatUSD(displayState.tax)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wide">
                  {isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់សរុប' : 'Total Amount Due'}
                </div>
                <div className="text-xs sm:text-sm text-indigo-300 font-mono font-bold">
                  {formatKHR(displayState.total, displayState.khrRate)}
                </div>
              </div>
              <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono drop-shadow-md">
                {formatUSD(displayState.total)}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: PAYMENT METHODS (5 cols on lg) */}
        {/* CRITICAL REQUIREMENT: ONLY display the payment method once counter selects it! */}
        <section className="lg:col-span-5 flex flex-col bg-slate-900 p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Header of Payment Section */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span>{isKh ? 'វិធីសាស្ត្រទូទាត់ប្រាក់ (Payment Method)' : 'Payment Method'}</span>
            </h3>

            {displayState.selectedPaymentMethod ? (
              <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                {isKh ? 'បានជ្រើសរើស' : 'Selected by Cashier'}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {isKh ? 'រង់ចាំអ្នកគិតលុយ...' : 'Waiting for Counter...'}
              </span>
            )}
          </div>

          {/* CASE 0: Order just completed */}
          {displayState.isOrderCompleted ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-3xl space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {isKh ? 'ការទូទាត់ទទួលបានជោគជ័យ!' : 'Payment Completed Successfully!'}
                </h3>
                {displayState.completedOrderNumber && (
                  <p className="text-sm font-mono text-emerald-300 font-bold">
                    #{displayState.completedOrderNumber}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto pt-2 leading-relaxed">
                  {isKh 
                    ? 'សូមអរគុណសម្រាប់ការគាំទ្រហាងរបស់យើងខ្ញុំ! សូមអញ្ជើញមកកាន់ម្តងទៀត។' 
                    : 'Thank you for shopping with us! Have a wonderful day.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 w-full max-w-xs space-y-1">
                <div className="text-xs text-slate-400">{isKh ? 'បានទូទាត់សរុប:' : 'Total Paid:'}</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {formatUSD(displayState.total)}
                </div>
                <div className="text-xs text-indigo-300 font-mono">
                  {formatKHR(displayState.total, displayState.khrRate)}
                </div>
              </div>
            </div>
          ) : !displayState.selectedPaymentMethod ? (
            /* CASE 1: Cashier has NOT selected payment method yet -> Show welcoming status card */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-800/40 border-2 border-dashed border-slate-700/80 rounded-3xl space-y-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                <Hourglass className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-indigo-400 duration-1000" style={{ animationDuration: '6s' }} />
              </div>

              <div className="space-y-2 max-w-sm">
                <h4 className="text-base sm:text-lg font-black text-white">
                  {isKh 
                    ? 'រង់ចាំអ្នកគិតលុយជ្រើសរើសវិធីសាស្ត្រទូទាត់' 
                    : 'Waiting for Cashier to Select Payment Method'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {isKh 
                    ? 'សូមពិនិត្យមើលបញ្ជីមុខទំនិញ និងតម្លៃសរុបខាងឆ្វេងដៃ។ នៅពេលអ្នកគិតលុយជ្រើសរើសវិធីសាស្ត្រទូទាត់ (KHQR ឬ សាច់ប្រាក់ ឬ កាត) ផ្ទាំងទូទាត់នឹងបង្ហាញនៅទីនេះភ្លាមៗ។' 
                    : 'Please review your items and totals on the left. The payment options will appear here once chosen at the counter.'}
                </p>
              </div>

              {/* Big amount due card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/90 w-full max-w-xs space-y-1 shadow-md">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                  {isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់' : 'Amount to Pay'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono block">
                  {formatUSD(displayState.total)}
                </span>
                <span className="text-xs text-indigo-300 font-mono block">
                  {formatKHR(displayState.total, displayState.khrRate)}
                </span>
              </div>
            </div>
          ) : (
            /* CASE 2: Cashier HAS selected a specific Payment Method -> Show ONLY that selected method */
            <div className="flex-1 flex flex-col space-y-4">
              
              {/* Active Payment Badge */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-xs text-slate-400 font-bold">
                  {isKh ? 'វិធីសាស្ត្រទូទាត់ដែលបានជ្រើសរើស:' : 'Active Payment Selection:'}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  {displayState.selectedPaymentMethod === 'khqr' && <QrCode className="w-3.5 h-3.5 text-rose-400" />}
                  {displayState.selectedPaymentMethod === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                  {displayState.selectedPaymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>
                    {displayState.selectedPaymentMethod === 'khqr' && (isKh ? 'ស្កេន KHQR' : 'Bakong KHQR')}
                    {displayState.selectedPaymentMethod === 'cash' && (isKh ? 'សាច់ប្រាក់សុទ្ធ' : 'Cash Payment')}
                    {displayState.selectedPaymentMethod === 'card' && (isKh ? 'កាតធនាគារ' : 'Card Terminal')}
                    {displayState.selectedPaymentMethod === 'debt' && (isKh ? 'កត់ត្រាជំពាក់' : 'Debt / Credit')}
                  </span>
                </span>
              </div>

              {/* Sub-view: KHQR */}
              {displayState.selectedPaymentMethod === 'khqr' && (
                <div className="bg-slate-800/60 rounded-3xl p-5 border border-slate-700/80 flex flex-col items-center text-center space-y-4 animate-in fade-in">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Bakong KHQR Payment</span>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-3 bg-white rounded-3xl shadow-2xl border-4 border-rose-500/30 max-w-[240px] sm:max-w-[260px] w-full aspect-square flex flex-col items-center justify-center" data-preserve-white="true">
                    <img 
                      src={displayQrSrc} 
                      alt="Bakong KHQR" 
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  </div>

                  {/* Bank and Account Details */}
                  <div className="w-full space-y-1.5">
                    <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                      {displayState.khqrBankName || 'ABA Bank (KHQR)'}
                    </div>
                    <h4 className="text-lg font-black text-white truncate">
                      {displayState.khqrMerchantName || currentShopName}
                    </h4>
                    {displayState.khqrAccountName && (
                      <p className="text-xs text-slate-300 font-bold truncate">
                        {displayState.khqrAccountName}
                      </p>
                    )}

                    {displayState.khqrAccountNumber && (
                      <div className="pt-1 flex items-center justify-center gap-2">
                        <code className="text-xs font-mono font-bold bg-slate-900 px-3 py-1 rounded-xl text-slate-300 border border-slate-700">
                          {displayState.khqrAccountNumber}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer transition-colors"
                          title="Copy Account Number"
                        >
                          {accountCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    {isKh 
                      ? 'សូមបើក App ធនាគារណាមួយ (ABA, Wing, ACLEDA, Bakong...) ដើម្បីស្កេនទូទាត់ប្រាក់' 
                      : 'Open any mobile banking app to scan and pay seamlessly'}
                  </div>
                </div>
              )}

              {/* Sub-view: Cash */}
              {displayState.selectedPaymentMethod === 'cash' && (
                <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/80 flex flex-col items-center text-center space-y-4 animate-in fade-in flex-1 justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                    <Banknote className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white">
                      {isKh ? 'ទូទាត់ដោយសាច់ប្រាក់សុទ្ធ (Cash Payment)' : 'Cash Payment at Counter'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {isKh 
                        ? 'សូមប្រគល់ប្រាក់សុទ្ធជូនបុគ្គលិកគិតលុយនៅបញ្ជរ' 
                        : 'Please hand over cash to the cashier at the counter'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 w-full max-w-xs space-y-2">
                    <div>
                      <div className="text-xs text-slate-400">{isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់:' : 'Total Due:'}</div>
                      <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                        {formatUSD(displayState.total)}
                      </div>
                      <div className="text-xs text-indigo-300 font-mono">
                        {formatKHR(displayState.total, displayState.khrRate)}
                      </div>
                    </div>

                    {/* If cashier typed cash received */}
                    {displayState.cashTendered && displayState.cashTendered > 0 ? (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">{isKh ? 'ប្រាក់ទទួលបាន:' : 'Received:'}</span>
                        <span className="font-mono font-bold text-white">${displayState.cashTendered.toFixed(2)}</span>
                      </div>
                    ) : null}

                    {displayState.changeDueUSD && displayState.changeDueUSD > 0 ? (
                      <div className="pt-1 flex items-center justify-between text-xs text-amber-300 font-bold">
                        <span>{isKh ? 'ប្រាក់អាប់ជូន:' : 'Change Due:'}</span>
                        <span className="font-mono text-sm">${displayState.changeDueUSD.toFixed(2)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Sub-view: Card Terminal */}
              {displayState.selectedPaymentMethod === 'card' && (
                <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/80 flex flex-col items-center text-center space-y-4 animate-in fade-in flex-1 justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white">
                      {isKh ? 'ទូទាត់ដោយកាតធនាគារ (Card Payment)' : 'Credit / Debit Card Payment'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {isKh 
                        ? 'គាំទ្រកាត Visa, Mastercard, UnionPay តាមរយៈម៉ាស៊ីនឆូតកាតបញ្ជរ' 
                        : 'Tap or insert your card into the counter POS terminal'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 w-full max-w-xs">
                    <div className="text-xs text-slate-400">{isKh ? 'ទឹកប្រាក់ត្រូវឆូត:' : 'Total Charge:'}</div>
                    <div className="text-2xl font-black text-indigo-400 font-mono mt-0.5">
                      {formatUSD(displayState.total)}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-view: Debt / Credit */}
              {displayState.selectedPaymentMethod === 'debt' && (
                <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/80 flex flex-col items-center text-center space-y-4 animate-in fade-in flex-1 justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white">
                      {isKh ? 'កត់ត្រាជំពាក់ (Debt / Credit Record)' : 'Recorded on Credit'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {isKh 
                        ? 'ការកុម្ម៉ង់ត្រូវបានកត់ត្រាក្នុងគណនីអតិថិជនរួចរាល់' 
                        : 'Order amount added to customer credit balance'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 w-full max-w-xs">
                    <div className="text-xs text-slate-400">{isKh ? 'ទឹកប្រាក់កត់ត្រា:' : 'Recorded Balance:'}</div>
                    <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                      {formatUSD(displayState.total)}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Store Info Footer */}
          <div className="mt-auto p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-1">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKh ? 'អរគុណសម្រាប់ការគាំទ្រហាងរបស់យើងខ្ញុំ!' : 'Thank you for shopping with us!'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {displayState.phone ? `Tel: ${displayState.phone}` : currentShopName}
            </p>
          </div>

        </section>
      </main>

      {/* 3. Bottom Footer Status */}
      <footer className="px-6 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isConnected ? (isKh ? 'ផ្សាយបន្តផ្ទាល់ពីបញ្ជរគិតលុយ (Live Stream Active)' : 'Live Connected to POS') : 'Offline'}</span>
        </div>

        <div className="text-[11px] text-slate-500">
          MINI MART POS • Customer Facing Checkout
        </div>
      </footer>
    </div>
  );
};
