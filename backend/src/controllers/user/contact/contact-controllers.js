import { sendEmail } from "../../../configs/nodemailer.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. Send Notification Email to Admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">New Contact Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #4f46e5;">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid #e5e7eb;">
          <p style="margin: 0; font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Message</p>
          <p style="margin-top: 5px; line-height: 1.6;">${message}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
          Received via Noctowls Contact Form • ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    // Note: We use 'await' here to ensure we don't send a success response if the email fails
    const adminEmailSent = await sendEmail({
      to: process.env.ADMIN_MAIL,
      subject: `New Inquiry: ${subject}`,
      html: adminHtml,
    });

    if (!adminEmailSent) {
        throw new Error("Failed to send admin notification");
    }

    // 3. Send Acknowledgement Email to User (Fire and forget - don't block response)
    const userHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
        <h2 style="color: #4f46e5;">Hello ${name},</h2>
        <p>Thanks for reaching out to <strong>Noctowls</strong>! 🦉</p>
        <p>We have received your message regarding <strong>"${subject}"</strong>.</p>
        <p>Our team will review it and get back to you as soon as possible (usually within 24 hours).</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 14px; color: #6b7280;">Best Regards,<br/><strong>Team Noctowls</strong></p>
      </div>
    `;

    sendEmail({
      to: email, 
      subject: "We received your message - Noctowls",
      html: userHtml,
    }).catch(err => console.error("Auto-reply failed:", err));

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });

  } catch (error) {
    console.error("Contact Form Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
      error: error.message,
    });
  }
};