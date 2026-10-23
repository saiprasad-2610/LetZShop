// Explicit diagnostic; never prints credentials, recipients, message IDs or codes.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { randomInt } from 'node:crypto';
import { resolveTxt, resolveMx } from 'node:dns/promises';
process.loadEnvFile('.env');
const require = createRequire(import.meta.url);
const { MailService } = require('../apps/api/dist/modules/notifications/mail.service.js');
const addressParser = require('../apps/api/node_modules/nodemailer/lib/addressparser');
const fromMailbox = addressParser(process.env.SMTP_FROM || process.env.SMTP_USER || '')[0]?.address;
const domain = process.env.SMTP_USER?.split('@')[1];
const records = async (name, type = 'txt') => {
  try { return type === 'mx' ? await resolveMx(name) : (await resolveTxt(name)).map(r => r.join('')); }
  catch (e) { return { unavailable: e.code }; }
};
const mail = new MailService();
const result = {
  config: { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, credentialsPresent: Boolean(process.env.SMTP_USER && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)), fromMatchesAuthenticatedMailbox: Boolean(fromMailbox && process.env.SMTP_USER && fromMailbox.trim().toLowerCase() === process.env.SMTP_USER.trim().toLowerCase()) },
  verified: await mail.verifyTransport(),
  dns: domain ? { domain, mx: await records(domain, 'mx'), txt: await records(domain), dmarc: await records(`_dmarc.${domain}`), googleDkim: await records(`google._domainkey.${domain}`) } : null,
  attempted: false, accepted: false, inboxConfirmed: 'NOT AVAILABLE',
};
// Only a deliberately supplied diagnostic destination triggers mail.
if (process.env.OTP_SMOKE_TO && result.verified) {
  result.attempted = true;
  result.accepted = await mail.sendVerificationOtp(process.env.OTP_SMOKE_TO.trim().toLowerCase(), randomInt(0, 1_000_000).toString().padStart(6, '0'), 10);
  result.delivery = mail.lastVerificationDelivery;
}
fs.mkdirSync('artifacts/final-hardening', { recursive: true });
fs.writeFileSync('artifacts/final-hardening/smtp-diagnostic.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
if (!result.verified || (result.attempted && !result.accepted)) process.exitCode = 1;
