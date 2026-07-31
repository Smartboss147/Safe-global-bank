import { supabase } from '../lib/supabase';
import { getCurrencyByCountry, getCurrencyInfo } from './currency';

export const getUserDisplayName = (userData: any, user: any): string => {
  if (!userData && !user) return 'Valued Customer';
  
  const displayName = userData?.display_name || userData?.displayName;
  if (displayName && typeof displayName === 'string' && displayName.trim() && displayName !== 'undefined undefined') {
    return displayName.trim();
  }

  const firstName = userData?.first_name || userData?.firstName || '';
  const lastName = userData?.last_name || userData?.lastName || '';
  const combined = `${firstName} ${lastName}`.trim();
  if (combined && combined !== 'undefined undefined' && combined !== 'undefined') {
    return combined;
  }

  if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user?.user_metadata?.name) return user.user_metadata.name;

  if (user?.email) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix) {
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
  }

  return 'Valued Customer';
};

export const getUserPhotoURL = (userData: any, user: any): string => {
  const photo = userData?.photoURL || userData?.photo_url || userData?.avatar_url || user?.user_metadata?.avatar_url;
  if (photo && typeof photo === 'string' && photo.trim()) {
    return photo;
  }

  const name = getUserDisplayName(userData, user);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
};

export const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const saveUserProfile = async (userId: string, email: string, profileData: Record<string, any>) => {
  if (!userId) return;

  const storageKey = `local_profile_${userId}`;
  const existingLocal = JSON.parse(localStorage.getItem(storageKey) || '{}');
  const updatedLocal = {
    ...existingLocal,
    ...profileData,
    updated_at: new Date().toISOString()
  };

  try {
    // 1. Update Supabase profiles table as single source of truth
    const { data: updatedDb } = await supabase.from('profiles').upsert({
      id: userId,
      email: email,
      ...profileData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    const finalData = updatedDb || updatedLocal;
    localStorage.setItem(storageKey, JSON.stringify(finalData));

    // Sync with central user registry in local storage
    const rawRegistry = localStorage.getItem('all_registered_users');
    let registryList: any[] = rawRegistry ? JSON.parse(rawRegistry) : [];
    if (!Array.isArray(registryList)) registryList = [];

    const existingIdx = registryList.findIndex(u => u && (u.id === userId || u.email === email));
    if (existingIdx >= 0) {
      registryList[existingIdx] = { ...registryList[existingIdx], ...finalData };
    } else {
      registryList.push({ id: userId, email, ...finalData });
    }
    localStorage.setItem('all_registered_users', JSON.stringify(registryList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user_registered_or_updated', { detail: { userId, updatedLocal: finalData } }));
    }

    console.log(`[saveUserProfile] Successfully updated profile for ${userId}:`, finalData);
    return finalData;
  } catch (err) {
    console.warn('[saveUserProfile] Supabase profiles update notice:', err);
    localStorage.setItem(storageKey, JSON.stringify(updatedLocal));
    return updatedLocal;
  }
};

export const syncRegisteredUser = async (userObj: any, signupFields: Record<string, any> = {}) => {
  if (!userObj || (!userObj.id && !userObj.uid)) return null;

  const userId = userObj.id || userObj.uid;
  const email = userObj.email || signupFields.email || `user_${userId.substring(0, 6)}@safeglobalbank.com`;
  
  console.log(`[syncRegisteredUser] Checking existing database records for user ${userId} (${email})...`);

  // 1. Check existing profile in Supabase
  let existingProfileInDb: any = null;
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) existingProfileInDb = data;
  } catch (err) {
    console.warn('[syncRegisteredUser] Error fetching existing profile:', err);
  }

  // 2. Check existing account in Supabase
  let existingAccountInDb: any = null;
  try {
    const { data } = await supabase.from('accounts').select('*').eq('user_id', userId).maybeSingle();
    if (data) existingAccountInDb = data;
  } catch (err) {
    console.warn('[syncRegisteredUser] Error fetching existing account:', err);
  }

  const storageKey = `local_profile_${userId}`;
  const existingLocal = JSON.parse(localStorage.getItem(storageKey) || '{}');

  // Derive field values prioritizing existing DB values to preserve admin modifications
  const firstName = signupFields.firstName || signupFields.first_name || userObj.user_metadata?.first_name || existingProfileInDb?.first_name || existingLocal.first_name || '';
  const lastName = signupFields.lastName || signupFields.last_name || userObj.user_metadata?.last_name || existingProfileInDb?.last_name || existingLocal.last_name || '';
  const displayName = signupFields.displayName || signupFields.display_name || existingProfileInDb?.display_name || (firstName || lastName ? `${firstName} ${lastName}`.trim() : email.split('@')[0]);
  const phone = signupFields.phone || existingProfileInDb?.phone || userObj.phone || existingLocal.phone || '';
  const address = signupFields.address || existingProfileInDb?.address || existingLocal.address || '';
  const city = signupFields.city || existingProfileInDb?.city || existingLocal.city || '';
  const state = signupFields.state || existingProfileInDb?.state || existingLocal.state || '';
  const zip = signupFields.zip || existingProfileInDb?.zip || existingLocal.zip || '';
  const country = signupFields.country || existingProfileInDb?.country || existingLocal.country || '';
  const pin = signupFields.pin || existingProfileInDb?.pin || existingLocal.pin || '1234';
  const role = existingProfileInDb?.role || signupFields.role || existingLocal.role || (email.toLowerCase().includes('admin') ? 'admin' : 'user');
  const status = existingProfileInDb?.status || signupFields.status || existingLocal.status || 'active';
  const kycStatus = existingProfileInDb?.kyc_status || signupFields.kyc_status || signupFields.kycStatus || existingLocal.kyc_status || 'pending';

  // Currency
  const detectedCurrencyObj = getCurrencyByCountry(country);
  const assignedCurrencyCode = existingProfileInDb?.currency_code || existingProfileInDb?.currency || signupFields.currency || signupFields.currency_code || detectedCurrencyObj.code;
  const assignedCurrencySymbol = existingProfileInDb?.currency_symbol || signupFields.currency_symbol || detectedCurrencyObj.symbol;

  const profileRecord = {
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    phone,
    address,
    city,
    state,
    zip,
    country,
    currency: assignedCurrencyCode,
    currency_code: assignedCurrencyCode,
    currency_symbol: assignedCurrencySymbol,
    pin,
    transaction_pin: pin,
    role,
    status,
    kyc_status: kycStatus,
    created_at: existingProfileInDb?.created_at || existingLocal.created_at || userObj.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 3. Save to Supabase profiles table (only upserting needed or missing fields, without overwriting admin status updates)
  try {
    await supabase.from('profiles').upsert(profileRecord, { onConflict: 'id' });
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase profiles upsert notice:', err);
  }

  // Save to local storage as fresh cache mirror
  localStorage.setItem(storageKey, JSON.stringify(profileRecord));

  // 4. Ensure initial account in Supabase ONLY IF it does not already exist
  if (!existingAccountInDb) {
    const initialAccNum = signupFields.accountNumber || signupFields.account_number || ('9424' + Math.floor(100000 + Math.random() * 900000));
    const initialBalance = signupFields.balance !== undefined ? signupFields.balance : 1000.00;
    const initialAccType = signupFields.accountType || signupFields.account_type || 'checking';

    const accountRecord = {
      user_id: userId,
      account_number: initialAccNum,
      balance: initialBalance,
      currency: assignedCurrencyCode,
      currency_code: assignedCurrencyCode,
      currency_symbol: assignedCurrencySymbol,
      account_type: initialAccType,
      status: 'active'
    };

    try {
      await supabase.from('accounts').upsert(accountRecord, { onConflict: 'user_id' });
      console.log(`[syncRegisteredUser] Created new initial account for ${userId} with balance ${initialBalance}`);
    } catch (err) {
      console.warn('[syncRegisteredUser] Supabase accounts upsert notice:', err);
    }
  } else {
    console.log(`[syncRegisteredUser] Existing account found for ${userId} with balance ${existingAccountInDb.balance}. Preserving DB balance.`);
  }

  // 5. Ensure wallets are created ONLY IF missing
  try {
    const { data: existingWallets } = await supabase.from('wallets').select('*').eq('user_id', userId);
    if (!existingWallets || existingWallets.length === 0) {
      const walletTypes = ['main', 'trading', 'investment', 'bonus', 'profit'];
      const walletInserts = walletTypes.map(type => ({
        user_id: userId,
        wallet_type: type,
        balance: 0.00,
        currency: assignedCurrencyCode
      }));
      await supabase.from('wallets').upsert(walletInserts, { onConflict: 'user_id,wallet_type' });
    }
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase wallets check notice:', err);
  }

  // 6. Ensure broker account
  try {
    const { data: existingBroker } = await supabase.from('broker_accounts').select('*').eq('user_id', userId).maybeSingle();
    if (!existingBroker) {
      await supabase.from('broker_accounts').upsert({
        user_id: userId,
        broker_name: 'Safe Global Prime',
        tier: 'Standard',
        status: 'active'
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase broker_accounts notice:', err);
  }

  // 7. Ensure trading statistics
  try {
    const { data: existingStats } = await supabase.from('trading_statistics').select('*').eq('user_id', userId).maybeSingle();
    if (!existingStats) {
      await supabase.from('trading_statistics').upsert({
        user_id: userId,
        total_trades: 0,
        total_profit: 0.00
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase trading_statistics notice:', err);
  }

  // 8. Ensure trading account ONLY IF missing
  try {
    const { data: existingTradingAcc } = await supabase.from('trading_accounts').select('*').eq('user_id', userId).maybeSingle();
    if (!existingTradingAcc) {
      const trdAccNum = 'TRD-' + Math.floor(100000 + Math.random() * 900000);
      await supabase.from('trading_accounts').upsert({
        user_id: userId,
        account_number: trdAccNum,
        balance: 10000.00,
        equity: 10000.00,
        margin: 0.00,
        free_margin: 10000.00,
        leverage: '1:100',
        status: 'active'
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase trading_accounts notice:', err);
  }

  // 9. Ensure identity verification record ONLY IF missing
  try {
    const { data: existingVerification } = await supabase.from('identity_verification').select('*').eq('user_id', userId).maybeSingle();
    if (!existingVerification) {
      await supabase.from('identity_verification').upsert({
        user_id: userId,
        document_type: 'National ID',
        document_url: 'pending',
        status: 'pending'
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase identity_verification notice:', err);
  }

  // 10. Ensure KYC documents entry ONLY IF missing
  try {
    const { data: existingKyc } = await supabase.from('kyc_documents').select('*').eq('user_id', userId).maybeSingle();
    if (!existingKyc) {
      await supabase.from('kyc_documents').upsert({
        user_id: userId,
        document_type: 'Identity Card',
        document_url: 'pending',
        status: 'pending'
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('[syncRegisteredUser] Supabase kyc_documents notice:', err);
  }

  // 11. If role is admin, ensure entry in admins table
  if (role === 'admin' || email.toLowerCase().includes('admin@safeglobal')) {
    try {
      await supabase.from('admins').upsert({ user_id: userId, email }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[syncRegisteredUser] Admins table notice:', e);
    }
  }

  // Dispatch global window event for live real-time synchronization
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user_registered_or_updated', { detail: { userId, profileRecord } }));
  }

  return profileRecord;
};

export const loadUserProfile = async (userId: string, userAuthData?: any) => {
  let profileFromDb: any = null;
  let accountFromDb: any = null;

  if (userId) {
    try {
      const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (pData) profileFromDb = pData;
    } catch (err) {
      console.warn('[loadUserProfile] Supabase profiles fetch notice:', err);
    }

    try {
      const { data: aData } = await supabase.from('accounts').select('*').eq('user_id', userId).maybeSingle();
      if (aData) accountFromDb = aData;
    } catch (err) {
      console.warn('[loadUserProfile] Supabase accounts fetch notice:', err);
    }
  }

  const localProfile = userId ? JSON.parse(localStorage.getItem(`local_profile_${userId}`) || '{}') : {};

  // Database values from Supabase take STRICT PRECEDENCE over local cache
  const combined = {
    ...(userAuthData || {}),
    ...(localProfile || {}),
    ...(profileFromDb || {}),
    account: accountFromDb || localProfile.account || null
  };

  if (combined && (combined.country || combined.id)) {
    if (!combined.currency || !combined.currency_symbol || !combined.currency_code) {
      const currencyObj = getCurrencyByCountry(combined.country);
      combined.currency = combined.currency || currencyObj.code;
      combined.currency_code = combined.currency_code || currencyObj.code;
      combined.currency_symbol = combined.currency_symbol || currencyObj.symbol;
    }
  }

  if (userId) {
    const storageKey = `local_profile_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(combined));
  }

  console.log(`[loadUserProfile] Fresh profile loaded from Supabase for ${userId}:`, combined);
  return combined;
};
