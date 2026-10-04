// İşletme kimliği (organizations.id). Veritabanında çözülür (current_org_id()); oturum/kullanıcı kimliğinden
// türetilmez ve sunucuya gönderilmez (AGENTS.md §3 kural 2). Filtre gereken güncelleme/silme yerlerinde kullanılır.
export async function getCurrentOrgId(supabase) {
  const { data, error } = await supabase.rpc('current_org_id');
  if (error) {
    console.warn('[getCurrentOrgId]', error.message);
    return null;
  }
  return data || null;
}
