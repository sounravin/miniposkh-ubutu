import React, { useState, useRef } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  QrCode, 
  Upload, 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  Infinity, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Send,
  Loader2,
  Lock,
  ExternalLink
} from 'lucide-react';
import { User, UpgradeRequest, ShopSettings } from '../types';
import { submitUpgradeRequest, logUserActivity } from '../lib/firestoreService';
import { resizeImageFile } from '../lib/imageUtils';
import confetti from 'canvas-confetti';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language: 'en' | 'kh';
  settings?: ShopSettings;
  userProductCount?: number;
  onUpgradeSuccess?: () => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  settings,
  userProductCount = 0,
  onUpgradeSuccess
}) => {
  const isKh = language === 'kh';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentSlipImage, setPaymentSlipImage] = useState<string>('');
  const [senderNote, setSenderNote] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const isAlreadyLifetime = currentUser.plan === 'lifetime' || currentUser.role === 'admin' || currentUser.username === 'admin';
  
  // Prioritize Admin Upgrade KHQR configuration, then shop defaults
  const adminKhqr = settings?.adminUpgradeKhqr;
  const priceUsd = adminKhqr?.upgradePrice && adminKhqr.upgradePrice > 0 ? adminKhqr.upgradePrice : 19.00;
  const khqrImage = adminKhqr?.khqrImage || settings?.khqrImage || '';
  const merchantName = adminKhqr?.merchantName || settings?.khqrMerchantName || 'MINI MART POS KH';
  const accountName = adminKhqr?.accountName || settings?.khqrAccountName || 'PROZZ LOP (POS ADMIN)';
  const accountNumber = adminKhqr?.accountNumber || settings?.khqrAccountNumber || '001 888 999 (ABA Bank)';
  const bankName = adminKhqr?.bankName || settings?.khqrBankName || 'ABA Bank / Bakong KHQR';
  const telegramLink = adminKhqr?.telegramUsername 
    ? (adminKhqr.telegramUsername.startsWith('http') ? adminKhqr.telegramUsername : `https://t.me/${adminKhqr.telegramUsername.replace('@', '')}`)
    : 'https://t.me/laymeancamera';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      setErrorMessage('');
      const resized = await resizeImageFile(file, 900, 900, 0.85);
      setPaymentSlipImage(resized.dataUrl);
    } catch (err: any) {
      setErrorMessage(isKh ? 'បរាជ័យក្នុងការ Upload វិក្កយបត្រ៖ ' + err.message : 'Failed to upload slip: ' + err.message);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmitUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyLifetime) return;

    if (!paymentSlipImage) {
      setErrorMessage(isKh ? 'សូម Upload រូបភាពវិក្កយបត្របង់ប្រាក់ KHQR ជាមុនសិន!' : 'Please upload your KHQR payment slip/receipt first!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newRequest: UpgradeRequest = {
        id: `upg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        phone: currentUser.phone || '',
        currentPlan: currentUser.plan || 'free',
        targetPlan: 'lifetime',
        amount: priceUsd,
        paymentSlipImage,
        senderNote: senderNote.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await submitUpgradeRequest(newRequest);
      await logUserActivity(
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'SUBMIT_UPGRADE_REQUEST',
        `User ${currentUser.fullName} submitted KHQR upgrade to Lifetime Plan ($${priceUsd})`
      );

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setIsSubmittedSuccess(true);
      if (onUpgradeSuccess) onUpgradeSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || (isKh ? 'បរាជ័យក្នុងការបញ្ជូនសំណើ!' : 'Failed to submit upgrade request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center text-2xl shadow-md shadow-amber-200 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {isKh ? 'Upgrade គម្រោងប្រើប្រាស់ពេញមួយជីវិត (Lifetime Access)' : 'Upgrade to Lifetime Plan'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase tracking-wide border border-amber-200">
                  LIFETIME
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isKh 
                  ? 'ដោះសោការបន្ថែមមុខទំនិញគ្មានដែនកំណត់ (Unlimited Products) និងមុខងារពិសេសៗទាំងអស់' 
                  : 'Unlock unlimited products inventory, unlimited POS receipts & premium features'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user is already Lifetime */}
        {isAlreadyLifetime ? (
          <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-teal-50 p-6 rounded-2xl border border-emerald-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-emerald-950">
              {isKh ? 'គណនីរបស់អ្នកជាគម្រោង Lifetime រួចរាល់ហើយ!' : 'You already have Lifetime Access!'}
            </h4>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              {isKh 
                ? `គណនី @${currentUser.username} មានសិទ្ធិបញ្ចូលទំនិញគ្មានដែនកំណត់ (បច្ចុប្បន្នមាន ${userProductCount} មុខ) និងប្រើប្រាស់គ្រប់មុខងារទាំងអស់ដោយឥតគិតថ្លៃប្រចាំខែ។` 
                : `Your account @${currentUser.username} is enjoying unlimited products and full lifetime POS access.`}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                {isKh ? 'យល់ព្រម' : 'Done'}
              </button>
            </div>
          </div>
        ) : isSubmittedSuccess ? (
          /* Submission Success State */
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-indigo-50 p-6 rounded-2xl border border-indigo-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto text-3xl shadow-lg shadow-indigo-200 animate-bounce">
              <FileCheck className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-indigo-950">
                {isKh ? '🎉 បានបញ្ជូនវិក្កយបត្រ Upgrade ជោគជ័យ!' : '🎉 Upgrade Request Submitted!'}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {isKh 
                  ? 'វិក្កយបត្របង់ប្រាក់ KHQR របស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ផ្ទាំង Admin Console រួចរាល់ហើយ។ Admin នឹងពិនិត្យ និង Approve គម្រោង Lifetime ជូនលោកអ្នកក្នុងពេលឆាប់ៗនេះ។' 
                  : 'Your KHQR payment slip has been forwarded to the Admin Console for review. Admin will approve your Lifetime access shortly.'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-indigo-100 text-left text-xs space-y-2 max-w-md mx-auto shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>{isKh ? 'ម្ចាស់គណនី' : 'Account'}:</span>
                <span className="font-bold text-slate-800">@{currentUser.username} ({currentUser.fullName})</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{isKh ? 'គម្រោងស្នើសុំ' : 'Target Plan'}:</span>
                <span className="font-black text-amber-600 uppercase">Lifetime VIP</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{isKh ? 'ស្ថានភាព' : 'Status'}:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Clock className="w-3 h-3" />
                  {isKh ? 'រង់ចាំ Admin ពិនិត្យ (Pending)' : 'Pending Review'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#24A1DE] hover:bg-[#0088cc] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-sky-200 transition-all cursor-pointer"
              >
                <span>{isKh ? 'ជូនដំណឹង Admin តាម Telegram' : 'Notify Admin via Telegram'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isKh ? 'បិទផ្ទាំង' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          /* Form for Upgrading */
          <form onSubmit={handleSubmitUpgrade} className="space-y-6">
            
            {/* Plan Comparison Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Free Plan (Current) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isKh ? 'គម្រោងឥតគិតថ្លៃ (បច្ចុប្បន្ន)' : 'Free Tier (Current)'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Active
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800">$0</span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <li className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{isKh ? 'កំណត់ត្រឹម ១០ មុខទំនិញ (Limit 10 Items)' : 'Max 10 Products limit'}</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-500">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isKh ? `បានប្រើ ${userProductCount}/10 មុខទំនិញ` : `Used ${userProductCount}/10 products`}</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-500">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{isKh ? 'POS លក់ និងចេញវិក្កយបត្រ' : 'Standard POS sales'}</span>
                  </li>
                </ul>
              </div>

              {/* Lifetime Plan (Target) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-purple-500/10 border-2 border-amber-400 space-y-2.5 relative shadow-xs">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  ★ RECOMMENDED
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    {isKh ? 'គម្រោង Lifetime VIP' : 'Lifetime Unlimited'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-900">${priceUsd}</span>
                  <span className="text-xs font-bold text-amber-700 line-through opacity-60">$49</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    {isKh ? 'បង់តែ១ដង ប្រើរហូត' : 'One-time payment'}
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-800 pt-1 font-medium">
                  <li className="flex items-center gap-1.5 text-indigo-950 font-bold">
                    <Infinity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{isKh ? 'បន្ថែមទំនិញគ្មានដែនកំណត់ (Unlimited)' : 'Unlimited Products & Stock'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isKh ? 'Custom Logo & KHQR លើវិក្កយបត្រ' : 'Custom KHQR & Invoice Logo'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isKh ? 'របាយការណ៍លក់ & Export Excel/PDF' : 'Reports & Export Capabilities'}</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* KHQR Payment & Invoice Upload Step */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>{isKh ? 'ជំហានទី ១៖ ស្កេន KHQR ដើម្បីបង់ប្រាក់' : 'Step 1: Scan KHQR to Pay'}</span>
                </h4>
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  ${priceUsd.toFixed(2)} USD
                </span>
              </div>

              {/* KHQR Card Display */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                {/* QR Code Graphic */}
                <div className="w-36 h-36 bg-slate-900 rounded-xl p-2 flex items-center justify-center shrink-0 shadow-xs border border-slate-200">
                  {khqrImage ? (
                    <img 
                      src={khqrImage} 
                      alt="Admin KHQR" 
                      className="w-full h-full object-contain rounded-lg bg-white"
                    />
                  ) : (
                    <div className="text-center text-white space-y-1 p-2">
                      <QrCode className="w-12 h-12 text-rose-400 mx-auto" />
                      <span className="text-[10px] font-bold block text-slate-200 leading-tight">KHQR Bakong</span>
                    </div>
                  )}
                </div>

                {/* Account Details */}
                <div className="space-y-1.5 text-xs flex-1 w-full text-center sm:text-left">
                  <div className="font-extrabold text-slate-900 text-sm">
                    {merchantName}
                  </div>
                  <div className="text-slate-600 font-medium">
                    {isKh ? 'ឈ្មោះគណនី' : 'Account Name'}: <strong className="text-slate-900 font-mono">{accountName}</strong>
                  </div>
                  <div className="text-slate-600 font-medium">
                    {isKh ? 'លេខគណនី' : 'Account Number'}: <strong className="text-indigo-600 font-mono">{accountNumber}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {isKh ? 'ធនាគារ' : 'Bank'}: <span className="font-semibold text-slate-700">{bankName}</span>
                  </div>
                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2 font-medium">
                    💡 {isKh ? 'សូមបញ្ជាក់ឈ្មោះ User (@' + currentUser.username + ') ក្នុងចំណាំផ្ញើប្រាក់' : `Please put remark: "${currentUser.username}" in transaction memo`}
                  </div>
                </div>
              </div>

              {/* Step 2: Upload Payment Slip */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>{isKh ? 'ជំហានទី ២៖ Upload វិក្កយបត្របង់ប្រាក់ (KHQR Invoice Slip)' : 'Step 2: Upload KHQR Payment Receipt Slip'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {paymentSlipImage && (
                    <button
                      type="button"
                      onClick={() => setPaymentSlipImage('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      {isKh ? 'ប្តូររូបភាព' : 'Change'}
                    </button>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {paymentSlipImage ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-900 p-2 flex items-center justify-center max-h-56">
                    <img 
                      src={paymentSlipImage} 
                      alt="Uploaded slip" 
                      className="max-h-52 object-contain rounded-xl"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {isKh ? 'បានជ្រើសវិក្កយបត្រ' : 'Slip Uploaded'}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="w-full py-6 px-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-white hover:bg-indigo-50/40 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-slate-600"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isProcessingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">
                        {isKh ? 'ចុចទីនេះដើម្បី Upload រូបថតវិក្កយបត្រ (Payment Slip)' : 'Click to Upload Payment Receipt'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        PNG, JPG, JPEG (Compressed automatically)
                      </span>
                    </div>
                  </button>
                )}

                {/* Optional Note */}
                <div className="pt-2">
                  <input
                    type="text"
                    value={senderNote}
                    onChange={(e) => setSenderNote(e.target.value)}
                    placeholder={isKh ? 'ចំណាំបន្ថែម (ឧ. បានបង់ពីគណនី ABA លោក...) (ស្រេចចិត្ត)' : 'Optional note (e.g. Paid from ABA account name...)'}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

              </div>

            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {isKh ? 'បោះបង់' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isProcessingImage}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{isKh ? 'កំពុងបញ្ជូនសំណើ...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>{isKh ? 'បញ្ជូនវិក្កយបត្រទៅ Admin' : 'Submit Upgrade to Admin'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
