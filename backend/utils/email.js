const nodemailer = require('nodemailer');

// Create transporter from environment variables, fallback to console only
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }

  // Fallback transporter that logs emails to console
  return {
    sendMail: async (options) => {
      console.log('Email transport not configured. Logging email instead:');
      console.log({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });
      return Promise.resolve();
    }
  };
}

const transporter = createTransporter();

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || 'no-reply@taskvra.local';
  const info = await transporter.sendMail({ from, to, subject, text, html });
  try {
    // Log minimal delivery info in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent:', {
        to,
        subject,
        messageId: info && info.messageId,
        accepted: info && info.accepted,
        rejected: info && info.rejected
      });
    }
  } catch {}
}

module.exports = { sendEmail };
