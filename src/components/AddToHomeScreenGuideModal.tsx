import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Laptop, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';
import { Logo } from './Logo';

interface AddToHomeScreenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'kh';
  userName?: string;
  userId?: string;
}

export const AddToHomeScreenGuideModal: React.FC<AddToHomeScreenGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  userName = 'Member',
  userId
}) => {
  const isKh = language === 'kh';

  // Detect current operating platform
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // 1. Detect device OS
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        setActivePlatform('ios');
      } else if (/android/i.test(ua)) {
        setActivePlatform('android');
      } else {
        setActivePlatform('desktop');
      }

      // Check if already in standalone PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }
    }

    // 2. Listen for native browser PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleDismiss = () => {
    // Permanently mark as shown so it never pops up again
    if (userId) {
      localStorage.setItem(`minipos_a2hs_prompted_${userId}`, 'true');
    }
    localStorage.setItem('minipos_a2hs_global_seen', 'true');
    onClose();
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          handleDismiss();
        }, 1500);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Native install prompt notice:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="a2hs-guide-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        id="a2hs-guide-modal-container"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white overflow-hidden shrink-0">
          {/* Subtle background visual glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer z-10"
            title={isKh ? 'បិទ' : 'Close'}
            id="btn-close-a2hs-modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 relative z-0">
            <div className="p-1 bg-white rounded-2xl shadow-md border border-white/20 shrink-0">
              <Logo size={44} variant="badge" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {isKh ? 'ចុះឈ្មោះជោគជ័យ' : 'Registration Successful'}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {isKh ? 'របៀបដាក់លើអេក្រង់ដើម (Add to Home Screen)' : 'Add MINI MART POS to Home Screen'}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {isKh 
                  ? `ជំរាបសួរ ${userName}! សូមដំឡើង App លើទូរស័ព្ទដើម្បីងាយស្រួលបើកលក់ភ្លាមៗ` 
                  : `Hello ${userName}! Add to home screen for 1-tap instant POS access`}
              </p>
            </div>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="p-3 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between gap-1.5 shrink-0">
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-a2hs-ios"
          >
            <span className="text-sm">🍏</span>
            <span>iPhone / iPad</span>
          </button>

          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-a2hs-android"
          >
            <span className="text-sm">🤖</span>
            <span>Android / Chrome</span>
          </button>

          <button
            onClick={() => setActivePlatform('desktop')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePlatform === 'desktop'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-a2hs-desktop"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>PC / Desktop</span>
          </button>
        </div>

        {/* Step-by-Step Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Native Install Button (if Chrome / PWA prompt available) */}
          {deferredPrompt && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    {isKh ? 'ដំឡើងកម្មវិធីដោយស្វ័យប្រវត្ត' : 'Instant One-Click Install'}
                  </h4>
                  <p className="text-[11px] text-emerald-800 line-clamp-1">
                    {isKh ? 'ចុចទីនេះដើម្បីដំឡើងភ្លាមៗលើទូរស័ព្ទ' : 'Tap to install app directly on your screen'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleNativeInstall}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center gap-1"
                id="btn-native-pwa-install"
              >
                <Download className="w-3.5 h-3.5" />
                {isKh ? 'ដំឡើងឥឡូវ' : 'Install'}
              </button>
            </div>
          )}

          {/* iOS Safari Instructions */}
          {activePlatform === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isKh ? 'ការណែនាំសម្រាប់ Safari លើ iPhone/iPad' : 'Safari on iOS (iPhone / iPad)'}
                </span>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                  Safari Browser
                </span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ចុចប៊ូតុង Share' : 'Tap the Share Button'}</span>
                    <span className="p-1 bg-white border border-slate-200 rounded-md shadow-2xs inline-flex text-indigo-600">
                      <Share2 className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'នៅលើកម្មវិធី Safari សូមចុចលើរូបសញ្ញា Share (សញ្ញាព្រួញចង្អុលឡើងលើ) នៅរបារខាងក្រោមអេក្រង់ទូរស័ព្ទ។'
                      : 'In Safari, tap the Share icon (box with upward arrow) in the bottom navigation bar.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ជ្រើសរើស "Add to Home Screen"' : 'Select "Add to Home Screen"'}</span>
                    <span className="p-1 bg-white border border-slate-200 rounded-md shadow-2xs inline-flex text-indigo-600">
                      <PlusSquare className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'អូសចុះក្រោមក្នុងផ្ទាំង Share រួចចុចលើពាក្យ "Add to Home Screen" (ឬ "បន្ថែមទៅអេក្រង់ដើម")។'
                      : 'Scroll down the share sheet menu and tap "Add to Home Screen".'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ចុច "Add" នៅជ្រុងខាងលើស្ដាំ' : 'Tap "Add" in Top Right Corner'}</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Add
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'ចុចប៊ូតុង "Add" រួចជាការស្រេច! រូបតំណាង MINI MART POS នឹងលេចឡើងលើ Home Screen ទូរស័ព្ទរបស់អ្នក។'
                      : 'Tap "Add" to confirm. MINI MART POS icon will appear on your phone home screen.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Android Chrome Instructions */}
          {activePlatform === 'android' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isKh ? 'ការណែនាំសម្រាប់ Google Chrome លើ Android' : 'Chrome / Samsung Internet on Android'}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                  Chrome Browser
                </span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ចុចលើ Menu (ចុច ៣)' : 'Tap Browser Menu (3 Dots)'}</span>
                    <span className="p-1 bg-white border border-slate-200 rounded-md shadow-2xs inline-flex text-emerald-600">
                      <MoreVertical className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'នៅលើកម្មវិធី Chrome សូមចុចលើសញ្ញាចុចបី (⋮) នៅជ្រុងខាងលើផ្នែកខាងស្ដាំនៃអេក្រង់។'
                      : 'In Google Chrome, tap the 3-dot menu icon (⋮) in the top-right corner.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ជ្រើសរើស "Install app" ឬ "Add to Home screen"' : 'Tap "Install app" or "Add to Home screen"'}</span>
                    <span className="p-1 bg-white border border-slate-200 rounded-md shadow-2xs inline-flex text-emerald-600">
                      <Download className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'ចុចលើពាក្យ "Install app" ឬ "Add to Home screen" (ឬ "ដំឡើងកម្មវិធី") ក្នុងបញ្ជីជម្រើស។'
                      : 'Tap "Install app" or "Add to Home screen" from the menu options.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ចុច "Install" ដើម្បីបញ្ជាក់' : 'Tap "Install" to confirm'}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Install
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'ចុចប៊ូតុង "Install / ដំឡើង" នោះកម្មវិធីនឹងដំណើរការពេញអេក្រង់ (Full Screen) ដូច Native App!'
                      : 'Confirm the installation to enjoy full-screen POS experience with offline capability.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop / Computer Instructions */}
          {activePlatform === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isKh ? 'ការណែនាំសម្រាប់ Chrome / Edge លើកុំព្យូទ័រ' : 'Chrome / Edge on Desktop / Mac / PC'}
                </span>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                  Desktop Browser
                </span>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ចុចរូបសញ្ញា Install លើ Address Bar' : 'Click Install Icon in Address Bar'}</span>
                    <span className="p-1 bg-white border border-slate-200 rounded-md shadow-2xs inline-flex text-blue-600">
                      <Download className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'នៅលើរបារ URL (Address Bar) ខាងលើផ្នែកខាងស្ដាំ សូមចុចលើរូបសញ្ញា Install ឬ កុំព្យូទ័រ។'
                      : 'Look at the right side of the browser URL bar and click the Install icon.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isKh ? 'ចុច "Install"' : 'Click "Install" Button'}</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Install
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isKh 
                      ? 'ផ្ទាំង Popup នឹងសួរបញ្ជាក់ សូមចុច "Install" ដើម្បីដំឡើង POS លើ Desktop របស់អ្នក។'
                      : 'Click "Install" on the popup. MINI MART POS will open in a standalone desktop window.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Advantages Checklist */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKh ? 'អត្ថប្រយោជន៍ពេល Add to Home Screen' : 'Key Benefits of Home Screen App'}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isKh ? 'បើកលក់លឿន 1-Tap' : '1-Tap instant launch'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isKh ? 'ពេញអេក្រង់ Full Screen' : 'Full-screen mode'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isKh ? 'ស្កេន Barcode រលូន' : 'Fast barcode scan'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isKh ? 'សន្សំសំចៃថ្ម & Data' : 'Data & battery efficient'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isKh 
                ? 'ផ្ទាំងនេះបង្ហាញតែម្ដងគត់ពេលចុះឈ្មោះលើកដំបូង' 
                : 'This prompt only appears once after registration'}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            id="btn-dismiss-a2hs-guide"
          >
            <span>{isKh ? 'យល់ហើយ ចូលទៅកាន់ផ្ទាំង POS' : 'Got it, Open POS System'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
