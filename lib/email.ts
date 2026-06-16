import { Resend } from 'resend'

const BLOCKED_DOMAINS = ['teste.com', 'test.com', 'example.com', 'foo.com', 'bar.com']

export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!regex.test(email)) return false
  const domain = email.split('@')[1].toLowerCase()
  return !BLOCKED_DOMAINS.includes(domain)
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'onboarding@nexocollege.com.br',
    to,
    subject,
    html,
  })
}
