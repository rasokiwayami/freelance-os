import {
  Document, Page, Text, View, StyleSheet, Font, pdf,
} from '@react-pdf/renderer'
import { Button } from '../../components/ui/button'
import { Download } from 'lucide-react'
import { useState } from 'react'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 24 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 100, color: '#666' },
  value: { flex: 1 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
    marginBottom: 8,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: '6 8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  totalLabel: { width: 100, textAlign: 'right', color: '#666', marginRight: 8 },
  totalValue: { width: 100, textAlign: 'right', fontWeight: 'bold' },
  totalGrand: { fontSize: 13, fontWeight: 'bold', color: '#1a1a1a' },
  footer: { position: 'absolute', bottom: 40, left: 50, right: 50, color: '#999', fontSize: 8 },
})

const fmt = (n) => `¥${Number(n).toLocaleString('ja-JP')}`

function InvoiceDocument({ project, client, profile, issueDate }) {
  const taxRate = profile?.default_tax_rate ?? 10
  const subtotal = project.amount
  const tax = Math.floor(subtotal * (taxRate / 100))
  const total = subtotal + tax

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.section}>
          <Text style={styles.title}>請求書</Text>
          <Text style={styles.subtitle}>INVOICE</Text>
        </View>

        {/* 発行情報 */}
        <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
          {/* 請求先 */}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>請求先</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{client?.name ?? '—'} 御中</Text>
            {client?.company && <Text style={{ color: '#666', marginTop: 2 }}>{client.company}</Text>}
            {client?.email && <Text style={{ color: '#666', marginTop: 2 }}>{client.email}</Text>}
          </View>
          {/* 発行者情報 */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.sectionTitle}>発行者</Text>
            {profile?.display_name && <Text>{profile.display_name}</Text>}
            <View style={[styles.row, { marginTop: 4 }]}>
              <Text style={styles.label}>発行日:</Text>
              <Text>{issueDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>請求番号:</Text>
              <Text>INV-{project.id.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* 明細 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>明細</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>内容</Text>
            <Text style={styles.colQty}>数量</Text>
            <Text style={styles.colUnit}>単価</Text>
            <Text style={styles.colAmount}>金額</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>{project.title}</Text>
            <Text style={styles.colQty}>1</Text>
            <Text style={styles.colUnit}>{fmt(subtotal)}</Text>
            <Text style={styles.colAmount}>{fmt(subtotal)}</Text>
          </View>

          {/* 小計・税・合計 */}
          <View style={{ marginTop: 8 }}>
            {[
              { label: '小計', value: fmt(subtotal) },
              { label: `消費税（${taxRate}%）`, value: fmt(tax) },
            ].map(({ label, value }) => (
              <View key={label} style={styles.totalRow}>
                <Text style={styles.totalLabel}>{label}</Text>
                <Text style={styles.totalValue}>{value}</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#ddd' }]}>
              <Text style={[styles.totalLabel, { color: '#1a1a1a' }]}>合計</Text>
              <Text style={[styles.totalValue, styles.totalGrand]}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* 振込先 */}
        {(profile?.bank_name || profile?.bank_account_number) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>振込先</Text>
            {profile.bank_name && (
              <View style={styles.row}>
                <Text style={styles.label}>銀行名:</Text>
                <Text>{profile.bank_name}{profile.bank_branch ? ` ${profile.bank_branch}支店` : ''}</Text>
              </View>
            )}
            {profile.bank_account_type && profile.bank_account_number && (
              <View style={styles.row}>
                <Text style={styles.label}>口座:</Text>
                <Text>{profile.bank_account_type} {profile.bank_account_number}</Text>
              </View>
            )}
            {profile.bank_account_name && (
              <View style={styles.row}>
                <Text style={styles.label}>口座名義:</Text>
                <Text>{profile.bank_account_name}</Text>
              </View>
            )}
          </View>
        )}

        {/* フッター */}
        <Text style={styles.footer}>
          FreelanceOS — 自動生成された請求書です
        </Text>
      </Page>
    </Document>
  )
}

export function InvoiceDownloadButton({ project, client, profile }) {
  const [generating, setGenerating] = useState(false)
  const issueDate = new Date().toLocaleDateString('ja-JP')

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const blob = await pdf(
        <InvoiceDocument
          project={project}
          client={client}
          profile={profile}
          issueDate={issueDate}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${project.id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={generating}>
      <Download size={14} className="mr-1" />
      {generating ? '生成中...' : 'PDF'}
    </Button>
  )
}
