/** Türkçe ayrılma hali eki: "Dr.Ediz HUN" → "Dr.Ediz HUN'dan", "Dr.Salih GÜNEY" → "Dr.Salih GÜNEY'den".
 *  İsim harfle bitmiyorsa (ör. "Oda 1") null döner; çağıran taraf "ile" kalıbına düşmeli. */
export function withAblative(name: string): string | null {
  const s = name.trim();
  const lower = s.toLocaleLowerCase('tr');
  const last = lower.slice(-1);
  if (!/\p{L}/u.test(last)) return null;
  const vowels = [...lower].filter((c) => 'aeıioöuü'.includes(c));
  if (vowels.length === 0) return null;
  const front = 'eiöü'.includes(vowels[vowels.length - 1]);
  const hard = 'fstkçşhp'.includes(last);
  return `${s}'${hard ? 't' : 'd'}${front ? 'en' : 'an'}`;
}

/** "Volkan Akbulut, 8 Ekim Çarşamba 09:00 için Dr.Ediz HUN'dan randevu aldı" */
export function appointmentSentence(customer: string, when: string, doctor?: string | null): string {
  if (!doctor) return `${customer}, ${when} için randevu aldı`;
  const abl = withAblative(doctor);
  return abl ? `${customer}, ${when} için ${abl} randevu aldı` : `${customer}, ${when} için ${doctor} ile randevu aldı`;
}
