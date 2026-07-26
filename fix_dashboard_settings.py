import re

# Dashboard.tsx
with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { db, auth } from '../lib/firebase';", "import { supabase } from '../lib/supabase';")
content = re.sub(r"import { collection.*} from 'firebase/firestore';", "", content)
content = content.replace("import { signOut } from 'firebase/auth';", "")

content = content.replace("user.uid", "user.id")

notifs = """
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifications();
    
    const channel = supabase.channel('dashboard_notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
        fetchNotifications();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
"""
content = re.sub(r"const q = query\(\s*collection\(db, 'notifications'\).*?return \(\) => unsubscribe\(\);", notifs, content, flags=re.DOTALL)


fetch_acc = """
    // Fetch account
    const { data: accData } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    if (accData && accData.length > 0) {
      setAccountId(accData[0].id);
      setAccount(accData[0]);
    }
    
    // Fetch user profile info
    const { data: userData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (userData) {
      setUserData({ ...user, ...userData });
    }
"""
content = re.sub(r"// Fetch account.*?setUserData\(userSnap\.data\(\)\);\s*\}", fetch_acc, content, flags=re.DOTALL)


content = content.replace("signOut(auth);", "supabase.auth.signOut();")
content = content.replace("notification.createdAt?.toDate ? \n                           new Date(notification.createdAt.toDate()).toLocaleDateString() : 'Just now'", "notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'Just now'")

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

# Settings.tsx
with open('src/components/dashboard/Settings.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { db } from '../../lib/firebase';", "import { supabase } from '../../lib/supabase';")
content = re.sub(r"import { doc, updateDoc } from 'firebase/firestore';", "", content)

content = content.replace("user.uid", "user.id")

save_prof = """
      await supabase.from('profiles').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        display_name: formData.displayName
      }).eq('id', user.id);
"""
content = re.sub(r"await updateDoc\(doc\(db, 'users', user\.uid\), formData\);", save_prof, content, flags=re.DOTALL)

bio = """
      const current = userData?.biometricLogin || false;
      supabase.from('profiles').update({ biometricLogin: !current }).eq('id', user.id).then(() => fetchAccount());
"""
content = re.sub(r"const current = userData\?\.biometricLogin \|\| false;\s*updateDoc\(doc\(db, 'users', user\.uid\), \{ biometricLogin: !current \}\);\s*fetchAccount\(\);", bio, content, flags=re.DOTALL)


content = content.replace("userData.kycStatus", "userData.kyc_status")
content = content.replace("userData?.kycStatus", "userData?.kyc_status")
content = content.replace("userData?.createdAt", "userData?.created_at")
content = content.replace("userData.firstName", "userData.first_name")
content = content.replace("userData.lastName", "userData.last_name")
content = content.replace("userData.displayName", "userData.display_name")
content = content.replace("userData?.firstName", "userData?.first_name")
content = content.replace("userData?.lastName", "userData?.last_name")
content = content.replace("userData?.displayName", "userData?.display_name")


with open('src/components/dashboard/Settings.tsx', 'w') as f:
    f.write(content)
