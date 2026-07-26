import { supabase, isSupabaseConfigured } from './supabase';

const getStore = (key: string) => {
  try {
    const data = localStorage.getItem(`sb_${key}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setStore = (key: string, data: any) => {
  try {
    localStorage.setItem(`sb_${key}`, JSON.stringify(data));
  } catch {}
};

export let cachedUser: any = null;

try {
  const localU = localStorage.getItem('sb_auth_user');
  if (localU) {
    cachedUser = JSON.parse(localU);
  }
} catch {}

if (isSupabaseConfigured) {
  supabase.auth.getUser().then(({ data }) => {
    if (data?.user) {
      cachedUser = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name || '',
        photoURL: data.user.user_metadata?.avatar_url || ''
      };
      try { localStorage.setItem('sb_auth_user', JSON.stringify(cachedUser)); } catch {}
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      cachedUser = {
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.display_name || '',
        photoURL: session.user.user_metadata?.avatar_url || ''
      };
      try { localStorage.setItem('sb_auth_user', JSON.stringify(cachedUser)); } catch {}
    } else {
      cachedUser = null;
      try { localStorage.removeItem('sb_auth_user'); } catch {}
    }
  });
}

export const auth: any = {
  get currentUser() {
    return cachedUser;
  }
};

export const onAuthStateChanged = (_authObj: any, callback: (user: any) => void, errorCallback?: (err: any) => void) => {
  if (!isSupabaseConfigured) {
    callback(cachedUser);
    return () => {};
  }

  supabase.auth.getUser().then(({ data }) => {
    if (data?.user) {
      const u = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name || '',
        photoURL: data.user.user_metadata?.avatar_url || ''
      };
      cachedUser = u;
      callback(u);
    } else {
      cachedUser = null;
      callback(null);
    }
  }).catch((err) => {
    if (errorCallback) errorCallback(err);
    else callback(null);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const u = {
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.display_name || '',
        photoURL: session.user.user_metadata?.avatar_url || ''
      };
      cachedUser = u;
      callback(u);
    } else {
      cachedUser = null;
      callback(null);
    }
  });

  return () => {
    listener.subscription.unsubscribe();
  };
};

export const signInWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  if (!isSupabaseConfigured) {
    const uid = email.toLowerCase().includes('admin') ? 'admin_id_1' : ('user_' + Math.random().toString(36).substring(2, 9));
    const u = {
      uid,
      email,
      displayName: email.split('@')[0],
    };
    cachedUser = u;
    try { localStorage.setItem('sb_auth_user', JSON.stringify(u)); } catch {}

    // Ensure user doc exists
    try {
      await setDoc(doc({} as any, 'users', uid), {
        uid,
        email,
        displayName: email.split('@')[0],
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
        balance: 15420.50,
        createdAt: new Date().toISOString(),
        kycStatus: 'verified'
      });
    } catch {}

    return { user: u };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const u = {
    uid: data.user.id,
    email: data.user.email,
    displayName: data.user.user_metadata?.display_name || '',
  };
  cachedUser = u;
  try { localStorage.setItem('sb_auth_user', JSON.stringify(u)); } catch {}
  return { user: u };
};

export const createUserWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  if (!isSupabaseConfigured) {
    const uid = email.toLowerCase().includes('admin') ? 'admin_id_1' : ('user_' + Math.random().toString(36).substring(2, 9));
    const u = {
      uid,
      email,
      displayName: email.split('@')[0],
    };
    cachedUser = u;
    try { localStorage.setItem('sb_auth_user', JSON.stringify(u)); } catch {}

    try {
      await setDoc(doc({} as any, 'users', uid), {
        uid,
        email,
        displayName: email.split('@')[0],
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
        balance: 10000.00,
        createdAt: new Date().toISOString(),
        kycStatus: 'verified'
      });

      await addDoc(collection({} as any, 'accounts'), {
        userId: uid,
        accountNumber: 'SGB' + Math.floor(1000000000 + Math.random() * 9000000000),
        accountType: 'Checking',
        balance: 15420.50,
        currency: 'USD',
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    } catch (e) {}

    return { user: u };
  }

  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: { display_name: email.split('@')[0] }
    }
  });
  if (error) throw error;
  if (!data.user) throw new Error('User creation failed');
  const u = {
    uid: data.user.id,
    email: data.user.email,
    displayName: data.user.user_metadata?.display_name || '',
  };
  cachedUser = u;
  try { localStorage.setItem('sb_auth_user', JSON.stringify(u)); } catch {}

  try {
    const userId = data.user.id;
    await setDoc(doc({} as any, 'users', userId), {
      uid: userId,
      email,
      displayName: email.split('@')[0],
      role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
      balance: 10000.00,
      createdAt: new Date().toISOString(),
      kycStatus: 'verified'
    });

    await addDoc(collection({} as any, 'accounts'), {
      userId,
      accountNumber: 'SGB' + Math.floor(1000000000 + Math.random() * 9000000000),
      accountType: 'Checking',
      balance: 15420.50,
      currency: 'USD',
      status: 'Active',
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Auto create records error:', e);
  }

  return { user: u };
};

export const signOut = async (_auth: any) => {
  if (isSupabaseConfigured) {
    try { await supabase.auth.signOut(); } catch {}
  }
  cachedUser = null;
  try { localStorage.removeItem('sb_auth_user'); } catch {}
};

export const sendPasswordResetEmail = async (_auth: any, email: string) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const db: any = {};

export class DocumentReference {
  constructor(public collectionName: string, public id: string) {}
}

export class CollectionReference {
  constructor(public name: string) {}
}

export class Query {
  constructor(public collectionName: string, public conditions: any[] = [], public orderBys: any[] = []) {}
}

export const collection = (_db: any, name: string): any => new CollectionReference(name);

export const doc = (_dbOrCol: any, collectionOrId: string, id?: string): any => {
  if (id) {
    return new DocumentReference(collectionOrId, id);
  }
  return new DocumentReference(_dbOrCol?.name || 'default', collectionOrId);
};

export const getDoc = async (docRef: any): Promise<any> => {
  const store = getStore(docRef.collectionName);
  const data = store[docRef.id];
  
  if (isSupabaseConfigured) {
    try {
      const { data: sbData, error } = await supabase
        .from(docRef.collectionName)
        .select('*')
        .eq('id', docRef.id)
        .single();
      
      if (!error && sbData) {
        store[docRef.id] = sbData;
        setStore(docRef.collectionName, store);
        return {
          exists: () => true,
          id: docRef.id,
          data: () => sbData
        };
      }
    } catch (e) {}
  }

  if (data) {
    return {
      exists: () => true,
      id: docRef.id,
      data: () => data
    };
  }

  if (docRef.collectionName === 'users') {
    const defaultUser = {
      uid: docRef.id,
      email: docRef.id === 'admin_id_1' ? 'admin@safeglobal.com' : 'user@safe.com',
      displayName: docRef.id === 'admin_id_1' ? 'System Admin' : 'Global User',
      role: docRef.id === 'admin' || docRef.id === 'admin_id_1' || docRef.id.includes('admin') ? 'admin' : 'user',
      balance: 15420.50,
      createdAt: new Date().toISOString(),
      kycStatus: 'verified'
    };
    return {
      exists: () => true,
      id: docRef.id,
      data: () => defaultUser
    };
  }

  return {
    exists: () => false,
    data: () => null
  };
};

export const setDoc = async (docRef: any, data: any, options?: { merge?: boolean }): Promise<void> => {
  const store = getStore(docRef.collectionName);
  const existing = store[docRef.id] || {};
  const merged = options?.merge ? { ...existing, ...data } : data;
  merged.id = docRef.id;
  store[docRef.id] = merged;
  setStore(docRef.collectionName, store);

  if (isSupabaseConfigured) {
    try {
      await supabase.from(docRef.collectionName).upsert({ id: docRef.id, ...merged });
    } catch (e) {}
  }
};

export const addDoc = async (colRef: any, data: any): Promise<any> => {
  const id = 'doc_' + Math.random().toString(36).substr(2, 9);
  const store = getStore(colRef.name);
  const record = { id, ...data, createdAt: data.createdAt || new Date().toISOString() };
  store[id] = record;
  setStore(colRef.name, store);

  if (isSupabaseConfigured) {
    try {
      await supabase.from(colRef.name).insert([record]);
    } catch (e) {}
  }

  return new DocumentReference(colRef.name, id);
};

export const updateDoc = async (docRef: any, data: any): Promise<void> => {
  const store = getStore(docRef.collectionName);
  const existing = store[docRef.id] || {};
  const updated = { ...existing, ...data };
  store[docRef.id] = updated;
  setStore(docRef.collectionName, store);

  if (isSupabaseConfigured) {
    try {
      await supabase.from(docRef.collectionName).update(data).eq('id', docRef.id);
    } catch (e) {}
  }
};

export const deleteDoc = async (docRef: any): Promise<void> => {
  const store = getStore(docRef.collectionName);
  delete store[docRef.id];
  setStore(docRef.collectionName, store);

  if (isSupabaseConfigured) {
    try {
      await supabase.from(docRef.collectionName).delete().eq('id', docRef.id);
    } catch (e) {}
  }
};

export const query = (colRef: any, ...conditions: any[]): any => {
  return new Query(colRef.name, conditions);
};

export const where = (field: string, op: string, value: any): any => {
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction: string = 'asc'): any => {
  return { type: 'orderBy', field, direction };
};

export const getDocs = async (q: any): Promise<any> => {
  let recordsObj = getStore(q.collectionName);
  let records = Object.values(recordsObj);

  if (isSupabaseConfigured) {
    try {
      const { data: sbRecords } = await supabase.from(q.collectionName).select('*');
      if (sbRecords && sbRecords.length > 0) {
        sbRecords.forEach((r: any) => {
          recordsObj[r.id || r.uid] = r;
        });
        setStore(q.collectionName, recordsObj);
        records = Object.values(recordsObj);
      }
    } catch (e) {}
  }

  if (records.length === 0 && q.collectionName === 'accounts') {
    const defaultAcc = {
      id: 'acc_default',
      userId: cachedUser?.uid || 'default_user',
      accountNumber: 'SGB9482716503',
      accountType: 'Checking',
      balance: 15420.50,
      currency: 'USD',
      status: 'Active'
    };
    recordsObj['acc_default'] = defaultAcc;
    setStore('accounts', recordsObj);
    records = [defaultAcc];
  }

  q.conditions?.forEach((cond: any) => {
    if (cond?.type === 'where') {
      records = records.filter((r: any) => {
        const val = r[cond.field];
        if (cond.op === '==') return val === cond.value;
        if (cond.op === 'in') return Array.isArray(cond.value) && cond.value.includes(val);
        return true;
      });
    }
  });

  return {
    empty: records.length === 0,
    docs: records.map((r: any) => ({
      id: r.id || r.uid || 'doc',
      data: () => r,
      exists: () => true
    }))
  };
};

export const onSnapshot = (q: any, callback: (snapshot: any) => void): any => {
  getDocs(q).then(snapshot => callback(snapshot));

  const interval = setInterval(async () => {
    const snapshot = await getDocs(q);
    callback(snapshot);
  }, 2000);

  return () => clearInterval(interval);
};

export const serverTimestamp = () => new Date().toISOString();

export const increment = (n: number) => n;

export const runTransaction = async (_db: any, updateFunction: any) => {
  return await updateFunction({
    get: async (ref: any) => await getDoc(ref),
    update: async (ref: any, data: any) => await updateDoc(ref, data),
    set: async (ref: any, data: any, opts: any) => await setDoc(ref, data, opts)
  });
};
