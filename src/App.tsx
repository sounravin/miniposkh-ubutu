import React, { useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  Expense, 
  Customer, 
  TableInfo, 
  ShopSettings, 
  ActiveView,
  User,
  ActivityLog,
  AppNotification
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_EXPENSES, 
  INITIAL_CUSTOMERS, 
  INITIAL_TABLES, 
  INITIAL_SETTINGS 
} from './data/initialData';
import { sounds } from './utils/audio';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { PosView } from './components/PosView';
import { CartDrawer } from './components/CartDrawer';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProductsManager } from './components/ProductsManager';
import { IncomeReports } from './components/IncomeReports';
import { ExpensesManager } from './components/ExpensesManager';
import { OrdersManager } from './components/OrdersManager';
import { TablesManager } from './components/TablesManager';
import { CustomersManager } from './components/CustomersManager';
import { SettingsManager } from './components/SettingsManager';
import { WelcomeAuthPage } from './components/WelcomeAuthPage';
import { AdminConsole } from './components/AdminConsole';
import { UserProfileModal } from './components/UserProfileModal';
import { CustomerCatalogView } from './components/CustomerCatalogView';
import { CustomerMenuShareModal } from './components/CustomerMenuShareModal';
import { IncomingOnlineOrdersDrawer } from './components/IncomingOnlineOrdersDrawer';
import { AddToHomeScreenGuideModal } from './components/AddToHomeScreenGuideModal';
import { Share2 } from 'lucide-react';
import {
  initializeFirestoreDatabase,
  subscribeToProducts,
  subscribeToOrders,
  subscribeToExpenses,
  subscribeToCustomers,
  subscribeToTables,
  subscribeToUsers,
  subscribeToActivityLogs,
  subscribeToSettings,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  saveTableToFirestore,
  saveSettingsToFirestore,
  logUserActivity,
  DEFAULT_USERS,
  LOCAL_STORAGE_KEYS,
  getCachedData,
  setCachedData,
  fetchAllCloudData,
  syncAllLocalDataToFirestore,
  isSyncDue,
  incrementPendingChanges,
  getLastSyncTime
} from './lib/firestoreService';

