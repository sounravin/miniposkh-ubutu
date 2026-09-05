import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Activity, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  RefreshCw,
  ShoppingBag,
  LogOut,
  X,
  Phone,
  Mail,
  KeyRound,
  Camera,
  Upload,
  Download,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  Check,
  Cloud,
  CloudUpload,
  CloudDownload,
  Server,
  HardDrive,
  Sparkles,
  Layers,
  FileSpreadsheet,
  DollarSign,
  QrCode,
  Image as ImageIcon,
  Loader2,
  Crown,
  CheckCheck,
  Ban,
  Maximize2,
  ExternalLink,
  Smartphone,
  Laptop,
  Tablet,
  Radio,
  Wifi,
  Globe,
  Monitor,
  Save
} from 'lucide-react';
import { User, ActivityLog, Product, Order, Expense, Customer, TableInfo, ShopSettings, UpgradeRequest, ActiveSession } from '../types';
import { 
  updateUserStatusInFirestore, 
  updateUserRoleInFirestore, 
  deleteUserFromFirestore, 
  saveUserToFirestore,
  logUserActivity,
  getLastSyncTime,
  getPendingChangesCount,
  isSyncDue,
  syncAllLocalDataToFirestore,
  fetchAllCloudData,
  getCachedUpgradeRequests,
  subscribeToUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  updateUserPlanInFirestore,
  getAdminUpgradeKhqrSettings,
  saveAdminUpgradeKhqrSettings,
  DEFAULT_USERS,
  LOCAL_STORAGE_KEYS,
  getCachedData,
  exportDatabaseBackupFile,
  importDatabaseBackupFile,
  fetchActiveSessionsFromServer,
  getOrCreateSessionId,
  uploadImageToServer
} from '../lib/firestoreService';
import { resizeImageFile } from '../lib/imageUtils';

interface AdminConsoleProps {
  currentUser: User;
  users: User[];
  activityLogs: ActivityLog[];
  activeSessions?: ActiveSession[];
  language: 'en' | 'kh';
  onNavigateToPos: () => void;
  onLogout: () => void;
  onUpdateCurrentUser?: (user: User) => void;
  products?: Product[];
  orders?: Order[];
  expenses?: Expense[];
  customers?: Customer[];
  tables?: TableInfo[];
  settings?: ShopSettings;
  onSyncAllToCloud?: () => Promise<{ success: boolean; productsSynced: number; ordersSynced: number; timestamp: string }>;
  onFetchLatestFromCloud?: () => Promise<void>;
}

