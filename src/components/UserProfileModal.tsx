import React, { useState, useRef } from 'react';
import { 
  User as UserIcon, 
  Upload, 
  Camera, 
  X, 
  Check, 
  KeyRound, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  QrCode,
  Building2,
  CreditCard,
  Crown,
  Zap
} from 'lucide-react';
import { User } from '../types';
import { saveUserToFirestore, logUserActivity } from '../lib/firestoreService';
import { resizeImageFile } from '../lib/imageUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser?: (updatedUser: User) => void;
  onUserUpdated?: (updatedUser: User) => void;
  onOpenUpgradePlan?: () => void;
  language: 'en' | 'kh';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onUserUpdated,
  onOpenUpgradePlan,
  language,
}) => {
  const isKh = language === 'kh';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const khqrFileInputRef = useRef<HTMLInputElement>(null);
  const invoiceLogoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'khqr' | 'invoice'>('profile');
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Per-user KHQR fields
  const [khqrImage, setKhqrImage] = useState(currentUser.khqrImage || '');
  const [khqrMerchantName, setKhqrMerchantName] = useState(currentUser.khqrMerchantName || '');
  const [khqrAccountName, setKhqrAccountName] = useState(currentUser.khqrAccountName || '');
  const [khqrAccountNumber, setKhqrAccountNumber] = useState(currentUser.khqrAccountNumber || '');
  const [khqrBankName, setKhqrBankName] = useState(currentUser.khqrBankName || 'ABA Bank');

  // Per-user custom Invoice fields
  const [invoiceLogo, setInvoiceLogo] = useState(currentUser.invoiceLogo || '');
  const [invoiceShopName, setInvoiceShopName] = useState(currentUser.invoiceShopName || '');
  const [invoiceShopNameKh, setInvoiceShopNameKh] = useState(currentUser.invoiceShopNameKh || '');
  const [invoiceAddress, setInvoiceAddress] = useState(currentUser.invoiceAddress || '');
  const [invoicePhone, setInvoicePhone] = useState(currentUser.invoicePhone || '');
  const [invoiceFooterText, setInvoiceFooterText] = useState(currentUser.invoiceFooterText || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isProcessingKhqr, setIsProcessingKhqr] = useState(false);
  const [isProcessingInvoiceLogo, setIsProcessingInvoiceLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingKhqr, setIsDraggingKhqr] = useState(false);
  const [isDraggingInvoiceLogo, setIsDraggingInvoiceLogo] = useState(false);

  if (!isOpen) return null;

  // Process selected image file with auto-resizing & compression
  const processImageFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(isKh ? 'សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព (JPG, PNG, WebP)!' : 'Please choose an image file (JPG, PNG, WebP)!');
      return;
    }

    setErrorMessage('');
    setIsProcessingPhoto(true);

    try {
      const result = await resizeImageFile(file, 400, 400, 0.85);
      setAvatar(result.dataUrl);
    } catch (err: any) {
      console.error('Photo resize error:', err);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            setAvatar(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        setErrorMessage(isKh ? 'បរាជ័យក្នុងការ Upload រូបភាព សូមសាកល្បងម្ដងទៀត!' : 'Failed to process photo. Please try again.');
      }
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Process KHQR image upload
  const processKhqrFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(isKh ? 'សូមជ្រើសរើសប្រភេទជារូបភាព KHQR!' : 'Please choose an image file for KHQR!');
      return;
    }

    setErrorMessage('');
    setIsProcessingKhqr(true);

    try {
      const result = await resizeImageFile(file, 800, 800, 0.9);
      setKhqrImage(result.dataUrl);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setKhqrImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingKhqr(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleKhqrInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processKhqrFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleKhqrDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingKhqr(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processKhqrFile(file);
    }
  };

  const processInvoiceLogoFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage(isKh ? 'សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព!' : 'Please select an image file!');
      return;
    }
    setErrorMessage('');
    setIsProcessingInvoiceLogo(true);

    try {
      const result = await resizeImageFile(file, 400, 400, 0.9);
      setInvoiceLogo(result.dataUrl);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setInvoiceLogo(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingInvoiceLogo(false);
    }
  };

  const handleInvoiceLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processInvoiceLogoFile(file);
    }
  };

  const handleInvoiceLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingInvoiceLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processInvoiceLogoFile(file);
    }
  };

  // Handle Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage(isKh ? 'សូមបញ្ចូលឈ្មោះពេញ!' : 'Please enter full name.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: User = {
        ...currentUser,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatar: avatar || currentUser.avatar,
        password: newPassword.trim() ? newPassword.trim() : currentUser.password,
        khqrImage: khqrImage.trim(),
        khqrMerchantName: khqrMerchantName.trim(),
        khqrAccountName: khqrAccountName.trim(),
        khqrAccountNumber: khqrAccountNumber.trim(),
        khqrBankName: khqrBankName.trim(),
        invoiceLogo: invoiceLogo.trim(),
        invoiceShopName: invoiceShopName.trim(),
        invoiceShopNameKh: invoiceShopNameKh.trim(),
        invoiceAddress: invoiceAddress.trim(),
        invoicePhone: invoicePhone.trim(),
        invoiceFooterText: invoiceFooterText.trim()
      };

      // 1. Save to Cloud Firestore
      await saveUserToFirestore(updatedUser);

      // 2. Log activity
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'UPDATE_PROFILE',
        `${currentUser.username} updated profile, KHQR, and personal invoice branding`
      );

      // 3. Update application state & localStorage
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      
      setSuccessMessage(isKh ? 'បានកែប្រែព័ត៌មាន Profile, KHQR & Invoice ជោគជ័យ!' : 'Profile, KHQR & Invoice settings saved successfully!');
      
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 border border-slate-100 my-auto pb-safe">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                {isKh ? 'កែសម្រួលគណនី & KHQR (User Profile & POS)' : 'Edit Profile & Personal KHQR'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Membership & Plan Status Banner */}
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          currentUser.plan === 'lifetime' || currentUser.role === 'admin'
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 border-amber-300/80'
            : 'bg-gradient-to-r from-indigo-50 via-slate-50 to-amber-50/60 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              <Crown className="w-5 h-5 text-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {isKh ? 'គម្រោងគណនីរបស់អ្នក:' : 'Your Account Plan:'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide ${
                  currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {currentUser.plan === 'lifetime' || currentUser.role === 'admin' ? '👑 Lifetime VIP' : 'Free (10 Items)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                  ? (isKh ? 'អ្នកអាចបញ្ចូលទំនិញ និងប្រើប្រាស់មុខងារទាំងអស់បានគ្មានដែនកំណត់' : 'Enjoy unlimited product catalog and full POS features')
                  : (isKh ? 'គម្រោង Free អាចបញ្ចូលទំនិញបានត្រឹម 10 មុខប៉ុណ្ណោះ' : 'Free plan is limited to 10 products maximum')}
              </p>
            </div>
          </div>

          {onOpenUpgradePlan && (
            <button
              type="button"
              id="profile-modal-upgrade-btn"
              onClick={() => {
                onClose();
                onOpenUpgradePlan();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                  ? 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>
                {currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                  ? (isKh ? 'ពិនិត្យគម្រោង' : 'View Plan')
                  : (isKh ? 'Upgrade ទៅ Lifetime ($19)' : 'Upgrade Lifetime ($19)')}
              </span>
              <Zap className="w-3 h-3 text-amber-300" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{isKh ? 'ព័ត៌មានទូទៅ' : 'Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('khqr')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'khqr'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-rose-600" />
            <span>{isKh ? 'KHQR ផ្ទាល់ខ្លួន' : 'KHQR'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'invoice'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>{isKh ? 'Invoice ផ្ទាល់ខ្លួន' : 'Invoice Logo'}</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {activeTab === 'profile' ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Avatar Upload Section */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isDragging ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700">
                    {isKh ? 'រូបភាពផ្ទាល់ខ្លួន (Profile Photo / Avatar)' : 'Profile Photo & Avatar'}
                  </label>
                  {isProcessingPhoto && (
                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {isKh ? 'កំពុងបង្រួមរូបភាព...' : 'Optimizing photo...'}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview with Overlaid Upload Trigger */}
                  <div className="relative group shrink-0">
                    <img
                      src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt={fullName}
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover ring-4 ring-white shadow-md group-hover:opacity-90 transition-opacity bg-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                    >
                      <Camera className="w-5 h-5" />
                      <span>{isKh ? 'ប្តូររូប' : 'Change'}</span>
                    </button>
                  </div>

                  {/* Upload Buttons */}
                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      capture="user"
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isKh ? 'ថតរូប' : 'Camera'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isKh ? 'ជ្រើសរូប' : 'Upload'}</span>
                      </button>

                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="px-2.5 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title={isKh ? 'លុបរូបភាព' : 'Reset avatar'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Avatar Presets */}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    {isKh ? 'ឬជ្រើសរើស Avatar គំរូស្អាតៗ៖' : 'Or select preset avatar:'}
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 touch-scroll no-scrollbar">
                    {PRESET_AVATARS.map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(presetUrl)}
                        className={`w-9 h-9 rounded-xl overflow-hidden ring-2 transition-all shrink-0 cursor-pointer ${
                          avatar === presetUrl ? 'ring-indigo-600 scale-105 shadow-xs' : 'ring-transparent hover:ring-slate-300'
                        }`}
                      >
                        <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ឈ្មោះពេញ (Full Name) *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sok Piseth"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="012 345 678"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'អ៊ីមែល' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@pos.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ប្តូរពាក្យសម្ងាត់ថ្មី (ទុកទទេបើមិនចង់ប្តូរ)' : 'New Password (Leave blank to keep current)'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'khqr' ? (
            /* KHQR Per-User Configuration Tab */
            <div className="space-y-4 animate-in fade-in">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingKhqr(true); }}
                onDragLeave={() => setIsDraggingKhqr(false)}
                onDrop={handleKhqrDrop}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isDraggingKhqr ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700">
                    {isKh ? 'រូបភាព KHQR ផ្ទាល់ខ្លួនរបស់ User នេះ' : 'Personal User KHQR Code Image'}
                  </label>
                  {isProcessingKhqr && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {khqrImage ? (
                      <div className="relative group">
                        <img 
                          src={khqrImage} 
                          alt="KHQR" 
                          className="w-24 h-24 object-contain rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setKhqrImage('')}
                          className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <QrCode className="w-8 h-8 mb-1" />
                        <span className="text-[9px] font-bold">Use Shop QR</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <input
                      type="file"
                      ref={khqrFileInputRef}
                      onChange={handleKhqrInputChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => khqrFileInputRef.current?.click()}
                      disabled={isProcessingKhqr}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isKh ? 'Upload រូបភាព KHQR ផ្ទាល់ខ្លួន' : 'Upload Personal KHQR'}</span>
                    </button>

                    <p className="text-[11px] text-slate-500">
                      {isKh ? 'រូបភាពនេះនឹងបង្ហាញនៅលើផ្ទាំង Complete Payment ពេល User នេះគិតលុយ' : 'This QR will display during checkout when this cashier processes payments.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* KHQR Custom Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ឈ្មោះហាង / Merchant Name' : 'Merchant Name'}
                  </label>
                  <input
                    type="text"
                    value={khqrMerchantName}
                    onChange={(e) => setKhqrMerchantName(e.target.value)}
                    placeholder="e.g. MINI MART POS"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'ឈ្មោះម្ចាស់គណនី (Account Name)' : 'Account Name'}
                    </label>
                    <input
                      type="text"
                      value={khqrAccountName}
                      onChange={(e) => setKhqrAccountName(e.target.value)}
                      placeholder="e.g. SOK PISETH"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'លេខគណនី (Account Number)' : 'Account Number'}
                    </label>
                    <input
                      type="text"
                      value={khqrAccountNumber}
                      onChange={(e) => setKhqrAccountNumber(e.target.value)}
                      placeholder="000 123 456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'ធនាគារ (Bank Name)' : 'Bank'}
                  </label>
                  <select
                    value={khqrBankName}
                    onChange={(e) => setKhqrBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-semibold"
                  >
                    <option value="ABA Bank">ABA Bank (KHQR)</option>
                    <option value="ACLEDA Bank">ACLEDA Bank (KHQR)</option>
                    <option value="Bakong">Bakong (National Bank of Cambodia)</option>
                    <option value="Canadia Bank">Canadia Bank</option>
                    <option value="Wing Bank">Wing Bank</option>
                    <option value="Sathapana Bank">Sathapana Bank</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Custom Invoice Branding Tab (Per-User) */
            <div className="space-y-4 animate-in fade-in">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingInvoiceLogo(true); }}
                onDragLeave={() => setIsDraggingInvoiceLogo(false)}
                onDrop={handleInvoiceLogoDrop}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isDraggingInvoiceLogo ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800">
                      {isKh ? 'Logo វិក្កយបត្រផ្ទាល់ខ្លួន (Personal Invoice Logo)' : 'Personal Invoice Logo'}
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isKh ? 'កំណត់ Logo លើ Invoice ដោយមិនប៉ះពាល់ Logo របស់ប្រព័ន្ធទាំងមូល' : 'Applies custom logo on receipts generated by this user without altering global system logo'}
                    </p>
                  </div>
                  {isProcessingInvoiceLogo && (
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {invoiceLogo ? (
                      <div className="relative group">
                        <img 
                          src={invoiceLogo} 
                          alt="Invoice Logo" 
                          className="w-20 h-20 object-contain rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setInvoiceLogo('')}
                          className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <ImageIcon className="w-7 h-7 mb-1 text-slate-400" />
                        <span className="text-[9px] font-bold">Use System Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <input
                      type="file"
                      ref={invoiceLogoInputRef}
                      onChange={handleInvoiceLogoInputChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => invoiceLogoInputRef.current?.click()}
                      disabled={isProcessingInvoiceLogo}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isKh ? 'Upload Logo វិក្កយបត្រផ្ទាល់ខ្លួន' : 'Upload Invoice Logo'}</span>
                    </button>

                    <p className="text-[11px] text-slate-400">
                      {isKh ? 'PNG, JPG ឬ WebP (ទំហំសមរម្យ 400x400)' : 'PNG, JPG or WebP (Recommended square format)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice Text Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'ឈ្មោះហាងលើ Invoice (English)' : 'Invoice Shop Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={invoiceShopName}
                      onChange={(e) => setInvoiceShopName(e.target.value)}
                      placeholder="e.g. Sok Piseth Cafe & Mart"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'ឈ្មោះហាងលើ Invoice (ភាសាខ្មែរ)' : 'Invoice Shop Name (Khmer)'}
                    </label>
                    <input
                      type="text"
                      value={invoiceShopNameKh}
                      onChange={(e) => setInvoiceShopNameKh(e.target.value)}
                      placeholder="e.g. ហាងកាហ្វេ សុខ ពិសិដ្ឋ"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'អាសយដ្ឋានលើ Invoice' : 'Invoice Address'}
                    </label>
                    <input
                      type="text"
                      value={invoiceAddress}
                      onChange={(e) => setInvoiceAddress(e.target.value)}
                      placeholder="e.g. St. 271, Phnom Penh"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isKh ? 'លេខទូរស័ព្ទលើ Invoice' : 'Invoice Phone Number'}
                    </label>
                    <input
                      type="text"
                      value={invoicePhone}
                      onChange={(e) => setInvoicePhone(e.target.value)}
                      placeholder="+855 12 345 678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKh ? 'សារនៅចុងបញ្ចប់វិក្កយបត្រ (Footer Message)' : 'Invoice Footer Message'}
                  </label>
                  <input
                    type="text"
                    value={invoiceFooterText}
                    onChange={(e) => setInvoiceFooterText(e.target.value)}
                    placeholder="e.g. អរគុណសម្រាប់ការគាំទ្រ! សូមអញ្ជើញមកម្តងទៀត"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isKh ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingPhoto || isProcessingKhqr || isProcessingInvoiceLogo}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isKh ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                </>
              ) : (
                <span>{isKh ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

