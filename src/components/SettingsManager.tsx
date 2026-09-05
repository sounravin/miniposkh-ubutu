import React, { useRef, useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Volume2, 
  DollarSign, 
  Store, 
  Percent, 
  Image, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck,
  QrCode,
  Upload,
  Trash2,
  Check,
  CreditCard,
  Building2,
  ExternalLink,
  MessageCircle,
  Crown
} from 'lucide-react';
import { ShopSettings, User } from '../types';
import { sounds } from '../utils/audio';
import { Logo } from './Logo';
import { uploadImageToServer } from '../lib/firestoreService';
import { resizeImageFile } from '../lib/imageUtils';

interface SettingsManagerProps {
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  onResetData: () => void;
  language: 'en' | 'kh';
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
  onOpenA2HSGuide?: () => void;
  onOpenUpgradePlan?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  language,
  currentUser,
  onLogout,
  onOpenProfileModal,
  onOpenA2HSGuide,
  onOpenUpgradePlan
}) => {
  const isKh = language === 'kh';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handleChange = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const handleKhqrImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(isKh ? 'សូមជ្រើសរើសឯកសាររូបភាពប៉ុណ្ណោះ (PNG, JPG, WebP)!' : 'Please select an image file (PNG, JPG, WebP)!');
      return;
    }

    try {
      const resized = await resizeImageFile(file, 800, 800, 0.85);
      const serverUrl = await uploadImageToServer(resized.dataUrl, 'khqr');
      handleChange('khqrImage', serverUrl || resized.dataUrl);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (err: any) {
      alert(isKh ? 'បរាជ័យក្នុងការ Upload KHQR: ' + err.message : 'Failed to upload KHQR: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleKhqrImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleKhqrImageUpload(file);
    }
  };

  const handleRemoveKhqrImage = () => {
    handleChange('khqrImage', '');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>{isKh ? 'ការកំណត់ប្រព័ន្ធ (System Settings)' : 'Shop & POS Configuration'}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isKh ? 'កែប្រែព័ត៌មានហាង កំណត់ KHQR ទទួលប្រាក់ អត្រាប្តូរប្រាក់ ពន្ធ និងសំឡេង' : 'Configure store identity, KHQR payment receiver, tax, exchange rates, and audio effects'}
        </p>
      </div>

      {/* Store Identity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-800">Store Information (ព័ត៌មានហាង)</h4>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            MINI MART POS
          </span>
        </div>

        {/* Logo Preview Banner */}
        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100 flex items-center gap-3.5">
          <Logo size={52} variant="badge" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">System Logo & Branding</span>
            <span className="text-[11px] text-slate-500">Official vector artwork active for MINI MART POS</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Shop Name (English)</label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">ឈ្មោះហាងជាភាសាខ្មែរ</label>
            <input
              type="text"
              value={settings.shopNameKh}
              onChange={(e) => handleChange('shopNameKh', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Address / Location</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* KHQR Shop & POS Payment Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'ការកំណត់ KHQR ទទួលប្រាក់ (KHQR & POS Payment)' : 'KHQR Shop & POS Payment Configuration'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isKh ? 'រូបភាព QR នេះនឹងបង្ហាញនៅក្នុងផ្ទាំង Complete Payment នៅពេលគិតលុយ' : 'Upload your custom KHQR image to appear in the Complete Payment modal'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Bakong KHQR
          </span>
        </div>

        {/* Upload Box and Live Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Dropzone & Upload Action */}
          <div className="md:col-span-7 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2.5 ${
                isDragOver
                  ? 'border-rose-500 bg-rose-50/60 scale-[1.01]'
                  : 'border-slate-200 hover:border-rose-400 hover:bg-slate-50/80 bg-slate-50/40'
              }`}
            >
              <div className="p-3 rounded-full bg-rose-100 text-rose-600 shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isKh ? 'ចុចទីនេះដើម្បី Upload រូបភាព KHQR' : 'Click to Upload KHQR Code / Stand'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {isKh ? 'ឬអូសទម្លាក់រូបភាព (PNG, JPG, WebP)' : 'or Drag & Drop image file here'}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 text-[11px] font-bold text-rose-600 shadow-2xs">
                <QrCode className="w-3.5 h-3.5" />
                <span>{isKh ? 'ជ្រើសរើសរូបពីទូរស័ព្ទ / កុំព្យូទ័រ' : 'Browse Gallery / Files'}</span>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{isKh ? 'បានរក្សាទុករូបភាព KHQR ដោយជោគជ័យ!' : 'KHQR image saved successfully!'}</span>
              </div>
            )}
          </div>

          {/* Live KHQR Card Preview */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-50 to-rose-50/30 p-4 rounded-2xl border border-slate-200/80 flex flex-col items-center text-center">
            <span className="text-[10px] font-black tracking-wider text-rose-600 uppercase mb-2">
              {isKh ? 'គំរូក្នុងផ្ទាំងគិតប្រាក់' : 'Payment Modal Preview'}
            </span>

            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 relative group">
              {settings.khqrImage ? (
                <>
                  <img
                    src={settings.khqrImage}
                    alt="Store KHQR"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveKhqrImage();
                    }}
                    title={isKh ? 'លុបរូបភាពចេញ' : 'Remove QR Image'}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg opacity-90 shadow-md transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="w-36 h-36 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400">
                  <QrCode className="w-12 h-12 text-slate-300 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-400">
                    {isKh ? 'មិនទាន់ Upload' : 'No custom QR'}
                  </span>
                  <span className="text-[9px] text-slate-400">(Dynamic QR Active)</span>
                </div>
              )}
            </div>

            <div className="mt-2.5 space-y-0.5">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                {settings.khqrMerchantName || settings.shopNameKh || settings.shopName || 'MINI MART POS'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {settings.khqrAccountName || currentUser?.fullName || 'STORE ACCOUNT'}
              </div>
              {settings.khqrAccountNumber && (
                <div className="text-[10px] text-rose-600 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {settings.khqrAccountNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank & Merchant Account Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isKh ? 'ឈ្មោះហាង / អាជីវកម្មលើ KHQR' : 'Merchant / Shop Name on KHQR'}
            </label>
            <input
              type="text"
              placeholder={settings.shopNameKh || settings.shopName || 'MINI MART POS'}
              value={settings.khqrMerchantName || ''}
              onChange={(e) => handleChange('khqrMerchantName', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isKh ? 'ឈ្មោះម្ចាស់គណនី (Account Name)' : 'Account Holder Name'}
            </label>
            <input
              type="text"
              placeholder="e.g. SOUN RAVIN"
              value={settings.khqrAccountName || ''}
              onChange={(e) => handleChange('khqrAccountName', e.target.value.toUpperCase())}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isKh ? 'លេខគណនីធនាគារ / Bakong ID' : 'Bank Account No. / Bakong ID'}
            </label>
            <input
              type="text"
              placeholder="e.g. 001 234 567 (ABA) / sounravin@aba"
              value={settings.khqrAccountNumber || ''}
              onChange={(e) => handleChange('khqrAccountNumber', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isKh ? 'ធនាគារ (Bank Name)' : 'Bank / Partner'}
            </label>
            <select
              value={settings.khqrBankName || 'ABA Bank'}
              onChange={(e) => handleChange('khqrBankName', e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="ABA Bank">ABA Bank (KHQR)</option>
              <option value="ACLEDA Bank">ACLEDA Bank (KHQR)</option>
              <option value="Bakong">Bakong (National Bank of Cambodia)</option>
              <option value="Canadia Bank">Canadia Bank</option>
              <option value="Wing Bank">Wing Bank</option>
              <option value="Sathapana Bank">Sathapana Bank</option>
              <option value="Chip Mong Bank">Chip Mong Bank</option>
              <option value="Prince Bank">Prince Bank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial & Currency Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-sm text-slate-800">Financial & Currency Rates</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              KHR Exchange Rate (1 USD = ? ៛)
            </label>
            <input
              type="number"
              value={settings.khrExchangeRate}
              onChange={(e) => handleChange('khrExchangeRate', parseInt(e.target.value) || 4100)}
              className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Default VAT / Sales Tax Rate
            </label>
            <select
              value={settings.taxRate}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="0">0% (No Tax / Tax Inclusive)</option>
              <option value="0.05">5% VAT</option>
              <option value="0.08">8% Sales Tax (Default)</option>
              <option value="0.10">10% Standard Tax</option>
            </select>
          </div>
        </div>

        {/* Audio feedback switch */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Audio Sound Effects (Beep & Chime)</span>
          </div>
          <input
            type="checkbox"
            checked={settings.enableSound}
            onChange={(e) => {
              handleChange('enableSound', e.target.checked);
              sounds.setMuted(!e.target.checked);
            }}
            className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Invoice & Receipt Configuration Card with Member Customization Option */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-amber-600" />
            <h4 className="font-bold text-sm text-slate-800">
              {isKh ? 'ការកំណត់វិក្កយបត្រ & Logo (Invoice & Receipt)' : 'Invoice & Receipt Settings'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            {isKh ? 'កំណត់តាម Member នីមួយៗបាន' : 'Per-Member Customizable'}
          </span>
        </div>

        {/* User Member Custom Invoice Customizer Action Box */}
        <div className="p-4 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 rounded-2xl border border-amber-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentUser?.invoiceLogo ? (
                <div className="p-1.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                  <img
                    src={currentUser.invoiceLogo}
                    alt="Member Invoice Logo"
                    className="w-10 h-10 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Image className="w-5 h-5" />
                </div>
              )}
              <div>
                <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span>{isKh ? 'កំណត់ Logo & ឈ្មោះ Invoice ផ្ទាល់ខ្លួនរបស់គណនីនេះ' : 'Member Personal Invoice Branding'}</span>
                  {currentUser?.invoiceLogo && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Custom Active
                    </span>
                  )}
                </h5>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {isKh 
                    ? 'អនុញ្ញាតឱ្យ User Member កំណត់ Logo, ឈ្មោះលើវិក្កយបត្រផ្ទាល់ខ្លួន និង Export ជា JPG ដោយមិនផ្លាស់ប្តូរ Logo របស់ប្រព័ន្ធទាំងមូល'
                    : 'Each user member can set their own custom invoice logo, custom header name, and export receipts as JPG without altering global system branding.'
                  }
                </p>
              </div>
            </div>

            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Image className="w-3.5 h-3.5" />
                <span>{isKh ? 'កំណត់ Invoice ផ្ទាល់ខ្លួន' : 'Customize Invoice'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Receipt Footer */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {isKh ? 'សារលំនាំដើមនៅចុងបញ្ចប់វិក្កយបត្រ (Default Receipt Footer Message)' : 'Default Receipt Footer Message'}
          </label>
          <input
            type="text"
            value={settings.receiptFooterText}
            onChange={(e) => handleChange('receiptFooterText', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Current User Session & Auth Card */}
      {currentUser && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'គណនីកំពុងប្រើប្រាស់ (Current User Session)' : 'Active Account & Security'}
              </h4>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              currentUser.role === 'admin' 
                ? 'bg-indigo-100 text-indigo-800' 
                : currentUser.role === 'manager'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentUser.role}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                alt={currentUser.fullName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-200" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{currentUser.fullName}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black uppercase flex items-center gap-1 ${
                    currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>{currentUser.plan === 'lifetime' || currentUser.role === 'admin' ? 'Lifetime VIP' : 'Free (10 Items)'}</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">@{currentUser.username}</div>
                {currentUser.phone && (
                  <div className="text-[11px] text-slate-400 mt-0.5">{currentUser.phone}</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenUpgradePlan && (
                <button
                  type="button"
                  id="settings-upgrade-plan-btn"
                  onClick={onOpenUpgradePlan}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${
                    currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>
                    {currentUser.plan === 'lifetime' || currentUser.role === 'admin'
                      ? (isKh ? 'ពិនិត្យគម្រោង Lifetime' : 'View Lifetime Plan')
                      : (isKh ? 'Upgrade គម្រោង Lifetime ($19)' : 'Upgrade Lifetime ($19)')}
                  </span>
                </button>
              )}

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{isKh ? 'កែប្រែ Profile & រូបភាព' : 'Edit Profile & Photo'}</span>
                </button>
              )}

              {onLogout && (
                <button
                  id="settings-logout-btn"
                  type="button"
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isKh ? 'ចាកចេញពីគណនី (Logout)' : 'Sign Out Account'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to Home Screen Quick Guide Banner */}
      {onOpenA2HSGuide && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50/50 to-indigo-50 p-6 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-200 shrink-0">
              📲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-bold text-sm text-slate-900">
                  {isKh ? 'របៀបដាក់លើអេក្រង់ដើម (Add to Home Screen)' : 'Add MINI MART POS to Home Screen'}
                </h5>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  PWA APP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKh 
                  ? 'មើលការណែនាំដំឡើង App លើ iPhone (Safari) ឬ Android (Chrome) ដើម្បីងាយស្រួលបើកលក់ភ្លាមៗ' 
                  : 'Step-by-step installation instructions for iPhone, iPad, Android, and Desktop.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenA2HSGuide}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>{isKh ? 'មើលរបៀបដំឡើង' : 'View Install Guide'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Telegram Live Support Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-sky-50 p-6 rounded-2xl border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#24A1DE] text-white flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-sm text-slate-900">
                {isKh ? 'ជំនួយបច្ចេកទេស និង Support (Telegram)' : 'Customer & Technical Support (Telegram)'}
              </h5>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ONLINE 24/7
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKh ? 'ប្រសិនបើមានបញ្ហា ឬត្រូវការជំនួយបន្ថែម សូមទាក់ទងមកកាន់:' : 'Need help or feature assistance? Chat directly on Telegram:'}{' '}
              <strong className="text-[#0088cc] font-mono">@laymeancamera</strong>
            </p>
          </div>
        </div>

        <a
          href="https://t.me/laymeancamera"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#24A1DE] hover:bg-[#1f8fc5] active:bg-[#1a7eb0] text-white rounded-xl text-xs font-bold shadow-md shadow-sky-200 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>{isKh ? 'ឆាតទៅកាន់ Support' : 'Chat with Support'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Reset to Default Demo Data */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h5 className="font-bold text-xs text-slate-800">Reset Demo Catalog & Statistics</h5>
          <p className="text-[11px] text-slate-500">Restore default restaurant menu, sample orders, and product barcodes.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset all demo products, orders, and expenses to default?')) {
              onResetData();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>
      </div>
    </div>
  );
};
