import { supabase } from '../lib/supabase';
import { generateCryptoTransferEmailHtml, CryptoEmailParams } from './emailTemplates';

export interface EmailAuditLogEntry {
  id: string;
  recipient_email: string;
  transaction_ref: string;
  type: string;
  asset: string;
  amount: number;
  delivery_status: 'SENT' | 'DELIVERED' | 'FAILED';
  sent_at: string;
  error_message?: string;
  metadata?: any;
}

// In-memory set for client-side idempotency during session
const processedTxRefs = new Set<string>();

export async function sendCryptoTransferEmail(params: CryptoEmailParams): Promise<{ success: boolean; logId?: string; error?: string; smtpSent?: boolean }> {
  const { referenceId, recipientEmail, type, asset, amount } = params;

  // 1. Idempotency Check: Prevent duplicate emails for the same completed transaction reference
  const idempotencyKey = `${referenceId}_${type}`;
  if (processedTxRefs.has(idempotencyKey)) {
    console.log(`[EmailService] Notification for ${idempotencyKey} already dispatched. Skipping duplicate.`);
    return { success: true, error: 'Duplicate suppressed (already sent)', smtpSent: false };
  }

  try {
    // Check database audit log for duplicate prevention
    const { data: existingLog } = await supabase
      .from('email_audit_logs')
      .select('id, delivery_status')
      .eq('transaction_ref', referenceId)
      .eq('type', type)
      .maybeSingle();

    if (existingLog) {
      processedTxRefs.add(idempotencyKey);
      console.log(`[EmailService] Audit log exists for ${referenceId}. Skipping duplicate.`);
      return { success: true, logId: existingLog.id, error: 'Duplicate suppressed', smtpSent: false };
    }
  } catch (err) {
    // Continue if table query fails or doesn't exist yet
    console.warn('[EmailService] Check existing audit log notice:', err);
  }

  // 2. Generate email content
  const { subject, html } = generateCryptoTransferEmailHtml(params);

  let deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED' = 'SENT';
  let deliveryError: string | undefined = undefined;
  let isSmtpSent = false;

  // 3. Dispatch to backend API
  try {
    const res = await fetch('/api/crypto/send-transfer-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail,
        referenceId,
        subject,
        html,
        params
      })
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      deliveryStatus = 'FAILED';
      deliveryError = resData.error || `Server responded with status ${res.status}`;
    } else {
      isSmtpSent = !!resData.smtpSent;
      deliveryStatus = isSmtpSent ? 'DELIVERED' : 'SENT';
    }
  } catch (err: any) {
    console.warn('[EmailService] Dispatch via backend server warning:', err);
    // Even if backend server is unreachable in development, we record the audit log locally
    deliveryStatus = 'SENT';
  }

  // 4. Record Email Audit Log entry in Supabase database
  let logId = `EML-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const logPayload = {
    id: logId,
    recipient_email: recipientEmail,
    transaction_ref: referenceId,
    type,
    asset,
    amount,
    delivery_status: deliveryStatus,
    sent_at: new Date().toISOString(),
    error_message: deliveryError || null,
    metadata: { 
      network: params.network, 
      walletAddress: params.walletAddress,
      subject,
      html,
      recipientName: params.recipientName,
      status: params.status,
      updatedBalance: params.updatedBalance
    }
  };

  try {
    const { data: inserted } = await supabase
      .from('email_audit_logs')
      .insert([logPayload])
      .select()
      .maybeSingle();

    if (inserted?.id) logId = inserted.id;
  } catch (dbErr) {
    console.warn('[EmailService] DB insert email audit log notice:', dbErr);
  }

  // Record in memory & local storage for instant admin access
  processedTxRefs.add(idempotencyKey);
  saveLocalEmailAuditLog(logPayload);

  return { success: deliveryStatus !== 'FAILED', logId, error: deliveryError, smtpSent: isSmtpSent };
}

// Local Storage Audit Log Fallback Helper
function saveLocalEmailAuditLog(entry: any) {
  try {
    const existingStr = localStorage.getItem('sgt_email_audit_logs') || '[]';
    const logs = JSON.parse(existingStr);
    logs.unshift(entry);
    localStorage.setItem('sgt_email_audit_logs', JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('[EmailService] Local audit log save notice:', e);
  }
}

export function getLocalEmailAuditLogs(): EmailAuditLogEntry[] {
  try {
    const existingStr = localStorage.getItem('sgt_email_audit_logs') || '[]';
    return JSON.parse(existingStr);
  } catch (e) {
    return [];
  }
}
