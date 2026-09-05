import { User, Product, Order, Expense, Customer, TableInfo, ShopSettings, ActivityLog, UpgradeRequest } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_CUSTOMERS, INITIAL_TABLES } from '../data/initialData';

// Pre-seeded Admin, Manager & Default Cashier
export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin',
    fullName: 'ប្រធានគ្រប់គ្រងទូទៅ (System Admin)',
    role: 'admin',
    status: 'active',
    plan: 'lifetime',
    phone: '+855 12 888 999',
    email: 'admin@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-manager-1',
    username: 'manager',
    password: '123',
    fullName: 'ចាន់ វ៉ាន់នី (Chan Vanny)',
    role: 'manager',
    status: 'active',
    plan: 'lifetime',
    phone: '+855 77 123 456',
    email: 'manager@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cashier-1',
    username: 'cashier01',
    password: '123',
    fullName: 'សុខ ពិសិដ្ឋ (Sok Piseth)',
    role: 'cashier',
    status: 'active',
    plan: 'free',
    phone: '+855 98 777 666',
    email: 'piseth@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cashier-2',
    username: 'cashier',
    password: '123',
    fullName: 'កែវ មុនី (Keo Mony)',
    role: 'cashier',
    status: 'active',
    plan: 'free',
    phone: '+855 10 555 444',
    email: 'mony@miniposkh.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString(),
  }
];

// ============================================================================
// LOCAL STORAGE KEYS & STORAGE HELPERS (OFFLINE & SELF-HOSTED UBUNTU COMPATIBLE)
// ============================================================================

export const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'minipos_cached_products',
  ORDERS: 'minipos_cached_orders',
  EXPENSES: 'minipos_cached_expenses',
  CUSTOMERS: 'minipos_cached_customers',
  TABLES: 'minipos_cached_tables',
  SETTINGS: 'minipos_cached_settings',
  USERS: 'minipos_cached_users',
  LOGS: 'minipos_cached_logs',
  UPGRADE_REQUESTS: 'minipos_cached_upgrade_requests',
  ADMIN_UPGRADE_KHQR: 'minipos_admin_upgrade_khqr',
  LAST_SYNC: 'minipos_last_server_sync',
  PENDING_CHANGES: 'minipos_pending_server_changes',
  AUTO_SYNC_INTERVAL_DAYS: 'minipos_auto_sync_interval_days'
};

