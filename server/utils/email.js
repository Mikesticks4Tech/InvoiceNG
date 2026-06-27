const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendInvoiceEmail = async ({
  clientEmail,
  clientName,
  businessName,
  invoiceNumber,
  amount,
  invoiceUrl,
}) => {
  await resend.emails.send({
    from: "InvoiceNG <onboarding@resend.dev>",
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #6366f1;">📄 InvoiceNG</h2>
        <p>Hi ${clientName},</p>
        <p><strong>${businessName}</strong> has sent you an invoice.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Invoice Number</p>
          <p style="margin: 4px 0 16px; font-weight: 700; color: #6366f1;">${invoiceNumber}</p>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Amount Due</p>
          <p style="margin: 4px 0 0; font-size: 24px; font-weight: 800; color: #1e293b;">${amount}</p>
        </div>
        <a href="${invoiceUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
          View & Pay Invoice →
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
          Powered by InvoiceNG
        </p>
      </div>
    `,
  });
};
