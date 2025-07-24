import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html } = req.body;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"SIPANDAI" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || 'Notifikasi SIPANDAI',
      text: text || '',
      html: html || text || '',
    });

    return res.status(200).json({ 
      success: true,
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
