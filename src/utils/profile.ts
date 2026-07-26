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

  return updatedLocal;
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
