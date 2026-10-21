import { CountryCurrency } from '../types';

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(num: number): string {
  let current = '';

  if (num % 100 < 20) {
    current = ONES[num % 100];
    num = Math.floor(num / 100);
  } else {
    const unit = ONES[num % 10];
    const ten = TENS[Math.floor((num % 100) / 10)];
    current = unit ? `${ten}-${unit}` : ten;
    num = Math.floor(num / 100);
  }

  if (num === 0) return current;
  const hundred = `${ONES[num]} Hundred`;
  return current ? `${hundred} and ${current}` : hundred;
}

// Indian Numbering System (Crore, Lakh, Thousand, Hundred)
function convertIndianSystem(num: number): string {
  if (num === 0) return 'Zero';

  const parts: string[] = [];

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (crore > 0) {
    parts.push(`${convertIndianSystem(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertLessThanThousand(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertLessThanThousand(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertLessThanThousand(remainder));
  }

  return parts.join(' ').trim();
}

// International System (Billion, Million, Thousand, Hundred)
function convertInternationalSystem(num: number): string {
  if (num === 0) return 'Zero';

  const parts: string[] = [];

  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;

  const million = Math.floor(num / 1000000);
  num %= 1000000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (billion > 0) {
    parts.push(`${convertLessThanThousand(billion)} Billion`);
  }
  if (million > 0) {
    parts.push(`${convertLessThanThousand(million)} Million`);
  }
  if (thousand > 0) {
    parts.push(`${convertLessThanThousand(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertLessThanThousand(remainder));
  }

  return parts.join(' ').trim();
}

export function numberToWords(amount: number, country: CountryCurrency): string {
  if (amount === 0) {
    return `Zero ${country.mainUnitPlural} Only`;
  }

  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const wholePart = Math.floor(rounded);
  const fractionPart = Math.round((rounded - wholePart) * 100);

  const wordsWhole =
    country.numberSystem === 'lakhs'
      ? convertIndianSystem(wholePart)
      : convertInternationalSystem(wholePart);

  const mainUnit = wholePart === 1 ? country.mainUnitSingular : country.mainUnitPlural;

  let result = `${wordsWhole} ${mainUnit}`;

  if (fractionPart > 0) {
    const fractionWords = convertLessThanThousand(fractionPart);
    const fracUnit = fractionPart === 1 ? country.fractionUnitSingular : country.fractionUnitPlural;
    result += ` and ${fractionWords} ${fracUnit}`;
  }

  return `${result} Only`;
}
