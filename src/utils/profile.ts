import { supabase } from '../lib/supabase';

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
  localStorage.setItem(storageKey, JSON.stringify(updatedLocal));

  // Sync with central user registry in local storage
  try {
    const rawRegistry = localStorage.getItem('all_registered_users');
    let registryList: any[] = rawRegistry ? JSON.parse(rawRegistry) : [];
    if (!Array.isArray(registryList)) registryList = [];

    const existingIdx = registryList.findIndex(u => u && (u.id === userId || u.email === email));
    if (existingIdx >= 0) {
      registryList[existingIdx] = { ...registryList[existingIdx], ...updatedLocal };
    } else {
      registryList.push({ id: userId, email, ...updatedLocal });
    }
    localStorage.setItem('all_registered_users', JSON.stringify(registryList));
  } catch (e) {
    console.warn('Error updating all_registered_users:', e);
  }

  try {
    await supabase.from('profiles').upsert({
      id: userId,
      email: email,
      ...profileData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase profiles update notice:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user_registered_or_updated', { detail: { userId, updatedLocal } }));
  }

  return updatedLocal;
};

export const syncRegisteredUser = async (userObj: any, signupFields: Record<string, any> = {}) => {
  if (!userObj || (!userObj.id && !userObj.uid)) return null;

  const userId = userObj.id || userObj.uid;
  const email = userObj.email || signupFields.email || `user_${userId.substring(0, 6)}@safeglobalbank.com`;
  
  const firstName = signupFields.firstName || signupFields.first_name || userObj.user_metadata?.first_name || '';
  const lastName = signupFields.lastName || signupFields.last_name || userObj.user_metadata?.last_name || '';
  const displayName = signupFields.displayName || signupFields.display_name || (firstName || lastName ? `${firstName} ${lastName}`.trim() : email.split('@')[0]);
  const phone = signupFields.phone || userObj.phone || '';
  const address = signupFields.address || '';
  const city = signupFields.city || '';
  const state = signupFields.state || '';
  const zip = signupFields.zip || '';
  const country = signupFields.country || '';
  const pin = signupFields.pin || '1234';
  const role = signupFields.role || (email.toLowerCase().includes('admin') ? 'admin' : 'user');
  const status = signupFields.status || 'active';
  const kycStatus = signupFields.kyc_status || signupFields.kycStatus || 'Unverified';

  // 1. Update local profile key
  const storageKey = `local_profile_${userId}`;
  const existingLocal = JSON.parse(localStorage.getItem(storageKey) || '{}');
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
    pin,
    role: existingLocal.role || role,
    status: existingLocal.status || status,
    kyc_status: existingLocal.kyc_status || kycStatus,
    created_at: existingLocal.created_at || userObj.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(storageKey, JSON.stringify(profileRecord));

  // 2. Update central user registry array in localStorage
  try {
    const rawRegistry = localStorage.getItem('all_registered_users');
    let registryList: any[] = rawRegistry ? JSON.parse(rawRegistry) : [];
    if (!Array.isArray(registryList)) registryList = [];

    const existingIdx = registryList.findIndex(u => u && (u.id === userId || u.email === email));
    if (existingIdx >= 0) {
      registryList[existingIdx] = { ...registryList[existingIdx], ...profileRecord };
    } else {
      registryList.push(profileRecord);
    }
    localStorage.setItem('all_registered_users', JSON.stringify(registryList));
  } catch (e) {
    console.warn('Error saving to all_registered_users registry:', e);
  }

  // 3. Upsert to Supabase profiles table
  try {
    await supabase.from('profiles').upsert(profileRecord, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase profiles upsert notice:', err);
  }

  // 4. Ensure initial account in Supabase & local storage
  const initialAccNum = signupFields.accountNumber || ('9424' + Math.floor(100000 + Math.random() * 900000));
  const initialBalance = signupFields.balance !== undefined ? signupFields.balance : 1000;
  const initialAccType = signupFields.accountType || 'checking';

  const accountRecord = {
    user_id: userId,
    account_number: initialAccNum,
    balance: initialBalance,
    currency: 'USD',
    account_type: initialAccType,
    status: 'active'
  };

  try {
    await supabase.from('accounts').upsert(accountRecord, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Supabase accounts upsert notice:', err);
  }

  // 5. If role is admin, ensure entry in admins table
  if (role === 'admin') {
    try {
      await supabase.from('admins').upsert({ user_id: userId, email }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Admins table notice:', e);
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

  if (userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) profileFromDb = data;
    } catch (err) {
      console.warn('Supabase profiles fetch notice:', err);
    }
  }

  const localProfile = userId ? JSON.parse(localStorage.getItem(`local_profile_${userId}`) || '{}') : {};

  return {
    ...(userAuthData || {}),
    ...(profileFromDb || {}),
    ...(localProfile || {})
  };
};