export default function App() {
  // Current Auth User Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('minipos_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // 1. Local-First Caching State with Periodic & Manual Cloud Synchronization
  const [products, setProducts] = useState<Product[]>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  });
  const [tables, setTables] = useState<TableInfo[]>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES);
  });
  const [settings, setSettings] = useState<ShopSettings>(() => {
    return getCachedData(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  });

  // Filter products, orders, expenses by user account (Multi-user Strict Data Isolation)
  const userProducts = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      return products.filter(p => !p.userId || p.userId === 'user-admin' || p.userId === currentUser.id);
    }
    return products.filter(p => p.userId === currentUser.id);
  }, [products, currentUser]);

  const userOrders = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      return orders.filter(o => !o.userId || o.userId === 'user-admin' || o.userId === currentUser.id);
    }
    return orders.filter(o => o.userId === currentUser.id);
  }, [orders, currentUser]);

  const userExpenses = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      return expenses.filter(e => !e.userId || e.userId === 'user-admin' || e.userId === currentUser.id);
    }
    return expenses.filter(e => e.userId === currentUser.id);
  }, [expenses, currentUser]);

  const userCustomers = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.id === 'user-admin' || currentUser.username === 'admin') {
      return customers.filter(c => !c.userId || c.userId === 'user-admin' || c.userId === currentUser.id);
    }
    return customers.filter(c => c.userId === currentUser.id);
  }, [customers, currentUser]);

  // 2. Active Screen State
  const [activeView, setActiveView] = useState<ActiveView>('pos');
  const [cashierName, setCashierName] = useState('MD Atikur Rhaman');
  const [language, setLanguage] = useState<'en' | 'kh'>(() => {
    return (localStorage.getItem('minipos_lang') as 'en' | 'kh') || 'kh';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 2.1 Notifications Management Engine
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('minipos_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'notif-welcome-1',
        title: 'ស្វាគមន៍មកកាន់ MINI MART POS',
        desc: 'ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកទំនិញត្រូវបានបើកដំណើរការដោយជោគជ័យ។',
        type: 'info',
        category: 'system',
        read: false,
        timestamp: new Date().toISOString()
      }
    ];
  });

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('minipos_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications:', e);
    }
  }, [notifications]);

  // Dispatch / add a new notification with sound and system push
  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
    sounds.playNotificationAlert();

    // Trigger Native Browser Web Notification if allowed
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.title, {
          body: newNotif.desc,
          icon: '/apple-touch-icon.png'
        });
      } catch {
        // Safe fallback
      }
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Automatically monitor and generate alerts for Low Stock (< 5)
  useEffect(() => {
    if (userProducts.length === 0) return;
    const lowStockItems = userProducts.filter(p => p.stock <= 5);
    if (lowStockItems.length > 0) {
      setNotifications(prev => {
        let next = [...prev];
        let hasNew = false;
        for (const item of lowStockItems) {
          const alertId = `stock-alert-${item.id}`;
          if (!next.some(n => n.id === alertId)) {
            next.unshift({
              id: alertId,
              title: language === 'kh' ? `⚠️ ស្តុកទាប៖ ${item.name}` : `⚠️ Low Stock: ${item.name}`,
              desc: language === 'kh'
                ? `ទំនិញ "${item.name}" (#${item.barcode}) នៅសល់តែ ${item.stock} ឯកតាប៉ុណ្ណោះក្នុងស្តុក។`
                : `Product "${item.name}" (#${item.barcode}) has only ${item.stock} unit(s) remaining.`,
              type: 'warning',
              category: 'stock',
              read: false,
              timestamp: new Date().toISOString(),
              linkView: 'products'
            });
            hasNew = true;
          }
        }
        return hasNew ? next : prev;
      });
    }
  }, [userProducts, language]);

  // Initialize Firestore and Real-time Listeners with Local-First Caching
  useEffect(() => {
    initializeFirestoreDatabase();

    const doInitialSync = async () => {
      try {
        const cloudData = await fetchAllCloudData();
        if (cloudData) {
          if (cloudData.products && cloudData.products.length > 0) setProducts(cloudData.products);
          if (cloudData.orders && cloudData.orders.length > 0) setOrders(cloudData.orders);
          if (cloudData.expenses && cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
          if (cloudData.customers && cloudData.customers.length > 0) setCustomers(cloudData.customers);
          if (cloudData.tables && cloudData.tables.length > 0) setTables(cloudData.tables);
          if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
          if (cloudData.settings) setSettings(cloudData.settings);
        }

        // Auto-Sync if 2-3 days have elapsed
        if (isSyncDue(3)) {
          console.log('⏰ 3-Day Periodic Auto-Sync Triggered...');
          await syncAllLocalDataToFirestore({
            products,
            orders,
            expenses,
            customers,
            tables,
            users,
            settings
          });
        }
      } catch (err) {
        console.warn('Initial cloud sync warning:', err);
      }
    };

    doInitialSync();

    // Lightweight live subscribers for users, logs, and shop settings
    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        setCachedData(LOCAL_STORAGE_KEYS.USERS, cloudUsers);
      }
    });

    const unsubLogs = subscribeToActivityLogs((cloudLogs) => {
      setActivityLogs(cloudLogs);
    });

    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
        setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, cloudSettings);
      }
    });

    return () => {
      unsubUsers();
      unsubLogs();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('minipos_lang', language);
    if (language === 'kh') {
      document.body.classList.add('lang-kh');
    } else {
      document.body.classList.remove('lang-kh');
    }
  }, [language]);

  // Auth login handler: fetches latest dataset from Cloud and caches in Local Storage
  const handleLoginSuccess = async (user: User, isNewRegistration = false) => {
    setCurrentUser(user);
    setCashierName(user.fullName);
    localStorage.setItem('minipos_auth_user', JSON.stringify(user));
    setCartItems([]);
    setDiscount(0);
    setOrderNote('');
    setCustomerName('');
    setActiveView('pos');

    // Trigger Add to Home Screen guide ONLY ONCE when registering for the first time
    if (isNewRegistration) {
      const promptedKey = `minipos_a2hs_prompted_${user.id}`;
      const alreadyPrompted = localStorage.getItem(promptedKey);
      if (!alreadyPrompted) {
        setIsA2HSGuideOpen(true);
        localStorage.setItem(promptedKey, 'true');
        localStorage.setItem('minipos_a2hs_global_seen', 'true');
      }
    }

    try {
      const cloudData = await fetchAllCloudData();
      if (cloudData) {
        if (cloudData.products && cloudData.products.length > 0) setProducts(cloudData.products);
        if (cloudData.orders && cloudData.orders.length > 0) setOrders(cloudData.orders);
        if (cloudData.expenses && cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
        if (cloudData.customers && cloudData.customers.length > 0) setCustomers(cloudData.customers);
        if (cloudData.tables && cloudData.tables.length > 0) setTables(cloudData.tables);
        if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
        if (cloudData.settings) setSettings(cloudData.settings);
      }
      if (isSyncDue(3)) {
        await syncAllLocalDataToFirestore({
          products: cloudData?.products || products,
          orders: cloudData?.orders || orders,
          expenses: cloudData?.expenses || expenses,
          customers: cloudData?.customers || customers,
          tables: cloudData?.tables || tables,
          users: cloudData?.users || users,
          settings: cloudData?.settings || settings
        });
      }
    } catch (err) {
      console.warn('Post-login cloud fetch skipped:', err);
    }
  };

  // Auth logout handler
  const handleLogout = () => {
    if (currentUser) {
      logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'LOGOUT',
        `${currentUser.fullName} signed out`
      ).catch((err) => console.warn('Logout log skipped:', err));
    }
    setCurrentUser(null);
    setCartItems([]);
    localStorage.removeItem('minipos_auth_user');
    setMobileSidebarOpen(false);
  };

  // 3. Current Order / Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('Counter 01 (Main POS)');
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [orderNote, setOrderNote] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  // 4. Modals State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [isCustomerMenuShareOpen, setIsCustomerMenuShareOpen] = useState(false);
  const [isIncomingOrdersDrawerOpen, setIsIncomingOrdersDrawerOpen] = useState(false);
  const [isA2HSGuideOpen, setIsA2HSGuideOpen] = useState(false);

  // BroadcastChannel listener for real-time customer online orders
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('minipos_online_orders');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_CUSTOMER_ORDER') {
          const ord = event.data.order as Order;
          const targetUserId = event.data.targetUserId;

          // Account Isolation: filter notifications only for the intended store owner / cashier
          if (currentUser) {
            const isMatch = (currentUser.id === 'user-admin' || currentUser.role === 'admin')
              ? (!targetUserId || targetUserId === 'user-admin' || targetUserId === currentUser.id || targetUserId === ord?.userId)
              : (targetUserId === currentUser.id || ord?.userId === currentUser.id);
            
            if (!isMatch) return;
          }

          sounds.playNotificationAlert();
          addNotification({
            title: language === 'kh' ? '🔔 មានការកុម្ម៉ង់ថ្មីពីអតិថិជន!' : '🔔 New Customer Order Received!',
            desc: language === 'kh' 
              ? `អតិថិជន ${ord?.customerName || 'អនឡាញ'} បានផ្ញើការកុម្ម៉ង់ #${ord?.orderNumber} (សរុប $${ord?.total?.toFixed(2) || '0.00'})`
              : `Customer ${ord?.customerName || 'Online'} placed order #${ord?.orderNumber} (Total $${ord?.total?.toFixed(2) || '0.00'})`,
            type: 'info',
            category: 'order',
            linkView: 'orders'
          });
          setIsIncomingOrdersDrawerOpen(true);
        }
      };
      return () => {
        channel.close();
      };
    }
  }, [language, currentUser]);

  // Load an online customer order directly into POS current order to checkout
  const handleLoadOrderToPOS = (order: Order) => {
    setCartItems(order.items || []);
    if (order.customerName) setCustomerName(order.customerName);
    if (order.tableNumber) setSelectedTable(order.tableNumber);
    if (order.note) setOrderNote(order.note);
    if (typeof order.discount === 'number') setDiscount(order.discount);
    if (order.discountType) setDiscountType(order.discountType);
    setActiveView('pos');
    setIsMobileCartOpen(true);
    sounds.playSuccessChime();
    addNotification({
      title: language === 'kh' ? '📥 បានបញ្ចូលក្នុង Current Order' : '📥 Loaded into POS Order',
      desc: language === 'kh'
        ? `ការកុម្ម៉ង់ #${order.orderNumber} ត្រូវបានបញ្ចូលក្នុងកន្ត្រក POS ដើម្បីត្រៀមគិតលុយ!`
        : `Order #${order.orderNumber} loaded into checkout cart!`,
      type: 'success',
      category: 'order',
      linkView: 'pos'
    });
  };

  // Profile update handler
  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('minipos_auth_user', JSON.stringify(updatedUser));
  };

  // Handle Cart Operations
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1
        };
        return next;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    setIsMobileCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setOrderNote('');
    setCustomerName('');
  };

  // Barcode scanned callback
  const handleBarcodeScanSuccess = (product: Product) => {
    handleAddToCart(product);
  };

  // Complete Order & Save with Local-First State & Cache
  const handleOrderCompleted = async (newOrder: Order) => {
    const orderWithUser: Order = {
      ...newOrder,
      userId: currentUser?.id || 'user-admin'
    };
    
    // 1. Immediately update Orders state & local cache
    setOrders(prev => {
      const updated = [orderWithUser, ...prev.filter(o => o.id !== orderWithUser.id)];
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, updated);
      return updated;
    });

    // 2. Immediately decrement product stock in local state & cache
    setProducts(prev => {
      const next = prev.map(p => {
        const item = newOrder.items.find(it => it.product.id === p.id);
        if (item) {
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        }
        return p;
      });
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, next);
      return next;
    });

    // 3. Increment pending changes count for cloud sync
    incrementPendingChanges();

    // 4. Update customer lifetime stats & points if customer is provided
    if (orderWithUser.customerName && orderWithUser.customerName !== 'Walk-in Customer' && orderWithUser.customerName !== 'Draft Order') {
      setCustomers(prev => {
        const next = prev.map(c => {
          if (c.name.toLowerCase() === orderWithUser.customerName?.toLowerCase()) {
            return {
              ...c,
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + orderWithUser.total,
              points: c.points + Math.round(orderWithUser.total),
              lastVisit: new Date().toISOString().slice(0, 10)
            };
          }
          return c;
        });
        setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });

      const matchedCust = customers.find(c => c.name.toLowerCase() === orderWithUser.customerName?.toLowerCase());
      if (matchedCust) {
        const updatedCust: Customer = {
          ...matchedCust,
          totalOrders: matchedCust.totalOrders + 1,
          totalSpent: matchedCust.totalSpent + orderWithUser.total,
          points: matchedCust.points + Math.round(orderWithUser.total),
          lastVisit: new Date().toISOString().slice(0, 10)
        };
        saveCustomerToFirestore(updatedCust).catch(() => {});
      }
    }

    // 5. Async cloud saves (non-blocking)
    saveOrderToFirestore(orderWithUser).catch((err) => {
      console.warn('Background order save:', err);
    });

    for (const item of newOrder.items) {
      const p = products.find(prod => prod.id === item.product.id);
      if (p) {
        const updatedStock = Math.max(0, p.stock - item.quantity);
        const updatedProduct: Product = { ...p, stock: updatedStock, userId: p.userId || currentUser?.id || 'user-admin' };
        saveProductToFirestore(updatedProduct).catch(() => {});
      }
    }

    if (currentUser) {
      logUserActivity(
        currentUser.id, 
        currentUser.username, 
        currentUser.role, 
        'COMPLETED_SALE', 
        `Completed order #${orderWithUser.orderNumber} for $${orderWithUser.total.toFixed(2)}`
      ).catch(() => {});
    }

    // Complete Order UI
    setIsPaymentModalOpen(false);
    setActiveReceiptOrder(orderWithUser);

    // Dispatch real-time sale notification
    addNotification({
      title: language === 'kh' 
        ? `✅ ការកុម្ម៉ង់ #${orderWithUser.orderNumber} បានទូទាត់ជោគជ័យ` 
        : `✅ Order #${orderWithUser.orderNumber} Paid`,
      desc: language === 'kh'
        ? `ទទួលបានសរុប ${orderWithUser.total.toFixed(2)} (${orderWithUser.totalKhr.toLocaleString()} ៛) តាម ${orderWithUser.paymentMethod.toUpperCase()} (${orderWithUser.customerName || 'ទូទៅ'})`
        : `Received ${orderWithUser.total.toFixed(2)} (${orderWithUser.totalKhr.toLocaleString()} KHR) via ${orderWithUser.paymentMethod.toUpperCase()} (${orderWithUser.customerName || 'Walk-in'})`,
      type: 'success',
      category: 'order',
      linkView: 'orders'
    });

    // Reset current order
    setCartItems([]);
    setDiscount(0);
    setOrderNote('');
    setCustomerName('');
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (cartItems.length === 0) return;
    
    const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const computedDiscount = discountType === 'percent' ? (subtotal * discount) / 100 : discount;
    const tax = Math.max(0, subtotal - computedDiscount) * settings.taxRate;
    const total = Math.max(0, subtotal - computedDiscount) + tax;

    const draftOrder: Order = {
      id: `ord-draft-${Date.now()}`,
      userId: currentUser?.id || 'user-admin',
      orderNumber: `DRF-${Math.floor(1000 + Math.random() * 9000)}`,
      items: [...cartItems],
      subtotal,
      discount,
      discountType,
      tax,
      taxRate: settings.taxRate,
      total,
      totalKhr: total * settings.khrExchangeRate,
      paymentMethod: 'cash',
      amountPaid: 0,
      changeDue: 0,
      tableNumber: selectedTable,
      customerName: customerName || (language === 'kh' ? 'សេចក្តីព្រាង' : 'Draft Order'),
      cashierName: currentUser?.fullName || cashierName,
      status: 'draft',
      createdAt: new Date().toISOString(),
      note: orderNote
    };

    setOrders(prev => {
      const next = [draftOrder, ...prev.filter(o => o.id !== draftOrder.id)];
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, next);
      return next;
    });
    incrementPendingChanges();
    saveOrderToFirestore(draftOrder).catch(() => {});

    setCartItems([]);
    alert(language === 'kh' ? 'ការកុម្ម៉ង់ត្រូវបានរក្សាទុកក្នុងសេចក្តីព្រាង (Draft)!' : 'Order saved as draft!');
  };

  // Product CRUD with Local-First Caching & Pending Sync Tracking
  const handleAddProduct = async (newProd: Product) => {
    const prodWithUser: Product = {
      ...newProd,
      userId: currentUser?.id || 'user-admin',
      createdAt: newProd.createdAt || new Date().toISOString()
    };
    
    // Update state and localStorage immediately
    setProducts(prev => {
      const updated = [prodWithUser, ...prev.filter(p => p.id !== prodWithUser.id)];
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
    incrementPendingChanges();

    addNotification({
      title: language === 'kh' ? `✨ បានបន្ថែមទំនិញ៖ ${prodWithUser.name}` : `✨ Product Added: ${prodWithUser.name}`,
      desc: language === 'kh' 
        ? `បានបញ្ចូលទៅក្នុងស្តុកចំនួន ${prodWithUser.stock} (តម្លៃ ${prodWithUser.price.toFixed(2)})`
        : `Added to inventory with ${prodWithUser.stock} in stock (Price ${prodWithUser.price.toFixed(2)})`,
      type: 'info',
      category: 'stock',
      linkView: 'products'
    });

    if (currentUser) {
      logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'ADD_PRODUCT', `Added product "${prodWithUser.name}"`).catch(() => {});
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    const prodWithUser: Product = {
      ...updated,
      userId: updated.userId || currentUser?.id || 'user-admin'
    };

    // Update state and localStorage immediately
    setProducts(prev => {
      const next = prev.map(p => p.id === prodWithUser.id ? prodWithUser : p);
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, next);
      return next;
    });
    incrementPendingChanges();

    if (currentUser) {
      logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'UPDATE_PRODUCT', `Updated product "${prodWithUser.name}"`).catch(() => {});
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const target = products.find(p => p.id === productId);
    
    // Update state and localStorage immediately
    setProducts(prev => {
      const next = prev.filter(p => p.id !== productId);
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, next);
      return next;
    });
    incrementPendingChanges();

    if (currentUser && target) {
      logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'DELETE_PRODUCT', `Deleted product "${target.name}"`).catch(() => {});
    }
  };

  // Expense CRUD with Local-First Caching
  const handleAddExpense = async (expense: Expense) => {
    const expWithUser: Expense = {
      ...expense,
      userId: currentUser?.id || 'user-admin'
    };

    setExpenses(prev => {
      const next = [expWithUser, ...prev];
      setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, next);
      return next;
    });
    incrementPendingChanges();
    
    addNotification({
      title: language === 'kh' ? `💸 ចំណាយថ្មី៖ ${expense.title}` : `💸 New Expense: ${expense.title}`,
      desc: language === 'kh'
        ? `បានកត់ត្រាចំណាយទឹកប្រាក់ ${expense.amount.toFixed(2)} (${expense.category})`
        : `Recorded expense of ${expense.amount.toFixed(2)} (${expense.category})`,
      type: 'info',
      category: 'expense',
      linkView: 'expenses'
    });

    if (currentUser) {
      logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'ADD_EXPENSE', `Logged expense "${expense.title}" of ${expense.amount}`).catch(() => {});
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== expenseId);
      setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, next);
      return next;
    });
    incrementPendingChanges();
  };

  // Customer CRUD with Local-First Caching
  const handleAddCustomer = async (customer: Customer) => {
    const custWithUser: Customer = {
      ...customer,
      userId: currentUser?.id || 'user-admin'
    };

    setCustomers(prev => {
      const next = [custWithUser, ...prev.filter(c => c.id !== custWithUser.id)];
      setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, next);
      return next;
    });
    incrementPendingChanges();

    if (currentUser) {
      logUserActivity(currentUser.id, currentUser.username, currentUser.role, 'ADD_CUSTOMER', `Registered customer "${customer.name}"`).catch(() => {});
    }
  };

  // Order Status update
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, status } : o);
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, next);
      return next;
    });
    incrementPendingChanges();
    updateOrderStatusInFirestore(orderId, status).catch(() => {});
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, next);
      return next;
    });
    incrementPendingChanges();
    deleteOrderFromFirestore(orderId).catch(() => {});
  };

  // Table Status
  const handleUpdateTableStatus = async (tableId: string, status: TableInfo['status']) => {
    setTables(prev => {
      const next = prev.map(t => t.id === tableId ? { ...t, status } : t);
      setCachedData(LOCAL_STORAGE_KEYS.TABLES, next);
      return next;
    });
    incrementPendingChanges();
  };

  const handleSelectTableForPOS = (tableName: string) => {
    setSelectedTable(tableName);
    setActiveView('pos');
  };

  // Settings update with Local-First Caching
  const handleUpdateSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, newSettings);
    incrementPendingChanges();
    saveSettingsToFirestore(newSettings).catch(() => {});
  };

  // Reset to initial demo data
  const handleResetData = async () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setExpenses(INITIAL_EXPENSES);
    setCustomers(INITIAL_CUSTOMERS);
    setTables(INITIAL_TABLES);
    setSettings(INITIAL_SETTINGS);

    setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setCachedData(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setCachedData(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES);
    setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    incrementPendingChanges();
  };

  // Cloud Sync handlers for Admin Console
  const handleSyncAllToCloud = async () => {
    const res = await syncAllLocalDataToFirestore({
      products,
      orders,
      expenses,
      customers,
      tables,
      users,
      settings
    });
    return res;
  };

  const handleFetchLatestFromCloud = async () => {
    const cloudData = await fetchAllCloudData();
    if (cloudData) {
      if (cloudData.products && cloudData.products.length > 0) setProducts(cloudData.products);
      if (cloudData.orders && cloudData.orders.length > 0) setOrders(cloudData.orders);
      if (cloudData.expenses && cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
      if (cloudData.customers && cloudData.customers.length > 0) setCustomers(cloudData.customers);
      if (cloudData.tables && cloudData.tables.length > 0) setTables(cloudData.tables);
      if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
      if (cloudData.settings) setSettings(cloudData.settings);
    }
  };

  // Calculate pending online orders strictly for current user
  const pendingOnlineOrders = userOrders.filter(o => o.status === 'pending_online');

  // Check if opened directly via customer self-order link (?mode=customer_menu)
  const isDirectCustomerMenu = typeof window !== 'undefined' && 
    (window.location.search.includes('mode=customer_menu') || window.location.hash.includes('customer_menu'));

  // Get targeted storeId from query string (?storeId=...)
  const rawStoreId = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('storeId') || new URLSearchParams(window.location.search).get('userId') || '')
    : '';

  // If accessed directly via customer self-order link (?mode=customer_menu), render the Customer Dashboard immediately
  if (isDirectCustomerMenu) {
    const targetUser = users.find(u => 
      (rawStoreId && (u.id === rawStoreId || u.username.toLowerCase() === rawStoreId.toLowerCase()))
    );

    const resolvedStoreId = targetUser ? targetUser.id : (rawStoreId || 'user-admin');
    const storeOwnerName = targetUser?.fullName || (resolvedStoreId === 'user-admin' ? (settings.shopNameKh || settings.shopName) : resolvedStoreId);

    // Strict Account Isolation: NEVER leak or mix products from different store accounts
    const storeProducts = (resolvedStoreId === 'user-admin' || resolvedStoreId === 'admin')
      ? products.filter(p => !p.userId || p.userId === 'user-admin' || p.userId === 'admin')
      : products.filter(p => p.userId === resolvedStoreId);

    // Dedicated isolated store configuration
    const storeSettings: ShopSettings = {
      ...settings,
      shopName: targetUser?.fullName || settings.shopName,
      shopNameKh: targetUser?.fullName || settings.shopNameKh,
      phone: targetUser?.phone || settings.phone,
      email: targetUser?.email || settings.email,
      khqrImage: targetUser?.khqrImage || (targetUser?.role === 'admin' ? settings.khqrImage : ''),
      khqrMerchantName: targetUser?.khqrMerchantName || targetUser?.fullName || settings.khqrMerchantName,
      khqrAccountName: targetUser?.khqrAccountName || targetUser?.fullName || settings.khqrAccountName,
      khqrAccountNumber: targetUser?.khqrAccountNumber || (targetUser?.role === 'admin' ? settings.khqrAccountNumber : ''),
      khqrBankName: targetUser?.khqrBankName || settings.khqrBankName
    };

    return (
      <CustomerCatalogView
        products={storeProducts}
        settings={storeSettings}
        language={language}
        isStandalone={true}
        storeId={resolvedStoreId}
        storeOwnerName={storeOwnerName}
        onOrderSubmitted={(newOrd) => {
          console.log('Customer online order submitted for store:', resolvedStoreId, newOrd);
        }}
      />
    );
  }

  // If user is not logged in, display the dedicated Welcome / Auth page
  if (!currentUser) {
    return (
      <WelcomeAuthPage
        onLoginSuccess={handleLoginSuccess}
        language={language}
        setLanguage={setLanguage}
        users={users}
        onUserRegistered={(newUser) => {
          setUsers(prev => [newUser, ...prev.filter(u => u.id !== newUser.id)]);
        }}
      />
    );
  }

  // If Admin is in dedicated Admin Console View
  if (activeView === 'admin_console' && currentUser.role === 'admin') {
    return (
      <>
        <AdminConsole
          currentUser={currentUser}
          users={users}
          activityLogs={activityLogs}
          language={language}
          onNavigateToPos={() => setActiveView('pos')}
          onLogout={handleLogout}
          onUpdateCurrentUser={handleUpdateCurrentUser}
          products={products}
          orders={orders}
          expenses={expenses}
          customers={customers}
          tables={tables}
          settings={settings}
          onSyncAllToCloud={handleSyncAllToCloud}
          onFetchLatestFromCloud={handleFetchLatestFromCloud}
        />
        {isProfileModalOpen && (
          <UserProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={currentUser}
            onUpdateUser={handleUpdateCurrentUser}
            onUserUpdated={handleUpdateCurrentUser}
            language={language}
          />
        )}
        <AddToHomeScreenGuideModal
          isOpen={isA2HSGuideOpen}
          onClose={() => setIsA2HSGuideOpen(false)}
          language={language}
          userName={currentUser?.fullName}
          userId={currentUser?.id}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f5f6fa] flex text-slate-800 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* 1. Left Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 md:relative md:z-auto transition-all duration-200 ${
        mobileSidebarOpen 
          ? 'translate-x-0 opacity-100 visible pointer-events-auto' 
          : '-translate-x-full opacity-0 invisible md:opacity-100 md:visible md:translate-x-0 pointer-events-none md:pointer-events-auto'
      }`}>
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            setMobileSidebarOpen(false);
          }}
          openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          ordersCount={userOrders.length}
          productsCount={userProducts.length}
          pendingOnlineOrdersCount={pendingOnlineOrders.length}
          language={language}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenCustomerMenuShare={() => setIsCustomerMenuShareOpen(true)}
          onOpenIncomingOnlineOrders={() => setIsIncomingOrdersDrawerOpen(true)}
          onOpenA2HSGuide={() => setIsA2HSGuideOpen(true)}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 max-w-full h-screen overflow-y-auto overflow-x-hidden touch-scroll">
        {/* Top Header */}
        <Header
          products={userProducts}
          onSelectProduct={(p) => {
            handleAddToCart(p);
            setActiveView('pos');
          }}
          openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          openNewProductModal={() => setActiveView('products')}
          language={language}
          setLanguage={setLanguage}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAdminConsole={() => setActiveView('admin_console')}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          notifications={notifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onRemoveNotification={handleRemoveNotification}
          onClearAllNotifications={handleClearAllNotifications}
          onNavigateView={(v) => setActiveView(v)}
          onOpenCustomerMenuShare={() => setIsCustomerMenuShareOpen(true)}
          pendingOnlineOrdersCount={pendingOnlineOrders.length}
          onOpenIncomingOnlineOrders={() => setIsIncomingOrdersDrawerOpen(true)}
        />

        {/* Body View Router */}
        <main className="p-3 sm:p-5 lg:p-6 flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {activeView === 'pos' && (
            <div className="flex-1 flex flex-col">
              {/* Top 4 Stat Cards */}
              <StatCards
                orders={userOrders}
                customers={userCustomers}
                expenses={userExpenses}
                language={language}
              />

              {/* POS Dual Panel Layout */}
              <div className="flex-1 flex flex-col xl:flex-row gap-6 items-start">
                {/* Center / Left Panel: Categories, Search, Products Grid */}
                <PosView
                  products={userProducts}
                  onAddToCart={handleAddToCart}
                  openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
                  onNavigateToProducts={() => setActiveView('products')}
                  language={language}
                  khrRate={settings.khrExchangeRate}
                />

                {/* Right Panel: Current Order / Checkout Drawer */}
                <CartDrawer
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  tables={tables}
                  discount={discount}
                  discountType={discountType}
                  setDiscount={setDiscount}
                  setDiscountType={setDiscountType}
                  taxRate={settings.taxRate}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  orderNote={orderNote}
                  setOrderNote={setOrderNote}
                  onOpenPayment={() => setIsPaymentModalOpen(true)}
                  onSaveDraft={handleSaveDraft}
                  language={language}
                  khrRate={settings.khrExchangeRate}
                  isMobileOpen={isMobileCartOpen}
                  onCloseMobile={() => setIsMobileCartOpen(false)}
                  onOpenMobile={() => setIsMobileCartOpen(true)}
                  openBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
                />
              </div>
            </div>
          )}

          {activeView === 'customer_menu_preview' && (
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                      <span>📱</span>
                      <span>{language === 'kh' ? 'ផ្ទាំងសាកល្បងម៉ឺនុយទូរស័ព្ទ (Customer iPhone / Mobile Preview)' : 'Customer iPhone / Mobile Preview'}</span>
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      iPhone Optimized
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'kh' 
                      ? `ទម្រង់ម៉ឺនុយសម្រាប់គណនី (${currentUser.fullName}) ដែលអតិថិជននឹងឃើញពេលបើកនៅលើទូរស័ព្ទ iPhone` 
                      : `Customer menu view for account (${currentUser.fullName}) on iPhone / Mobile`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCustomerMenuShareOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{language === 'kh' ? '🔗 ចែករំលែក Link / QR' : '🔗 Share Link / QR'}</span>
                  </button>
                  <button
                    onClick={() => setActiveView('pos')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {language === 'kh' ? 'ត្រឡប់ទៅ POS' : 'Back to POS'}
                  </button>
                </div>
              </div>

              {/* Centered Mobile Frame */}
              <div className="w-full flex justify-center py-1 sm:py-2">
                <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden min-h-[640px]">
                  <CustomerCatalogView
                    products={userProducts}
                    settings={{
                      ...settings,
                      shopName: currentUser.fullName || settings.shopName,
                      shopNameKh: currentUser.fullName || settings.shopNameKh,
                      phone: currentUser.phone || settings.phone,
                      email: currentUser.email || settings.email,
                      khqrImage: currentUser.khqrImage || (currentUser.role === 'admin' ? settings.khqrImage : ''),
                      khqrMerchantName: currentUser.khqrMerchantName || currentUser.fullName || settings.khqrMerchantName,
                      khqrAccountName: currentUser.khqrAccountName || currentUser.fullName || settings.khqrAccountName,
                      khqrAccountNumber: currentUser.khqrAccountNumber || (currentUser.role === 'admin' ? settings.khqrAccountNumber : ''),
                      khqrBankName: currentUser.khqrBankName || settings.khqrBankName
                    }}
                    language={language}
                    onBackToPos={() => setActiveView('pos')}
                    isStandalone={false}
                    storeId={currentUser.id}
                    storeOwnerName={currentUser.fullName}
                  />
                </div>
              </div>
            </div>
          )}

          {activeView === 'products' && (
            <ProductsManager
              products={userProducts}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddExpense={handleAddExpense}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'income_reports' && (
            <IncomeReports
              orders={userOrders}
              expenses={userExpenses}
              products={userProducts}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'expenses' && (
            <ExpensesManager
              expenses={userExpenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'orders' && (
            <OrdersManager
              orders={userOrders}
              onViewReceipt={(ord) => setActiveReceiptOrder(ord)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onLoadOrderToPOS={handleLoadOrderToPOS}
              language={language}
              khrRate={settings.khrExchangeRate}
            />
          )}

          {activeView === 'tables' && (
            <TablesManager
              tables={tables}
              onUpdateTableStatus={handleUpdateTableStatus}
              onSelectTableForPOS={handleSelectTableForPOS}
              language={language}
            />
          )}

          {activeView === 'customers' && (
            <CustomersManager
              customers={userCustomers}
              onAddCustomer={handleAddCustomer}
              language={language}
            />
          )}

          {activeView === 'settings' && (
            <SettingsManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetData={handleResetData}
              language={language}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
              onOpenA2HSGuide={() => setIsA2HSGuideOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Share Customer Menu Modal */}
      <CustomerMenuShareModal
        isOpen={isCustomerMenuShareOpen}
        onClose={() => setIsCustomerMenuShareOpen(false)}
        settings={settings}
        language={language}
        currentUser={currentUser}
        currentUserId={currentUser?.id || 'user-admin'}
        onOpenPreview={() => {
          setActiveView('customer_menu_preview');
        }}
      />

      {/* Incoming Online Customer Orders Drawer */}
      <IncomingOnlineOrdersDrawer
        isOpen={isIncomingOrdersDrawerOpen}
        onClose={() => setIsIncomingOrdersDrawerOpen(false)}
        onlineOrders={userOrders}
        onLoadOrderToPOS={handleLoadOrderToPOS}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        language={language}
        khrRate={settings.khrExchangeRate}
      />

      {/* Global Profile & Photo Modal */}
      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateCurrentUser}
          onUserUpdated={handleUpdateCurrentUser}
          language={language}
        />
      )}

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={userProducts}
        onScanSuccess={handleBarcodeScanSuccess}
        language={language}
        onOpenCartMobile={() => setIsMobileCartOpen(true)}
      />

      {/* Checkout / Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          cartItems={cartItems}
          subtotal={cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)}
          discount={discount}
          discountType={discountType}
          tax={Math.max(0, cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) - (discountType === 'percent' ? (cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * discount) / 100 : discount)) * settings.taxRate}
          taxRate={settings.taxRate}
          total={Math.max(0, cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) - (discountType === 'percent' ? (cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * discount) / 100 : discount)) + (Math.max(0, cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) - (discountType === 'percent' ? (cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * discount) / 100 : discount)) * settings.taxRate)}
          selectedTable={selectedTable}
          customerName={customerName}
          orderNote={orderNote}
          cashierName={currentUser?.fullName || cashierName}
          khrRate={settings.khrExchangeRate}
          language={language}
          onOrderCompleted={handleOrderCompleted}
          settings={settings}
          currentUser={currentUser}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        order={activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        settings={settings}
        language={language}
        currentUser={currentUser}
        users={users}
      />

      {/* Add To Home Screen One-Time First Registration Guide Modal */}
      <AddToHomeScreenGuideModal
        isOpen={isA2HSGuideOpen}
        onClose={() => setIsA2HSGuideOpen(false)}
        language={language}
        userName={currentUser?.fullName}
        userId={currentUser?.id}
      />
    </div>
  );
}
