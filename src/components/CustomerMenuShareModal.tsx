import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Sparkles, 
  X, 
  Smartphone, 
  MessageCircle, 
  Send, 
  Printer, 
  Download,
  Info,
  ShieldCheck,
  Store,
  UserCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { ShopSettings, User } from '../types';
import { Logo } from './Logo';

interface CustomerMenuShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  language: 'en' | 'kh';
  onOpenPreview: () => void;
  currentUserId?: string;
  currentUser?: User | null;
}

export const CustomerMenuShareModal: React.FC<CustomerMenuShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  language,
  onOpenPreview,
  currentUserId,
  currentUser
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isKh = language === 'kh';

  // Build the strictly isolated shareable link for customer self-order menu scoped to this store/user account
  const storeId = currentUser?.id || currentUserId || 'user-admin';
  const merchantName = currentUser?.fullName || settings.shopNameKh || settings.shopName || 'MINI MART';
  const usernameTag = currentUser?.username ? `@${currentUser.username}` : '';

  const storeParam = storeId ? `&storeId=${encodeURIComponent(storeId)}` : '';
  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?mode=customer_menu${storeParam}`
    : `https://miniposkh.app/?mode=customer_menu${storeParam}`;

  // Generate QR Code image
  useEffect(() => {
    if (isOpen && menuUrl) {
      QRCode.toDataURL(menuUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [isOpen, menuUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(menuUrl);
      } else {
        const input = document.createElement('input');
        input.value = menuUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      isKh 
        ? `សូមចូលកុម្ម៉ង់ទំនិញតាមតំណភ្ជាប់នេះពីហាង ${merchantName}:\n${menuUrl}`
        : `Order online from ${merchantName}:\n${menuUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(menuUrl)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      isKh 
        ? `សូមចូលកុម្ម៉ង់ទំនិញពីហាង ${merchantName}: ${menuUrl}`
        : `Order online from ${merchantName}: ${menuUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `minipos-menu-${storeId}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Menu - ${merchantName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px 20px;
              color: #1e293b;
            }
            .card {
              max-width: 380px;
              margin: 0 auto;
              border: 2px dashed #6366f1;
              border-radius: 24px;
              padding: 30px 20px;
            }
            h1 { font-size: 22px; margin: 10px 0 4px 0; color: #1e1b4b; }
            p { font-size: 13px; color: #64748b; margin: 4px 0 20px 0; }
            img { width: 240px; height: 240px; margin-bottom: 15px; }
            .badge {
              display: inline-block;
              background: #e0e7ff;
              color: #4338ca;
              font-weight: bold;
              font-size: 12px;
              padding: 6px 14px;
              border-radius: 999px;
            }
            .store-tag {
              display: inline-block;
              margin-top: 10px;
              font-size: 11px;
              font-weight: bold;
              color: #4f46e5;
              background: #f1f5f9;
              padding: 4px 10px;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">${isKh ? 'ស្កេនកុម្ម៉ង់ទំនិញភ្លាមៗ' : 'SCAN TO ORDER ONLINE'}</span>
            <h1>${merchantName}</h1>
            <p>${isKh ? 'បើកកាមេរ៉ាស្កេន QR Code ដើម្បីមើលមុខទំនិញ & កុម្ម៉ង់' : 'Scan this QR code with phone camera to order'}</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div>
              <span class="store-tag">ID: ${storeId} ${usernameTag}</span>
            </div>
            <p style="font-size: 11px; font-weight: bold; color: #4f46e5; margin-top: 15px;">MINI MART POS • Dedicated Store Menu</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-hidden">
      <div className="w-full max-w-lg max-h-[94vh] sm:max-h-[88vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-xs text-amber-300 shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-lg tracking-tight truncate">
                {isKh ? 'តំណភ្ជាប់ម៉ឺនុយអតិថិជនដាច់ដោយឡែក' : 'Isolated Customer Menu Link & QR'}
              </h3>
              <p className="text-[11px] sm:text-xs text-indigo-200 font-medium truncate">
                {isKh ? `គណនី៖ ${merchantName}` : `Store Account: ${merchantName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content (Scrollable & Optimized for iPhone) */}
        <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 flex-1 overflow-y-auto overscroll-contain">
          
          {/* Account Isolation Notice Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-emerald-900 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                <span>{isKh ? 'តំណភ្ជាប់ដាច់ដោយឡែក ១០០%' : '100% Isolated Account Link'}</span>
                <span className="px-2 py-0.2 rounded-md bg-emerald-200/80 text-emerald-900 text-[10px] font-mono font-bold">
                  {storeId}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/90 mt-0.5">
                {isKh 
                  ? `តំណភ្ជាប់នេះគឺសម្រាប់តែគណនី "${merchantName}" របស់អ្នកប៉ុណ្ណោះ។ ទំនិញ និងការកុម្ម៉ង់របស់អតិថិជននឹងចូលមកកាន់គណនីនេះផ្ទាល់ មិនច្រឡូកច្រឡំជាមួយគណនីផ្សេងៗឡើយ។` 
                  : `This link belongs exclusively to "${merchantName}". Products and customer orders route strictly to this account and never mix with others.`}
              </p>
            </div>
          </div>

          {/* Main QR Card */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 text-center sm:text-left">
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xs border border-slate-200/70 shrink-0" data-preserve-white="true">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Customer Menu QR Code"
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-lg mx-auto"
                />
              ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center text-slate-400">
                  <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-2.5 flex-1 min-w-0">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase tracking-wide">
                  <Store className="w-3 h-3 text-indigo-600" />
                  {merchantName}
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  {isKh ? 'ស្កេនកុម្ម៉ង់ទំនិញពីហាងរបស់អ្នក' : 'Scan to View & Order From Your Store'}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  {isKh 
                    ? 'អតិថិជនអាចស្កេន QR នេះដោយទូរស័ព្ទដៃ ដើម្បីជ្រើសរើសទំនិញ និងផ្ញើចូលប្រព័ន្ធគិតលុយរបស់លោកអ្នកដោយផ្ទាល់។' 
                    : 'Customers scan this QR code with their mobile phone to browse all products and place orders directly into POS.'}
                </p>
              </div>

              {/* Action Buttons for QR */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKh ? 'ទាញយក QR' : 'Download QR'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintQr}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKh ? 'បោះពុម្ពបិទលើតុ' : 'Print Table QR'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click Copy Direct Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700">
                {isKh ? 'តំណភ្ជាប់ផ្ទាល់ (Direct Customer URL)' : 'Direct Customer Ordering Link'}
              </label>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                storeId={storeId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 border border-slate-200 px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-mono text-slate-700 truncate select-all">
                {menuUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isKh ? 'បានចម្លង!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isKh ? 'ចម្លង Link' : 'Copy Link'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-1.5 pt-0.5">
            <label className="block text-[11px] sm:text-xs font-bold text-slate-600">
              {isKh ? 'ផ្ញើទៅកាន់អតិថិជនតាមបណ្តាញសង្គម' : 'Quick Share to Customers'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2 sm:py-2.5 px-3 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#229ED9]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2 sm:py-2.5 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#25D366]/20"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(menuUrl, '_blank');
                }}
                className="py-2 sm:py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isKh ? 'បើកផ្ទាំងថ្មី' : 'New Tab'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreview();
                }}
                className="py-2 sm:py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isKh ? 'មើលសាកល្បង' : 'In-App View'}</span>
              </button>
            </div>
          </div>

          {/* Guide Tips */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/70 text-[11px] sm:text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">{isKh ? 'របៀបដំណើរការ:' : 'How it works:'}</strong>{' '}
              {isKh 
                ? 'នៅពេលអតិថិជនចុច "ផ្ញើការកុម្ម៉ង់ទៅហាង" នៅលើទូរស័ព្ទរបស់គាត់ ប្រព័ន្ធ POS របស់អ្នកនឹងបន្លឺសំឡេងរោទិ៍ ហើយបង្ហាញផ្ទាំងកុម្ម៉ង់ភ្លាមៗ ជាមួយប៊ូតុង "បញ្ចូលក្នុង Current Order ដើម្បីគិតលុយ" តែម្តង!'
                : 'When customers tap "Send Order to Store" on their phones, your POS receives a real-time notification with a 1-click button to load items straight into your checkout cart!'}
            </div>
          </div>
        </div>

        {/* Modal Footer with Safe Area Support for iPhone */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {isKh ? 'យល់ព្រម / បិទ' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