export function getCachedData<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to read local storage for ${key}:`, e);
    return fallback;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(key, JSON.stringify(data));
    // Trigger server background save if available
    debounceSaveToServer();
  } catch (e) {
    console.warn(`Failed to write local storage for ${key}:`, e);
  }
}

// Background debounce saver to Ubuntu server /api/db endpoint
let serverSaveTimeout: any = null;
function debounceSaveToServer() {
  if (typeof window === 'undefined' || !window.fetch) return;
  if (serverSaveTimeout) clearTimeout(serverSaveTimeout);
  serverSaveTimeout = setTimeout(async () => {
    try {
      const userPool = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
      const mergedUsers = [...userPool];
      for (const defU of DEFAULT_USERS) {
        if (!mergedUsers.some(u => u.id === defU.id || u.username.toLowerCase() === defU.username.toLowerCase())) {
          mergedUsers.push(defU);
        }
      }

      const payload = {
        products: getCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, []),
        orders: getCachedData(LOCAL_STORAGE_KEYS.ORDERS, []),
        expenses: getCachedData(LOCAL_STORAGE_KEYS.EXPENSES, []),
        customers: getCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, []),
        tables: getCachedData(LOCAL_STORAGE_KEYS.TABLES, []),
        users: mergedUsers,
        settings: getCachedData(LOCAL_STORAGE_KEYS.SETTINGS, null),
        logs: getCachedData(LOCAL_STORAGE_KEYS.LOGS, []),
        upgradeRequests: getCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, []),
        updatedAt: new Date().toISOString()
      };
      
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Silently ignore if static mode or offline
      });
    } catch {
      // Safe offline fallback
    }
  }, 1000);
}

export function getLastSyncTime(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC) || localStorage.getItem('minipos_last_cloud_sync');
  } catch {
    return null;
  }
}

export function setLastSyncTime(isoDate?: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const time = isoDate || new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, time);
  } catch (e) {
    console.warn('Failed to save last sync time:', e);
  }
}

export function isSyncDue(intervalDays: number = 3): boolean {
  const last = getLastSyncTime();
  if (!last) return true;
  try {
    const lastDate = new Date(last).getTime();
    const now = Date.now();
    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
    return diffDays >= intervalDays;
  } catch {
    return true;
  }
}

export function getPendingChangesCount(): number {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    const count = localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_CHANGES);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementPendingChanges(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const curr = getPendingChangesCount();
    localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_CHANGES, (curr + 1).toString());
  } catch (e) {
    console.warn('Failed to increment pending changes:', e);
  }
}

export function resetPendingChanges(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_CHANGES, '0');
  } catch (e) {
    console.warn('Failed to reset pending changes:', e);
  }
}

// Clean helper
export function cleanForFirestore<T>(data: T): T {
  return data;
}

// Initialize Local Storage Database with initial data or Ubuntu Server data
export async function initializeFirestoreDatabase(): Promise<void> {
  try {
    let serverHasData = false;
    // 0. Fetch latest authoritative snapshot from self-hosted Ubuntu backend API (/api/db)
    if (typeof window !== 'undefined' && window.fetch) {
      try {
        const res = await fetch('/api/db');
        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            const d = json.data;
            serverHasData = true;
            if (Array.isArray(d.products)) {
              setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, d.products);
            }
            if (Array.isArray(d.orders)) {
              setCachedData(LOCAL_STORAGE_KEYS.ORDERS, d.orders);
            }
            if (Array.isArray(d.expenses)) {
              setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, d.expenses);
            }
            if (Array.isArray(d.customers)) {
              setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, d.customers);
            }
            if (Array.isArray(d.tables)) {
              setCachedData(LOCAL_STORAGE_KEYS.TABLES, d.tables);
            }
            if (Array.isArray(d.users)) {
              setCachedData(LOCAL_STORAGE_KEYS.USERS, d.users);
            }
            if (d.settings) {
              setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, d.settings);
            }
            if (Array.isArray(d.logs)) {
              setCachedData(LOCAL_STORAGE_KEYS.LOGS, d.logs);
            }
            if (Array.isArray(d.upgradeRequests)) {
              setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, d.upgradeRequests);
            }
            if (d.updatedAt) {
              setLastSyncTime(d.updatedAt);
            }
            localStorage.setItem('minipos_db_seeded', 'true');
          }
        }
      } catch {
        // Fallback to local storage if API is temporarily not reachable
      }
    }

    const isSeeded = localStorage.getItem('minipos_db_seeded') === 'true';

    // Only seed initial default demo data if this is the very first install (not seeded on server or client)
    if (!serverHasData && !isSeeded) {
      setCachedData(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
      setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
      setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
      setCachedData(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES);
      localStorage.setItem('minipos_db_seeded', 'true');
    } else {
      // Ensure all DEFAULT_USERS exist in list
      const currentUsers = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
      let updatedUsers = [...currentUsers];
      let hasChanges = false;
      for (const defUser of DEFAULT_USERS) {
        if (!updatedUsers.some(u => u.id === defUser.id || u.username.toLowerCase() === defUser.username.toLowerCase())) {
          updatedUsers.push(defUser);
          hasChanges = true;
        }
      }
      if (hasChanges || updatedUsers.length === 0) {
        setCachedData(LOCAL_STORAGE_KEYS.USERS, updatedUsers.length > 0 ? updatedUsers : DEFAULT_USERS);
      }
    }
  } catch (err) {
    console.warn('Database initialization note:', err);
  }
}

// Activity Logging
export async function logUserActivity(
  userId: string,
  username: string,
  userRole: string,
  action: string,
  details: string
): Promise<void> {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const logItem: ActivityLog = {
      id: logId,
      userId: userId || 'system',
      username: username || 'User',
      userRole: userRole || 'staff',
      action: action || 'Action',
      details: details || '',
      timestamp: new Date().toISOString()
    };
    const currentLogs = getCachedData<ActivityLog[]>(LOCAL_STORAGE_KEYS.LOGS, []);
    const updated = [logItem, ...currentLogs].slice(0, 100);
    setCachedData(LOCAL_STORAGE_KEYS.LOGS, updated);
  } catch (err) {
    console.warn('Failed to record activity log:', err);
  }
}

// Subscribe to Products
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  try {
    const current = getCachedData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
    callback(current);
  } catch {
    callback([]);
  }
  return () => {};
}

// Subscribe to Orders
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  try {
    const current = getCachedData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    callback(current);
  } catch {
    callback([]);
  }
  return () => {};
}

// Subscribe to Expenses
export function subscribeToExpenses(callback: (expenses: Expense[]) => void): () => void {
  try {
    const current = getCachedData<Expense[]>(LOCAL_STORAGE_KEYS.EXPENSES, []);
    callback(current);
  } catch {
    callback([]);
  }
  return () => {};
}

// Subscribe to Customers
export function subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
  try {
    const current = getCachedData<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
    callback(current);
  } catch {
    callback([]);
  }
  return () => {};
}

// Subscribe to Tables
export function subscribeToTables(callback: (tables: TableInfo[]) => void): () => void {
  try {
    const current = getCachedData<TableInfo[]>(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES);
    callback(current);
  } catch {
    callback(INITIAL_TABLES);
  }
  return () => {};
}

// Subscribe to Registered Users
export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  try {
    const current = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
    const merged = [...current];
    for (const defUser of DEFAULT_USERS) {
      if (!merged.some(u => u.id === defUser.id || u.username.toLowerCase() === defUser.username.toLowerCase())) {
        merged.push(defUser);
      }
    }
    callback(merged);
  } catch {
    callback(DEFAULT_USERS);
  }
  return () => {};
}

// Subscribe to Activity Logs
export function subscribeToActivityLogs(callback: (logs: ActivityLog[]) => void): () => void {
  try {
    const current = getCachedData<ActivityLog[]>(LOCAL_STORAGE_KEYS.LOGS, []);
    callback(current);
  } catch {
    callback([]);
  }
  return () => {};
}

// Subscribe to Shop Settings
export function subscribeToSettings(callback: (settings: ShopSettings) => void): () => void {
  try {
    const current = getCachedData<ShopSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    callback(current);
  } catch {
    callback(INITIAL_SETTINGS);
  }
  return () => {};
}

// Helper to upload base64 image to Ubuntu Server filesystem with User Account attribution & folder organization
export async function uploadImageToServer(
  imageData: string, 
  type: 'product' | 'khqr' | 'avatar' | 'receipt' = 'product',
  userId?: string,
  username?: string
): Promise<string> {
  if (!imageData || !imageData.startsWith('data:image/')) {
    return imageData; // Already a URL or empty
  }

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      // Find username if missing
      let resolvedUsername = username;
      if (!resolvedUsername && userId) {
        const users = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
        const u = users.find(x => x.id === userId);
        if (u) resolvedUsername = u.username;
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, type, userId, username: resolvedUsername })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.url) {
          return json.url;
        }
      }
    }
  } catch (err) {
    console.warn('Could not upload image to /api/upload, keeping local:', err);
  }
  return imageData; // Fallback to base64 if offline
}

// Helper to upload Video Tutorial (.mp4, .webm, etc.) directly to Ubuntu Server storage
export async function uploadVideoTutorialToServer(
  file: File,
  title?: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  try {
    if (typeof window === 'undefined' || !window.fetch) {
      return { success: false, error: 'Offline / window not available' };
    }

    // Use XMLHttpRequest for accurate upload progress tracking
    return await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-video', true);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
      xhr.setRequestHeader('x-filename', file.name);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.url) {
              // Update local settings cache
              const currentSettings = getCachedData<ShopSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
              const updated: ShopSettings = {
                ...currentSettings,
                tutorialVideoUrl: res.url,
                tutorialVideoTitle: title || currentSettings.tutorialVideoTitle || 'របៀបដំឡើង MINI MART POS លើទូរស័ព្ទ (Add to Home Screen)'
              };
              setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, updated);
              window.dispatchEvent(new CustomEvent('minipos:settings_updated', { detail: updated }));
              resolve({ success: true, url: res.url, filename: res.filename });
              return;
            }
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse server response' });
            return;
          }
        }
        resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
      };

      xhr.onerror = () => {
        resolve({ success: false, error: 'Network error during video upload' });
      };

      xhr.send(file);
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown upload error' };
  }
}

// Save Tutorial Video Settings
export async function saveTutorialVideoSettings(videoUrl: string, title?: string): Promise<void> {
  const currentSettings = getCachedData<ShopSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  const updated: ShopSettings = {
    ...currentSettings,
    tutorialVideoUrl: videoUrl,
    tutorialVideoTitle: title || currentSettings.tutorialVideoTitle || 'របៀបដំឡើង MINI MART POS លើទូរស័ព្ទ (Add to Home Screen)'
  };
  setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, updated);
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/settings/tutorial-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, title: updated.tutorialVideoTitle })
      });
    }
  } catch {}
  window.dispatchEvent(new CustomEvent('minipos:settings_updated', { detail: updated }));
}

// Delete Tutorial Video from Ubuntu Server
export async function deleteTutorialVideoFromServer(): Promise<void> {
  const currentSettings = getCachedData<ShopSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  const updated = { ...currentSettings };
  delete updated.tutorialVideoUrl;
  delete updated.tutorialVideoTitle;
  setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, updated);
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/settings/tutorial-video', {
        method: 'DELETE'
      });
    }
  } catch {}
  window.dispatchEvent(new CustomEvent('minipos:settings_updated', { detail: updated }));
}

// Save or Update Product (Persists to local storage & Ubuntu Server)
export async function saveProductToFirestore(product: Product): Promise<void> {
  // If product has a base64 image, upload to Ubuntu Server storage
  let finalProd = { ...product };
  if (finalProd.image && finalProd.image.startsWith('data:image/')) {
    try {
      const serverUrl = await uploadImageToServer(finalProd.image, 'product', finalProd.userId);
      finalProd.image = serverUrl;
    } catch {
      // Continue with original
    }
  }

  const current = getCachedData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  const exists = current.some(p => p.id === finalProd.id);
  const updated = exists ? current.map(p => p.id === finalProd.id ? finalProd : p) : [finalProd, ...current];
  setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, updated);

  // Send to Ubuntu Server API
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProd)
      }).catch(e => console.warn('Background server product save failed:', e));
    }
  } catch {}
}

// Delete Product (Removes from local storage & Ubuntu Server)
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const current = getCachedData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  const updated = current.filter(p => p.id !== productId);
  setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, updated);

  // Send to Ubuntu Server API
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      });
    }
  } catch (e) {
    console.warn('Background server product delete failed:', e);
  }

  window.dispatchEvent(new CustomEvent('minipos:products_updated', { detail: updated }));
}

// Save Order (Persists to local storage & Ubuntu Server)
export async function saveOrderToFirestore(order: Order): Promise<void> {
  const current = getCachedData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const exists = current.some(o => o.id === order.id);
  const updated = exists ? current.map(o => o.id === order.id ? order : o) : [order, ...current];
  setCachedData(LOCAL_STORAGE_KEYS.ORDERS, updated);

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      }).catch(e => console.warn('Background server order save failed:', e));
    }
  } catch {}
}

// Update Order Status
export async function updateOrderStatusInFirestore(orderId: string, status: Order['status']): Promise<void> {
  const current = getCachedData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const updated = current.map(o => o.id === orderId ? { ...o, status } : o);
  setCachedData(LOCAL_STORAGE_KEYS.ORDERS, updated);
  
  const target = updated.find(o => o.id === orderId);
  if (target) {
    saveOrderToFirestore(target).catch(() => {});
  }
}

// Delete Order
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const current = getCachedData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const updated = current.filter(o => o.id !== orderId);
  setCachedData(LOCAL_STORAGE_KEYS.ORDERS, updated);

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
      });
    }
  } catch (e) {
    console.warn('Background server order delete failed:', e);
  }
}

// Save Expense
export async function saveExpenseToFirestore(expense: Expense): Promise<void> {
  const current = getCachedData<Expense[]>(LOCAL_STORAGE_KEYS.EXPENSES, []);
  const exists = current.some(e => e.id === expense.id);
  const updated = exists ? current.map(e => e.id === expense.id ? expense : e) : [expense, ...current];
  setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, updated);

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      }).catch(e => console.warn('Background server expense save failed:', e));
    }
  } catch {}
}

// Delete Expense
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  const current = getCachedData<Expense[]>(LOCAL_STORAGE_KEYS.EXPENSES, []);
  const updated = current.filter(e => e.id !== expenseId);
  setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, updated);

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch(`/api/expenses/${encodeURIComponent(expenseId)}`, {
        method: 'DELETE'
      });
    }
  } catch (e) {
    console.warn('Background server expense delete failed:', e);
  }
}

// Save Customer
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  const current = getCachedData<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
  const exists = current.some(c => c.id === customer.id);
  const updated = exists ? current.map(c => c.id === customer.id ? customer : c) : [customer, ...current];
  setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, updated);
}

// Delete Customer
export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  const current = getCachedData<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
  const updated = current.filter(c => c.id !== customerId);
  setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, updated);

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'DELETE'
      });
    }
  } catch (e) {
    console.warn('Background server customer delete failed:', e);
  }
}

// Save Table
export async function saveTableToFirestore(table: TableInfo): Promise<void> {
  const current = getCachedData<TableInfo[]>(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES);
  const exists = current.some(t => t.id === table.id);
  const updated = exists ? current.map(t => t.id === table.id ? table : t) : [table, ...current];
  setCachedData(LOCAL_STORAGE_KEYS.TABLES, updated);
}

// Save Settings
export async function saveSettingsToFirestore(settings: ShopSettings): Promise<void> {
  setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, settings);
}

// Save or Update User
export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const currentCached = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
    const updated = [user, ...currentCached.filter(u => u.id !== user.id && u.username.toLowerCase() !== user.username.toLowerCase())];
    setCachedData(LOCAL_STORAGE_KEYS.USERS, updated);

    // Also update backup registry in localStorage
    try {
      const backupUsers = JSON.parse(localStorage.getItem('minipos_all_registered_accounts') || '[]');
      const backupUpdated = [user, ...backupUsers.filter((u: any) => u.id !== user.id && u.username?.toLowerCase() !== user.username.toLowerCase())];
      localStorage.setItem('minipos_all_registered_accounts', JSON.stringify(backupUpdated));
    } catch {
      // Safe fallback
    }

    // Direct sync to Ubuntu Server API
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }).catch(e => console.warn('Server user save failed:', e));
    }

    window.dispatchEvent(new CustomEvent('minipos:users_updated', { detail: updated }));
  } catch (err) {
    console.warn('Failed to save user to local storage:', err);
  }
}

// Fetch all registered users
export async function fetchAllUsersFromFirestoreDirectly(): Promise<User[]> {
  try {
    // Try to get latest from Ubuntu Server first
    if (typeof window !== 'undefined' && window.fetch) {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const json = await res.json();
          if (json?.users && Array.isArray(json.users) && json.users.length > 0) {
            const serverUsers = json.users;
            const merged = [...serverUsers];
            for (const defUser of DEFAULT_USERS) {
              if (!merged.some(u => u.id === defUser.id || u.username.toLowerCase() === defUser.username.toLowerCase())) {
                merged.push(defUser);
              }
            }
            setCachedData(LOCAL_STORAGE_KEYS.USERS, merged);
            return merged;
          }
        }
      } catch {
        // Fallback to cache
      }
    }

    const cached = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
    const merged = [...cached];
    for (const defUser of DEFAULT_USERS) {
      if (!merged.some(u => u.id === defUser.id || u.username.toLowerCase() === defUser.username.toLowerCase())) {
        merged.push(defUser);
      }
    }
    return merged;
  } catch (err) {
    console.warn('Fetch users fallback to cache:', err);
    return DEFAULT_USERS;
  }
}

// Update User Status
export async function updateUserStatusInFirestore(userId: string, status: 'active' | 'pending' | 'disabled'): Promise<void> {
  const current = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
  const target = current.find(u => u.id === userId);
  const updated = current.map(u => u.id === userId ? { ...u, status } : u);
  setCachedData(LOCAL_STORAGE_KEYS.USERS, updated);

  if (target && typeof window !== 'undefined' && window.fetch) {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...target, status })
    }).catch(() => {});
  }

  window.dispatchEvent(new CustomEvent('minipos:users_updated', { detail: updated }));
}

// Update User Plan (free / lifetime)
export async function updateUserPlanInFirestore(userId: string, plan: 'free' | 'lifetime'): Promise<void> {
  const current = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
  const target = current.find(u => u.id === userId);
  const updated = current.map(u => u.id === userId ? { ...u, plan } : u);
  setCachedData(LOCAL_STORAGE_KEYS.USERS, updated);

  if (target && typeof window !== 'undefined' && window.fetch) {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...target, plan })
    }).catch(() => {});
  }

  // If current logged-in user in session, update it
  try {
    const authRaw = localStorage.getItem('minipos_auth_user');
    if (authRaw) {
      const authUser = JSON.parse(authRaw);
      if (authUser.id === userId) {
        localStorage.setItem('minipos_auth_user', JSON.stringify({ ...authUser, plan }));
      }
    }
  } catch {}

  // Broadcast change locally
  window.dispatchEvent(new CustomEvent('minipos:users_updated', { detail: updated }));
}

// Upgrade Requests (Local Storage & Ubuntu Server Endpoint)
export function getCachedUpgradeRequests(): UpgradeRequest[] {
  return getCachedData<UpgradeRequest[]>(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, []);
}

export function subscribeToUpgradeRequests(callback: (requests: UpgradeRequest[]) => void): () => void {
  // 1. Initial cached callback
  try {
    const current = getCachedUpgradeRequests();
    callback(current);
  } catch {
    callback([]);
  }

  // 2. Poll server for real-time upgrade requests
  const fetchUpgradeRequests = async () => {
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        const res = await fetch('/api/upgrade-requests');
        if (res.ok) {
          const json = await res.json();
          if (json?.requests && Array.isArray(json.requests)) {
            setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, json.requests);
            callback(json.requests);
          }
        }
      }
    } catch {}
  };

  fetchUpgradeRequests();
  const interval = setInterval(fetchUpgradeRequests, 3500);

  // 3. Listen to custom internal events
  const handleLocalUpdate = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    } else {
      callback(getCachedUpgradeRequests());
    }
  };
  window.addEventListener('minipos:upgrades_updated', handleLocalUpdate);

  return () => {
    clearInterval(interval);
    window.removeEventListener('minipos:upgrades_updated', handleLocalUpdate);
  };
}

export async function submitUpgradeRequest(request: UpgradeRequest): Promise<void> {
  const current = getCachedUpgradeRequests();
  const exists = current.some(r => r.id === request.id);
  const updated = exists ? current.map(r => r.id === request.id ? request : r) : [request, ...current];
  setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, updated);

  // Post to Ubuntu Server API
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/upgrade-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
    }
  } catch (err) {
    console.warn('Server submit upgrade error:', err);
  }

  window.dispatchEvent(new CustomEvent('minipos:upgrades_updated', { detail: updated }));
}

export async function approveUpgradeRequest(requestId: string, adminUser: User): Promise<void> {
  const current = getCachedUpgradeRequests();
  const targetReq = current.find(r => r.id === requestId);
  if (!targetReq) return;

  const now = new Date().toISOString();
  const updatedRequests = current.map(r => r.id === requestId ? {
    ...r,
    status: 'approved' as const,
    reviewedAt: now,
    reviewedBy: adminUser.fullName || adminUser.username
  } : r);
  setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, updatedRequests);

  // 1. Upgrade the target user's plan to lifetime in local storage
  await updateUserPlanInFirestore(targetReq.userId, 'lifetime');

  // 2. Direct server-authoritative API call on Ubuntu Server
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      const res = await fetch('/api/upgrade-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          adminId: adminUser.id,
          adminName: adminUser.fullName || adminUser.username
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.users && Array.isArray(json.users)) {
          setCachedData(LOCAL_STORAGE_KEYS.USERS, json.users);
          window.dispatchEvent(new CustomEvent('minipos:users_updated', { detail: json.users }));
        }
      }
    }
  } catch (err) {
    console.warn('Server approve upgrade error:', err);
  }

  await logUserActivity(
    adminUser.id,
    adminUser.username,
    adminUser.role,
    'APPROVE_UPGRADE',
    `Approved Lifetime Upgrade for ${targetReq.fullName} (@${targetReq.username})`
  );

  window.dispatchEvent(new CustomEvent('minipos:upgrades_updated', { detail: updatedRequests }));
}

export async function rejectUpgradeRequest(requestId: string, adminUser: User, reason?: string): Promise<void> {
  const current = getCachedUpgradeRequests();
  const now = new Date().toISOString();
  const updatedRequests = current.map(r => r.id === requestId ? {
    ...r,
    status: 'rejected' as const,
    adminNote: reason,
    reviewedAt: now,
    reviewedBy: adminUser.fullName || adminUser.username
  } : r);
  setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, updatedRequests);

  // Server API call
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/upgrade-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          adminId: adminUser.id,
          adminName: adminUser.fullName || adminUser.username,
          reason
        })
      });
    }
  } catch (err) {
    console.warn('Server reject upgrade error:', err);
  }

  await logUserActivity(
    adminUser.id,
    adminUser.username,
    adminUser.role,
    'REJECT_UPGRADE',
    `Rejected Upgrade Request for ID ${requestId}`
  );

  window.dispatchEvent(new CustomEvent('minipos:upgrades_updated', { detail: updatedRequests }));
}

// Admin Upgrade KHQR Configuration
export function getAdminUpgradeKhqrSettings(): any {
  return getCachedData(LOCAL_STORAGE_KEYS.ADMIN_UPGRADE_KHQR, null);
}

export async function saveAdminUpgradeKhqrSettings(config: any): Promise<void> {
  setCachedData(LOCAL_STORAGE_KEYS.ADMIN_UPGRADE_KHQR, config);

  // Save to Settings in local storage
  const currentSettings = getCachedData<ShopSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  const updatedSettings = {
    ...currentSettings,
    adminUpgradeKhqr: config
  };
  setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, updatedSettings);

  // Post to Ubuntu Server API
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/admin/upgrade-khqr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    }
  } catch (err) {
    console.warn('Server save admin KHQR error:', err);
  }

  window.dispatchEvent(new CustomEvent('minipos:settings_updated', { detail: updatedSettings }));
}

// Update User Role
export async function updateUserRoleInFirestore(userId: string, role: 'admin' | 'cashier' | 'manager'): Promise<void> {
  const current = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
  const target = current.find(u => u.id === userId);
  const updated = current.map(u => u.id === userId ? { ...u, role } : u);
  setCachedData(LOCAL_STORAGE_KEYS.USERS, updated);

  if (target && typeof window !== 'undefined' && window.fetch) {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...target, role })
    }).catch(() => {});
  }

  window.dispatchEvent(new CustomEvent('minipos:users_updated', { detail: updated }));
}

// Delete User
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  // 1. Update primary cache
  const current = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
  const updated = current.filter(u => u.id !== userId);
  setCachedData(LOCAL_STORAGE_KEYS.USERS, updated);

  // 2. Clean backup accounts registry in localStorage
  try {
    const backupUsers = JSON.parse(localStorage.getItem('minipos_all_registered_accounts') || '[]');
    const backupFiltered = backupUsers.filter((u: any) => u.id !== userId);
    localStorage.setItem('minipos_all_registered_accounts', JSON.stringify(backupFiltered));
  } catch {}

  // 3. Delete from Ubuntu Server filesystem immediately
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
    }
  } catch (e) {
    console.warn('Background server user delete failed:', e);
  }

  // 4. Notify all UI listeners
  window.dispatchEvent(new CustomEvent('minipos:users_updated', { detail: updated }));
}

// Fetch all datasets (pulls directly from Ubuntu Server database if reachable)
export async function fetchAllCloudData(): Promise<{
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  customers: Customer[];
  tables: TableInfo[];
  users: User[];
  settings: ShopSettings;
}> {
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      const res = await fetch('/api/db');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          const d = json.data;
          if (Array.isArray(d.products)) {
            setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, d.products);
          }
          if (Array.isArray(d.orders)) {
            setCachedData(LOCAL_STORAGE_KEYS.ORDERS, d.orders);
          }
          if (Array.isArray(d.expenses)) {
            setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, d.expenses);
          }
          if (Array.isArray(d.customers)) {
            setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, d.customers);
          }
          if (Array.isArray(d.tables)) {
            setCachedData(LOCAL_STORAGE_KEYS.TABLES, d.tables);
          }
          if (Array.isArray(d.users)) {
            setCachedData(LOCAL_STORAGE_KEYS.USERS, d.users);
          }
          if (d.settings) {
            setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, d.settings);
          }
          if (Array.isArray(d.logs)) {
            setCachedData(LOCAL_STORAGE_KEYS.LOGS, d.logs);
          }
          if (Array.isArray(d.upgradeRequests)) {
            setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, d.upgradeRequests);
          }
          if (d.updatedAt) {
            setLastSyncTime(d.updatedAt);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Fetch cloud data fallback to local cache:', e);
  }

  return {
    products: getCachedData<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []),
    orders: getCachedData<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []),
    expenses: getCachedData<Expense[]>(LOCAL_STORAGE_KEYS.EXPENSES, []),
    customers: getCachedData<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []),
    tables: getCachedData<TableInfo[]>(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES),
    users: (() => {
      const cached = getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS);
      const merged = [...cached];
      for (const defU of DEFAULT_USERS) {
        if (!merged.some(u => u.id === defU.id || u.username.toLowerCase() === defU.username.toLowerCase())) {
          merged.push(defU);
        }
      }
      return merged;
    })(),
    settings: getCachedData<ShopSettings>(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  };
}

// Sync all local datasets & save to local server file
export async function syncAllLocalDataToFirestore(payload: {
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  customers: Customer[];
  tables: TableInfo[];
  users: User[];
  settings: ShopSettings;
}): Promise<{
  success: boolean;
  productsSynced: number;
  ordersSynced: number;
  usersSynced: number;
  timestamp: string;
  error?: string;
}> {
  try {
    const now = new Date().toISOString();
    setLastSyncTime(now);
    resetPendingChanges();

    setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, payload.products);
    setCachedData(LOCAL_STORAGE_KEYS.ORDERS, payload.orders);
    setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, payload.expenses);
    setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, payload.customers);
    setCachedData(LOCAL_STORAGE_KEYS.TABLES, payload.tables);
    setCachedData(LOCAL_STORAGE_KEYS.USERS, payload.users);
    setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, payload.settings);

    // Save to Ubuntu server endpoint if available
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          updatedAt: now
        })
      }).catch(() => {});
    }

    return {
      success: true,
      productsSynced: payload.products.length,
      ordersSynced: payload.orders.length,
      usersSynced: payload.users.length,
      timestamp: now
    };
  } catch (err: any) {
    console.error('Failed to sync local data:', err);
    return {
      success: false,
      productsSynced: 0,
      ordersSynced: 0,
      usersSynced: 0,
      timestamp: new Date().toISOString(),
      error: err.message || 'Unknown sync error'
    };
  }
}

// Export Full Database to JSON File (Download for Offline / Ubuntu Backup)
export function exportDatabaseBackupFile(): void {
  try {
    const fullBackup = {
      meta: {
        app: 'MINI MART POS',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        hostType: 'Self-Hosted Ubuntu & Standalone'
      },
      products: getCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
      orders: getCachedData(LOCAL_STORAGE_KEYS.ORDERS, INITIAL_ORDERS),
      expenses: getCachedData(LOCAL_STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
      customers: getCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
      tables: getCachedData(LOCAL_STORAGE_KEYS.TABLES, INITIAL_TABLES),
      users: getCachedData(LOCAL_STORAGE_KEYS.USERS, DEFAULT_USERS),
      settings: getCachedData(LOCAL_STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
      logs: getCachedData(LOCAL_STORAGE_KEYS.LOGS, []),
      upgradeRequests: getCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, [])
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minipos_ubuntu_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export database backup file:', err);
  }
}

// Import Full Database from JSON File
export function importDatabaseBackupFile(jsonData: any): boolean {
  try {
    if (!jsonData || typeof jsonData !== 'object') return false;

    if (Array.isArray(jsonData.products)) {
      setCachedData(LOCAL_STORAGE_KEYS.PRODUCTS, jsonData.products);
    }
    if (Array.isArray(jsonData.orders)) {
      setCachedData(LOCAL_STORAGE_KEYS.ORDERS, jsonData.orders);
    }
    if (Array.isArray(jsonData.expenses)) {
      setCachedData(LOCAL_STORAGE_KEYS.EXPENSES, jsonData.expenses);
    }
    if (Array.isArray(jsonData.customers)) {
      setCachedData(LOCAL_STORAGE_KEYS.CUSTOMERS, jsonData.customers);
    }
    if (Array.isArray(jsonData.tables)) {
      setCachedData(LOCAL_STORAGE_KEYS.TABLES, jsonData.tables);
    }
    if (Array.isArray(jsonData.users)) {
      setCachedData(LOCAL_STORAGE_KEYS.USERS, jsonData.users);
    }
    if (jsonData.settings && typeof jsonData.settings === 'object') {
      setCachedData(LOCAL_STORAGE_KEYS.SETTINGS, jsonData.settings);
    }
    if (Array.isArray(jsonData.logs)) {
      setCachedData(LOCAL_STORAGE_KEYS.LOGS, jsonData.logs);
    }
    if (Array.isArray(jsonData.upgradeRequests)) {
      setCachedData(LOCAL_STORAGE_KEYS.UPGRADE_REQUESTS, jsonData.upgradeRequests);
    }

    setLastSyncTime(new Date().toISOString());
    return true;
  } catch (err) {
    console.error('Failed to import database backup file:', err);
    return false;
  }
}

// Device detection helper
export function getClientDeviceSummary(): { device: string; deviceType: 'mobile' | 'desktop' | 'tablet' } {
  if (typeof window === 'undefined' || !navigator) {
    return { device: 'Server / Unknown', deviceType: 'desktop' };
  }

  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua)) {
    return { device: 'iPad / Tablet', deviceType: 'tablet' };
  }
  if (/iPhone/i.test(ua)) {
    return { device: 'Apple iPhone (iOS)', deviceType: 'mobile' };
  }
  if (/Android/i.test(ua)) {
    return { device: 'Android Mobile', deviceType: 'mobile' };
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return { device: 'MacBook / Mac OS', deviceType: 'desktop' };
  }
  if (/Windows/i.test(ua)) {
    return { device: 'Windows PC', deviceType: 'desktop' };
  }
  if (/Linux/i.test(ua)) {
    return { device: 'Ubuntu / Linux Device', deviceType: 'desktop' };
  }
  return { device: 'Web Browser Device', deviceType: 'desktop' };
}

// Get or generate persistent session ID per browser tab
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'sess-server';
  let sid = sessionStorage.getItem('minipos_session_id');
  if (!sid) {
    sid = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('minipos_session_id', sid);
  }
  return sid;
}

// Send session heartbeat to Ubuntu Express Server
export async function sendSessionHeartbeat(
  user: User,
  activeView: string,
  isNewLogin: boolean = false
): Promise<{ success: boolean; activeCount?: number; registeredIp?: string }> {
  try {
    if (typeof window === 'undefined' || !window.fetch) return { success: false };
    const sessionId = getOrCreateSessionId();
    const { device, deviceType } = getClientDeviceSummary();

    const res = await fetch('/api/sessions/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        device,
        deviceType,
        activeView,
        isNewLogin
      })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, activeCount: data.activeCount, registeredIp: data.registeredIp };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

// Fetch list of all active sessions from Ubuntu Server
export async function fetchActiveSessionsFromServer(): Promise<import('../types').ActiveSession[]> {
  try {
    if (typeof window === 'undefined' || !window.fetch) return [];
    const res = await fetch('/api/sessions');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.sessions)) {
        return data.sessions;
      }
    }
    return [];
  } catch {
    return [];
  }
}

// Clear session on logout
export async function logoutSessionOnServer(user?: User | null): Promise<void> {
  try {
    if (typeof window === 'undefined' || !window.fetch) return;
    const sessionId = getOrCreateSessionId();
    await fetch('/api/sessions/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId: user?.id,
        username: user?.username,
        fullName: user?.fullName
      })
    });
    sessionStorage.removeItem('minipos_session_id');
  } catch {
    // Ignore error
  }
}

