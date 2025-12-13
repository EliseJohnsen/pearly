import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import WelcomeEmail from '@/emails/welcome-email';

export async function POST(request: NextRequest) {
  // Initialize Resend only when the route is called
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { to, name, type = 'welcome' } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    let emailHtml: string;
    let subject: string;

    if (type === 'welcome') {
      emailHtml = await render(WelcomeEmail({ name: name || 'Bruker' }));
      subject = 'Velkommen til Perle!';
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Endre dette til din verifiserte domene
      to: [to],
      subject: subject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
