import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for OTPs (for demo purposes)
const otpStore = new Map<string, string>();

// Twilio Client (Lazy initialized)
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

// API: Send OTP
app.post("/api/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phoneNumber, otp);

  console.log(`[OTP DEBUG] Phone: ${phoneNumber}, Code: ${otp}`);

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !twilioNumber) {
      console.warn("Twilio credentials missing.");
      return res.status(500).json({ 
        error: "SMS service is not configured. Please contact the administrator."
      });
    }

    const client = twilio(sid, token);
    
    // Ensure twilioNumber is in E.164 format (starts with +)
    const formattedFrom = twilioNumber.startsWith('+') ? twilioNumber : `+${twilioNumber.replace(/\D/g, '')}`;
    
    // Clean to only contain '+' and digits
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedTo = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/\D/g, '')}`;
    const digitsOnly = formattedTo.replace(/\D/g, '');

    // If it's a test/mock number (e.g., contains 'X', 'x', '*', '_', or has insufficient digit count), skip real Twilio call to prevent errors
    const isMock = 
      /[a-zA-Z_*]/.test(phoneNumber) || 
      digitsOnly.length < 10 || 
      formattedTo.includes('00000');

    if (isMock) {
      console.log(`[OTP DEBUG] Skipping Twilio send for mock number: ${phoneNumber} (formatted: ${formattedTo})`);
      return res.status(400).json({ 
        error: "Invalid phone number provided."
      });
    }

    try {
      await client.messages.create({
        body: `Your EcoBuild verification code is: ${otp}`,
        from: formattedFrom,
        to: formattedTo
      });
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (twilioErr: any) {
      console.error("Twilio Service Error:", twilioErr.message);
      res.status(500).json({ 
        error: "Failed to send verification SMS."
      });
    }
  } catch (error: any) {
    console.error("Server Error sending OTP:", error);
    res.status(500).json({ 
      error: "Server encountered an issue sending verification SMS."
    });
  }
});

// API: Verify OTP
app.post("/api/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required" });
  }

  const storedOtp = otpStore.get(phoneNumber);
  if (storedOtp === otp) {
    otpStore.delete(phoneNumber);
    res.json({ success: true, message: "OTP verified successfully" });
  } else {
    res.status(400).json({ error: "Invalid OTP" });
  }
});

// API: Send Email OTP
app.post("/api/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  console.log(`[OTP DEBUG] Email: ${email}, Code: ${otp}`);

  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    console.warn("SMTP credentials missing.");
    return res.status(500).json({ 
      error: "Email service is not configured. Please contact the administrator."
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `"EcoBuild" <${smtpEmail}>`,
      to: email,
      subject: "EcoBuild - Verification Code",
      text: `Your EcoBuild verification code is: ${otp}`,
      html: `<b>Your EcoBuild verification code is:</b> <h2>${otp}</h2>`,
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Email Sending Error:", error);
    res.status(500).json({ 
      error: "Failed to send verification email. Please check configuration or try again.",
      debug: error.message
    });
  }
});

// API: Verify Email OTP
app.post("/api/verify-email-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const storedOtp = otpStore.get(email);
  if (storedOtp === otp) {
    otpStore.delete(email);
    res.json({ success: true, message: "OTP verified successfully" });
  } else {
    res.status(400).json({ error: "Invalid OTP" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