const PRESET_AVATARS = [

  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
];

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  users,
  activityLogs,
  activeSessions = [],
  language,
  onNavigateToPos,
  onLogout,
  onUpdateCurrentUser,
  products = [],
  orders = [],
  expenses = [],
  customers = [],
  tables = [],
  settings,
  onSyncAllToCloud,
  onFetchLatestFromCloud
}) => {
  const isKh = language === 'kh';
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'cashier' | 'manager'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Live Active Sessions on Ubuntu Server
  const [liveSessions, setLiveSessions] = useState<ActiveSession[]>(activeSessions);
  const [logFilter, setLogFilter] = useState<'all' | 'login' | 'user' | 'order'>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      const sess = await fetchActiveSessionsFromServer();
      if (sess && Array.isArray(sess)) {
        setLiveSessions(sess);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, []);

  // Cloud Sync State
  const [lastSyncTime, setLastSyncTimeState] = useState<string | null>(() => getLastSyncTime());
  const [pendingChanges, setPendingChanges] = useState<number>(() => getPendingChangesCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setLastSyncTimeState(getLastSyncTime());
    setPendingChanges(getPendingChangesCount());
  }, []);

  // Format Sync Timestamp nicely
  const formatSyncTime = (iso?: string | null) => {
    if (!iso) return isKh ? 'មិនទាន់ធ្លាប់ Sync' : 'Never Synced';
    try {
      const d = new Date(iso);
      return d.toLocaleString(isKh ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  // Trigger Full Cloud Backup
  const handleTriggerSyncAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      if (onSyncAllToCloud) {
        const res = await onSyncAllToCloud();
        if (res.success) {
          setLastSyncTimeState(res.timestamp);
          setPendingChanges(0);
          setSyncFeedback({
            type: 'success',
            message: isKh 
              ? `✅ បាន Sync ទិន្នន័យជោគជ័យ! (${res.productsSynced} ទំនិញ, ${res.ordersSynced} វិក្កយបត្រ)` 
              : `✅ Data synced to Cloud! (${res.productsSynced} products, ${res.ordersSynced} orders)`
          });
        } else {
          throw new Error('Sync returned false');
        }
      } else {
        // Fallback direct sync
        const res = await syncAllLocalDataToFirestore({
          products,
          orders,
          expenses,
          customers,
          tables,
          users,
          settings: settings || {
            shopName: 'MINI MART POS',
            shopNameKh: 'មីនី ម៉ាត',
            address: 'Phnom Penh, Cambodia',
            phone: '+855 12 345 678',
            email: 'contact@minimart.com',
            taxRate: 0.05,
            currencySymbol: '$',
            currency: 'USD',
            khrExchangeRate: 4100,
            enableSound: true,
            language: 'kh',
            receiptFooterText: 'សូមអរគុណ! Thank you for shopping with us.',
            khqrImage: '',
            khqrMerchantName: 'MINI MART',
            khqrAccountName: 'MINI MART',
            khqrAccountNumber: '001 234 567',
            khqrBankName: 'Bakong / ABA'
          }
        });
        if (res.success) {
          setLastSyncTimeState(res.timestamp);
          setPendingChanges(0);
          setSyncFeedback({
            type: 'success',
            message: isKh 
              ? `✅ បានរក្សាទុក និងបម្រុងទុកទិន្នន័យទាំងអស់ក្នុងប្រព័ន្ធជោគជ័យ!` 
              : `✅ All datasets successfully saved and backed up in local storage!`
          });
        } else {
          throw new Error(res.error || 'Failed to sync');
        }
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || (isKh ? 'បរាជ័យក្នុងការ Sync ទៅ Cloud!' : 'Failed to sync to Cloud!')
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 6000);
    }
  };

  // Trigger Fetch Fresh Data from Cloud
  const handleTriggerFetchLatest = async () => {
    setIsFetching(true);
    setSyncFeedback(null);
    try {
      if (onFetchLatestFromCloud) {
        await onFetchLatestFromCloud();
      } else {
        await fetchAllCloudData();
      }
      setLastSyncTimeState(new Date().toISOString());
      setPendingChanges(0);
      setSyncFeedback({
        type: 'success',
        message: isKh ? '✅ បានទាញយកទិន្នន័យចុងក្រោយពី Cloud ជោគជ័យ!' : '✅ Fresh cloud snapshot pulled into local storage!'
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || (isKh ? 'បរាជ័យក្នុងការទាញយកពី Cloud!' : 'Failed to pull cloud snapshot!')
      });
    } finally {
      setIsFetching(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 6000);
    }
  };

  // Restore database from JSON file
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const handleRestoreFromJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const success = importDatabaseBackupFile(parsed);
        if (success) {
          setSyncFeedback({
            type: 'success',
            message: isKh 
              ? '✅ បានបញ្ចូលទិន្នន័យពី JSON Backup ជោគជ័យ! សូម Refresh ទំព័រ' 
              : '✅ Database successfully restored from JSON backup! Please refresh.'
          });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          throw new Error('ទម្រង់ JSON មិនត្រឹមត្រូវ');
        }
      } catch (err: any) {
        setSyncFeedback({
          type: 'error',
          message: isKh ? '❌ បរាជ័យក្នុងការ Restore ឯកសារ JSON: ' + err.message : '❌ Failed to restore JSON: ' + err.message
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0]);
  const [newRole, setNewRole] = useState<'cashier' | 'manager' | 'admin'>('cashier');
  const [addModalError, setAddModalError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRole, setEditRole] = useState<'cashier' | 'manager' | 'admin'>('cashier');
  const [editPassword, setEditPassword] = useState('');
  const [editModalError, setEditModalError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Local / Server Users State
  const [localUsers, setLocalUsers] = useState<User[]>(() => {
    return Array.isArray(users) && users.length > 0 ? users : getCachedData<User[]>(LOCAL_STORAGE_KEYS.USERS, [DEFAULT_USERS[0]]);
  });

  useEffect(() => {
    if (Array.isArray(users)) {
      setLocalUsers(users);
    }
  }, [users]);

  useEffect(() => {
    const handleUsersUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLocalUsers(e.detail);
      }
    };
    window.addEventListener('minipos:users_updated', handleUsersUpdated);
    return () => window.removeEventListener('minipos:users_updated', handleUsersUpdated);
  }, []);

  // Upgrade Requests Management State & Subscription
  const [adminTab, setAdminTab] = useState<'members' | 'sessions' | 'upgrades' | 'logs'>('members');
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>(() => getCachedUpgradeRequests());
  const [processingUpgradeId, setProcessingUpgradeId] = useState<string | null>(null);
  const [previewReceiptImage, setPreviewReceiptImage] = useState<string | null>(null);
  const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Admin Upgrade KHQR Configuration State
  const initialAdminKhqr = settings?.adminUpgradeKhqr || getAdminUpgradeKhqrSettings() || {};
  const [adminKhqrImage, setAdminKhqrImage] = useState<string>(initialAdminKhqr.khqrImage || settings?.khqrImage || '');
  const [adminKhqrBankName, setAdminKhqrBankName] = useState<string>(initialAdminKhqr.bankName || settings?.khqrBankName || 'ABA Bank / Bakong KHQR');
  const [adminKhqrAccountName, setAdminKhqrAccountName] = useState<string>(initialAdminKhqr.accountName || settings?.khqrAccountName || 'PROZZ LOP (POS ADMIN)');
  const [adminKhqrAccountNumber, setAdminKhqrAccountNumber] = useState<string>(initialAdminKhqr.accountNumber || settings?.khqrAccountNumber || '001 888 999');
  const [adminKhqrMerchantName, setAdminKhqrMerchantName] = useState<string>(initialAdminKhqr.merchantName || settings?.khqrMerchantName || 'MINI MART POS OFFICIAL');
  const [adminUpgradePrice, setAdminUpgradePrice] = useState<number>(initialAdminKhqr.upgradePrice || 19.00);
  const [adminTelegramUsername, setAdminTelegramUsername] = useState<string>(initialAdminKhqr.telegramUsername || 'laymeancamera');
  const [isAdminKhqrSaving, setIsAdminKhqrSaving] = useState(false);
  const [adminKhqrSavedFeedback, setAdminKhqrSavedFeedback] = useState(false);
  const [showAdminKhqrConfig, setShowAdminKhqrConfig] = useState(true);
  const adminKhqrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToUpgradeRequests((reqs) => {
      setUpgradeRequests(reqs);
    });
    return () => unsub();
  }, []);

  const handleSaveAdminKhqrConfig = async () => {
    setIsAdminKhqrSaving(true);
    try {
      let finalKhqrImg = adminKhqrImage;
      if (adminKhqrImage.startsWith('data:image/')) {
        try {
          const uploadedUrl = await uploadImageToServer(adminKhqrImage, 'khqr');
          if (uploadedUrl) {
            finalKhqrImg = uploadedUrl;
            setAdminKhqrImage(uploadedUrl);
          }
        } catch {}
      }

      const config = {
        khqrImage: finalKhqrImg,
        bankName: adminKhqrBankName.trim(),
        accountName: adminKhqrAccountName.trim(),
        accountNumber: adminKhqrAccountNumber.trim(),
        merchantName: adminKhqrMerchantName.trim(),
        upgradePrice: Number(adminUpgradePrice) || 19.00,
        telegramUsername: adminTelegramUsername.trim()
      };
      await saveAdminUpgradeKhqrSettings(config);
      setAdminKhqrSavedFeedback(true);
      setTimeout(() => setAdminKhqrSavedFeedback(false), 4000);
    } catch (err: any) {
      alert(isKh ? 'បរាជ័យក្នុងការរក្សាទុក KHQR: ' + err.message : 'Failed to save KHQR config: ' + err.message);
    } finally {
      setIsAdminKhqrSaving(false);
    }
  };

  const handleAdminKhqrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageFile(file, 800, 800, 0.85);
      setAdminKhqrImage(resized.dataUrl);
    } catch (err: any) {
      alert(isKh ? 'បរាជ័យក្នុងការ Upload រូបភាព KHQR: ' + err.message : 'Failed to upload KHQR: ' + err.message);
    }
  };

  const handleApproveUpgrade = async (req: UpgradeRequest) => {
    setProcessingUpgradeId(req.id);
    try {
      await approveUpgradeRequest(req.id, currentUser);
      
      // Immediately reflect in local state
      setLocalUsers(prev => prev.map(u => (u.id === req.userId || u.username === req.username) ? { ...u, plan: 'lifetime' } : u));
      setUpgradeRequests(prev => prev.map(r => r.id === req.id ? { 
        ...r, 
        status: 'approved', 
        reviewedAt: new Date().toISOString(), 
        reviewedBy: currentUser.fullName || currentUser.username 
      } : r));

      if (onFetchLatestFromCloud) {
        await onFetchLatestFromCloud();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve upgrade request');
    } finally {
      setProcessingUpgradeId(null);
    }
  };

  const handleRejectUpgrade = async (req: UpgradeRequest) => {
    const reason = window.prompt(
      isKh ? 'សូមបញ្ជាក់មូលហេតុនៃការបដិសេធ (Reason for rejection):' : 'Enter rejection reason:',
      isKh ? 'រូបភាពវិក្កយបត្រមិនច្បាស់លាស់ ឬទឹកប្រាក់មិនត្រូវ' : 'Payment receipt unclear or amount mismatch'
    );
    if (reason === null) return;
    setProcessingUpgradeId(req.id);
    try {
      await rejectUpgradeRequest(req.id, currentUser, reason);
      setUpgradeRequests(prev => prev.map(r => r.id === req.id ? { 
        ...r, 
        status: 'rejected', 
        adminNote: reason,
        reviewedAt: new Date().toISOString(), 
        reviewedBy: currentUser.fullName || currentUser.username 
      } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to reject upgrade request');
    } finally {
      setProcessingUpgradeId(null);
    }
  };

  // Direct toggle user plan
  const handleToggleUserPlan = async (targetUser: User) => {
    const newPlan = targetUser.plan === 'lifetime' ? 'free' : 'lifetime';
    try {
      await updateUserPlanInFirestore(targetUser.id, newPlan);
      setLocalUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, plan: newPlan } : u));
      if (onFetchLatestFromCloud) {
        await onFetchLatestFromCloud();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user plan');
    }
  };

  // Filtered Users List (Using localUsers ensuring all registered members display)
  const filteredUsers = localUsers.filter((u) => {
    const matchSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // User & Member Specific Metrics
  const totalUsers = localUsers.length;
  const activeUsers = localUsers.filter(u => u.status === 'active').length;
  const disabledUsers = localUsers.filter(u => u.status === 'disabled').length;
  const cashiersCount = localUsers.filter(u => u.role === 'cashier').length;
  const managersCount = localUsers.filter(u => u.role === 'manager').length;
  const adminsCount = localUsers.filter(u => u.role === 'admin').length;

  // Handle Photo Upload Helper with auto-compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(isKh ? 'សូមជ្រើសរើសប្រភេទជារូបភាព!' : 'Please select an image file!');
      return;
    }
    try {
      const result = await resizeImageFile(file, 400, 400, 0.85);
      callback(result.dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          callback(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditAvatar(user.avatar || '');
    setEditRole(user.role);
    setEditPassword('');
    setEditModalError('');
  };

  // Save Edit Member
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditModalError('');

    if (!editFullName.trim()) {
      setEditModalError(isKh ? 'សូមបញ្ចូលឈ្មោះពេញ!' : 'Please enter full name.');
      return;
    }

    setIsEditing(true);
    try {
      const updated: User = {
        ...editingUser,
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        avatar: editAvatar || editingUser.avatar,
        role: editingUser.username === 'admin' ? 'admin' : editRole,
        password: editPassword.trim() ? editPassword.trim() : editingUser.password,
      };

      await saveUserToFirestore(updated);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_USER',
        `Admin updated member info for ${updated.fullName} (@${updated.username})`
      );

      if (currentUser.id === updated.id && onUpdateCurrentUser) {
        onUpdateCurrentUser(updated);
      }

      setEditingUser(null);
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update member');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user: User) => {
    if (user.username === 'admin') {
      alert(isKh ? 'មិនអាចផ្អាកគណនី Root Admin បានទេ!' : 'Cannot disable primary Admin account!');
      return;
    }
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await updateUserStatusInFirestore(user.id, newStatus);
      setLocalUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_USER_STATUS',
        `Changed ${user.username} status to ${newStatus}`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Handle Change Role
  const handleChangeRole = async (user: User, newRole: 'admin' | 'cashier' | 'manager') => {
    if (user.username === 'admin' && newRole !== 'admin') {
      alert(isKh ? 'មិនអាចប្តូរតួនាទី Root Admin បានទេ!' : 'Cannot change root admin role!');
      return;
    }
    try {
      await updateUserRoleInFirestore(user.id, newRole);
      setLocalUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_USER_ROLE',
        `Changed ${user.username} role to ${newRole}`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  // Handle Delete User Execution
  const executeDeleteUser = async (user: User) => {
    if (user.username === 'admin') {
      alert(isKh ? 'មិនអាចលុបគណនី Root Admin បានទេ!' : 'Cannot delete primary Admin account!');
      return;
    }

    try {
      await deleteUserFromFirestore(user.id);
      setLocalUsers(prev => prev.filter(u => u.id !== user.id));
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'DELETE_USER',
        `Deleted member ${user.username}`
      );
      if (onFetchLatestFromCloud) {
        await onFetchLatestFromCloud();
      }
      setUserToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Handle Create New User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError('');
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddModalError(isKh ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់!' : 'Please fill all required fields.');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setAddModalError(isKh ? 'ឈ្មោះគណនីនេះមានរួចហើយ!' : 'Username already exists.');
      return;
    }

    setIsAdding(true);
    try {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        password: newPassword.trim(),
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        role: newRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        avatar: newAvatar || PRESET_AVATARS[0]
      };

      await saveUserToFirestore(newUser);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'CREATE_USER',
        `Admin created new member ${newUser.fullName} (@${newUser.username}) with role ${newUser.role}`
      );

      // Reset form
      setNewFullName('');
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      setNewEmail('');
      setNewAvatar(PRESET_AVATARS[0]);
      setShowAddModal(false);
    } catch (err: any) {
      setAddModalError(err.message || 'Failed to create member');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Header - Focused on User & Member Management */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-900/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  {isKh ? 'ប្រព័ន្ធគ្រប់គ្រងសមាជិក & អ្នកប្រើប្រាស់ (User & Member Management)' : 'User & Member Management Console'}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 text-[10px] font-bold border border-indigo-400/30">
                  Live Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isKh 
                  ? 'គ្រប់គ្រងគណនីបុគ្គលិក សមាជិក សិទ្ធិប្រើប្រាស់ និងរូបភាពផ្ទាល់ខ្លួន (Photo Upload)' 
                  : 'Manage staff, member profiles, photo uploads, access roles & security'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onNavigateToPos}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {isKh ? 'ទៅកាន់ផ្ទាំងលក់ POS' : 'Back to POS'}
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {isKh ? 'ចាកចេញ' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        
        {/* User & Member Specific KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'សមាជិកសរុប' : 'Total Members'}
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
              <span className="text-xs font-bold text-slate-500">
                {isKh ? 'គណនី' : 'Accounts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'ទិន្នន័យលើ Ubuntu Server' : 'Stored in Ubuntu Server'}
            </p>
          </div>

          {/* Live Online Users & Devices Card */}
          <div 
            onClick={() => setAdminTab('sessions')}
            className="bg-gradient-to-br from-emerald-950/20 via-white to-emerald-50/40 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                {isKh ? 'កំពុង Online' : 'Live Online'}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{liveSessions.length}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                {isKh ? 'ឧបករណ៍' : 'Devices'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center justify-between">
              <span>{isKh ? 'iPhone, PC, Tablet លើ Server' : 'Active on Server'}</span>
              <span className="text-[10px] underline">{isKh ? 'មើល' : 'View'} &rarr;</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'គណនីសកម្ម' : 'Active Members'}
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{activeUsers}</span>
              {disabledUsers > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  {disabledUsers} {isKh ? 'ផ្អាក' : 'Disabled'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'មានសិទ្ធិចូលប្រព័ន្ធពេញលេញ' : 'Ready to sign in'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'បេឡាករ & បុគ្គលិកលក់' : 'Cashiers / Staff'}
              </span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{cashiersCount}</span>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                Cashiers
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'កាន់កាប់ការលក់ POS' : 'Assigned to POS'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isKh ? 'ថ្នាក់គ្រប់គ្រង' : 'Admins & Managers'}
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{adminsCount + managersCount}</span>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {adminsCount} Admins
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isKh ? 'សិទ្ធិគ្រប់គ្រង & របាយការណ៍' : 'Management & Reports'}
            </p>
          </div>
        </div>

        {/* Ubuntu Server Database & Local Storage Engine Hub */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/20 shadow-xl relative overflow-hidden">
          {/* Hidden JSON File input for Restore */}
          <input
            type="file"
            ref={jsonFileInputRef}
            onChange={handleRestoreFromJsonFile}
            accept=".json"
            className="hidden"
          />

          {/* Ambient glow decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 space-y-6">
            
            {/* Header with Badges */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      {isKh ? 'ការគ្រប់គ្រង Database & បម្រុងទុកទិន្នន័យ Server (Ubuntu Server & Database Hub)' : 'Ubuntu Server & Database Hub'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Self-Hosted & Offline Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl font-medium">
                    {isKh 
                      ? 'ទិន្នន័យទាំងអស់ដំណើរការលើ Server Ubuntu ផ្ទាល់ខ្លួន និង Local Storage ដោយស្វ័យប្រវត្តិ មិនជាប់ពាក់ព័ន្ធជាមួយ Cloud ខាងក្រៅឡើយ និងអាចទាញយក Backup File .JSON បានគ្រប់ពេល។'
                      : 'Data operates on your self-hosted Ubuntu server & local storage with zero cloud dependencies. Download or restore .JSON backups anytime.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Export JSON, Import JSON, Pull Server, Save Snapshot */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={exportDatabaseBackupFile}
                  className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-xs"
                  title={isKh ? 'ទាញយកឯកសារ Database Backup (.JSON)' : 'Download Database JSON Backup'}
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isKh ? 'ទាញយក Backup (.JSON)' : 'Export JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-xs"
                  title={isKh ? 'បញ្ចូលឯកសារ Restore ពី .JSON' : 'Restore from JSON File'}
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{isKh ? 'Restore ពី JSON' : 'Restore JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerFetchLatest}
                  disabled={isFetching || isSyncing}
                  className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  title={isKh ? 'ទាញយកទិន្នន័យពី Server មកវិញ' : 'Fetch fresh dataset from Server'}
                >
                  {isFetching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                  )}
                  <span>{isKh ? 'ទាញយកពី Server' : 'Pull Server'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerSyncAll}
                  disabled={isSyncing || isFetching}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{isKh ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4 text-white" />
                      <span>{isKh ? '💾 រក្សាទុកលើ Server' : '💾 Save to Server'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Feedback Toast Message */}
            {syncFeedback && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
                syncFeedback.type === 'success' 
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {syncFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{syncFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncFeedback(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sync Status Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>{isKh ? 'កាលបរិច្ឆេទរក្សាទុកចុងក្រោយ' : 'Last Server Snapshot'}</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-sm font-black text-white">
                  {formatSyncTime(lastSyncTime)}
                </div>
                <p className="text-[10px] text-slate-400">
                  {lastSyncTime ? (isKh ? 'ទិន្នន័យមានសុវត្ថិភាព' : 'Database file ready') : (isKh ? 'សូមចុច រក្សាទុកលើកដំបូង' : 'Initial save ready')}
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>{isKh ? 'ទិន្នន័យរង់ចាំ Save' : 'Pending Changes'}</span>
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <span>{pendingChanges} {isKh ? 'ការផ្លាស់ប្តូរ' : 'items'}</span>
                  {pendingChanges > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {pendingChanges === 0 ? (isKh ? 'បានរក្សាទុកទាំងអស់' : 'All saved') : (isKh ? 'ក្នុង Local Storage' : 'Staged locally')}
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>{isKh ? 'របៀបដំណើរការ Server' : 'Server Engine Mode'}</span>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-sm font-black text-emerald-400">
                  {isKh ? 'Ubuntu & Standalone' : 'Ubuntu & Standalone'}
                </div>
                <p className="text-[10px] text-slate-400">
                  {isKh ? '100% គ្មានថ្លៃ Cloud' : '100% Zero Cloud Fees'}
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>{isKh ? 'ទិន្នន័យសរុបក្នុងប្រព័ន្ធ' : 'Total System Records'}</span>
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <span className="text-sky-300">{products.length}</span> {isKh ? 'ទំនិញ' : 'prods'},{' '}
                  <span className="text-indigo-300">{orders.length}</span> {isKh ? 'វិក្កយបត្រ' : 'orders'}
                </div>
                <p className="text-[10px] text-slate-400">
                  {customers.length} {isKh ? 'អតិថិជន' : 'custs'}, {expenses.length} {isKh ? 'ចំណាយ' : 'expenses'}
                </p>
              </div>
            </div>

            {/* Per-Member Data Inventory Breakdown Table */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isKh ? 'ស្ថិតិទិន្នន័យតាមគណនីសមាជិកនីមួយៗ (Per-Member Inventory & Sales Breakdown)' : 'Per-Member Inventory & Sales Breakdown'}</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {localUsers.length} {isKh ? 'គណនីបានចុះឈ្មោះ' : 'Registered Accounts'}
                </span>
              </div>

              {localUsers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium">
                  {isKh ? 'កំពុងទាញយកទិន្នន័យសមាជិក...' : 'Loading registered members data...'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {localUsers.map((u) => {
                    const memberProds = products.filter(p => p.userId === u.id || (!p.userId && u.id === 'user-admin'));
                    const memberOrds = orders.filter(o => o.userId === u.id || (!o.userId && u.id === 'user-admin'));
                    const memberRevenue = memberOrds.reduce((sum, ord) => sum + (ord.total || 0), 0);
                    const hasCustomLogo = Boolean(u.invoiceLogo);
                    const hasCustomKhqr = Boolean(u.khqrImage || u.khqrAccountNumber);
                    const isLifetime = u.plan === 'lifetime' || u.role === 'admin' || u.username === 'admin';

                    return (
                      <div 
                        key={`sync-user-${u.id}`} 
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={u.avatar || PRESET_AVATARS[0]} 
                              alt={u.fullName} 
                              className="w-8 h-8 rounded-lg object-cover border border-slate-700" 
                            />
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[120px]">
                                {u.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                @{u.username}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isLifetime ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-400" />
                                <span>LIFETIME</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                FREE (10)
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              u.role === 'admin' 
                                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' 
                                : u.role === 'manager' 
                                ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50' 
                                : 'bg-sky-900/60 text-sky-300 border border-sky-700/50'
                            }`}>
                              {u.role}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                          <div className="bg-slate-900/80 p-1.5 rounded-lg text-center">
                            <span className="text-[9px] text-slate-400 block">{isKh ? 'ទំនិញ' : 'Items'}</span>
                            <span className="font-black text-indigo-300">{memberProds.length}</span>
                          </div>
                          <div className="bg-slate-900/80 p-1.5 rounded-lg text-center">
                            <span className="text-[9px] text-slate-400 block">{isKh ? 'វិក្កយបត្រ' : 'Sales'}</span>
                            <span className="font-black text-emerald-300">{memberOrds.length}</span>
                          </div>
                          <div className="bg-slate-900/80 p-1.5 rounded-lg text-center">
                            <span className="text-[9px] text-slate-400 block">{isKh ? 'ចំណូល' : 'Rev'}</span>
                            <span className="font-black text-amber-300">${memberRevenue.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Branding Flags */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <QrCode className={`w-3 h-3 ${hasCustomKhqr ? 'text-rose-400' : 'text-slate-600'}`} />
                            {hasCustomKhqr ? (isKh ? 'KHQR ផ្ទាល់ខ្លួន' : 'Custom KHQR') : (isKh ? 'KHQR លំនាំដើម' : 'Default KHQR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className={`w-3 h-3 ${hasCustomLogo ? 'text-amber-400' : 'text-slate-600'}`} />
                            {hasCustomLogo ? (isKh ? 'Invoice Logo' : 'Custom Logo') : (isKh ? 'Logo លំនាំដើម' : 'System Logo')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Tab Navigation Controls (Members Management vs Live Sessions vs Upgrade Requests vs Activity Logs) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            type="button"
            onClick={() => setAdminTab('members')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'members'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isKh ? 'សមាជិកទាំងអស់' : 'All Users & Members'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              adminTab === 'members' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {users.length}
            </span>
          </button>

          {/* Tab 2: Live Active Devices & Sessions */}
          <button
            type="button"
            onClick={() => setAdminTab('sessions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'sessions'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{isKh ? 'ឧបករណ៍ & User កំពុង Online' : 'Live Active Sessions'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              adminTab === 'sessions' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {liveSessions.length} {isKh ? 'Online' : 'Active'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('upgrades')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'upgrades'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>{isKh ? 'សំណើ Upgrade (KHQR)' : 'Upgrade Requests (KHQR)'}</span>
            {upgradeRequests.filter(r => r.status === 'pending').length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                {upgradeRequests.filter(r => r.status === 'pending').length} {isKh ? 'រង់ចាំ' : 'New'}
              </span>
            ) : (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                adminTab === 'upgrades' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {upgradeRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('logs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === 'logs'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>{isKh ? 'កំណត់ត្រា & Logins' : 'Audit Logs & Logins'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              adminTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {activityLogs.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Members Management Table Section */}
        {adminTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          {/* Table Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {isKh ? 'បញ្ជីគណនីសមាជិក និងបុគ្គលិកទាំងអស់' : 'Registered Users & Members'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {isKh 
                  ? 'គ្រប់គ្រងរូបភាព Profile ព័ត៌មានលម្អិត តួនាទី និងពាក្យសម្ងាត់' 
                  : 'Manage profile photos, info, roles and passwords'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះ/លេខទូរស័ព្ទ...' : 'Search name, username, phone...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{isKh ? 'តួនាទីទាំងអស់' : 'All Roles'}</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{isKh ? 'ស្ថានភាពទាំងអស់' : 'All Status'}</option>
                <option value="active">{isKh ? 'សកម្ម (Active)' : 'Active'}</option>
                <option value="disabled">{isKh ? 'ផ្អាក (Disabled)' : 'Disabled'}</option>
              </select>

              {/* Add Member Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isKh ? 'បន្ថែមសមាជិកថ្មី' : 'Add Member'}</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">{isKh ? 'រូបភាព & ឈ្មោះសមាជិក' : 'Member & Avatar'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'ព័ត៌មានទំនាក់ទំនង' : 'Contact'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'តួនាទី' : 'Role'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="px-4 py-3.5">{isKh ? 'កាលបរិច្ឆេទ' : 'Created Date'}</th>
                  <th className="px-5 py-3.5 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span>{isKh ? 'រកមិនឃើញគណនីដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No members found matching your search.'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRootAdmin = u.username === 'admin';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Member Photo & Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative group">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                                alt={u.fullName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 shrink-0 group-hover:opacity-80 transition-opacity"
                              />
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title={isKh ? 'កែសម្រួលរូបភាព' : 'Edit photo'}
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                {u.fullName}
                                {isRootAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                                    ROOT ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 font-mono text-xs">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5 text-slate-600">
                          <div className="space-y-0.5">
                            {u.phone ? (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{u.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                            {u.email && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="px-4 py-3.5">
                          {isRootAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] bg-indigo-100 text-indigo-800">
                              Admin
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u, e.target.value as any)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
                            >
                              <option value="cashier">{isKh ? 'បេឡាករ (Cashier)' : 'Cashier'}</option>
                              <option value="manager">{isKh ? 'អ្នកគ្រប់គ្រង (Manager)' : 'Manager'}</option>
                              <option value="admin">{isKh ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)' : 'Admin'}</option>
                            </select>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="px-4 py-3.5">
                          {isRootAdmin ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              {u.status === 'active' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Disabled</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '-'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Toggle Plan quick button */}
                            <button
                              type="button"
                              onClick={() => handleToggleUserPlan(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.plan === 'lifetime' 
                                  ? 'text-amber-600 hover:bg-amber-50' 
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={u.plan === 'lifetime' ? (isKh ? 'គម្រោង Lifetime (ចុចដើម្បីប្តូរ)' : 'Lifetime Plan (Click to toggle)') : (isKh ? 'គម្រោង Free (ចុចដើម្បី Upgrade ផ្ទាល់)' : 'Free Plan (Click to Upgrade)')}
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title={isKh ? 'កែសម្រួលគណនី' : 'Edit Member'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {!isRootAdmin && (
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={isKh ? 'លុបគណនី' : 'Delete Member'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Tab 2: Upgrade Requests Approval Section */}
        {adminTab === 'upgrades' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>{isKh ? 'សំណើ Upgrade គម្រោងពីសមាជិក (KHQR / Invoice Verification)' : 'Membership Plan Upgrade Requests'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isKh 
                    ? 'ពិនិត្យវិក្កយបត្របង់ប្រាក់ KHQR និងអនុញ្ញាតអោយគណនីសមាជិកប្រើប្រាស់ Lifetime បានគ្មានដែនកំណត់' 
                    : 'Verify member KHQR payment slips and approve Lifetime Unlimited access'}
                </p>
              </div>

              {/* Status Filter for Upgrades */}
              <div className="flex items-center gap-2">
                <select
                  value={upgradeFilter}
                  onChange={(e) => setUpgradeFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">{isKh ? 'សំណើទាំងអស់' : 'All Requests'}</option>
                  <option value="pending">{isKh ? 'កំពុងរង់ចាំ (Pending)' : 'Pending'}</option>
                  <option value="approved">{isKh ? 'បានយល់ព្រម (Approved)' : 'Approved'}</option>
                  <option value="rejected">{isKh ? 'បានបដិសេធ (Rejected)' : 'Rejected'}</option>
                </select>
              </div>
            </div>

            {/* Admin KHQR Configuration for Membership Upgrades */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-indigo-500/30 p-5 text-white shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-900/40 shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>{isKh ? '🇰🇭 កំណត់ KHQR ទទួលប្រាក់ Upgrade ពីសមាជិក (Admin Payment QR Code)' : '🇰🇭 Admin Upgrade KHQR Configuration'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                        Step 1 KHQR
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isKh 
                        ? 'រូបភាព KHQR និងលេខគណនីនេះ នឹងបង្ហាញដោយស្វ័យប្រវត្តិទៅកាន់សមាជិកទាំងអស់នៅត្រង់ "ជំហានទី ១៖ ស្កេន KHQR ដើម្បីបង់ប្រាក់"' 
                        : 'This KHQR code and bank account info will be displayed automatically in Step 1 of the Member Upgrade Modal.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminKhqrConfig(!showAdminKhqrConfig)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {showAdminKhqrConfig ? (isKh ? 'បង្រួម (Collapse)' : 'Collapse') : (isKh ? 'ពង្រីក (Expand)' : 'Expand')}
                  </button>
                </div>
              </div>

              {showAdminKhqrConfig && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">
                  
                  {/* Left: KHQR Image Upload & Preview */}
                  <div className="lg:col-span-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      {isKh ? 'រូបភាព QR Code Bakong / ABA' : 'Admin KHQR Image'}
                    </span>

                    <input 
                      type="file" 
                      ref={adminKhqrFileInputRef}
                      onChange={handleAdminKhqrImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {adminKhqrImage ? (
                      <div className="relative group w-44 h-44 mx-auto bg-white rounded-xl p-2 border border-slate-700 shadow-md">
                        <img 
                          src={adminKhqrImage} 
                          alt="Admin KHQR" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => adminKhqrFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                          >
                            {isKh ? 'ប្តូររូបភាព' : 'Change QR'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminKhqrImage('')}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow cursor-pointer"
                          >
                            {isKh ? 'លុបចេញ' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => adminKhqrFileInputRef.current?.click()}
                        className="w-44 h-44 mx-auto border-2 border-dashed border-slate-700 hover:border-indigo-400 rounded-xl bg-slate-900/60 hover:bg-indigo-950/30 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-300">
                          {isKh ? 'Upload រូប KHQR' : 'Upload KHQR'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          PNG, JPG (Auto-optimize)
                        </span>
                      </button>
                    )}

                    <p className="text-[10px] text-slate-400">
                      💡 {isKh ? 'សូម Upload រូបភាព KHQR ផ្ទាល់ខ្លួនរបស់ Admin សម្រាប់ទទួលប្រាក់' : 'Upload your personal Bakong/ABA KHQR image'}
                    </p>
                  </div>

                  {/* Right: Bank Account Details Form */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Bank Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {isKh ? 'ឈ្មោះធនាគារ (Bank Name)' : 'Bank Name'}
                        </label>
                        <input
                          type="text"
                          value={adminKhqrBankName}
                          onChange={(e) => setAdminKhqrBankName(e.target.value)}
                          placeholder="ABA Bank / Bakong KHQR"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      {/* Store / Merchant Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {isKh ? 'ឈ្មោះហាង/ស្ថាប័នលើ QR (Merchant Name)' : 'Merchant Name'}
                        </label>
                        <input
                          type="text"
                          value={adminKhqrMerchantName}
                          onChange={(e) => setAdminKhqrMerchantName(e.target.value)}
                          placeholder="MINI MART POS KH"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      {/* Account Holder Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {isKh ? 'ឈ្មោះម្ចាស់គណនី (Account Name)' : 'Account Name'}
                        </label>
                        <input
                          type="text"
                          value={adminKhqrAccountName}
                          onChange={(e) => setAdminKhqrAccountName(e.target.value)}
                          placeholder="PROZZ LOP (POS ADMIN)"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono font-medium"
                        />
                      </div>

                      {/* Account Number */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {isKh ? 'លេខគណនី / Bakong ID (Account No.)' : 'Account Number'}
                        </label>
                        <input
                          type="text"
                          value={adminKhqrAccountNumber}
                          onChange={(e) => setAdminKhqrAccountNumber(e.target.value)}
                          placeholder="001 888 999"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono font-medium"
                        />
                      </div>

                      {/* Upgrade Price */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {isKh ? 'តម្លៃគម្រោង Lifetime USD (Upgrade Fee)' : 'Lifetime Upgrade Price ($ USD)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-black text-amber-400">$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={adminUpgradePrice}
                            onChange={(e) => setAdminUpgradePrice(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold"
                          />
                        </div>
                      </div>

                      {/* Telegram Contact Link */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">
                          {isKh ? 'Telegram សម្រាប់សមាជិកទាក់ទង' : 'Admin Telegram Username/Link'}
                        </label>
                        <input
                          type="text"
                          value={adminTelegramUsername}
                          onChange={(e) => setAdminTelegramUsername(e.target.value)}
                          placeholder="laymeancamera ឬ https://t.me/..."
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                    </div>

                    {/* Action button */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        {adminKhqrSavedFeedback ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {isKh ? '✅ បានរក្សាទុកព័ត៌មាន KHQR លើ Server ជោគជ័យ!' : '✅ Admin KHQR saved on server!'}
                          </span>
                        ) : (
                          <span>{isKh ? 'ការកែប្រែនឹងត្រូវ Update ភ្លាមៗ' : 'Changes apply immediately to all users'}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAdminKhqrConfig}
                        disabled={isAdminKhqrSaving}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isAdminKhqrSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{isKh ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>{isKh ? 'រក្សាទុក KHQR លើ Server' : 'Save KHQR to Server'}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* Upgrade Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">{isKh ? 'សមាជិក / គណនី' : 'Member / Account'}</th>
                    <th className="px-4 py-3">{isKh ? 'គម្រោងស្នើសុំ' : 'Target Plan'}</th>
                    <th className="px-4 py-3">{isKh ? 'ទឹកប្រាក់ / វិធីបង់' : 'Amount / Method'}</th>
                    <th className="px-4 py-3">{isKh ? 'វិក្កយបត្រ (Invoice Slip)' : 'Payment Slip'}</th>
                    <th className="px-4 py-3">{isKh ? 'កាលបរិច្ឆេទ' : 'Request Date'}</th>
                    <th className="px-4 py-3">{isKh ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="px-4 py-3 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upgradeRequests
                    .filter(req => upgradeFilter === 'all' || req.status === upgradeFilter)
                    .length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Crown className="w-8 h-8 text-slate-300" />
                          <span className="font-medium">
                            {isKh ? 'មិនទាន់មានសំណើ Upgrade នៅក្នុងបញ្ជីនេះទេ' : 'No upgrade requests in this view.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    upgradeRequests
                      .filter(req => upgradeFilter === 'all' || req.status === upgradeFilter)
                      .map((req) => {
                        const isPending = req.status === 'pending';
                        const isApproved = req.status === 'approved';
                        const isRejected = req.status === 'rejected';

                        return (
                          <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 text-sm">
                                {req.fullName || req.username}
                              </div>
                              <div className="text-slate-400 font-mono text-xs">
                                @{req.username}
                              </div>
                              {req.phone && (
                                <div className="text-slate-500 text-[11px]">
                                  Tel: {req.phone}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                <Crown className="w-3 h-3 text-amber-600" />
                                {req.targetPlan || 'lifetime'}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-extrabold text-slate-900 text-sm">
                                ${req.amount || 19}
                              </div>
                              <div className="text-slate-500 text-[11px] font-medium">
                                Bakong KHQR
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              {req.paymentSlipImage ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceiptImage(req.paymentSlipImage)}
                                    className="relative group w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
                                  >
                                    <img
                                      src={req.paymentSlipImage}
                                      alt="Invoice receipt"
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceiptImage(req.paymentSlipImage)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>{isKh ? 'មើលរូបវិក្កយបត្រ' : 'View Slip'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs italic">
                                  {isKh ? 'គ្មានរូបភាព' : 'No slip uploaded'}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                              {new Date(req.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>

                            <td className="px-4 py-3">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                                  {isKh ? 'កំពុងរង់ចាំការពិនិត្យ' : 'Pending Review'}
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {isKh ? 'បានយល់ព្រម (Lifetime)' : 'Approved (VIP)'}
                                </span>
                              )}
                              {isRejected && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <Ban className="w-3 h-3 text-rose-600" />
                                    {isKh ? 'បានបដិសេធ' : 'Rejected'}
                                  </span>
                                  {req.adminNote && (
                                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                      {req.adminNote}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={processingUpgradeId === req.id}
                                    onClick={() => handleApproveUpgrade(req)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>{isKh ? 'អនុម័ត (Approve)' : 'Approve'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={processingUpgradeId === req.id}
                                    onClick={() => handleRejectUpgrade(req)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>{isKh ? 'បដិសេធ' : 'Reject'}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {req.reviewedBy ? `@${req.reviewedBy}` : '-'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Live Active Sessions & Devices Section */}
        {adminTab === 'sessions' && (
          <div className="space-y-6">
            {/* Server Connection Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Radio className="w-48 h-48 text-emerald-400" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{isKh ? 'Ubuntu Server Real-Time Network: Active' : 'Ubuntu Server Live Sync: Active'}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                    <Server className="w-6 h-6 text-indigo-400" />
                    <span>{isKh ? 'ឧបករណ៍ & សមាជិកកំពុងប្រើប្រាស់លើ Server' : 'Active Devices & Sessions on Server'}</span>
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {isKh 
                      ? 'ប្រព័ន្ធកំពុងដំណើរការផ្ទាល់លើ Server Ubuntu របស់អ្នក (Local SQLite/JSON DB)។ រាល់ពេលដែលសមាជិក ឬបេឡាករ Login ចូលតាម iPhone, iPad, ឬ Laptop នៅលើបណ្តាញ Wi-Fi តែមួយ វានឹងបង្ហាញភ្លាមៗនៅទីនេះ។'
                      : 'The system runs directly on your local Ubuntu Server. Whenever a member logs in from an iPhone, iPad, or computer on the local network, their live connection and active screen appear here in real time.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700 text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {isKh ? 'ឧបករណ៍ Online សរុប' : 'Total Connected'}
                    </div>
                    <div className="text-2xl font-black text-emerald-400 flex items-center justify-end gap-1.5">
                      <span>{liveSessions.length}</span>
                      <span className="text-xs text-slate-400 font-medium">{isKh ? 'ឧបករណ៍' : 'Devices'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const sess = await fetchActiveSessionsFromServer();
                      if (sess) setLiveSessions(sess);
                    }}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-md transition-all cursor-pointer hover:rotate-180"
                    title={isKh ? 'Refresh បញ្ជី' : 'Refresh List'}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sessions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSessions.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {isKh ? 'មិនទាន់មានឧបករណ៍កំពុង Online ទេ' : 'No Active Sessions Detected'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isKh 
                      ? 'ឧបករណ៍ទាំងអស់នឹងបញ្ជូន Heartbeat មកកាន់ Server Ubuntu រៀងរាល់ 10 វិនាទីម្តង។'
                      : 'Connected devices send periodic heartbeats to your Ubuntu Server every 10 seconds.'}
                  </p>
                </div>
              ) : (
                liveSessions.map((session) => {
                  const isCurrentSession = session.sessionId === getOrCreateSessionId();
                  const devLower = (session.device || '').toLowerCase();
                  const isIPhone = devLower.includes('iphone') || devLower.includes('ios');
                  const isAndroid = devLower.includes('android');
                  const isMacOrPC = devLower.includes('mac') || devLower.includes('windows') || devLower.includes('linux');

                  return (
                    <div 
                      key={session.sessionId}
                      className={`bg-white rounded-2xl p-5 border transition-all relative overflow-hidden shadow-xs hover:shadow-md ${
                        isCurrentSession ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img
                              src={session.avatar || PRESET_AVATARS[0]}
                              alt={session.fullName}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                            />
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-900 truncate">
                              {session.fullName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-mono">@{session.username}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                session.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : session.role === 'manager'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-700'
                              }`}>
                                {session.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isCurrentSession && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            {isKh ? 'ឧបករណ៍នេះ (You)' : 'This Device'}
                          </span>
                        )}
                      </div>

                      {/* Device & Location Specs */}
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                            {isIPhone ? (
                              <Smartphone className="w-4 h-4 text-purple-600" />
                            ) : isAndroid ? (
                              <Smartphone className="w-4 h-4 text-emerald-600" />
                            ) : isMacOrPC ? (
                              <Laptop className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Monitor className="w-4 h-4 text-slate-600" />
                            )}
                            <span>{isKh ? 'ប្រភេទឧបករណ៍' : 'Device'}</span>
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[170px]" title={session.device}>
                            {session.device || (isKh ? 'មិនស្គាល់' : 'Unknown')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                            <Globe className="w-4 h-4 text-sky-600" />
                            <span>{isKh ? 'អាសយដ្ឋាន IP' : 'Client IP'}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {session.ip || '127.0.0.1'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                            <Layers className="w-4 h-4 text-amber-600" />
                            <span>{isKh ? 'ផ្ទាំងកំពុងបើក' : 'Active View'}</span>
                          </span>
                          <span className="font-bold text-indigo-600 uppercase text-[11px] bg-indigo-50 px-2 py-0.5 rounded">
                            {session.activeView || 'pos'}
                          </span>
                        </div>
                      </div>

                      {/* Footer Timestamps */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Login: {new Date(session.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>{isKh ? 'កំពុងភ្ជាប់' : 'Connected'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Full Audit Logs & Login History Section */}
        {adminTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {isKh ? 'កំណត់ត្រាសកម្មភាព & ការ Login ទាំងអស់' : 'Audit Logs & Login History'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isKh ? 'កត់ត្រារាល់ពេលមាន User Login, បង្កើតគណនី, ឬកែប្រែទិន្នន័យលើ Ubuntu Server' : 'Audit of all user logins, updates, and transactions on Ubuntu Server'}
                  </p>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isKh ? 'ទាំងអស់' : 'All'} ({activityLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilter('login')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    logFilter === 'login' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>{isKh ? 'Logins & ឧបករណ៍' : 'Logins & Devices'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilter('user')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilter === 'user' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <span>{isKh ? 'សមាជិក & សិទ្ធិ' : 'Users & Roles'}</span>
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
              {activityLogs
                .filter(l => {
                  if (logFilter === 'login') return l.action === 'LOGIN' || l.action === 'LOGOUT';
                  if (logFilter === 'user') return l.action.includes('USER') || l.action.includes('ROLE');
                  return true;
                })
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {isKh ? 'មិនមានកំណត់ត្រាសកម្មភាពក្នុងប្រភេទនេះទេ' : 'No logs found in this category.'}
                </div>
              ) : (
                activityLogs
                  .filter(l => {
                    if (logFilter === 'login') return l.action === 'LOGIN' || l.action === 'LOGOUT';
                    if (logFilter === 'user') return l.action.includes('USER') || l.action.includes('ROLE');
                    return true;
                  })
                  .map((log) => {
                    const isLogin = log.action === 'LOGIN';
                    const isLogout = log.action === 'LOGOUT';
                    const isUserAction = log.action.includes('USER');

                    return (
                      <div key={log.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                        <div className="flex items-start md:items-center gap-3 min-w-0">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-black shrink-0 ${
                            isLogin 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : isLogout
                              ? 'bg-slate-200 text-slate-700'
                              : isUserAction
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-black text-slate-900">@{log.username}</span>
                          <span className="text-slate-600 font-medium">{log.details}</span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono shrink-0 pl-1 md:pl-0">
                          <span>
                            {new Date(log.timestamp).toLocaleDateString(isKh ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* Member Audit & Activity Logs Summary (Shown on non-logs tabs) */}
        {adminTab !== 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {isKh ? 'កំណត់ត្រាសកម្មភាពសមាជិក (Member Activity & Audit Logs)' : 'Member Activity & Audit Logs'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAdminTab('logs')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
            >
              {isKh ? 'មើលកំណត់ត្រាទាំងអស់' : 'View All Logs'} &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {isKh ? 'មិនទាន់មានកំណត់ត្រាសកម្មភាពនៅឡើយទេ' : 'No member activities logged yet.'}
              </div>
            ) : (
              activityLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      log.action === 'LOGIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">@{log.username}</span>
                    <span className="text-slate-600 truncate">{log.details}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        )}

      </main>

      {/* Add Member Modal (With Photo Upload) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {isKh ? 'បង្កើតគណនីសមាជិកថ្មី (New Member)' : 'Create New Member Account'}
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addModalError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {/* Photo Upload for New Member */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {isKh ? 'រូបភាព Profile (Avatar Photo)' : 'Profile Avatar'}
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={newAvatar || PRESET_AVATARS[0]}
                    alt="New member"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-200 shadow-xs"
                  />
                  <div className="space-y-1">
                    <input
                      type="file"
                      ref={addFileInputRef}
                      onChange={(e) => handleFileUpload(e, setNewAvatar)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isKh ? 'Upload រូបភាព' : 'Upload Photo'}</span>
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  {PRESET_AVATARS.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewAvatar(preset)}
                      className={`w-7 h-7 rounded-lg overflow-hidden ring-2 transition-all cursor-pointer ${
                        newAvatar === preset ? 'ring-indigo-600 scale-105' : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ឈ្មោះពេញ (Full Name) *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Sok Piseth"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ឈ្មោះគណនី (Username) *' : 'Username *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="piseth01"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'តួនាទី (Role)' : 'Role'}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-bold text-indigo-700 cursor-pointer"
                  >
                    <option value="cashier">Cashier (បេឡាករ)</option>
                    <option value="manager">Manager (អ្នកគ្រប់គ្រង)</option>
                    <option value="admin">Admin (អ្នកគ្រប់គ្រងប្រព័ន្ធ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ពាក្យសម្ងាត់ (Password) *' : 'Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'លេខទូរស័ព្ទ' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'អ៊ីមែល' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@pos.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isKh ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? 'Saving...' : (isKh ? 'បង្កើតសមាជិក' : 'Create Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal (With Photo Upload & Details) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                {isKh ? 'កែប្រែព័ត៌មានសមាជិក (Edit Member)' : 'Edit Member Details'}
              </h4>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              {/* Photo Upload */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {isKh ? 'រូបភាពផ្ទាល់ខ្លួន (Profile Photo / Avatar)' : 'Member Profile Photo'}
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt="Editing"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-200 shadow-xs"
                  />
                  <div className="space-y-1">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={(e) => handleFileUpload(e, setEditAvatar)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isKh ? 'Upload រូបភាពថ្មី' : 'Change Photo'}</span>
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  {PRESET_AVATARS.slice(0, 6).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(preset)}
                      className={`w-7 h-7 rounded-lg overflow-hidden ring-2 transition-all cursor-pointer ${
                        editAvatar === preset ? 'ring-indigo-600 scale-105' : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ឈ្មោះពេញ *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ឈ្មោះគណនី (មិនអាចប្តូរ)' : 'Username (Readonly)'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.username}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'តួនាទី' : 'Role'}
                  </label>
                  <select
                    disabled={editingUser.username === 'admin'}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-bold text-indigo-700 cursor-pointer disabled:opacity-60"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'លេខទូរស័ព្ទ' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'អ៊ីមែល' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="user@pos.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKh ? 'ប្តូរពាក្យសម្ងាត់ (ទុកទទេបើមិនចង់ប្តូរ)' : 'Reset Password (Leave blank to keep)'}
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isKh ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isEditing ? 'Saving...' : (isKh ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Full Size Modal */}
      {previewReceiptImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                {isKh ? 'រូបភាពវិក្កយបត្របង់ប្រាក់ KHQR (Payment Receipt)' : 'KHQR Payment Receipt Proof'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewReceiptImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-black/50 rounded-2xl p-2 border border-slate-800">
              <img
                src={previewReceiptImage}
                alt="Payment Slip Proof"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewReceiptImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isKh ? 'បិទផ្ទាំង' : 'Close Preview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0 border border-rose-100">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {isKh ? 'បញ្ជាក់ការលុបគណនីសមាជិក' : 'Confirm Delete Member Account'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isKh ? 'តើអ្នកប្រាកដជាចង់លុបគណនីសមាជិកនេះចេញពីប្រព័ន្ធមែនទេ?' : 'Are you sure you want to permanently delete this user account?'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                {userToDelete.avatar && userToDelete.avatar.startsWith('data:') || userToDelete.avatar.startsWith('http') || userToDelete.avatar.startsWith('/') ? (
                  <img src={userToDelete.avatar} alt={userToDelete.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{userToDelete.avatar || '👤'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 truncate">
                  {userToDelete.fullName}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  @{userToDelete.username}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {userToDelete.role.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    userToDelete.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {userToDelete.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {isKh ? 'បោះបង់ (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => executeDeleteUser(userToDelete)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isKh ? 'លុបគណនី (Delete)' : 'Delete Member'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
