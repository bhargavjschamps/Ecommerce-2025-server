import { createTransport } from "nodemailer";

// OTP bhejne ka function
const sendOtp = async ({ email, subject, otp }) => {
  // 1️⃣ Transporter setup
  const transport = createTransport({
    service: "gmail", // Gmail service
    auth: {
      user: process.env.Gmail,       // tumhara Gmail
      pass: process.env.Password,    // Gmail app password
    },
  });

  // 2️⃣ HTML content
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OTP Verification</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f4; }
  .container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
  h1 { color: red; }
  p { margin-bottom: 20px; color: #333; }
  .otp { font-size: 36px; color: #7b68ee; margin-bottom: 30px; }
</style>
</head>
<body>
<div class="container">
  <h1>OTP Verification</h1>
  <p>Hello ${email}, your One-Time Password for account verification is:</p>
  <p class="otp">${otp}</p>
</div>
</body>
</html>`;

  // 3️⃣ Send Mail with error handling
  try {
    const info = await transport.sendMail({
      from: process.env.Gmail,
      to: email,
      subject,
      html,
    });
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

export default sendOtp;
