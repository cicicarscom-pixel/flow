export const formatRelativeTime = (dateStr, t) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t('dashboardScreen.time.minutesAgo', { count: Math.max(1, mins) });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('dashboardScreen.time.hoursAgo', { count: hrs });
  return t('dashboardScreen.time.daysAgo', { count: Math.floor(hrs / 24) });
};
