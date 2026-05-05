import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  // --- ADD THIS BLOCK ---
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST MODE] Skipping real email for ${email}. Code: ${code}`);
    return true; 
  }
  // ----------------------

  const mailOptions = {
    from: `"BildyApp Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your BildyApp account',
    html: `<h2>Code: ${code}</h2>`, // simplified for brevity
  };

  return transporter.sendMail(mailOptions);
};