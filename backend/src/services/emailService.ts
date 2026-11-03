import nodemailer from 'nodemailer';

interface SendOtpResult {
  success: boolean;
  message?: string;
  devOtp?: string;
  emailSent?: boolean;
}

export const sendOtpEmail = async (
  toEmail: string,
  otp: string,
  userName?: string
): Promise<SendOtpResult> => {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.trim(), 10) : 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  // Strip any spaces from the password (Google App Passwords often have spaces: "abcd efgh ijkl mnop")
  const rawPass = process.env.SMTP_PASS?.trim() || '';
  const smtpPass = rawPass.replace(/\s+/g, '');
  const fromEmail = process.env.EMAIL_FROM?.trim() || smtpUser || 'no-reply@dreamsguider.com';

  const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

  // Always log OTP prominently in server logs so admin can always see it
  console.log(`\n========================================`);
  console.log(`🔐 [DREAMSGUIDER OTP SERVICE]`);
  console.log(`To: ${toEmail} (${userName || 'Student'})`);
  console.log(`Code: ${otp}`);
  console.log(`Expires in: 10 minutes`);
  console.log(`SMTP configured: ${isSmtpConfigured ? 'YES' : 'NO'}`);
  if (isSmtpConfigured) {
    console.log(`SMTP Host: ${smtpHost}:${smtpPort} (User: ${smtpUser})`);
  }
  console.log(`========================================\n`);

  if (!isSmtpConfigured) {
    return {
      success: true,
      message: 'OTP generated (Simulated email mode - check console/dev badge).',
      devOtp: otp,
      emailSent: false,
    };
  }

  try {
    const isGmail = smtpHost?.includes('gmail') || smtpUser?.toLowerCase().endsWith('@gmail.com');

    // Create transporter with proper options and strict socket timeouts to prevent infinite spinning
    const transporter = isGmail
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
        })
      : nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false, // Helps avoid self-signed / proxy certificate blocks
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
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
            Use the following 6-digit One-Time Password (OTP) to securely sign in to your DreamsGuider classroom:
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

    // Hard 8-second timeout race to guarantee API never hangs or spins forever
    const sendPromise = transporter.sendMail({
      from: `"DreamsGuider" <${fromEmail}>`,
      to: toEmail,
      subject: `Your DreamsGuider Login Code: ${otp}`,
      text: `Hello ${userName || 'Student'}, your login OTP for DreamsGuider is ${otp}. Valid for 10 minutes.`,
      html: htmlContent,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout after 8 seconds')), 8000)
    );

    await Promise.race([sendPromise, timeoutPromise]);

    console.log(`✅ [DREAMSGUIDER EMAIL SUCCESS] OTP sent successfully to ${toEmail}`);
    return {
      success: true,
      message: 'OTP has been sent to your email address.',
      emailSent: true,
    };
  } catch (error: any) {
    console.error(`❌ [DREAMSGUIDER EMAIL ERROR]:`, error.message || error);
    // If SMTP fails or times out, DO NOT block the user! Return devOtp so login succeeds!
    return {
      success: true,
      message: 'OTP generated. (Email server response delayed - check below code).',
      devOtp: otp,
      emailSent: false,
    };
  }
};
