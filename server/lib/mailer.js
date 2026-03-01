import nodemailer from 'nodemailer';

let transporter;

export const initMailer = async () => {
  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    console.log(`[Mailer] Ethereal Email Ready: ${testAccount.user}`);
  } catch (err) {
    console.error('[Mailer] Failed to initialize Ethereal Email:', err);
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.warn('[Mailer] Transporter not initialized. Skipping email.');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: '"TBO Weddings" <notifications@tbo.com>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[Mailer] Message sent: ${info.messageId}`);
    // Preview URL available when sending through an Ethereal account
    console.log(`[Mailer] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (err) {
    console.error('[Mailer] Send email failed:', err);
    return null;
  }
};
