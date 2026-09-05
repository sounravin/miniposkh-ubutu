import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Barcode, 
  Globe, 
  Menu, 
  X,
  Plus,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  ArrowRight,
  Crown,
  Moon,
  Sun,
  Tv
} from 'lucide-react';
import { Product, User, AppNotification, ActiveView } from '../types';
import { Logo } from './Logo';
import { sounds } from '../utils/audio';

interface HeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  openBarcodeScanner: () => void;
  openNewProductModal: () => void;
  onOpenCustomerDisplay?: () => void;
  language: 'en' | 'kh';
  setLanguage: (lang: 'en' | 'kh') => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAdminConsole?: () => void;
  onOpenProfileModal?: () => void;
  onOpenUpgradePlan?: () => void;
  toggleMobileSidebar?: () => void;
  notifications?: AppNotification[];
  onMarkAllNotificationsRead?: () => void;
  onRemoveNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onNavigateView?: (view: ActiveView) => void;
  onOpenCustomerMenuShare?: () => void;
  pendingOnlineOrdersCount?: number;
  onOpenIncomingOnlineOrders?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  onSelectProduct,
  openBarcodeScanner,
  openNewProductModal,
  onOpenCustomerDisplay,
  language,
  setLanguage,
  theme: propTheme,
  toggleTheme: propToggleTheme,
  currentUser,
  onLogout,
  onOpenAdminConsole,
  onOpenProfileModal,
  onOpenUpgradePlan,
  toggleMobileSidebar,
  notifications = [],
  onMarkAllNotificationsRead,
  onRemoveNotification,
  onClearAllNotifications,
  onNavigateView,
  onOpenCustomerMenuShare,
  pendingOnlineOrdersCount = 0,
  onOpenIncomingOnlineOrders
}) => {
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('minipos_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const activeTheme = propTheme || localTheme;

  const handleToggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else {
      const next = activeTheme === 'light' ? 'dark' : 'light';
      setLocalTheme(next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('minipos_theme', next);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'stock' | 'order'>('all');
  const [browserNotifPermission, setBrowserNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isKh = language === 'kh';

  // Real-time clock update
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString(isKh ? 'km-KH' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString(isKh ? 'km-KH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Filter products for fast search
  const searchResults = searchQuery.trim() === '' ? [] : products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nameKh && p.nameKh.includes(q)) ||
      p.barcode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (
        (!desktopSearchRef.current || !desktopSearchRef.current.contains(e.target as Node)) &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(e.target as Node))
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications by active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeNotifTab === 'all') return true;
    if (activeNotifTab === 'stock') return n.category === 'stock';
    if (activeNotifTab === 'order') return n.category === 'order';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotifPermission(perm);
        if (perm === 'granted') {
          new Notification(isKh ? 'MINI MART POS - ការជូនដំណឹង' : 'MINI MART POS Notifications', {
            body: isKh ? 'ការជូនដំណឹងត្រូវបានបើកដំណើរការដោយជោគជ័យ!' : 'Notifications are now enabled!',
            icon: '/apple-touch-icon.png'
          });
          sounds.playNotificationAlert();
        }
      } catch {
        // Safe fallback
      }
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return isKh ? 'ទើបតែឥឡូវ' : 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return isKh ? `${diffMin} នាទីមុន` : `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return isKh ? `${diffHours} ម៉ោងមុន` : `${diffHours}h ago`;
      return date.toLocaleDateString(isKh ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return isKh ? 'ទើបតែឥឡូវ' : 'Just now';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors">
      {/* Top Navbar Row */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left Area: Logo & Search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-2xl min-w-0">
          {/* Mobile menu trigger & Mobile Brand Logo */}
          <div className="flex items-center gap-1 sm:gap-2 md:hidden shrink-0">
            {toggleMobileSidebar && (
              <button 
                onClick={toggleMobileSidebar}
                className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Logo size={32} variant="badge" />
          </div>

          {/* Desktop Global Search Bar (Hidden on mobile, only visible on sm screens and up) */}
          <div ref={desktopSearchRef} className="hidden sm:block relative flex-1 min-w-0 max-w-xs sm:max-w-md">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 sm:left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="header-global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder={isKh ? "ស្វែងរកទំនិញ ឬលេខបាកូដ..." : "Search product or barcode..."}
                className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl pl-7 sm:pl-9 pr-7 sm:pr-14 py-1.5 sm:py-2 border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery ? (
                <button 
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                  Ctrl K
                </kbd>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                  {isKh ? 'លទ្ធផលស្វែងរក' : 'Matching Products'}
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto touch-scroll">
                  {searchResults.map((item) => (
                    <div
                      key={`desktop-search-${item.id}`}
                      onClick={() => {
                        onSelectProduct(item);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/60 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0" 
                        />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                            {item.name} {item.nameKh && <span className="text-xs font-normal text-slate-400">({item.nameKh})</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                            <span className="font-mono">#{item.barcode}</span>
                            <span>•</span>
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs sm:text-sm font-bold text-slate-900">${item.price.toFixed(2)}</div>
                        <div className={`text-[10px] sm:text-[11px] font-bold ${item.stock <= 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Stock: {item.stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        {/* Barcode Quick Action Button in Header */}
        <button
          id="header-scan-barcode-button"
          onClick={openBarcodeScanner}
          title={isKh ? "ស្កេនបាកូដដោយកាមេរ៉ា" : "Scan Barcode with Camera"}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-200 rounded-xl border border-indigo-100 transition-colors cursor-pointer shrink-0"
        >
          <Barcode className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">{isKh ? "ស្កេនបាកូដ" : "Scan Barcode"}</span>
        </button>

        {/* Add Product Shortcut */}
        <button
          id="header-add-product-btn"
          onClick={openNewProductModal}
          title={isKh ? "បន្ថែមទំនិញថ្មី" : "Add New Product"}
          className="hidden lg:flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isKh ? "ថែមទំនិញ" : "Add Product"}</span>
        </button>

        {/* Customer Facing Display Screen Button (Option for customer to view checkout & payment) */}
        {onOpenCustomerDisplay && (
          <button
            id="header-customer-display-btn"
            type="button"
            onClick={onOpenCustomerDisplay}
            title={isKh ? "ផ្ទាំងអេក្រង់អតិថិជន (Customer Display / Checkout)" : "Customer Display Screen (Checkout & Payment)"}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:bg-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shrink-0 shadow-2xs group"
          >
            <Tv className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-bold">
              {isKh ? "អេក្រង់អតិថិជន" : "Customer Screen"}
            </span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto sm:ml-2">
        {/* Language Switcher */}
        <button
          id="header-language-toggle-btn"
          onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 dark:active:bg-slate-700 transition-colors cursor-pointer"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{language === 'en' ? 'EN' : 'ខ្មែរ'}</span>
        </button>

        {/* Dark / Light Mode Toggle Button (Mobile & Desktop - placed between Language & Notifications) */}
        <button
          id="header-theme-toggle-btn"
          onClick={handleToggleTheme}
          className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all cursor-pointer flex items-center justify-center min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] shadow-2xs"
          title={activeTheme === 'dark' ? (isKh ? 'ប្ដូរទៅ Light Mode' : 'Switch to Light Mode') : (isKh ? 'ប្ដូរទៅ Dark Mode' : 'Switch to Dark Mode')}
          aria-label="Toggle Dark/Light Mode"
        >
          {activeTheme === 'dark' ? (
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 fill-amber-400/20 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-600 dark:text-slate-300 fill-slate-100 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            id="header-notification-btn"
            className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors cursor-pointer min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
            aria-label="Notifications"
            title={isKh ? "ការជូនដំណឹង" : "Notifications"}
          >
            <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 max-w-[92vw] bg-white rounded-3xl shadow-2xl border border-slate-100 p-3.5 z-50 animate-in fade-in zoom-in-95 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {isKh ? 'ការជូនដំណឹង' : 'Notifications'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {unreadCount > 0 
                        ? (isKh ? `មាន ${unreadCount} មិនទាន់អាន` : `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`)
                        : (isKh ? 'បានអានទាំងអស់រួចរាល់' : 'All caught up')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onMarkAllNotificationsRead && unreadCount > 0 && (
                    <button
                      onClick={() => onMarkAllNotificationsRead()}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 bg-indigo-50 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>{isKh ? 'អានទាំងអស់' : 'Mark all read'}</span>
                    </button>
                  )}
                  {onClearAllNotifications && notifications.length > 0 && (
                    <button
                      onClick={() => onClearAllNotifications()}
                      className="text-[10px] text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title={isKh ? 'លុបទាំងអស់' : 'Clear all'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 py-2 border-b border-slate-100 text-[11px] font-semibold">
                <button
                  onClick={() => setActiveNotifTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeNotifTab === 'all' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {isKh ? 'ទាំងអស់' : 'All'} ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveNotifTab('stock')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    activeNotifTab === 'stock' 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>{isKh ? 'ស្តុកទំនិញ' : 'Stock'}</span>
                </button>
                <button
                  onClick={() => setActiveNotifTab('order')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    activeNotifTab === 'order' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>{isKh ? 'ការលក់' : 'Sales'}</span>
                </button>
              </div>

              {/* Push permission prompt banner if not enabled */}
              {browserNotifPermission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
                <div className="my-2 p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between gap-2">
                  <div className="text-[10px] text-indigo-900 flex-1">
                    <span className="font-bold">{isKh ? 'បើកការជូនដំណឹងទូរស័ព្ទ/កុំព្យូទ័រ' : 'Enable system notifications'}</span>
                  </div>
                  <button
                    onClick={requestBrowserPermission}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-xs"
                  >
                    {isKh ? 'បើក' : 'Enable'}
                  </button>
                </div>
              )}

              {/* Notification List */}
              <div className="py-2 space-y-2 text-xs max-h-72 overflow-y-auto touch-scroll">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                    <Bell className="w-6 h-6 text-slate-300 stroke-1" />
                    <span>{isKh ? 'គ្មានការជូនដំណឹងថ្មីទេ' : 'No notifications'}</span>
                  </div>
                ) : (
                  filteredNotifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        if (n.linkView && onNavigateView) {
                          onNavigateView(n.linkView);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col gap-1 transition-all relative group cursor-pointer ${
                        n.type === 'warning' 
                          ? 'bg-amber-50/60 border-amber-200/70 hover:bg-amber-100/70 text-amber-950' 
                          : n.type === 'success'
                          ? 'bg-emerald-50/60 border-emerald-200/70 hover:bg-emerald-100/70 text-emerald-950'
                          : 'bg-indigo-50/60 border-indigo-200/70 hover:bg-indigo-100/70 text-indigo-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {n.type === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : n.type === 'success' ? (
                            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <span className="truncate">{n.title}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatRelativeTime(n.timestamp)}
                          </span>
                          {onRemoveNotification && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveNotification(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-600 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] opacity-85 leading-relaxed pl-5">
                        {n.desc}
                      </p>

                      {n.linkView && (
                        <div className="pl-5 pt-0.5 flex items-center gap-1 text-[10px] font-bold text-indigo-600 group-hover:text-indigo-800">
                          <span>{isKh ? 'ចុចដើម្បីពិនិត្យ' : 'View details'}</span>
                          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date & Time Widget */}
        <div className="hidden xl:flex flex-col text-right pl-1 pr-2 border-r border-slate-200">
          <span className="text-xs font-semibold text-slate-800">{formattedDate}</span>
          <span className="text-[11px] font-mono text-slate-400">{formattedTime}</span>
        </div>

        {/* User Profile Section with Direct Click Handlers */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="relative" ref={profileMenuRef}>
              <button
                id="header-user-profile-button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-left group"
                aria-label="User Profile"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-200/80 group-hover:ring-indigo-400 shrink-0 transition-all"
                />
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate block">
                      {currentUser.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                      currentUser.role === 'admin' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : currentUser.role === 'manager'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {currentUser.role}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md flex items-center gap-0.5 ${
                      currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <Crown className="w-2.5 h-2.5 text-amber-600" />
                      <span>{currentUser.plan === 'lifetime' || currentUser.role === 'admin' ? 'VIP' : 'FREE'}</span>
                    </span>
                  </div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-2.5 bg-slate-50 rounded-xl mb-2 flex items-center gap-3">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={currentUser.fullName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">{currentUser.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">@{currentUser.username}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                          currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {currentUser.plan === 'lifetime' || currentUser.role === 'admin' ? '👑 Lifetime VIP' : 'Free (10 Items)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Upgrade Plan Option in Dropdown */}
                    {onOpenUpgradePlan && (
                      <button
                        id="dropdown-upgrade-plan-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenUpgradePlan();
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                            ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-300" />
                          <span>{isKh ? 'Upgrade គម្រោង Lifetime' : 'Upgrade to Lifetime Plan'}</span>
                        </div>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/20">
                          {currentUser.plan === 'lifetime' || currentUser.role === 'admin' ? (isKh ? 'សកម្ម' : 'Active') : '$19'}
                        </span>
                      </button>
                    )}

                    {onOpenProfileModal && (
                      <button
                        id="dropdown-edit-profile-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenProfileModal();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-indigo-600" />
                        <span>{isKh ? 'កែប្រែ Profile & Upload រូបថត' : 'Edit Profile & Photo'}</span>
                      </button>
                    )}

                    {currentUser.role === 'admin' && onOpenAdminConsole && (
                      <button
                        id="dropdown-admin-console-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenAdminConsole();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>{isKh ? 'បើកផ្ទាំង Admin Console' : 'Open Admin Console'}</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100 mt-1 pt-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>{isKh ? 'ចាកចេញពីគណនី (Logout)' : 'Sign Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Mobile Search Bar Row (Directly below the top bar on mobile phone, exactly in the green box position) */}
      <div ref={mobileSearchRef} className="sm:hidden px-3 pb-2.5 pt-0.5 w-full bg-white dark:bg-slate-900 transition-colors">
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="header-mobile-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={isKh ? "ស្វែងរកទំនិញ ឬលេខបាកូដ..." : "Search product or barcode..."}
              className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl pl-9 pr-9 py-2 border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery ? (
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Mobile Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                {isKh ? 'លទ្ធផលស្វែងរក' : 'Matching Products'}
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto touch-scroll">
                {searchResults.map((item) => (
                  <div
                    key={`mobile-search-${item.id}`}
                    onClick={() => {
                      onSelectProduct(item);
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/60 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                          {item.name} {item.nameKh && <span className="text-xs font-normal text-slate-400">({item.nameKh})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                          <span className="font-mono">#{item.barcode}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">${item.price.toFixed(2)}</div>
                      <div className={`text-[10px] sm:text-[11px] font-bold ${item.stock <= 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Stock: {item.stock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
