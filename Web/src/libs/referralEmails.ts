import { sendViaSmtp } from './mailer'

/**
 * Mask friend's email or name for privacy (e.g. John Doe -> Jo** Do**)
 */
function maskName(name: string): string {
  if (!name) return 'Friend'
  const parts = name.split(' ')
  return parts
    .map(p => {
      if (p.length <= 2) return p
      return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1]
    })
    .join(' ')
}

/**
 * Sends a welcome email containing the user's personal referral code and link.
 */
export async function sendWelcomeReferralEmail(toEmail: string, userName: string, referralCode: string) {
  const domain = process.env.NEXTAUTH_URL || 'https://paisape.in'
  const referralLink = `${domain}/register?ref=${referralCode}`
  const subject = 'Welcome to Paisape! Here is your Referral Link'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Paisape</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6fc;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
          background: linear-gradient(135deg, #7367f0 0%, #a83279 100%);
          color: #ffffff;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .content h2 {
          color: #7367f0;
          font-size: 20px;
          margin-top: 0;
        }
        .code-box {
          background-color: #f0edf7;
          border: 1px dashed #7367f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 25px 0;
        }
        .referral-code {
          font-size: 32px;
          font-weight: 700;
          color: #7367f0;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        .referral-link {
          font-size: 14px;
          color: #555555;
          word-break: break-all;
          user-select: all;
        }
        .button {
          display: inline-block;
          background-color: #7367f0;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px auto 0 auto;
        }
        .footer {
          background-color: #fafbfc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #777777;
          border-top: 1px solid #eaeaea;
        }
        .benefit-list {
          margin: 20px 0;
          padding-left: 20px;
        }
        .benefit-list li {
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Paisape, ${userName}! 🎉</h1>
        </div>
        <div class="content">
          <h2>Your account is registered successfully.</h2>
          <p>We are excited to have you on board! To get started, you can share your referral code to invite your friends and earn cash rewards directly in your bank account.</p>
          
          <div class="code-box">
            <div class="referral-code">${referralCode}</div>
            <div class="referral-link">${referralLink}</div>
          </div>

          <h3>How it works:</h3>
          <ul class="benefit-list">
            <li><strong>Step 1:</strong> Share your unique referral link with your family & friends.</li>
            <li><strong>Step 2:</strong> When they sign up and verify their phone OTP, you instantly get a signup reward cash.</li>
            <li><strong>Step 3:</strong> When they place their first order, you get a percentage/flat commission.</li>
            <li><strong>Step 4:</strong> You will continue earning recurring commissions on their future orders!</li>
          </ul>

          <div style="text-align: center;">
            <a href="${domain}/login" class="button">Log In to Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated transactional message from Paisape.</p>
          <p>&copy; ${new Date().getFullYear()} Paisape. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendViaSmtp(toEmail, subject, html)
}

/**
 * Sends a notification email to the referrer when they earn referral commissions.
 */
export async function sendReferralCommissionEmail(
  toEmail: string,
  referrerName: string,
  commissionAmount: number,
  friendName: string,
  newBalance: number,
  type: 'SIGNUP' | 'FIRST_ORDER' | 'RECURRING_ORDER'
) {
  const domain = process.env.NEXTAUTH_URL || 'https://paisape.in'
  const subject = 'Congratulations! You earned a Referral Commission 💰'
  const maskedFriendName = maskName(friendName)

  let description = ''
  if (type === 'SIGNUP') {
    description = `Your friend <strong>${maskedFriendName}</strong> signed up and successfully verified their account.`
  } else if (type === 'FIRST_ORDER') {
    description = `Your friend <strong>${maskedFriendName}</strong> placed their first purchase order.`
  } else {
    description = `Your friend <strong>${maskedFriendName}</strong> placed a successful order.`
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Commission Earned</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6fc;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
          background: linear-gradient(135deg, #28c76f 0%, #81fbb8 100%);
          color: #ffffff;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .reward-badge {
          background-color: #e3f9eb;
          border: 1px solid #28c76f;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 25px 0;
        }
        .reward-amount {
          font-size: 36px;
          font-weight: 700;
          color: #28c76f;
        }
        .balance-info {
          font-size: 14px;
          color: #555555;
          margin-top: 10px;
        }
        .button {
          display: inline-block;
          background-color: #28c76f;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px auto 0 auto;
        }
        .footer {
          background-color: #fafbfc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #777777;
          border-top: 1px solid #eaeaea;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You Earned Cash! 💸</h1>
        </div>
        <div class="content">
          <p>Hi ${referrerName},</p>
          <p>Great news! ${description}</p>
          
          <div class="reward-badge">
            <div style="font-size: 14px; color: #555555; text-transform: uppercase; font-weight: 600;">Commission Credited</div>
            <div class="reward-amount">₹${commissionAmount.toFixed(2)}</div>
            <div class="balance-info">Your new wallet balance is <strong>₹${newBalance.toFixed(2)}</strong>.</div>
          </div>

          <p>Once your withdrawable wallet balance reaches the minimum required limit, you can request a direct bank or UPI transfer from your dashboard.</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${domain}/login" class="button">View Wallet & Share Link</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated transaction alert from Paisape.</p>
          <p>&copy; ${new Date().getFullYear()} Paisape. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendViaSmtp(toEmail, subject, html)
}
