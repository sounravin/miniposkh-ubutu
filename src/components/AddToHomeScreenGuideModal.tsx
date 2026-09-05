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
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Play,
  Video,
  VideoOff,
  Film
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

  // State: Guide view vs Video Tutorial view
  const [viewMode, setViewMode] = useState<'guide' | 'video'>('guide');
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState<string>('');
  const [tutorialVideoTitle, setTutorialVideoTitle] = useState<string>('');

  // Detect current operating platform
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Fetch tutorial video from local cache & server
  useEffect(() => {
    const loadVideoSettings = async () => {
      try {
        const cached = localStorage.getItem('minipos_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.tutorialVideoUrl) {
            setTutorialVideoUrl(parsed.tutorialVideoUrl);
          }
          if (parsed.tutorialVideoTitle) {
            setTutorialVideoTitle(parsed.tutorialVideoTitle);
          }
        }
        const res = await fetch('/api/settings/tutorial-video');
        if (res.ok) {
          const data = await res.json();
          if (data.tutorialVideoUrl) {
            setTutorialVideoUrl(data.tutorialVideoUrl);
          }
          if (data.tutorialVideoTitle) {
            setTutorialVideoTitle(data.tutorialVideoTitle);
          }
        }
      } catch (err) {
        console.warn('Could not fetch tutorial video settings:', err);
      }
    };
    loadVideoSettings();

    const handleSettingsUpdate = (e: any) => {
      if (e.detail?.tutorialVideoUrl !== undefined) {
        setTutorialVideoUrl(e.detail.tutorialVideoUrl || '');
      }
      if (e.detail?.tutorialVideoTitle) {
        setTutorialVideoTitle(e.detail.tutorialVideoTitle);
      }
    };
    window.addEventListener('minipos:settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('minipos:settings_updated', handleSettingsUpdate);
    };
  }, []);

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

        {/* Platform Selection Tabs & Video Tutorial Tab */}
        <div className="p-3 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={() => { setViewMode('guide'); setActivePlatform('ios'); }}
            className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'guide' && activePlatform === 'ios'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-a2hs-ios"
          >
            <span className="text-sm">🍏</span>
            <span>iPhone / iPad</span>
          </button>

          <button
            onClick={() => { setViewMode('guide'); setActivePlatform('android'); }}
            className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'guide' && activePlatform === 'android'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-a2hs-android"
          >
            <span className="text-sm">🤖</span>
            <span>Android</span>
          </button>

          <button
            onClick={() => { setViewMode('guide'); setActivePlatform('desktop'); }}
            className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'guide' && activePlatform === 'desktop'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-a2hs-desktop"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>PC</span>
          </button>

          {/* User Requested: Dedicated Button for Video Tutorial */}
          <button
            onClick={() => setViewMode(viewMode === 'video' ? 'guide' : 'video')}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'video'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-200 border border-rose-500'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-900 border border-rose-200'
            }`}
            id="tab-a2hs-video-tutorial"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isKh ? 'វីដេអូបង្រៀន' : 'Video Tutorial'}</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          </button>
        </div>

        {/* Content Body: Video Tutorial Screen vs Step-by-Step Guide */}
        {viewMode === 'video' ? (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Video View Navigation Bar */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('guide')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isKh ? '← ត្រឡប់ទៅការណែនាំជាអក្សរ' : '← Back to Step-by-Step Guide'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Direct Server Stream
                </span>
              </div>
            </div>

            {/* Video Player Display */}
            {tutorialVideoUrl ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>{tutorialVideoTitle || (isKh ? 'វីដេអូបង្រៀន: របៀប Add to Home Screen' : 'Video Tutorial: How to Add to Home Screen')}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isKh ? 'ទស្សនាវីដេអូបង្រៀនងាយៗដើម្បីដំឡើង MINI MART POS លើទូរស័ព្ទរបស់អ្នក' : 'Watch this simple video to install MINI MART POS on your device'}
                  </p>
                </div>

                {/* Direct HTML5 Video Player (Hosted directly on Ubuntu server, NOT from YouTube) */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-slate-800 aspect-video group">
                  <video
                    key={tutorialVideoUrl}
                    src={tutorialVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    <source src={tutorialVideoUrl} type="video/mp4" />
                    <source src={tutorialVideoUrl} type="video/webm" />
                    <source src={tutorialVideoUrl} type="video/quicktime" />
                    Your browser does not support direct HTML5 video playback.
                  </video>
                </div>

                {/* Direct Server URL Banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <Film className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">
                      {isKh ? 'ប្រភពវីដេអូ Server Ubuntu:' : 'Ubuntu Server Direct URL:'}
                    </span>
                    <code className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                      {tutorialVideoUrl}
                    </code>
                  </div>
                  <a
                    href={tutorialVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold shrink-0 inline-flex items-center justify-center gap-1"
                  >
                    <span>{isKh ? 'បើកផ្ទាំងថ្មី' : 'Open in New Tab'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Key Steps Highlighted */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                  <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>{isKh ? 'ជំហានសង្ខេបដែលបង្ហាញក្នុងវីដេអូ' : 'Quick Steps Shown in Video'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100/80 shadow-2xs">
                      <div className="font-black text-indigo-600 text-[11px] mb-0.5">ជំហាន ១ (Step 1)</div>
                      <div className="text-slate-700 font-medium leading-relaxed">
                        {isKh ? 'បើក Browser (Safari លើ iOS ឬ Chrome លើ Android)' : 'Open Browser (Safari on iOS / Chrome on Android)'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100/80 shadow-2xs">
                      <div className="font-black text-indigo-600 text-[11px] mb-0.5">ជំហាន ២ (Step 2)</div>
                      <div className="text-slate-700 font-medium leading-relaxed">
                        {isKh ? 'ចុចប៊ូតុង Share ឬ Menu ចុចបី (⋮)' : 'Tap Share button or 3-dots Menu (⋮)'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100/80 shadow-2xs">
                      <div className="font-black text-indigo-600 text-[11px] mb-0.5">ជំហាន ៣ (Step 3)</div>
                      <div className="text-slate-700 font-medium leading-relaxed">
                        {isKh ? 'ជ្រើសរើស "Add to Home Screen" រួចចុច "Add"' : 'Select "Add to Home Screen" and tap "Add"'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center shadow-xs">
                  <VideoOff className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">
                    {isKh ? 'មិនទាន់មានវីដេអូបង្រៀនត្រូវបានបញ្ចូលទេ' : 'No Tutorial Video Uploaded Yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {isKh 
                      ? 'លោកអ្នកអាចមើលការណែនាំជាអក្សរ និងរូបភាពជំហានៗ ឬ Admin អាច Upload វីដេអូ (.mp4, .webm) រក្សាទុកផ្ទាល់លើ Ubuntu Server តាមរយៈផ្ទាំង Admin Console -> វីដេអូបង្រៀន A2HS ដោយមិនបាច់ប្រើប្រាស់ YouTube ឡើយ។' 
                      : 'You can follow the step-by-step guide below, or the Admin can upload an .mp4 tutorial directly to the Ubuntu server via Admin Console -> Video Tutorial.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('guide')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isKh ? 'មើលការណែនាំជាជំហានៗ' : 'View Step-by-Step Guide'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
        /* Step-by-Step Content Body */
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

          {/* User Requested: Banner to switch directly to Video Tutorial */}
          <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 rounded-2xl p-3.5 text-white shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black truncate">
                  {isKh ? 'ចង់មើលជាវីដេអូបង្រៀនងាយៗ?' : 'Prefer Watching a Video Tutorial?'}
                </h4>
                <p className="text-[11px] text-rose-100 truncate">
                  {isKh ? 'វីដេអូបង្ហាញពីរបៀប Add to Home Screen មួយជំហានម្តងៗ' : 'Watch clear step-by-step video instructions'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('video')}
              id="btn-open-video-guide-banner"
              className="px-3.5 py-2 bg-white text-rose-600 hover:bg-rose-50 active:scale-95 text-xs font-black rounded-xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isKh ? 'វីដេអូបង្រៀន' : 'Watch Video'}</span>
            </button>
          </div>

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
        )}

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isKh 
                ? 'ដំឡើងតែម្ដង ប្រើប្រាស់បានជារៀងរហូត' 
                : 'Install once and use anytime like a native app'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {viewMode === 'guide' ? (
              <button
                type="button"
                onClick={() => setViewMode('video')}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                id="btn-footer-video-tutorial"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isKh ? 'វីដេអូបង្រៀន' : 'Video Tutorial'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('guide')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                id="btn-footer-back-guide"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isKh ? 'ការណែនាំជាជំហាន' : 'Step-by-Step Guide'}</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              id="btn-dismiss-a2hs-guide"
            >
              <span>{isKh ? 'យល់ហើយ ចូលទៅកាន់ POS' : 'Got it, Open POS System'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
