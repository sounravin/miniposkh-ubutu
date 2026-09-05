import { CartItem, PaymentMethod, ShopSettings, User } from '../types';

export interface CustomerDisplayState {
  storeId: string;
  storeName: string;
  storeNameKh: string;
  phone?: string;
  email?: string;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  taxRate: number;
  total: number;
  khrRate: number;
  selectedTable?: string;
  customerName?: string;
  orderNote?: string;
  cashierName?: string;
  // Crucial: Only reveal payment method once cashier selects one!
  isCheckingOut: boolean;
  selectedPaymentMethod: PaymentMethod | null;
  cashTendered?: number;
  changeDueUSD?: number;
  changeDueKHR?: number;
  // Bank & KHQR credentials
  khqrImage?: string;
  khqrMerchantName?: string;
  khqrAccountName?: string;
  khqrAccountNumber?: string;
  khqrBankName?: string;
  // Completed Order notification
  isOrderCompleted?: boolean;
  completedOrderNumber?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'minipos_customer_display_state';
const CHANNEL_NAME = 'minipos_customer_display_bus';

let broadcastChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!broadcastChannel && typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

/**
 * Broadcast current POS cart & cashier payment state to customer screen
 */
export function broadcastCustomerDisplayState(state: CustomerDisplayState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save customer display state to localStorage', e);
  }

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'SYNC_STATE', state });
    } catch (e) {
      console.error('Failed to postMessage on BroadcastChannel', e);
    }
  }
}

/**
 * Read latest customer display state from localStorage
 */
export function getSavedCustomerDisplayState(storeId?: string): CustomerDisplayState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerDisplayState;
    if (storeId && parsed.storeId && parsed.storeId !== storeId) {
      // Return parsed state even if storeId differs slightly, or check matching
      return parsed;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Request latest state from any active POS counter window
 */
export function requestPOSCurrentState(): void {
  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'REQUEST_STATE' });
    } catch {
      // Ignore
    }
  }
}

/**
 * Subscribe to state updates (via BroadcastChannel and storage events)
 */
export function subscribeToCustomerDisplay(
  onStateUpdate: (state: CustomerDisplayState) => void,
  onStateRequested?: () => void
): () => void {
  const channel = getChannel();

  const handleMessage = (event: MessageEvent) => {
    if (!event.data) return;
    if (event.data.type === 'SYNC_STATE' && event.data.state) {
      onStateUpdate(event.data.state);
    } else if (event.data.type === 'REQUEST_STATE' && onStateRequested) {
      onStateRequested();
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onStateUpdate(parsed);
      } catch {
        // Ignore
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
