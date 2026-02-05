import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      // --- Timeout Settings ---
      connectionTimeout: 10000, // Time to wait for a connection to be established
      greetingTimeout: 5000,    // Time to wait for the greeting after connection
      socketTimeout: 15000,     // Time of inactivity on the socket
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Noctowls" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
};
