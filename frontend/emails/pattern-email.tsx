import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Img,
  Section,
  Hr,
} from '@react-email/components';
import { EmailTemplate } from '@/types/sanity';

interface PatternEmailProps {
  emailTemplate: EmailTemplate;
  patternImageUrl: string;
  patternData?: {
    gridSize: number;
    boards_width?: number;
    boards_height?: number;
    colors_used?: Array<{
      hex: string;
      name: string;
      count: number;
    }>;
  };
}

export default function PatternEmail({
  emailTemplate,
  patternImageUrl,
  patternData
}: PatternEmailProps) {
  // Convert Portable Text body to plain text for email
  const bodyText = emailTemplate.body
    ?.map((block: any) => {
      if (block._type === 'block' && block.children) {
        return block.children.map((child: any) => child.text).join('');
      }
      return '';
    })
    .join('\n\n');

  return (
    <Html>
      <Head />
      <Preview>{emailTemplate.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{emailTemplate.heading}</Heading>

          {bodyText && (
            <Text style={text}>{bodyText}</Text>
          )}

          {/* Pattern Image */}
          <Section style={imageSection}>
            <Img
              src={patternImageUrl}
              alt="Ditt genererte perlemønster"
              style={patternImage}
            />
          </Section>

          {/* Pattern Details */}
          {patternData && (
            <Section style={detailsSection}>
              <Text style={detailsHeading}>Mønsterdetaljer:</Text>

              {patternData.boards_width && patternData.boards_height && (
                <Text style={detailsText}>
                  <strong>Brett-størrelse:</strong> {patternData.boards_width} × {patternData.boards_height} brett
                  <br />
                  <strong>Total størrelse:</strong> {patternData.boards_width * 29} × {patternData.boards_height * 29} perler
                </Text>
              )}

              {patternData.colors_used && patternData.colors_used.length > 0 && (
                <>
                  <Text style={detailsText}>
                    <strong>Antall farger:</strong> {patternData.colors_used.length}
                  </Text>

                  <table style={colorTable}>
                    <tbody>
                      {patternData.colors_used.map((color, index) => (
                        <tr key={index} style={colorRow}>
                          <td style={colorCell}>
                            <div
                              style={{
                                ...colorSwatch,
                                backgroundColor: color.hex,
                              }}
                            />
                          </td>
                          <td style={colorName}>{color.name}</td>
                          <td style={colorCount}>{color.count} perler</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </Section>
          )}

          {/* CTA Button */}
          {emailTemplate.ctaText && emailTemplate.ctaUrl && (
            <Button style={button} href={emailTemplate.ctaUrl}>
              {emailTemplate.ctaText}
            </Button>
          )}

          <Hr style={hr} />

          {/* Footer */}
          {emailTemplate.footerText && (
            <Text style={footer}>{emailTemplate.footerText}</Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
};

const imageSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const patternImage = {
  maxWidth: '100%',
  height: 'auto',
  border: '2px solid #e0e0e0',
  borderRadius: '8px',
};

const detailsSection = {
  backgroundColor: '#f8f9fa',
  padding: '24px',
  margin: '24px',
  borderRadius: '8px',
};

const detailsHeading = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const detailsText = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const colorTable = {
  width: '100%',
  marginTop: '16px',
  borderCollapse: 'collapse' as const,
};

const colorRow = {
  borderBottom: '1px solid #e0e0e0',
};

const colorCell = {
  padding: '8px 0',
  width: '40px',
};

const colorSwatch = {
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  display: 'inline-block',
};

const colorName = {
  padding: '8px 12px',
  color: '#333',
  fontSize: '14px',
};

const colorCount = {
  padding: '8px 12px',
  color: '#666',
  fontSize: '14px',
  textAlign: 'right' as const,
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '8px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 20px',
  margin: '24px auto',
  maxWidth: '200px',
};

const hr = {
  borderColor: '#e0e0e0',
  margin: '32px 24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px',
  textAlign: 'center' as const,
};
