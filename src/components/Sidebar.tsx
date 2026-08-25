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
  MessageCircle
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
  onOpenA2HSGuide
}) => {
  const isKh = language === 'kh';

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
    <aside className="w-72 md:w-64 max-w-[85vw] bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none pt-safe pb-safe overflow-y-auto touch-scroll">
      {/* Brand Header */}
      <div>
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100/80 bg-slate-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={42} variant="badge" />
            <div className="min-w-0">
              <h1 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-1.5 leading-tight truncate">
                MINI MART POS
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
                {isKh ? 'ប្រព័ន្ធគ្រប់គ្រងការលក់' : 'Retail POS System'}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 md:hidden cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
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
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.badgeColor 
                      ? item.badgeColor 
                      : isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
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
      <div className="border-t border-slate-100 bg-slate-50/70 p-3 space-y-2.5">
        {/* Add to Home Screen Guide Button */}
        {onOpenA2HSGuide && (
          <button
            type="button"
            onClick={() => {
              onOpenA2HSGuide();
              if (onCloseMobile) onCloseMobile();
            }}
            id="sidebar-a2hs-guide-btn"
            className="w-full flex items-center justify-between p-2 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/60 to-indigo-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/80 hover:border-indigo-300 transition-all duration-200 group shadow-2xs cursor-pointer"
            title={isKh ? 'របៀបដាក់លើអេក្រង់ដើម (Add to Home Screen)' : 'Add to Home Screen Guide'}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform text-xs">
                📲
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-indigo-950 truncate">
                  {isKh ? 'Add to Home Screen' : 'Install / Add to Home'}
                </div>
                <div className="text-[10px] text-indigo-600 font-medium truncate">
                  {isKh ? 'របៀបដំឡើងលើទូរស័ព្ទ' : 'Setup POS on Phone'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs shrink-0">
              {isKh ? 'មើល' : 'View'}
            </span>
          </button>
        )}

        {/* Telegram 24/7 Support Option */}
        <a
          href="https://t.me/laymeancamera"
          target="_blank"
          rel="noopener noreferrer"
          id="sidebar-telegram-support-link"
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-100/50 to-indigo-50/60 hover:from-sky-100 hover:via-sky-200/50 hover:to-indigo-100 border border-sky-200/80 hover:border-sky-300 transition-all duration-200 group shadow-2xs cursor-pointer block"
          title="Telegram Support: @laymeancamera"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#24A1DE] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
                <span>{isKh ? 'ជំនួយតាម Telegram' : 'Telegram Support'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </div>
              <div className="text-[10px] text-[#0088cc] font-mono font-semibold truncate mt-0.5">
                @laymeancamera
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-white group-hover:bg-[#24A1DE] text-[#0088cc] group-hover:text-white rounded-lg border border-sky-200 group-hover:border-[#24A1DE] text-[10px] font-bold shadow-2xs transition-all shrink-0">
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
            className="flex items-center justify-between p-2 rounded-2xl bg-white hover:bg-indigo-50/70 border border-slate-200/70 shadow-2xs cursor-pointer transition-all group"
            title={isKh ? "ចុចដើម្បីកែប្រែ Profile & រូបថត" : "Click to edit Profile & Photo"}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-100 group-hover:ring-indigo-300 shrink-0 transition-all"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>@{currentUser.username}</span>
                  <span>•</span>
                  <span className="uppercase text-[9px] font-bold text-indigo-600">{currentUser.role}</span>
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

