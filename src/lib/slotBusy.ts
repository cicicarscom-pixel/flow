export type BusyAppt = { starts_at: string | null; ends_at: string | null; timezone?: string | null; status: string };

/** Randevunun verilen yerel gündeki [başlangıç, bitiş) aralığı, gece yarısından itibaren dakika. Günle kesişmiyorsa null. */
export function localMinutesRange(startsAt: string, endsAt: string, timeZone: string, ymd: string): [number, number] | null {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const at = (iso: string) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return { ymd: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
  };
  const s = at(startsAt);
  const e = at(endsAt);
  if (s.ymd > ymd || e.ymd < ymd) return null;
  const start = s.ymd < ymd ? 0 : s.min;
  const end = e.ymd > ymd ? 24 * 60 : e.min;
  return end > start ? [start, end] : null;
}

/** "HH:MM" ile başlayan slotMinutes uzunluğundaki slot, aktif bir randevuyla çakışıyor mu? */
export function isSlotBusy(slot: string, ymd: string, appts: BusyAppt[], slotMinutes = 30): boolean {
  const [h, m] = slot.split(':').map(Number);
  const s = h * 60 + m;
  const e = s + slotMinutes;
  return appts.some((a) => {
    if ((a.status !== 'Pending' && a.status !== 'Approved') || !a.starts_at || !a.ends_at) return false;
    const r = localMinutesRange(a.starts_at, a.ends_at, a.timezone ?? 'Europe/Istanbul', ymd);
    return r !== null && s < r[1] && e > r[0];
  });
}
