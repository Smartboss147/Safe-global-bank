export interface CryptoEmailParams {
  type: 'incoming' | 'outgoing' | 'internal' | 'failed';
  recipientName?: string;
  recipientEmail: string;
  asset: string;
  assetName?: string;
  amount: number;
  network: string;
  walletAddress: string;
  txHash?: string;
  explorerUrl?: string;
  timestamp?: string;
  status?: string;
  networkFee?: string;
  referenceId: string;
  updatedBalance?: string;
}

export function maskAddress(address: string): string {
  if (!address || address.length < 10) return address || 'N/A';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function generateCryptoTransferEmailHtml(params: CryptoEmailParams): { subject: string; html: string } {
  const {
    type,
    recipientName = 'Valued Client',
    recipientEmail,
    asset,
    assetName = asset,
    amount,
    network,
    walletAddress,
    txHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    explorerUrl = `https://etherscan.io/tx/${txHash}`,
    timestamp = new Date().toUTCString(),
    status = 'Completed',
    networkFee = `0.0005 ${asset}`,
    referenceId,
    updatedBalance = 'Verified on Chain'
  } = params;

  const maskedAddr = maskAddress(walletAddress);
  
  let title = 'Cryptocurrency Transaction Confirmation';
  let badgeColor = '#10B981'; // emerald green
  let badgeText = 'COMPLETED';
  let typeHeading = 'Crypto Transfer Receipt';

  if (type === 'incoming') {
    title = `Deposit Confirmed: Received ${amount} ${asset}`;
    badgeColor = '#10B981';
    typeHeading = 'Incoming Deposit Confirmation';
  } else if (type === 'outgoing') {
    title = `Withdrawal Processed: Sent ${amount} ${asset}`;
    badgeColor = '#3B82F6'; // blue
    typeHeading = 'Outgoing Withdrawal Confirmation';
  } else if (type === 'internal') {
    title = `Internal Transfer Executed: ${amount} ${asset}`;
    badgeColor = '#6366F1'; // indigo
    typeHeading = 'Internal Wallet Transfer Receipt';
  } else if (type === 'failed') {
    title = `Transaction Alert: ${asset} Transfer Failed`;
    badgeColor = '#EF4444'; // red
    badgeText = 'FAILED';
    typeHeading = 'Failed Transaction Notification';
  }

  const subject = `[Safe Global Trade] ${title} (Ref: ${referenceId})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden; max-width: 600px; width: 100%;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A3D36 0%, #0F172A 100%); padding: 28px 32px; border-bottom: 1px solid #334155;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
                      <span style="color: #34D399;">SAFE</span> GLOBAL TRADE
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 1.5px; margin-top: 2px;">
                      INSTITUTIONAL CRYPTO ASSET SETTLEMENT
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${badgeColor}; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #F8FAFC;">
                ${typeHeading}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #94A3B8; line-height: 1.5;">
                Dear ${recipientName}, your cryptocurrency transaction has been processed and logged on the digital asset ledger. Below are your transaction details:
              </p>

              <!-- Main Amount Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                      TRANSACTION VALUE
                    </div>
                    <div style="font-size: 32px; font-weight: 900; color: #38BDF8; font-family: monospace;">
                      ${amount} ${asset}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #94A3B8; margin-top: 4px;">
                      ${assetName} on ${network}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Detailed Transaction Specs Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Reference ID</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #F8FAFC; font-weight: 700; font-family: monospace;">${referenceId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Transfer Type</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #F8FAFC; font-weight: 700; text-transform: capitalize;">${type}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Network Protocol</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #F8FAFC; font-weight: 700;">${network}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Wallet Address</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #38BDF8; font-weight: 700; font-family: monospace;">${maskedAddr}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Network / Gas Fee</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #F8FAFC; font-weight: 700;">${networkFee}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Date & Time (UTC)</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #F8FAFC; font-weight: 600;">${timestamp}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Updated Wallet Balance</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; color: #34D399; font-weight: 800;">${updatedBalance}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-size: 13px; color: #94A3B8; font-weight: 600;">Tx Hash</td>
                  <td align="right" style="padding: 12px 0; font-size: 13px; font-weight: 700;">
                    <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" style="color: #38BDF8; text-decoration: none; font-family: monospace;">
                      ${maskAddress(txHash)} ↗
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Reminder Notice Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase; margin-bottom: 4px;">
                      SECURITY REMINDER
                    </div>
                    <div style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">
                      Safe Global Trade staff will <strong>NEVER</strong> ask for your password, account PIN, 2FA codes, or private wallet recovery keys via email, telephone, or direct message.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 24px 32px; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748B;">
                This email was sent automatically regarding your account registered under <strong>${recipientEmail}</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} Safe Global Trade & Banking Corporation. All rights reserved. Encrypted Ledger Protocol.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
