import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: { title: string; message: string; type?: string }) => void;
  refreshNotifications: () => Promise<void>;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children, user }: { children: React.ReactNode; user: any }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const defaultNotifications = [
    {
      id: 'notif-1',
      title: 'Account Security Verified',
      message: 'Your institutional account security status is verified and optimal.',
      read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'notif-2',
      title: 'Treasury Deposit Credited',
      message: 'A secure direct deposit has been credited to your balance.',
      read: false,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications(defaultNotifications);
      return;
    }

    try {
      let localNotifs = [];
      try {
        const stored = localStorage.getItem(`safe_bank_notifications_${user.id}`);
        if (stored) localNotifs = JSON.parse(stored);
      } catch (e) {}

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== 'PGRST205') {
          console.warn('Notifications table note:', error.message);
        }
        throw error;
      }

      const combined = [...(data || []), ...localNotifs];
      // Deduplicate by id
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      unique.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setNotifications(unique.length > 0 ? unique : defaultNotifications);
    } catch (err: any) {
      // Gracefully fallback to localStorage or default notifications without printing noisy errors for missing tables
      try {
        const stored = localStorage.getItem(`safe_bank_notifications_${user.id}`);
        if (stored) {
          setNotifications(JSON.parse(stored));
          return;
        }
      } catch (e) {}
      setNotifications(defaultNotifications);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshNotifications();

    if (!user?.id) return;

    const channel = supabase.channel(`realtime_notifications_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        refreshNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (e) {}
      try {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem(`safe_bank_notifications_${user.id}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
      } catch (e) {}
      try {
        const updated = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem(`safe_bank_notifications_${user.id}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const addNotification = (notif: { title: string; message: string; type?: string }) => {
    const newNotif = {
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      user_id: user?.id || 'guest',
      title: notif.title,
      message: notif.message,
      read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (user?.id) {
        try {
          localStorage.setItem(`safe_bank_notifications_${user.id}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      refreshNotifications,
      showNotifications,
      setShowNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
