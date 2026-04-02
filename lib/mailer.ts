import nodemailer from "nodemailer";

interface ContactMailPayload {
  to: string;
  name: string;
  email: string;
  projectTypeLabel: string;
  message: string;
}

function getTransportConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

export async function sendContactMail(payload: ContactMailPayload): Promise<boolean> {
  const transportConfig = getTransportConfig();
  if (!transportConfig) {
    return false;
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@maxhgd.design";

  await transporter.sendMail({
    from: fromAddress,
    to: payload.to,
    subject: `Nouveau message site - ${payload.name}`,
    replyTo: payload.email,
    text: [
      "Nouveau message recu depuis le formulaire de contact.",
      "",
      `Nom: ${payload.name}`,
      `Email: ${payload.email}`,
      `Type de projet: ${payload.projectTypeLabel}`,
      "",
      "Message:",
      payload.message,
    ].join("\n"),
    html: `
      <h2>Nouveau message recu depuis le site</h2>
      <p><strong>Nom:</strong> ${payload.name}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Type de projet:</strong> ${payload.projectTypeLabel}</p>
      <p><strong>Message:</strong></p>
      <p>${payload.message.replace(/\n/g, "<br />")}</p>
    `,
  });

  return true;
}
