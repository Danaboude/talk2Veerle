const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@talk2.be';
const FROM_NAME = 'Talk2';

/* ─────────────────────────────────────────────────────────
   Branded HTML email wrapper
   • Sage & cream palette matching the website
   • Mobile-responsive single-column layout
   • Replaces %FIRSTNAME%, %LINK% placeholders
───────────────────────────────────────────────────────── */
function buildHtml({ firstName = '', body = '', ctaUrl = '', ctaLabel = 'Meer info', subject = '' }) {
    // Replace placeholders in body
    const processedBody = (body || '')
        .replace(/%FIRSTNAME%/g, firstName)
        .replace(/%LINK%/g, ctaUrl || '#');

    // Convert line-breaks to paragraphs
    const bodyHtml = processedBody
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `<p style="margin:0 0 18px;color:#5a6e5c;font-size:16px;line-height:1.7;">${p.replace(/\n/g, '<br>')}</p>`)
        .join('');

    const ctaBlock = ctaUrl
        ? `<div style="text-align:center;margin:36px 0;">
             <a href="${ctaUrl}" style="display:inline-block;background:#1e3520;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:2px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.04em;">
               ${ctaLabel}
             </a>
           </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f7f3ec;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:40px 20px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fefdfb;border:1px solid #cce3cc;border-radius:2px;">

        <!-- Header -->
        <tr>
          <td style="background:#1e3520;padding:28px 40px;border-radius:2px 2px 0 0;">
            <p style="margin:0;font-family:'Georgia','Times New Roman',serif;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:0.01em;">Talk2</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:0.08em;text-transform:uppercase;">${subject || 'Nieuw bericht'}</p>
          </td>
        </tr>

        <!-- Sage accent line -->
        <tr>
          <td style="background:#4a7550;height:3px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 12px;">

            <!-- Greeting -->
            ${firstName ? `<p style="margin:0 0 24px;font-family:'Georgia','Times New Roman',serif;font-size:24px;font-weight:400;color:#1e3520;">Beste ${firstName},</p>` : ''}

            <!-- Main content -->
            ${bodyHtml}

            ${ctaBlock}

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="border-top:1px solid #cce3cc;"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#9ec19f;">Met vriendelijke groeten,</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#2d4a31;">Het Talk2 team</p>
            <p style="margin:8px 0 0;font-size:12px;color:#9ec19f;">
              <a href="https://talk2.be" style="color:#4a7550;text-decoration:none;">talk2.be</a>
            </p>
          </td>
        </tr>

        <!-- Legal footer -->
        <tr>
          <td style="background:#eaf3ea;padding:16px 40px;border-radius:0 0 2px 2px;border-top:1px solid #cce3cc;">
            <p style="margin:0;font-size:11px;color:#9ec19f;text-align:center;line-height:1.6;">
              Je ontvangt dit bericht omdat je eerder contact hebt opgenomen via Talk2.<br>
              © ${new Date().getFullYear()} Talk2 | Ives De Saeger
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────
   Handler
───────────────────────────────────────────────────────── */
const { requireAdmin } = require('./_lib/auth');

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
    if (!requireAdmin(request, response)) return;

    try {
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
        const { email, name, subject, html, text, body: plainBody, ctaUrl, ctaLabel } = body;

        if (!email) {
            return response.status(400).json({ error: 'Missing required field: email' });
        }

        // Build HTML: prefer explicit html > generate from plainBody/text > fallback
        const finalHtml = html || buildHtml({
            firstName: name ? name.split(' ')[0] : '',
            body: plainBody || text || '',
            ctaUrl: ctaUrl || '',
            ctaLabel: ctaLabel || 'Meer info',
            subject: subject || 'Nieuw bericht van Talk2'
        });

        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [email],
            subject: subject || 'Nieuw bericht van Talk2',
            html: finalHtml,
            text: text || plainBody || ''
        });

        return response.status(200).json(data);
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
