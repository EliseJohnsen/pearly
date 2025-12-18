import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { renderToBuffer } from '@react-pdf/renderer';
import WelcomeEmail from '@/emails/welcome-email';
import PatternEmail from '@/emails/pattern-email';
import { PatternPDF } from '@/lib/pdf-generator';
import { fetchSanityData } from '@/lib/sanity.server';
import { emailTemplateQuery } from '@/lib/queries';
import { EmailTemplate } from '@/types/sanity';

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { to, name, type = 'welcome', patternUuid, templateId = 'pattern-generated' } = body;

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

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const data = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, data }, { status: 200 });
    } else if (type === 'pattern') {
      if (!patternUuid) {
        return NextResponse.json(
          { error: 'Missing required field: patternUuid' },
          { status: 400 }
        );
      }

      const emailTemplate = await fetchSanityData<EmailTemplate>(emailTemplateQuery(templateId));

      if (!emailTemplate) {
        return NextResponse.json(
          { error: 'Email template not found in Sanity' },
          { status: 404 }
        );
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const patternResponse = await fetch(`${apiUrl}/api/patterns/${patternUuid}`);

      if (!patternResponse.ok) {
        return NextResponse.json(
          { error: 'Pattern not found' },
          { status: 404 }
        );
      }

      const patternData = await patternResponse.json();

      const patternImageUrl = `${apiUrl}${patternData.pattern_image_url}`;

      emailHtml = await render(
        PatternEmail({
          emailTemplate,
          patternImageUrl,
          patternData: {
            gridSize: patternData.grid_size,
            boards_width: patternData.pattern_data?.boards_width,
            boards_height: patternData.pattern_data?.boards_height,
            colors_used: patternData.colors_used,
          },
        })
      );

      subject = emailTemplate.subject;

      const pdfBuffer = await renderToBuffer(
        PatternPDF({
          patternImageUrl,
          patternData: {
            gridSize: patternData.grid_size,
            boards_width: patternData.pattern_data?.boards_width,
            boards_height: patternData.pattern_data?.boards_height,
            colors_used: patternData.colors_used,
          },
          customerEmail: to,
        })
      );

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const data = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: emailHtml,
        attachments: [
          {
            filename: 'perlemønster.pdf',
            content: pdfBuffer,
          },
        ],
      });

      return NextResponse.json({ success: true, data }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
