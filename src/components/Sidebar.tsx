import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  ReceiptText, 
  Settings, 
  QrCode,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Share2,
  Globe,
  Bell,
  ExternalLink,
  MessageCircle,
  Crown,
  Zap,
  Boxes
} from 'lucide-react';
import { ActiveView, User } from '../types';
import { Logo } from './Logo';
import { LogOut, X } from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  openBarcodeScanner: () => void;
  ordersCount: number;
  productsCount: number;
  pendingOnlineOrdersCount?: number;
  language: 'en' | 'kh';
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
  onCloseMobile?: () => void;
  onOpenCustomerMenuShare?: () => void;
  onOpenIncomingOnlineOrders?: () => void;
  onOpenA2HSGuide?: () => void;
  onOpenUpgradePlan?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  openBarcodeScanner,
  ordersCount,
  productsCount,
  pendingOnlineOrdersCount = 0,
  language,
  currentUser,
  onLogout,
  onOpenProfileModal,
  onCloseMobile,
  onOpenCustomerMenuShare,
  onOpenIncomingOnlineOrders,
  onOpenA2HSGuide,
  onOpenUpgradePlan
}) => {
  const isKh = language === 'kh';
  const isLifetime = currentUser?.plan === 'lifetime' || currentUser?.role === 'admin' || currentUser?.username === 'admin';

  const navItems: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string | number | null;
    badgeColor?: string;
  }> = [
    {
      id: 'pos' as ActiveView,
      label: isKh ? 'ផ្ទាំងលក់ POS' : 'Overview / POS',
      icon: LayoutDashboard,
      badge: null
    },
    ...(currentUser?.role === 'admin' ? [{
      id: 'admin_console' as ActiveView,
      label: isKh ? 'Admin Console' : 'Admin Console',
      icon: ShieldCheck,
      badge: isKh ? 'ADMIN' : 'ADMIN'
    }] : []),
    {
      id: 'products' as ActiveView,
      label: isKh ? 'គ្រប់គ្រងទំនិញ' : 'Products & Catalog',
      icon: Package,
      badge: productsCount
    },
    {
      id: 'orders' as ActiveView,
      label: isKh ? 'បញ្ជីលក់ & វិក្កយបត្រ' : 'Sales Orders',
      icon: ShoppingCart,
      badge: ordersCount > 0 ? ordersCount : null
    },
    {
      id: 'income_reports' as ActiveView,
      label: isKh ? 'ចំណូល & របាយការណ៍' : 'Income & Reports',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'member_breakdown' as ActiveView,
      label: isKh ? 'ស្ថិតិតាមសមាជិក' : 'Member Breakdown',
      icon: Boxes,
      badge: null
    },
    {
      id: 'expenses' as ActiveView,
      label: isKh ? 'គ្រប់គ្រងចំណាយ' : 'Expenses',
      icon: ReceiptText,
      badge: null
    },
    {
      id: 'customers' as ActiveView,
      label: isKh ? 'អតិថិជន & សមាជិក' : 'Customers & Loyalty',
      icon: Users,
      badge: null
    },
    {
      id: 'settings' as ActiveView,
      label: isKh ? 'ការកំណត់' : 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-72 md:w-64 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none pt-safe pb-safe overflow-y-auto touch-scroll transition-colors">
      {/* Brand Header */}
      <div>
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={42} variant="badge" />
            <div className="min-w-0">
              <h1 className="font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5 leading-tight truncate">
                MINI MART POS
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide truncate">
                {isKh ? 'ប្រព័ន្ធគ្រប់គ្រងការលក់' : 'Retail POS System'}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Buttons: 1. Barcode Scanner, 2. Share Customer Menu Link, 3. Online Orders Queue */}
        <div className="px-4 pt-3.5 pb-2 space-y-2">
          {/* Share Customer Menu CTA Button */}
          {onOpenCustomerMenuShare && (
            <button
              id="sidebar-share-menu-btn"
              onClick={onOpenCustomerMenuShare}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-200" />
                <span className="truncate">{isKh ? '📱 Link ម៉ឺនុយអតិថិជន' : '📱 Share Customer Menu'}</span>
              </div>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">QR</span>
            </button>
          )}

          {/* Pending Online Orders Quick Trigger */}
          {pendingOnlineOrdersCount > 0 && onOpenIncomingOnlineOrders && (
            <button
              onClick={onOpenIncomingOnlineOrders}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all animate-pulse cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                <span>{isKh ? 'កុម្ម៉ង់អនឡាញថ្មី!' : 'Online Orders!'}</span>
              </div>
              <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {pendingOnlineOrdersCount}
              </span>
            </button>
          )}

          {/* Barcode Quick Scanner */}
          <button
            id="sidebar-scan-barcode-btn"
            onClick={openBarcodeScanner}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isKh ? 'ស្កេនបាកូដ (Scan Barcode)' : 'Quick Scan Barcode'}</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.badgeColor 
                      ? item.badgeColor 
                      : isActive ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status & User Profile Card */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 p-3 space-y-2.5">
        {/* Add to Home Screen Guide Button */}
        {onOpenA2HSGuide && (
          <button
            type="button"
            onClick={() => {
              onOpenA2HSGuide();
              if (onCloseMobile) onCloseMobile();
            }}
            id="sidebar-a2hs-guide-btn"
            className="w-full flex items-center justify-between p-2 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/60 to-indigo-50 dark:from-indigo-950/50 dark:via-purple-950/40 dark:to-indigo-950/50 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/60 dark:hover:to-purple-900/60 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-300 transition-all duration-200 group shadow-2xs cursor-pointer"
            title={isKh ? 'របៀបដាក់លើអេក្រង់ដើម (Add to Home Screen)' : 'Add to Home Screen Guide'}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform text-xs">
                📲
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                  {isKh ? 'Add to Home Screen' : 'Install / Add to Home'}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium truncate">
                  {isKh ? 'របៀបដំឡើងលើទូរស័ព្ទ' : 'Setup POS on Phone'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs shrink-0">
              {isKh ? 'មើល' : 'View'}
            </span>
          </button>
        )}

        {/* Upgrade to Lifetime Plan Button (Placed right next to / above Telegram Support) */}
        {onOpenUpgradePlan && (
          <button
            type="button"
            id="sidebar-upgrade-plan-btn"
            onClick={() => {
              onOpenUpgradePlan();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 group shadow-xs cursor-pointer text-left ${
              isLifetime
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-emerald-950/40 border-amber-300 dark:border-amber-700/60 hover:border-amber-400'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] border-amber-500 shadow-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform ${
                isLifetime ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white' : 'bg-white/20 text-white'
              }`}>
                <Crown className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 text-left">
                <div className={`text-xs font-black flex items-center gap-1.5 leading-tight ${
                  isLifetime ? 'text-amber-950 dark:text-amber-200' : 'text-white'
                }`}>
                  <span>{isKh ? 'Upgrade គម្រោង' : 'Upgrade Plan'}</span>
                  {isLifetime ? (
                    <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                      LIFETIME
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping shrink-0" />
                  )}
                </div>
                <div className={`text-[10px] font-semibold truncate mt-0.5 ${
                  isLifetime ? 'text-amber-700 dark:text-amber-400' : 'text-amber-100'
                }`}>
                  {isLifetime ? (isKh ? 'ប្រើគ្មានដែនកំណត់' : 'Unlimited Products') : (isKh ? 'ដោះសោទំនិញគ្មានដែន' : 'Unlock Unlimited POS')}
                </div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg text-[10px] font-extrabold shadow-2xs transition-all shrink-0 flex items-center gap-1 ${
              isLifetime 
                ? 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 group-hover:bg-amber-100 dark:group-hover:bg-slate-700' 
                : 'bg-white text-amber-700 group-hover:bg-amber-50'
            }`}>
              <span>{isLifetime ? (isKh ? 'VIP' : 'Active') : (isKh ? 'Upgrade' : 'Get VIP')}</span>
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            </div>
          </button>
        )}

        {/* Telegram 24/7 Support Option */}
        <a
          href="https://t.me/laymeancamera"
          target="_blank"
          rel="noopener noreferrer"
          id="sidebar-telegram-support-link"
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-100/50 to-indigo-50/60 dark:from-sky-950/40 dark:via-sky-900/30 dark:to-indigo-950/40 hover:from-sky-100 hover:via-sky-200/50 hover:to-indigo-100 border border-sky-200/80 dark:border-sky-800/60 hover:border-sky-300 transition-all duration-200 group shadow-2xs cursor-pointer block"
          title="Telegram Support: @laymeancamera"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#24A1DE] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-tight">
                <span>{isKh ? 'ជំនួយតាម Telegram' : 'Telegram Support'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </div>
              <div className="text-[10px] text-[#0088cc] dark:text-sky-400 font-mono font-semibold truncate mt-0.5">
                @laymeancamera
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 group-hover:bg-[#24A1DE] text-[#0088cc] dark:text-sky-300 group-hover:text-white rounded-lg border border-sky-200 dark:border-sky-700/60 group-hover:border-[#24A1DE] text-[10px] font-bold shadow-2xs transition-all shrink-0">
            <span>{isKh ? 'ឆាត' : 'Chat'}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </a>

        {currentUser && (
          <div 
            onClick={() => {
              if (onOpenProfileModal) {
                onOpenProfileModal();
                if (onCloseMobile) onCloseMobile();
              }
            }}
            className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs cursor-pointer transition-all group"
            title={isKh ? "ចុចដើម្បីកែប្រែ Profile & រូបថត" : "Click to edit Profile & Photo"}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-100 dark:ring-indigo-900 group-hover:ring-indigo-300 shrink-0 transition-all"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>@{currentUser.username}</span>
                  <span>•</span>
                  <span className="uppercase text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{currentUser.role}</span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title={isKh ? "ចាកចេញពីគណនី" : "Logout"}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>MINI-POS v2.5</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">ONLINE</span>
        </div>
      </div>
    </aside>
  );
};

