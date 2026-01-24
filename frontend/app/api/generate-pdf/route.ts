import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PatternPDF } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patternId, customerEmail } = body;

    if (!patternId) {
      return NextResponse.json(
        { error: 'Missing required field: patternUuid' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const patternResponse = await fetch(`${apiUrl}/api/patterns/${patternId}`);

    if (!patternResponse.ok) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    const patternData = await patternResponse.json();
    const patternImageUrl = `${apiUrl}${patternData.pattern_image_url}`;

    const pdfBuffer = await renderToBuffer(
      PatternPDF({
        patternImageUrl,
        patternData: {
          gridSize: patternData.grid_size,
          boards_width: patternData.pattern_data?.boards_width,
          boards_height: patternData.pattern_data?.boards_height,
          colors_used: patternData.colors_used,
        },
        customerEmail,
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="perlemønster-${patternId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
