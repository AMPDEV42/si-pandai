export const sendEmailNotification = async ({ to, subject, html, text }) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        text,
        html,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    console.log('Message sent:', data.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendNewSubmissionEmail = async (adminEmail, submission, submitterName) => {
  const subject = 'Pengajuan Baru di SIPANDAI';
  const text = `Halo Admin,

Ada pengajuan baru dari ${submitterName} dengan detail sebagai berikut:

Jenis Pengajuan: ${submission.typeTitle}
Tanggal: ${new Date(submission.submittedAt).toLocaleString()}

Silakan login ke dashboard admin untuk melihat detail lebih lanjut.

Salam,
Tim SIPANDAI`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Pengajuan Baru di SIPANDAI</h2>
      <p>Halo Admin,</p>
      <p>Ada pengajuan baru dari <strong>${submitterName}</strong> dengan detail sebagai berikut:</p>
      
      <div style="background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
        <p><strong>Jenis Pengajuan:</strong> ${submission.typeTitle}</p>
        <p><strong>Tanggal:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
      </div>
      
      <p>Silakan login ke dashboard admin untuk melihat detail lebih lanjut.</p>
      
      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
        <p>Salam,<br>Tim SIPANDAI</p>
      </div>
    </div>
  `;

  return sendEmailNotification({
    to: adminEmail,
    subject,
    text,
    html,
  });
};
