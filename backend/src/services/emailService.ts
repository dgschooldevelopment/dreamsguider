import nodemailer from 'nodemailer';

interface SendOtpResult {
  success: boolean;
  message?: string;
  devOtp?: string;
}

export const sendOtpEmail = async (
  toEmail: string,
  otp: string,
  userName?: string
): Promise<SendOtpResult> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || smtpUser || 'no-reply@dreamsguider.com';

  const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

  // Always log OTP in server logs for instant debugging and demo verification
  console.log(`\n========================================`);
  console.log(`🔐 [DREAMSGUIDER OTP SERVICE]`);
  console.log(`To: ${toEmail} (${userName || 'Student'})`);
  console.log(`Code: ${otp}`);
  console.log(`Expires in: 10 minutes`);
  console.log(`SMTP configured: ${isSmtpConfigured ? 'YES' : 'NO (simulating delivery)'}`);
  console.log(`========================================\n`);

  if (!isSmtpConfigured) {
    return {
      success: true,
      message: 'OTP generated (Simulated email delivery mode - check server logs).',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">DreamsGuider</h1>
          <p style="color: #e0e7ff; margin: 6px 0 0 0; font-size: 13px;">Student Learning Portal</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">Hello ${userName || 'Student'},</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Use the following 6-digit One-Time Password (OTP) to securely sign in to your DreamsGuider classroom.
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
            ⏱️ This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            If you did not request this login code, you can safely ignore this email.
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #64748b;">
            © ${new Date().getFullYear()} DreamsGuider Education Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"DreamsGuider" <${fromEmail}>`,
      to: toEmail,
      subject: `Your DreamsGuider Login Code: ${otp}`,
      text: `Hello ${userName || 'Student'}, your login OTP for DreamsGuider is ${otp}. Valid for 10 minutes.`,
      html: htmlContent,
    });

    return {
      success: true,
      message: 'OTP sent to your email address.',
    };
  } catch (error: any) {
    console.error('Failed to send email via SMTP:', error);
    // Fallback: still allow login in case of SMTP timeout
    return {
      success: true,
      message: 'OTP generated. (SMTP connection issue, please check server logs)',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }
};
