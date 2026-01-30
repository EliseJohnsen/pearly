import { PatternPDFProps } from '@/app/models/patternModels';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';



const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  section: {
    margin: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  patternImage: {
    width: '100%',
    maxHeight: 350,
    objectFit: 'contain',
    marginBottom: 20,
    border: '2px solid #e0e0e0',
  },
  detailsBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    width: '40%',
  },
  detailValue: {
    fontSize: 12,
    color: '#555555',
    width: '60%',
  },
  colorTable: {
    marginTop: 10,
  },
  colorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: '1px solid #ddd',
    marginRight: 10,
  },
  colorName: {
    fontSize: 11,
    color: '#333333',
    width: '60%',
  },
  colorCount: {
    fontSize: 11,
    color: '#666666',
    width: '30%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#8898aa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  instructions: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404',
  },
  instructionsText: {
    fontSize: 11,
    color: '#856404',
    lineHeight: 1.5,
  },
});

export function PatternPDF({ patternImageUrl, patternData, customerEmail }: PatternPDFProps) {
  const totalPerler = patternData.boards_width && patternData.boards_height
    ? patternData.boards_width * 29 * patternData.boards_height * 29
    : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ditt Perlemønster</Text>
          {customerEmail && (
            <Text style={styles.subtitle}>Generert for: {customerEmail}</Text>
          )}
          <Text style={styles.subtitle}>Dato: {new Date().toLocaleDateString('nb-NO')}</Text>
        </View>

        {/* Pattern Image */}
        <View style={styles.section}>
          <Image
            src={patternImageUrl}
            style={styles.patternImage}
          />
        </View>

        {/* Pattern Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mønsterdetaljer</Text>
          <View style={styles.detailsBox}>
            {patternData.boards_width && patternData.boards_height && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Brett-størrelse:</Text>
                  <Text style={styles.detailValue}>
                    {patternData.boards_width} × {patternData.boards_height} brett
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total størrelse:</Text>
                  <Text style={styles.detailValue}>
                    {patternData.boards_width * 29} × {patternData.boards_height * 29} perler ({totalPerler} perler totalt)
                  </Text>
                </View>
              </>
            )}
            {patternData.colors_used && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Antall farger:</Text>
                <Text style={styles.detailValue}>{patternData.colors_used.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Color List */}
        {patternData.colors_used && patternData.colors_used.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fargeliste</Text>
            <View style={styles.colorTable}>
              {patternData.colors_used.map((color, index) => (
                <View key={index} style={styles.colorRow}>
                  <View style={{ ...styles.colorSwatch, backgroundColor: color.hex }} />
                  <Text style={styles.colorName}>{color.name}</Text>
                  <Text style={styles.colorCount}>{color.count} perler</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Tips for bruk:</Text>
          <Text style={styles.instructionsText}>
            • Bruk perleplater (29×29 pinner) for å lage mønsteret{'\n'}
            • Sorter perlene etter farge før du begynner{'\n'}
            • Følg mønsteret fra topp til bunn, rad for rad{'\n'}
            • Bruk strykepapir og strykejern (middels varme) for å smelte perlene sammen
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Dette mønsteret er generert av Perle</Text>
          <Text>For spørsmål, kontakt oss på support@perle.no</Text>
        </View>
      </Page>
    </Document>
  );
}
