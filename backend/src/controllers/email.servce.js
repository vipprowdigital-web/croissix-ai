// backend/src/services/email.service.js

import { Resend } from "resend";

/**
 * Sends a welcome email to a newly registered user.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.phone
 * @param {string} params.businessName
 * @param {number} params.employeeCount
 * @param {string} params.city
 * @param {string} params.state
 */
export async function sendWelcomeEmail({
  name,
  email,
  phone,
  businessName,
  employeeCount,
  city,
  state,
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: "Croissix <noreply@mail.croissix.com>",
      to: email,
      subject: `Welcome to Croissix, ${name}! 🎉`,
      html: buildWelcomeTemplate({
        name,
        email,
        phone,
        businessName,
        employeeCount,
        city,
        state,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    console.log("✅ Welcome email sent:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email service error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── HTML Template ────────────────────────────────────────────────────────────
function buildWelcomeTemplate({
  name,
  email,
  phone,
  businessName,
  employeeCount,
  city,
  state,
}) {
  const row = (label, value) =>
    value
      ? `
      <tr>
        <td style="padding: 10px 16px; color: #a78bca; font-size: 13px; font-weight: 600; width: 40%; border-bottom: 1px solid #2a1a40;">
          ${label}
        </td>
        <td style="padding: 10px 16px; color: #f0e6ff; font-size: 13px; border-bottom: 1px solid #2a1a40;">
          ${value}
        </td>
      </tr>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Croissix</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d14; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <!-- ── Header ── -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #2a0e45 0%, #9f57f5 100%);
              border-radius: 20px 20px 0 0;
              padding: 40px 32px 32px;
              text-align: center;
            ">
              <!-- Logo placeholder — swap src with your actual logo URL -->
              <div style="
                display: inline-block;
                background: rgba(255,255,255,0.12);
                border-radius: 14px;
                padding: 12px 24px;
                margin-bottom: 20px;
              ">
                <span style="color: white; font-size: 22px; font-weight: 800; letter-spacing: 1px;">
                  CROISSIX
                </span>
              </div>

              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">
                Welcome aboard, ${name}! 🎉
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.75); font-size: 15px;">
                Your account has been created successfully.
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background-color: #130d22; padding: 32px;">

              <p style="margin: 0 0 24px; color: #c4aee8; font-size: 15px; line-height: 1.6;">
                Here's a summary of the details you registered with. Keep this safe for your records.
              </p>

              <!-- Personal Info -->
              <p style="
                margin: 0 0 10px;
                color: #9f57f5;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
              ">Personal Info</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="
                background-color: #1a0f2e;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 24px;
                border: 1px solid #2a1a40;
              ">
                ${row("Full Name", name)}
                ${row("Email", email)}
                ${row("Phone", phone)}
              </table>

              <!-- Business Info -->
              <p style="
                margin: 0 0 10px;
                color: #9f57f5;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
              ">Business Info</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="
                background-color: #1a0f2e;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 32px;
                border: 1px solid #2a1a40;
              ">
                ${row("Business Name", businessName)}
                ${row("Employees", employeeCount || "—")}
                ${row("City", city)}
                ${row("State", state)}
              </table>

           

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="
              background-color: #0d0d14;
              border-radius: 0 0 20px 20px;
              border-top: 1px solid #2a1a40;
              padding: 24px 32px;
              text-align: center;
            ">
              <p style="margin: 0 0 6px; color: #6b5a8a; font-size: 12px;">
                If you didn't create this account, please ignore this email.
              </p>
              <p style="margin: 0; color: #6b5a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Croissix. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

// <table width="100%" cellpadding="0" cellspacing="0">
//   <tr>
//     <td align="center">
//       <a
//         href="https://app.croissix.com"
//         style="
//           display: inline-block;
//           background: linear-gradient(135deg, #2a0e45, #9f57f5);
//           color: #ffffff;
//           text-decoration: none;
//           font-size: 15px;
//           font-weight: 700;
//           padding: 14px 40px;
//           border-radius: 50px;
//           letter-spacing: 0.3px;
//         "
//       >
//         Open Croissix →
//       </a>
//     </td>
//   </tr>
// </table>
