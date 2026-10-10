export const TIMEZONES = [
  "Pacific/Midway (GMT-11)",
  "Pacific/Honolulu (GMT-10)",
  "America/Anchorage (GMT-9)",
  "America/Los_Angeles (GMT-8)",
  "America/Denver (GMT-7)",
  "America/Chicago (GMT-6)",
  "America/New_York (GMT-5)",
  "America/Caracas (GMT-4)",
  "America/Buenos_Aires (GMT-3)",
  "Atlantic/South_Georgia (GMT-2)",
  "Atlantic/Azores (GMT-1)",
  "Europe/London (GMT+0)",
  "Europe/Paris (GMT+1)",
  "Europe/Athens (GMT+2)",
  "Europe/Istanbul (GMT+3)",
  "Asia/Dubai (GMT+4)",
  "Asia/Karachi (GMT+5)",
  "Asia/Dhaka (GMT+6)",
  "Asia/Jakarta (GMT+7)",
  "Asia/Shanghai (GMT+8)",
  "Asia/Tokyo (GMT+9)",
  "Australia/Sydney (GMT+10)",
  "Pacific/Noumea (GMT+11)",
  "Pacific/Auckland (GMT+12)"
];

// Metin üretimi için videonun sunucuya gönderilebileceği en büyük boyut (flow-caption sınırı ~10 MB)
export const MAX_VIDEO_BYTES_FOR_CAPTION = 10 * 1024 * 1024;

export const VIDEO_MIME_BY_EXT = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', '3gp': 'video/3gpp', m4v: 'video/mp4' };
