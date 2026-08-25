import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Download, Check, Share2, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import QRCode from 'qrcode';
import { Order, ShopSettings, User } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';
import { Logo } from './Logo';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  settings: ShopSettings;
  language: 'en' | 'kh';
  currentUser?: User | null;
  users?: User[];
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onClose,
  settings,
  language,
  currentUser,
  users = []
}) => {
  if (!order) return null;

  const isKh = language === 'kh';
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [sanitizedLogoUrl, setSanitizedLogoUrl] = useState<string | null>(null);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  // Find order owner user or current user to apply custom per-user Invoice branding
  const orderOwnerUser = (order.userId ? users.find(u => u.id === order.userId) : null) || currentUser;

  // Resolve isolated custom invoice branding
  const rawLogo = orderOwnerUser?.invoiceLogo?.trim() || null;
  const displayShopName = orderOwnerUser?.invoiceShopName || settings.shopName || 'MINI MART POS';
  const displayShopNameKh = orderOwnerUser?.invoiceShopNameKh || settings.shopNameKh || 'មីនី ម៉ាត';
  const displayAddress = orderOwnerUser?.invoiceAddress || settings.address || 'Phnom Penh, Cambodia';
  const displayPhone = orderOwnerUser?.invoicePhone || settings.phone || '+855 12 345 678';
  const displayFooter = orderOwnerUser?.invoiceFooterText || settings.receiptFooterText || 'Thank you for shopping with us! Please come again.';

  // 1. Generate local offline Base64 QR Code to prevent missing QR during export
  useEffect(() => {
    let isMounted = true;
    const qrPayload = `RESTODASH-${order.orderNumber || order.id || Date.now()}`;
    
    QRCode.toDataURL(qrPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate offline QR code:', err);
        // Fallback to static data
        if (isMounted) setQrCodeDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrPayload)}`);
      });

    return () => {
      isMounted = false;
    };
  }, [order.orderNumber, order.id]);

  // 2. Pre-sanitize and convert any remote/blob invoice logo to embedded Data URL for flawless html-to-image export
  useEffect(() => {
    let isMounted = true;
    setLogoLoadFailed(false);

    if (!rawLogo) {
      setSanitizedLogoUrl(null);
      return;
    }

    // If already base64 data URL, use directly
    if (rawLogo.startsWith('data:image/')) {
      setSanitizedLogoUrl(rawLogo);
      return;
    }

    // Convert external URL / blob to clean base64 canvas data URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    
    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          setSanitizedLogoUrl(dataUrl);
        } else {
          setSanitizedLogoUrl(rawLogo);
        }
      } catch (err) {
        console.warn('Canvas conversion notice for logo:', err);
        setSanitizedLogoUrl(rawLogo);
      }
    };

    img.onerror = () => {
      if (!isMounted) return;
      console.warn('Custom logo failed to load, falling back to vector logo');
      setLogoLoadFailed(true);
      setSanitizedLogoUrl(null);
    };

    img.src = rawLogo;

    return () => {
      isMounted = false;
    };
  }, [rawLogo]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJpg = async () => {
    if (!receiptRef.current || isExportingJpg) return;

    try {
      setIsExportingJpg(true);

      // Ensure all images inside the receipt are loaded before rendering
      const imgElements = Array.from(receiptRef.current.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(
        imgElements.map((img: HTMLImageElement) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((res) => {
            img.onload = () => res(true);
            img.onerror = () => res(true);
            setTimeout(() => res(true), 300); // 300ms safety timeout
          });
        })
      );

      // Small delay for DOM layout stability
      await new Promise((r) => setTimeout(r, 60));

      const exportOptions = {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 3, // High DPI for crystal clear text & barcode
        cacheBust: true,
        style: {
          transform: 'none',
          borderRadius: '0px'
        }
      };

      // Warm-up pass for WebKit / iOS Safari to avoid blank image drops
      try {
        await toJpeg(receiptRef.current, exportOptions);
      } catch (warmupErr) {
        // Continue to final pass
      }

      // Final high-res export
      const dataUrl = await toJpeg(receiptRef.current, exportOptions);

      // Trigger standard download
      const link = document.createElement('a');
      link.download = `Invoice-${order.orderNumber || Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export invoice as JPG:', error);
      alert(isKh ? 'បរាជ័យក្នុងការ Export រូបភាព JPG សូមសាកល្បងម្ដងទៀត!' : 'Failed to export invoice as JPG. Please try again.');
    } finally {
      setIsExportingJpg(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-bold uppercase tracking-wider">
              {isKh ? 'វិក្កយបត្រផ្លូវការ' : 'Receipt / Invoice'}
            </span>
            {sanitizedLogoUrl && !logoLoadFailed && (
              <span className="text-[9px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                Custom Logo
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div 
          ref={receiptRef}
          className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4 bg-[#ffffff]" 
          id="printable-receipt"
        >
          {/* Shop Header with Custom User Invoice Logo or Default Vector Logo */}
          <div className="text-center space-y-1.5 border-b border-dashed border-slate-300 pb-3 flex flex-col items-center">
            {sanitizedLogoUrl && !logoLoadFailed ? (
              <div className="p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs inline-flex items-center justify-center">
                <img
                  src={sanitizedLogoUrl}
                  alt={displayShopName}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoLoadFailed(true)}
                  className="w-16 h-16 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs inline-flex items-center justify-center">
                <Logo size={46} variant="badge" />
              </div>
            )}
            <div>
              <h2 className="text-base font-black font-sans text-slate-900 tracking-tight">
                {displayShopName}
              </h2>
              {displayShopNameKh && (
                <p className="text-[11px] text-slate-500 font-sans font-medium">{displayShopNameKh}</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-sans">{displayAddress}</p>
            <p className="text-[10px] text-slate-400">Tel: {displayPhone}</p>
          </div>

          {/* Order Details Meta */}
          <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <span className="font-bold font-mono">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Table / Mode:</span>
              <span className="font-bold">{order.tableNumber || 'Takeaway'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span className="font-medium">{order.cashierName}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
            )}
          </div>

          {/* Purchased Items List */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold text-slate-700 text-[10px] uppercase">
              <span>Item</span>
              <span>Qty x Price</span>
              <span>Total</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-sans font-semibold text-slate-800 line-clamp-1">
                  {item.product.name}
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>{item.quantity} x ${item.product.price.toFixed(2)}</span>
                  <span className="font-bold">${(item.quantity * item.product.price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax ({(order.taxRate * 100).toFixed(0)}%):</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
              <span>TOTAL (USD):</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-indigo-700">
              <span>TOTAL (KHR):</span>
              <span>{formatKHR(order.total, settings.khrExchangeRate)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Payment Method:</span>
              <span className="font-bold uppercase">{order.paymentMethod}</span>
            </div>
            {order.paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Amount:</span>
                  <span>${order.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Change Due:</span>
                  <span className="font-bold text-emerald-700">${order.changeDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer note & Offline QR Code */}
          <div className="text-center space-y-2 pt-1">
            <p className="text-[11px] text-slate-500 font-sans">{displayFooter}</p>
            <div className="pt-2 flex flex-col items-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Receipt QR"
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">
                  QR
                </div>
              )}
              <span className="text-[9px] text-slate-400 mt-1 font-mono">{order.orderNumber}</span>
            </div>
          </div>
        </div>

        {/* Export Notice */}
        {exportSuccess && (
          <div className="mx-4 mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKh ? 'បានទាញយកវិក្កយបត្រ (JPG) ជោគជ័យ!' : 'Invoice exported as JPG successfully!'}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            {isKh ? 'បិទ' : 'Close'}
          </button>

          <button
            onClick={handleExportJpg}
            disabled={isExportingJpg}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title={isKh ? 'ទាញយកវិក្កយបត្រជារូបភាព JPG' : 'Export Invoice as JPG image'}
          >
            {isExportingJpg ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{isKh ? 'កំពុងបង្កើត...' : 'Exporting...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{isKh ? 'Export JPG' : 'Export JPG'}</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{isKh ? 'បោះពុម្ព' : 'Print'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

