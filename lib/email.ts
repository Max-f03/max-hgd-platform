import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendContactEmailParams {
  to: string;
  fromName: string;
  fromEmail: string;
  projectTypeLabel: string;
  message: string;
}

export async function sendContactEmail({
  to,
  fromName,
  fromEmail,
  projectTypeLabel,
  message,
}: SendContactEmailParams): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Max HGD Platform <onboarding@resend.dev>",
      to: [to],
      replyTo: fromEmail,
      subject: `Nouveau message site - ${fromName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Nouveau message de contact</h2>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>De :</strong> ${fromName}</p>
            <p><strong>Email :</strong> <a href="mailto:${fromEmail}">${fromEmail}</a></p>
            <p><strong>Type de projet :</strong> ${projectTypeLabel}</p>
          </div>

          <div style="padding: 20px; border-left: 4px solid #3B82F6;">
            <p style="white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;" />

          <p style="color: #6B7280; font-size: 12px;">
            Ce message a ete envoye depuis le formulaire de contact de votre site portfolio.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Erreur envoi email:", JSON.stringify(error));
      console.error("[Resend] Destinataire:", to);
      return false;
    }

    console.log("[Resend] Email envoye avec succes a:", to);
    return true;
  } catch (err) {
    console.error("[Resend] Exception:", err);
    return false;
  }
}
