import { CountryCurrency, Denomination, DenominationCounts } from '../types';

export function formatCurrencyAmount(
  amount: number,
  country: CountryCurrency,
  includeSymbol: boolean = true
): string {
  try {
    const hasDecimals = amount % 1 !== 0;
    const formattedNum = new Intl.NumberFormat(country.locale, {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);

    if (!includeSymbol) return formattedNum;

    // Handle RTL or special symbols
    return `${country.currencySymbol} ${formattedNum}`;
  } catch {
    const fallback = amount.toLocaleString();
    return includeSymbol ? `${country.currencySymbol} ${fallback}` : fallback;
  }
}

export function formatQuantity(num: number, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return num.toString();
  }
}

export function generateCashSlipText(
  country: CountryCurrency,
  denominations: Denomination[],
  counts: DenominationCounts,
  title: string = 'Cash Tally Slip',
  amountInWords: string
): string {
  const notes = denominations.filter((d) => d.type === 'note' && (counts[d.id] || 0) > 0);
  const coins = denominations.filter((d) => d.type === 'coin' && (counts[d.id] || 0) > 0);

  let totalNotesCount = 0;
  let totalNotesAmount = 0;
  let totalCoinsCount = 0;
  let totalCoinsAmount = 0;

  notes.forEach((d) => {
    const count = counts[d.id] || 0;
    totalNotesCount += count;
    totalNotesAmount += count * d.value;
  });

  coins.forEach((d) => {
    const count = counts[d.id] || 0;
    totalCoinsCount += count;
    totalCoinsAmount += count * d.value;
  });

  const grandTotal = totalNotesAmount + totalCoinsAmount;
  const grandPieces = totalNotesCount + totalCoinsCount;

  const dateStr = new Date().toLocaleString();

  let text = `==============================\n`;
  text += `   ${title.toUpperCase()}\n`;
  text += `==============================\n`;
  text += `Country  : ${country.countryName} ${country.flag}\n`;
  text += `Currency : ${country.currencyCode} (${country.currencySymbol})\n`;
  text += `Date/Time: ${dateStr}\n`;
  text += `------------------------------\n`;

  if (notes.length > 0) {
    text += `BANKNOTES:\n`;
    notes.forEach((d) => {
      const c = counts[d.id] || 0;
      const sub = c * d.value;
      const valStr = `${country.currencySymbol}${d.value}`.padEnd(9);
      const cntStr = `x ${c}`.padEnd(8);
      const subStr = `= ${country.currencySymbol}${sub.toLocaleString()}`;
      text += `  ${valStr} ${cntStr} ${subStr}\n`;
    });
    text += `  Subtotal Notes: ${totalNotesCount} pcs = ${country.currencySymbol}${totalNotesAmount.toLocaleString()}\n`;
    text += `------------------------------\n`;
  }

  if (coins.length > 0) {
    text += `COINS:\n`;
    coins.forEach((d) => {
      const c = counts[d.id] || 0;
      const sub = c * d.value;
      const valStr = `${country.currencySymbol}${d.value}`.padEnd(9);
      const cntStr = `x ${c}`.padEnd(8);
      const subStr = `= ${country.currencySymbol}${sub.toLocaleString()}`;
      text += `  ${valStr} ${cntStr} ${subStr}\n`;
    });
    text += `  Subtotal Coins: ${totalCoinsCount} pcs = ${country.currencySymbol}${totalCoinsAmount.toLocaleString()}\n`;
    text += `------------------------------\n`;
  }

  text += `TOTAL PIECES : ${grandPieces} (${totalNotesCount} notes, ${totalCoinsCount} coins)\n`;
  text += `TOTAL AMOUNT : ${formatCurrencyAmount(grandTotal, country, true)}\n`;
  text += `IN WORDS     : ${amountInWords}\n`;
  text += `==============================\n`;
  text += `Calculated via Currency Counter • 100% Offline • https://currency-counter.ai.studio\n`;

  return text;
}
