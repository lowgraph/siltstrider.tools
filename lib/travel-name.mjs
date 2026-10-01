/** Search spelling only: retain catalog labels and canonical route IDs. */
export function travelName(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().toLowerCase().replace(/['’‘ʼ\-‐‑‒–—]/g, '')
    : '';
}
