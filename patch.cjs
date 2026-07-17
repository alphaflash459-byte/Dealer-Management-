const fs = require('fs');
const file = 'src/components/UserDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export function calculateAutoតម្លៃForQty[\s\S]*?return standardតម្លៃ;\n\}/, `export function calculateAutoតម្លៃForQty(product: Product, qty: number): number {
  const standardតម្លៃ = product.price || 0;
  if (qty <= 0) return standardតម្លៃ;

  // Check if quantity is an exact promo target number
  const freeQty = calculatePromoQty(product, qty);
  if (freeQty > 0) {
    return standardតម្លៃ;
  }

  // Check if it's an apportioned quantity (buyQty + getQty)
  const tiers: { buyQty: number; getQty: number }[] = [];
  if (product.promotions && product.promotions.length > 0) {
    tiers.push(...product.promotions.filter(p => p.buyQty > 0 && p.getQty > 0));
  } else if (product.promoBuyQty && product.promoBuyQty > 0 && product.promoGetQty) {
    tiers.push({ buyQty: product.promoBuyQty, getQty: product.promoGetQty });
  }

  if (tiers.length === 0) {
    return standardតម្លៃ;
  }

  // Sort descending by total (buyQty + getQty)
  tiers.sort((a, b) => (b.buyQty + b.getQty) - (a.buyQty + a.getQty));

  for (const tier of tiers) {
    const totalQty = tier.buyQty + tier.getQty;
    if (qty >= totalQty) {
      // Falls into this tier
      return (tier.buyQty * standardតម្លៃ) / totalQty;
    }
  }

  // If quantity is smaller than the smallest tier, use the smallest tier's apportioned price
  const smallestTier = tiers[tiers.length - 1];
  const smallestTotalQty = smallestTier.buyQty + smallestTier.getQty;
  return (smallestTier.buyQty * standardតម្លៃ) / smallestTotalQty;
}`);

fs.writeFileSync(file, code);
