import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendStaffInvitation(
  email: string,
  firstName: string,
  lastName: string,
  temporaryPassword: string
) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"Cater Station" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to Cater Station - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Cater Station, ${firstName}!</h2>
        <p>Your account has been created. Here are your login details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        
        <p>For security reasons, please change your password after your first login.</p>
        
        <p>You can log in at: <a href="${loginUrl}">${loginUrl}</a></p>
        
        <p>If you have any questions or need assistance, please contact your administrator.</p>
        
        <p>Best regards,<br>The Cater Station Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
} 