import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      // IMPORTANT: 
      // 1. While testing, you must use 'onboarding@resend.dev' as the 'from' address.
      // 2. Once you verify your domain (e.g., noctowls.com) in the Resend dashboard, 
      //    update this to: "Noctowls <noreply@noctowls.com>"
      from: "Noctowls <noreply@noctowls.com>", 
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected Email error:", err);
    return false;
  }
};