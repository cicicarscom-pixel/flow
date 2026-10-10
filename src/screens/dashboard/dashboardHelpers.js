// zernio-client yanıtı {success, data: <gövde>}; gövde {accounts,...} (önbellekten ya da canlı). Eski sürümler bir kat daha sarmalıyordu.
export const pickFollowStats = (res) => {
  const b = res && res.data;
  if (b && Array.isArray(b.accounts)) return b;
  if (b && b.data && Array.isArray(b.data.accounts)) return b.data;
  if (b && b.data && b.data.data && Array.isArray(b.data.data.accounts)) return b.data.data;
  return {};
};
