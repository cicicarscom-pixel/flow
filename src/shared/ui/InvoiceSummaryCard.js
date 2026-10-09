import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { formatMoney } from '../../lib/money';

// Anasayfa "Son fatura" kartı içeriği. Belge görseli özel kovada durur (finance_receipts): önizleme için
// `finance-receipt-url` Edge Function'ından kısa ömürlü imzalı adres alınır (kimlik JWT'den çözülür).

const AMBER = '#F59E0B';

function daysBetween(fromYmd, toYmd) {
  const [fy, fm, fd] = String(fromYmd).split('-').map(Number);
  const [ty, tm, td] = String(toYmd).split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

const Chip = ({ text, color }) => (
  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}66`, marginLeft: 6 }}>
    <Text style={{ color, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>{String(text).toUpperCase()}</Text>
  </View>
);

export default function InvoiceSummaryCard({ invoice, todayYmd, onScan }) {
  const { t, i18n } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPreviewUrl(null);
    setImgFailed(false);
    if (!invoice || !invoice.id || !invoice.image_url) return undefined;
    let alive = true;
    setLoadingImg(true);
    supabase.functions.invoke('finance-receipt-url', { body: { documentId: invoice.id } })
      .then(({ data }) => { if (alive && data && data.url) setPreviewUrl(data.url); })
      .catch(() => { /* önizleme yoksa simge gösterilir */ })
      .finally(() => { if (alive) setLoadingImg(false); });
    return () => { alive = false; };
  }, [invoice && invoice.id, invoice && invoice.image_url]);

  const header = (right) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="receipt-outline" size={15} color={AMBER} />
        <Text style={{ color: AMBER, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginLeft: 6 }}>{t('dashboardScreen.invoiceScanner.card.latest')}</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>{right}</View>
    </View>
  );

  const cta = (
    <TouchableOpacity activeOpacity={0.85} onPress={onScan} style={{ marginTop: 14 }}>
      <LinearGradient colors={['rgba(245,158,11,0.32)', 'rgba(239,68,68,0.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Ionicons name="scan-outline" size={16} color="#FFD58A" />
        <Text style={{ color: '#FFD58A', fontWeight: '800', fontSize: 13, marginLeft: 8 }}>{t('dashboardScreen.invoiceScanner.scanButton')}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (!invoice) {
    return (
      <View>
        {header(null)}
        <View style={{ alignItems: 'center', paddingVertical: 18 }}>
          <View style={{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderStyle: 'dashed' }}>
            <Ionicons name="document-text-outline" size={24} color={AMBER} />
          </View>
          <Text style={{ color: '#A79E96', fontSize: 13, marginTop: 10 }}>{t('dashboardScreen.invoiceScanner.noInvoice')}</Text>
        </View>
        {cta}
      </View>
    );
  }

  const locale = i18n.language || 'tr';
  const supplier = invoice.title || invoice.counterparty_name || '-';
  const amount = Number(invoice.amount_minor || 0) / 100;
  const currency = invoice.currency_code || 'TRY';
  const tax = invoice.tax_details || {};
  const dateText = (ymd) => {
    if (!ymd) return '-';
    const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
    try {
      return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
    } catch {
      return String(ymd).slice(0, 10);
    }
  };
  const mDate = tax.date ? /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(tax.date).trim()) : null;
  const issueYmd = mDate ? `${mDate[3]}-${mDate[2].padStart(2, '0')}-${mDate[1].padStart(2, '0')}` : invoice.created_at;
  const kdv = tax.kdv_20 != null ? tax.kdv_20 : (tax.kdv_10 != null ? tax.kdv_10 : (tax.kdv_1 != null ? tax.kdv_1 : null));
  const paid = invoice.flow_payment_status === 'paid';
  const draft = invoice.ledger_official_status === 'taslak';

  let dueNote = null;
  if (invoice.due_date && !paid && todayYmd) {
    const diff = daysBetween(todayYmd, String(invoice.due_date).slice(0, 10));
    dueNote = diff < 0 ? { text: t('dashboardScreen.invoiceScanner.card.overdue', { n: Math.abs(diff) }), color: '#EF4444' }
      : diff === 0 ? { text: t('dashboardScreen.invoiceScanner.card.dueToday'), color: AMBER }
      : { text: t('dashboardScreen.invoiceScanner.card.dueIn', { n: diff }), color: diff <= 7 ? AMBER : '#22B573' };
  }

  const showImage = !!previewUrl && !imgFailed;
  const tile = { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' };
  const tileLabel = { color: '#A79E96', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' };
  const tileValue = { color: '#F6F1EC', fontSize: 13, fontWeight: '800', marginTop: 2 };

  return (
    <View>
      {header(
        <>
          {draft ? <Chip text={t('dashboardScreen.invoiceScanner.card.draft')} color="#9CA3AF" /> : null}
          <Chip text={paid ? t('dashboardScreen.invoiceScanner.card.paid') : t('dashboardScreen.invoiceScanner.card.unpaid')} color={paid ? '#22B573' : AMBER} />
        </>
      )}

      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity activeOpacity={0.85} disabled={!showImage} onPress={() => setOpen(true)} accessibilityLabel={t('dashboardScreen.invoiceScanner.card.viewReceipt')}
          style={{ width: 88, height: 116, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.08)', alignItems: 'center', justifyContent: 'center' }}>
          {showImage ? (
            <>
              <Image source={{ uri: previewUrl }} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', right: 5, bottom: 5, width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="expand-outline" size={12} color="#fff" />
              </View>
            </>
          ) : loadingImg ? (
            <ActivityIndicator size="small" color={AMBER} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={28} color="rgba(245,158,11,0.8)" />
              <Text style={{ color: 'rgba(245,158,11,0.8)', fontSize: 9, marginTop: 4 }}>{t('dashboardScreen.invoiceScanner.card.noPreview')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 0, marginLeft: 14 }}>
          <Text numberOfLines={2} style={{ color: '#F6F1EC', fontSize: 14, fontWeight: '800', lineHeight: 19 }}>{supplier}</Text>
          <Text style={{ color: '#FBBF24', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(amount, locale, currency)}
          </Text>
          <View style={{ marginTop: 4 }}>
            {kdv != null ? (
              <Text style={{ color: '#A79E96', fontSize: 11 }}>{t('dashboardScreen.invoiceScanner.card.vatAmount')}: <Text style={{ color: '#F6F1EC', fontWeight: '700' }}>{formatMoney(Number(kdv), locale, currency)}</Text></Text>
            ) : null}
            {tax.invoice_number ? (
              <Text style={{ color: '#A79E96', fontSize: 11, marginTop: 2 }} numberOfLines={1}>{t('dashboardScreen.invoiceScanner.card.invoiceNo')}: <Text style={{ color: '#F6F1EC', fontWeight: '700' }}>{tax.invoice_number}</Text></Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 14 }}>
        <View style={tile}>
          <Text style={tileLabel}>{t('dashboardScreen.invoiceScanner.date')}</Text>
          <Text style={tileValue}>{dateText(issueYmd)}</Text>
        </View>
        <View style={[tile, { marginLeft: 10, borderColor: dueNote ? `${dueNote.color}55` : 'rgba(255,255,255,0.07)' }]}>
          <Text style={tileLabel}>{t('dashboardScreen.invoiceScanner.card.dueDate')}</Text>
          <Text style={tileValue}>{dateText(invoice.due_date)}</Text>
          {dueNote ? <Text style={{ color: dueNote.color, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{dueNote.text}</Text> : null}
        </View>
      </View>

      {cta}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(5,7,12,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            {previewUrl ? <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /> : null}
            <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel={t('dashboardScreen.invoiceScanner.card.close')}
              style={{ position: 'absolute', top: 48, right: 20, width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
