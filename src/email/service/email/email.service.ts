import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private config: ConfigService) {}

    // Never throws — callers (e.g. AuthService.register()) should never fail
    // just because the email step had a problem.
    //
    // Sends via Resend's HTTP API (https://api.resend.com) instead of SMTP.
    // SMTP is commonly blocked outbound by ISPs, routers, and antivirus —
    // ports 587 AND 465 both timing out identically (rather than being
    // actively refused) is the classic symptom of exactly that, and no
    // in-app fix can route around a network-level block. An HTTP call on
    // port 443 sidesteps the whole problem, since that's the same port all
    // normal web browsing already depends on.
    private async send(to: string, subject: string, html: string) {
        const apiKey = this.config.get<string>('RESEND_API_KEY');

        if (!apiKey) {
            // No provider configured — log the email instead of attempting to
            // send it. Deliberately NOT falling back to Ethereal here: Ethereal
            // is also plain SMTP under the hood (smtp.ethereal.email:587), so
            // on a network that blocks outbound SMTP it would fail the exact
            // same way real SMTP just did. Logging needs no network at all.
            this.logger.warn(`No RESEND_API_KEY configured — logging email instead of sending it.`);
            this.logger.log(`Email (${subject} -> ${to}):\n${html}`);
            return;
        }

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.config.get<string>('EMAIL_FROM') || 'ProlificFX <onboarding@resend.dev>',
                    to,
                    subject,
                    html,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                this.logger.error(`Failed to send email to ${to}: ${response.status} ${errorBody}`);
                return;
            }

            const data = await response.json().catch(() => null);
            this.logger.log(`Email sent (${subject} -> ${to}) via Resend${data?.id ? ` [id: ${data.id}]` : ''}.`);
        } catch (error) {
            // fetch() throws a generic "fetch failed" TypeError for any
            // network-level failure (DNS, connection refused, TLS, etc.) —
            // the actual reason lives in error.cause, not error.message.
            const cause = (error as any)?.cause;
            const detail = cause ? `${cause.code ?? ''} ${cause.message ?? cause}`.trim() : error.message;
            this.logger.error(`Failed to send email to ${to}: ${detail}`);
        }
    }

    sendWelcomeEmail(to: string, fullName: string) {
        return this.send(
            to,
            'Welcome to ProlificFX',
            `<p>Hi ${fullName},</p><p>Welcome to ProlificFX! Your account is ready to use.</p>`,
        );
    }
}