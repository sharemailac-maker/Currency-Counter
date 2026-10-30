import React, { useState, useMemo } from 'react';
import { CountryCurrency, ActiveCalculatorType } from '../types';
import { 
  ArrowLeftRight, 
  Percent, 
  Coins, 
  DollarSign, 
  Copy, 
  Check, 
  RotateCcw, 
  Calculator, 
  Receipt,
  Info,
  ArrowDown,
  Printer,
  PiggyBank,
  TrendingUp,
  CalendarClock
} from 'lucide-react';
import { formatCurrencyAmount } from '../utils/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { FinancialCalculators } from './FinancialCalculators';

interface ConversionViewProps {
  currentCountry: CountryCurrency;
  allCountries: CountryCurrency[];
  counterTotalAmount: number;
  onNavigateToCounter?: () => void;
  activeCalculator?: ActiveCalculatorType;
  onNavigateToSettings?: () => void;
}

export const ConversionView: React.FC<ConversionViewProps> = ({
  currentCountry,
  allCountries,
  counterTotalAmount,
  onNavigateToCounter,
  activeCalculator = 'none',
  onNavigateToSettings,
}) => {
  // Tab switcher when a calculator is enabled from settings
  const [activeSubTab, setActiveSubTab] = useState<'converter' | 'calculator'>('converter');

  // Base (From) and Target (To) countries
  const [fromCountryId, setFromCountryId] = useState<string>(currentCountry.id);
  const [toCountryId, setToCountryId] = useState<string>(() => {
    // Default to US if current is not US, else EU/GB/IN
    if (currentCountry.id !== 'US') return 'US';
    return 'EU';
  });

  // Source amount (pre-filled with counter total if > 0, else 1000)
  const [sourceAmount, setSourceAmount] = useState<string>(() => {
    return counterTotalAmount > 0 ? String(counterTotalAmount) : '1000';
  });

  const fromCountry = useMemo(() => {
    return allCountries.find((c) => c.id === fromCountryId) || currentCountry;
  }, [allCountries, fromCountryId, currentCountry]);

  const toCountry = useMemo(() => {
    return allCountries.find((c) => c.id === toCountryId) || allCountries[0];
  }, [allCountries, toCountryId]);

  // Which currency sits on the 1-unit base side: e.g. 'USD' for '1 USD = 95.82 INR'
  // Initialized intelligently to the more common denominator or source currency
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string>(() => {
    // If either currency is USD/EUR/GBP, humans typically remember 1 USD = X INR, 1 EUR = X INR
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SGD', 'ILS'];
    const toMatch = allCountries.find((c) => c.id === toCountryId) || allCountries[0];
    const fromMatch = allCountries.find((c) => c.id === fromCountryId) || currentCountry;
    if (majorCurrencies.includes(toMatch.currencyCode) && !majorCurrencies.includes(fromMatch.currencyCode)) {
      return toMatch.currencyCode;
    }
    return fromMatch.currencyCode;
  });

  // User-entered custom exchange rate string: e.g. '95.82'
  const [customRate, setCustomRate] = useState<string>(() => {
    // If INR to USD or USD to INR, default to a familiar ~83.50
    const toMatch = allCountries.find((c) => c.id === toCountryId) || allCountries[0];
    const fromMatch = allCountries.find((c) => c.id === fromCountryId) || currentCountry;
    if ((fromMatch.currencyCode === 'INR' && toMatch.currencyCode === 'USD') || 
        (fromMatch.currencyCode === 'USD' && toMatch.currencyCode === 'INR')) {
      return '83.50';
    }
    return '1.0';
  });

  // Exchange fee / cost mode: default to 'none' (0% fee) so converted cash is exact
  const [feeType, setFeeType] = useState<'none' | 'percent' | 'flat'>('none');
  const [feePercent, setFeePercent] = useState<string>('1.5'); // e.g. 1.5%
  const [flatFeeAmount, setFlatFeeAmount] = useState<string>('5'); // e.g. 5.00
  const [flatFeeCurrency, setFlatFeeCurrency] = useState<'from' | 'to'>('to'); // fee deducted in base or target

  const [copied, setCopied] = useState(false);

  // Alphabetical list of countries
  const sortedCountries = useMemo(() => {
    return [...allCountries].sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [allCountries]);

  // Derived active quote currency (always the opposite of base currency in the pair)
  const quoteCurrencyCode = useMemo(() => {
    if (baseCurrencyCode === fromCountry.currencyCode) {
      return toCountry.currencyCode;
    }
    return fromCountry.currencyCode;
  }, [baseCurrencyCode, fromCountry.currencyCode, toCountry.currencyCode]);

  // Change base currency without mutating user's typed number
  const handleSelectBaseCurrency = (newBase: string) => {
    if (newBase === fromCountry.currencyCode || newBase === toCountry.currencyCode) {
      setBaseCurrencyCode(newBase);
    }
  };

  // Change quote currency (which adjusts base currency to the other one)
  const handleSelectQuoteCurrency = (newQuote: string) => {
    if (newQuote === fromCountry.currencyCode) {
      setBaseCurrencyCode(toCountry.currencyCode);
    } else if (newQuote === toCountry.currencyCode) {
      setBaseCurrencyCode(fromCountry.currencyCode);
    }
  };

  // Invert rate direction and calculate reciprocal (1 / X)
  const handleInvertRateAndNumber = () => {
    const nextBase = baseCurrencyCode === fromCountry.currencyCode ? toCountry.currencyCode : fromCountry.currencyCode;
    setBaseCurrencyCode(nextBase);
    const cleanRate = String(customRate || '').replace(/,/g, '').trim();
    const num = parseFloat(cleanRate);
    if (!isNaN(num) && num > 0) {
      const inv = 1 / num;
      setCustomRate(inv >= 1 ? Number(inv.toFixed(4)).toString() : Number(inv.toFixed(6)).toString());
    }
  };

  // Swap currencies
  const handleSwap = () => {
    const prevFrom = fromCountryId;
    const prevTo = toCountryId;
    setFromCountryId(prevTo);
    setToCountryId(prevFrom);
  };

  // Preset quick rates for common pairs if user wants a quick baseline
  const handleApplyPresetBaseline = () => {
    const ratesTable: Record<string, number> = {
      USD_INR: 83.5,
      EUR_INR: 90.5,
      GBP_INR: 105.8,
      AED_INR: 22.75,
      SAR_INR: 22.25,
      CAD_INR: 61.2,
      AUD_INR: 54.6,
      SGD_INR: 62.1,
      USD_EUR: 0.92,
      EUR_USD: 1.08,
      USD_GBP: 0.79,
      GBP_USD: 1.27,
      USD_AED: 3.67,
      USD_SAR: 3.75,
      USD_ILS: 3.72,
      EUR_ILS: 4.05,
      GBP_ILS: 4.85,
      ILS_INR: 22.45,
      USD_JPY: 152.0,
      EUR_GBP: 0.86,
      USD_CNY: 7.23,
      USD_BRL: 5.15,
      USD_MXN: 17.5,
      USD_PKR: 278.0,
      USD_BDT: 117.0,
      USD_NPR: 133.5,
      USD_LKR: 302.0,
      USD_RUB: 91.5,
      RUB_INR: 0.91,
      EUR_XOF: 655.96,
      EUR_XAF: 655.96,
      USD_XOF: 605.0,
      USD_XAF: 605.0,
      XOF_XAF: 1.0,
      XAF_XOF: 1.0,
      XOF_INR: 0.138,
      XAF_INR: 0.138,
    };

    const pairFromTo = `${fromCountry.currencyCode}_${toCountry.currencyCode}`;
    const pairToFrom = `${toCountry.currencyCode}_${fromCountry.currencyCode}`;

    if (ratesTable[pairFromTo]) {
      setBaseCurrencyCode(fromCountry.currencyCode);
      setCustomRate(String(ratesTable[pairFromTo]));
    } else if (ratesTable[pairToFrom]) {
      // Natural human-memorable direction (e.g. 1 USD = 83.50 INR)
      setBaseCurrencyCode(toCountry.currencyCode);
      setCustomRate(String(ratesTable[pairToFrom]));
    } else {
      setBaseCurrencyCode(fromCountry.currencyCode);
      setCustomRate('1.0');
    }
  };

  // Rock-solid mathematical calculations
  const calculations = useMemo(() => {
    const cleanAmountStr = String(sourceAmount || '').replace(/,/g, '').trim();
    const amount = Math.max(0, parseFloat(cleanAmountStr) || 0);

    const cleanRateStr = String(customRate || '').replace(/,/g, '').trim();
    const rate = Math.max(0, parseFloat(cleanRateStr) || 0);

    const fromCode = fromCountry.currencyCode;
    const toCode = toCountry.currencyCode;

    // Check if the 1-unit base is the source currency
    const isBaseSource = baseCurrencyCode === fromCode;

    let grossConverted = 0;
    let effectiveUnitRate = 0; // 1 Source = X Target

    if (amount > 0 && rate > 0) {
      if (isBaseSource) {
        // 1 Source = rate Target => e.g. 1 USD = 83.5 INR, converting $100 USD => 8350 INR
        grossConverted = amount * rate;
        effectiveUnitRate = rate;
      } else {
        // 1 Target = rate Source => e.g. 1 USD = 95.82 INR, converting 1000 INR => 1000 / 95.82 = 10.44 USD
        grossConverted = amount / rate;
        effectiveUnitRate = 1 / rate;
      }
    }

    // Safety guards against NaN or Infinity
    grossConverted = isFinite(grossConverted) && !isNaN(grossConverted) ? Math.max(0, grossConverted) : 0;
    effectiveUnitRate = isFinite(effectiveUnitRate) && !isNaN(effectiveUnitRate) ? Math.max(0, effectiveUnitRate) : 0;

    // Fee calculations
    let feeDeductedInTarget = 0;
    if (feeType === 'percent') {
      const cleanFeePercent = String(feePercent || '').replace(/,/g, '').trim();
      const p = Math.max(0, parseFloat(cleanFeePercent) || 0);
      feeDeductedInTarget = grossConverted * (p / 100);
    } else if (feeType === 'flat') {
      const cleanFlatFee = String(flatFeeAmount || '').replace(/,/g, '').trim();
      const flat = Math.max(0, parseFloat(cleanFlatFee) || 0);
      if (flatFeeCurrency === 'to') {
        feeDeductedInTarget = flat;
      } else {
        // Flat fee specified in source currency, convert to target
        feeDeductedInTarget = isBaseSource ? flat * rate : (rate > 0 ? flat / rate : 0);
      }
    }

    feeDeductedInTarget = isFinite(feeDeductedInTarget) && !isNaN(feeDeductedInTarget)
      ? Math.min(grossConverted, Math.max(0, feeDeductedInTarget))
      : 0;

    const netReceived = Math.max(0, grossConverted - feeDeductedInTarget);
    const postFeeEffectiveRate = amount > 0 ? netReceived / amount : 0;
    const invertedRate = rate > 0 ? 1 / rate : 0;

    return {
      amount,
      rate,
      isBaseSource,
      grossConverted,
      feeDeductedInTarget,
      netReceived,
      effectiveUnitRate,
      postFeeEffectiveRate,
      invertedRate,
    };
  }, [
    sourceAmount,
    customRate,
    baseCurrencyCode,
    fromCountry.currencyCode,
    toCountry.currencyCode,
    feeType,
    feePercent,
    flatFeeAmount,
    flatFeeCurrency,
  ]);

  const handleCopyQuote = async () => {
    const enteredRateText = `1 ${baseCurrencyCode} = ${calculations.rate} ${quoteCurrencyCode}`;
    const text = `Currency Conversion Quote\n-------------------------\nFrom: ${fromCountry.currencySymbol} ${calculations.amount.toLocaleString()} (${fromCountry.currencyCode})\nEntered Rate: ${enteredRateText}\nEffective Unit Rate: 1 ${fromCountry.currencyCode} = ${calculations.effectiveUnitRate.toFixed(6)} ${toCountry.currencyCode}\nGross Converted: ${toCountry.currencySymbol} ${calculations.grossConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nExchange Fee: -${toCountry.currencySymbol} ${calculations.feeDeductedInTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${feeType === 'none' ? '0% Fee' : feeType === 'percent' ? `${feePercent || '0'}%` : 'Flat fee'})\nNet Receivable: ${toCountry.currencySymbol} ${calculations.netReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${toCountry.currencyCode})`;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQuote = () => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        window.print();
        return;
      }

      const dateStr = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ' ' + new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      const feeLabel = feeType === 'percent'
        ? `${feePercent || '0'}% Fee`
        : feeType === 'flat'
        ? `Flat Fee (${flatFeeCurrency === 'from' ? fromCountry.currencyCode : toCountry.currencyCode})`
        : '0% (No Fee)';

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Currency Conversion Quote - ${fromCountry.currencyCode} to ${toCountry.currencyCode}</title>
  <style>
    @page {
      size: portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100% !important;
      height: 100% !important;
      max-height: 100vh !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #111111 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 6mm 8mm;
    }
    .quote-box {
      width: 100%;
      max-width: 520px;
      border: 1.5px solid #222;
      border-radius: 8px;
      padding: 16px 20px;
      background: #ffffff;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      margin: 0 auto;
      font-size: 11px;
      line-height: 1.35;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .uppercase { text-transform: uppercase; }
    .header {
      text-align: center;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1.5px dashed #333;
    }
    .app-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .sub-title {
      font-size: 10px;
      color: #555;
      margin-top: 2px;
    }
    .doc-title {
      font-size: 12px;
      font-weight: 800;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    th, td {
      padding: 5px 8px;
      text-align: left;
    }
    th {
      background: #f4f4f5;
      border-bottom: 1.5px solid #333;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      border-bottom: 1px solid #e4e4e7;
    }
    .net-box {
      background: #f0fdf4;
      border: 1.5px solid #16a34a;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 10px 0;
    }
    .net-label {
      font-size: 11px;
      font-weight: 700;
      color: #15803d;
      text-transform: uppercase;
    }
    .net-amount {
      font-size: 22px;
      font-weight: 900;
      color: #15803d;
      font-family: ui-monospace, monospace;
    }
    .signatures {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px dashed #aaa;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .sig-line {
      border-top: 1px solid #333;
      margin-top: 26px;
      padding-top: 4px;
      text-align: center;
      font-size: 10px;
      color: #444;
      font-weight: 500;
    }
    .footer {
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px dashed #ccc;
      text-align: center;
      font-size: 9px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="quote-box">
    <div class="header">
      <div class="app-title">CURRENCY COUNTER</div>
      <div class="sub-title">100% Offline Multi-Currency Financial Tools</div>
      <div class="doc-title">FOREIGN EXCHANGE QUOTATION VOUCHER</div>
      <div style="font-size: 10px; color: #555; margin-top: 4px;">Date/Time: ${dateStr}</div>
    </div>

    <table>
      <tbody>
        <tr>
          <td style="color: #555; width: 45%;">Source Currency (From):</td>
          <td class="font-bold font-mono text-right">${fromCountry.countryName} ${fromCountry.flag} (${fromCountry.currencyCode})</td>
        </tr>
        <tr>
          <td style="color: #555;">Source Cash Amount:</td>
          <td class="font-bold font-mono text-right" style="font-size: 13px;">${fromCountry.currencySymbol} ${calculations.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fromCountry.currencyCode}</td>
        </tr>
        <tr>
          <td style="color: #555;">Target Currency (To):</td>
          <td class="font-bold font-mono text-right">${toCountry.countryName} ${toCountry.flag} (${toCountry.currencyCode})</td>
        </tr>
        <tr>
          <td style="color: #555;">Exchange Rate Applied:</td>
          <td class="font-bold font-mono text-right">1 ${baseCurrencyCode} = ${calculations.rate} ${quoteCurrencyCode}</td>
        </tr>
        ${!calculations.isBaseSource && calculations.effectiveUnitRate > 0 ? `
        <tr>
          <td style="color: #777; font-size: 10px;">Unit Multiplier:</td>
          <td class="font-mono text-right" style="font-size: 10px; color: #555;">1 ${fromCountry.currencyCode} = ${calculations.effectiveUnitRate >= 1 ? calculations.effectiveUnitRate.toFixed(4) : calculations.effectiveUnitRate.toFixed(6)} ${toCountry.currencyCode}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #555;">Gross Converted:</td>
          <td class="font-bold font-mono text-right">${toCountry.currencySymbol} ${calculations.grossConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="color: #555;">Exchange Fee / Commission:</td>
          <td class="font-bold font-mono text-right" style="color: #b45309;">- ${toCountry.currencySymbol} ${calculations.feeDeductedInTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${feeLabel})</td>
        </tr>
      </tbody>
    </table>

    <div class="net-box">
      <div class="flex items-center justify-between">
        <div>
          <div class="net-label">Net Receivable Payout Cash</div>
          <div style="font-size: 10px; color: #166534;">Final cash in hand after all conversion fees</div>
        </div>
        <div class="net-amount">
          ${toCountry.currencySymbol} ${calculations.netReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style="font-size: 13px; font-weight: 700;">${toCountry.currencyCode}</span>
        </div>
      </div>
    </div>

    <div style="font-size: 10px; color: #555; margin-top: 4px;">
      Effective Post-Fee Rate: <strong class="font-mono">1 ${fromCountry.currencyCode} = ${calculations.postFeeEffectiveRate >= 1 ? calculations.postFeeEffectiveRate.toFixed(4) : calculations.postFeeEffectiveRate.toFixed(6)} ${toCountry.currencyCode}</strong>
    </div>

    <div class="signatures">
      <div class="sig-line">
        Customer / Client Signature
      </div>
      <div class="sig-line">
        Authorized Teller / Cashier
      </div>
    </div>

    <div class="footer">
      Generated with Currency Counter • 100% Offline • Quotation Slip
    </div>
  </div>
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {
            // cleanup
          }
        }, 1500);
      }, 300);
    } catch {
      window.print();
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-3 sm:px-4 py-4 pb-28 text-stone-900 dark:text-stone-100 animate-in fade-in duration-200">
      {/* Sub-Tabs: When a Financial Calculator (FD / SIP / RD / Loan EMI) is enabled from Settings */}
      {activeCalculator !== 'none' && (
        <div className="flex items-center gap-2 mb-4 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('converter')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSubTab === 'converter'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs border border-stone-200/60 dark:border-stone-700/60'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
            <span>Currency Converter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('calculator')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSubTab === 'calculator'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/60 dark:border-stone-700/60'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            {activeCalculator === 'fd' && <PiggyBank className="w-4 h-4 text-emerald-600" />}
            {activeCalculator === 'sip' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
            {activeCalculator === 'rd' && <CalendarClock className="w-4 h-4 text-emerald-600" />}
            {activeCalculator === 'loan_emi' && <Calculator className="w-4 h-4 text-emerald-600" />}
            <span>
              {activeCalculator === 'fd' && 'Fixed Deposit (FD)'}
              {activeCalculator === 'sip' && 'SIP Calculator'}
              {activeCalculator === 'rd' && 'Recurring Deposit (RD)'}
              {activeCalculator === 'loan_emi' && 'Loan EMI Calculator'}
            </span>
          </button>
        </div>
      )}

      {/* RENDER ACTIVE FINANCIAL CALCULATOR */}
      {activeCalculator !== 'none' && activeSubTab === 'calculator' ? (
        <FinancialCalculators
          activeCalculator={activeCalculator}
          currentCountry={currentCountry}
          counterTotalAmount={counterTotalAmount}
        />
      ) : (
        /* RENDER STANDARD CURRENCY CONVERTER */
        <div className="space-y-4">
          {/* Top Banner & Header inside Converter (matching FD/RD/SIP layout) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                    Currency Converter
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Custom user exchange rate with deductible exchange fee & transaction cost options
                </p>
              </div>
            </div>

            {/* Top-Right App Icon */}
            <div className="pl-2 border-l border-stone-200 dark:border-stone-800 ml-1 shrink-0" title="Currency Counter">
              <img
                src="/app-icon.png"
                alt="Currency Counter"
                className="w-8 h-8 rounded-lg object-cover border border-amber-400/60 shadow-xs ring-1 ring-black/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Input Settings */}
            <div className="space-y-4">
              {/* Currencies Selection */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Select Currencies (Alphabetical)
                  </label>
                  <button
                    onClick={handleSwap}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1"
                    title="Swap From and To currencies"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Swap</span>
                  </button>
                </div>

            <div className="space-y-2">
              {/* From Currency */}
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">
                  From (Source Currency):
                </span>
                <select
                  id="select-convert-from"
                  value={fromCountryId}
                  onChange={(e) => setFromCountryId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {sortedCountries.map((c) => (
                    <option key={`from-${c.id}`} value={c.id}>
                      {c.countryName} ({c.currencyCode} - {c.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Currency */}
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">
                  To (Target Currency):
                </span>
                <select
                  id="select-convert-to"
                  value={toCountryId}
                  onChange={(e) => setToCountryId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {sortedCountries.map((c) => (
                    <option key={`to-${c.id}`} value={c.id}>
                      {c.countryName} ({c.currencyCode} - {c.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount to Convert */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Source Cash Amount
              </label>

              {/* Shortcut: Use Counter Total */}
              {counterTotalAmount > 0 && (
                <button
                  id="btn-use-counter-total"
                  onClick={() => setSourceAmount(String(counterTotalAmount))}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  title="Copy counted cash from Counter"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Use Counter Total ({fromCountry.currencySymbol}{counterTotalAmount.toLocaleString()})</span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-base">
                {fromCountry.currencySymbol}
              </div>
              <input
                id="input-convert-amount"
                type="number"
                min="0"
                step="any"
                value={sourceAmount}
                onChange={(e) => setSourceAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full pl-9 pr-14 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold text-lg text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                {fromCountry.currencyCode}
              </span>
            </div>

            {/* Quick Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {[100, 500, 1000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSourceAmount(String(amt))}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium transition active:scale-95"
                >
                  {fromCountry.currencySymbol}{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* User Conversion Rate Input with Dual Dropdowns */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                  User Conversion Rate
                </label>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Select whichever currency rate you easily remember
                </span>
              </div>
              <button
                onClick={handleApplyPresetBaseline}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition cursor-pointer"
                title="Fill approximate market reference rate"
              >
                Suggested benchmark
              </button>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2.5">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                {/* Prefix "1" */}
                <span className="text-sm font-black text-stone-800 dark:text-stone-200 shrink-0">1</span>

                {/* Dropdown 1: Base Currency */}
                <div className="min-w-[130px] flex-1 sm:flex-initial">
                  <select
                    id="select-rate-base-currency"
                    value={baseCurrencyCode}
                    onChange={(e) => handleSelectBaseCurrency(e.target.value)}
                    className="w-full py-1.5 px-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
                    title="Select base currency for rate"
                  >
                    <option value={fromCountry.currencyCode}>
                      {fromCountry.flag} {fromCountry.currencyCode} ({fromCountry.countryName})
                    </option>
                    <option value={toCountry.currencyCode}>
                      {toCountry.flag} {toCountry.currencyCode} ({toCountry.countryName})
                    </option>
                  </select>
                </div>

                <span className="text-sm font-black text-stone-600 dark:text-stone-400 shrink-0">=</span>

                {/* Rate Input Field */}
                <div className="flex-1 min-w-[110px]">
                  <input
                    id="input-convert-rate"
                    type="number"
                    min="0"
                    step="any"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder={baseCurrencyCode === toCountry.currencyCode ? 'e.g. 95.82' : 'e.g. 1.0'}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-bold text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs"
                  />
                </div>

                {/* Dropdown 2: Target / Quote Currency */}
                <div className="min-w-[130px] flex-1 sm:flex-initial">
                  <select
                    id="select-rate-quote-currency"
                    value={quoteCurrencyCode}
                    onChange={(e) => handleSelectQuoteCurrency(e.target.value)}
                    className="w-full py-1.5 px-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
                    title="Select quote currency for rate"
                  >
                    <option value={toCountry.currencyCode}>
                      {toCountry.flag} {toCountry.currencyCode} ({toCountry.countryName})
                    </option>
                    <option value={fromCountry.currencyCode}>
                      {fromCountry.flag} {fromCountry.currencyCode} ({fromCountry.countryName})
                    </option>
                  </select>
                </div>

                {/* Quick Flip / Invert Button */}
                <button
                  type="button"
                  id="btn-swap-rate-direction"
                  onClick={handleInvertRateAndNumber}
                  className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition cursor-pointer active:scale-95 shadow-xs shrink-0"
                  title="Invert rate currency direction & reciprocal"
                >
                  <ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </button>
              </div>

              {/* Informative Human-Friendly Formula Banner */}
              <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/50 flex items-center justify-between flex-wrap gap-1 text-[11px]">
                <div className="flex items-center gap-1 font-semibold text-purple-900 dark:text-purple-300">
                  <span>Formula:</span>
                  <span className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded-sm">
                    {calculations.isBaseSource
                      ? `${calculations.amount.toLocaleString()} ${fromCountry.currencyCode} × ${calculations.rate} = ${toCountry.currencySymbol}${calculations.grossConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCountry.currencyCode}`
                      : `${calculations.amount.toLocaleString()} ${fromCountry.currencyCode} ÷ ${calculations.rate} = ${toCountry.currencySymbol}${calculations.grossConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCountry.currencyCode}`}
                  </span>
                </div>

                {calculations.invertedRate > 0 && (
                  <span className="text-stone-500 dark:text-stone-400">
                    Reciprocal: 1 {quoteCurrencyCode} ={' '}
                    <strong className="font-mono text-stone-700 dark:text-stone-300">
                      {calculations.invertedRate >= 1
                        ? calculations.invertedRate.toFixed(4)
                        : calculations.invertedRate.toFixed(6)}
                    </strong>{' '}
                    {baseCurrencyCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Exchange Fee / Cost Options */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
              Exchange Fee / Cost Options
            </label>

            {/* Fee Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFeeType('none')}
                className={`py-1.5 rounded-lg transition ${
                  feeType === 'none'
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Zero Fee (0%)
              </button>
              <button
                type="button"
                onClick={() => setFeeType('percent')}
                className={`py-1.5 rounded-lg transition ${
                  feeType === 'percent'
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                % Percentage
              </button>
              <button
                type="button"
                onClick={() => setFeeType('flat')}
                className={`py-1.5 rounded-lg transition ${
                  feeType === 'flat'
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Flat Cost
              </button>
            </div>

            {/* Percentage Fee Input */}
            {feeType === 'percent' && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300 shrink-0">
                  Commission / Margin:
                </span>
                <div className="relative flex-1 min-w-[120px]">
                  <input
                    id="input-fee-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={feePercent}
                    onChange={(e) => setFeePercent(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-1.5 pr-8 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-bold text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-xs font-black pointer-events-none">
                    %
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {['1', '1.5', '2.5', '3'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFeePercent(p)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                        feePercent === p
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flat Fee Input */}
            {feeType === 'flat' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-300 shrink-0">
                    Fixed Fee Amount:
                  </span>
                  <input
                    id="input-flat-fee-amount"
                    type="number"
                    min="0"
                    step="any"
                    value={flatFeeAmount}
                    onChange={(e) => setFlatFeeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-bold text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <select
                    id="select-flat-fee-currency"
                    value={flatFeeCurrency}
                    onChange={(e) => setFlatFeeCurrency(e.target.value as 'from' | 'to')}
                    className="py-1.5 px-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                  >
                    <option value="to">{toCountry.currencyCode} (Target)</option>
                    <option value="from">{fromCountry.currencyCode} (Base)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-time Converted Result & Financial Quote Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 text-white shadow-lg border border-stone-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                  Net Receivable Converted Cash
                </span>
              </div>

              {/* Main Net Result Number */}
              <div className="mb-4">
                <div className="text-xs text-stone-400 mb-1">
                  After all fees and costs:
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight flex items-baseline gap-1.5">
                  <span>{toCountry.currencySymbol}</span>
                  <span>
                    {calculations.netReceived.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-sm font-normal text-stone-400">
                    {toCountry.currencyCode}
                  </span>
                </div>
              </div>

              {/* Financial Step-by-Step Breakdown */}
              <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span>Source Amount</span>
                  <span className="font-semibold text-white">
                    {fromCountry.currencySymbol} {calculations.amount.toLocaleString()} {fromCountry.currencyCode}
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-300">
                  <span>Selected Rate</span>
                  <span className="font-semibold text-white font-mono">
                    1 {baseCurrencyCode} = {calculations.rate} {quoteCurrencyCode}
                  </span>
                </div>

                {!calculations.isBaseSource && calculations.effectiveUnitRate > 0 && (
                  <div className="flex items-center justify-between text-stone-400 text-[11px]">
                    <span>Unit Rate Multiplier</span>
                    <span className="font-mono text-stone-300">
                      1 {fromCountry.currencyCode} = {calculations.effectiveUnitRate >= 1 ? calculations.effectiveUnitRate.toFixed(4) : calculations.effectiveUnitRate.toFixed(6)} {toCountry.currencyCode}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-stone-300">
                  <span>Gross Converted</span>
                  <span className="font-semibold text-white">
                    {toCountry.currencySymbol} {calculations.grossConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-amber-300">
                  <span>
                    Exchange Fee / Cost{' '}
                    {feeType === 'percent' ? `(${feePercent || '0'}%)` : feeType === 'flat' ? '(Flat)' : '(0% fee)'}
                  </span>
                  <span className="font-semibold">
                    - {toCountry.currencySymbol} {calculations.feeDeductedInTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-700 flex items-center justify-between font-bold text-white">
                  <span>Net Receivable Cash</span>
                  <span className="text-emerald-400 font-mono text-base font-black">
                    {toCountry.currencySymbol} {calculations.netReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-1 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>Effective Post-Fee Rate:</span>
                  <span className="text-stone-300 font-medium font-mono">
                    1 {fromCountry.currencyCode} = {calculations.postFeeEffectiveRate >= 1 ? calculations.postFeeEffectiveRate.toFixed(4) : calculations.postFeeEffectiveRate.toFixed(6)} {toCountry.currencyCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-4 border-t border-stone-800 flex items-center gap-2">
              <button
                id="btn-print-conversion-quote"
                onClick={handlePrintQuote}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700 hover:border-stone-600"
                title="Print foreign exchange quote voucher"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Quote</span>
              </button>

              <button
                id="btn-copy-conversion-quote"
                onClick={handleCopyQuote}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Quote Copied!' : 'Copy Financial Quote'}</span>
              </button>

              {onNavigateToCounter && (
                <button
                  onClick={onNavigateToCounter}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-stone-700 hover:border-stone-600"
                  title="Return to denomination counter"
                >
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">To Counter</span>
                </button>
              )}
            </div>
          </div>

          {/* Light Bright Violet Custom Exchange Engine Card at Bottom */}
          <div className="p-4 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-300/80 dark:border-purple-700/60 shadow-md shadow-purple-900/10 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-200 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-purple-900 dark:text-purple-100">Custom Offline Exchange Engine</p>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                  Live Offline
                </span>
              </div>
              <p className="text-[11px] text-purple-800/90 dark:text-purple-300/80 leading-relaxed">
                Rates and fees are completely manual and operate 100% offline. Whether you are exchanging cash at an airport kiosk, bank, money changer, or retail register, enter your negotiated rate and fee to verify the exact payout down to the cent.
              </p>
            </div>
          </div>

          {/* Quick link to enable financial calculators if none active */}
          {activeCalculator === 'none' && onNavigateToSettings && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Need <strong>Fixed Deposit (FD)</strong>, <strong>SIP</strong>, <strong>Recurring Deposit (RD)</strong>, or <strong>Loan EMI</strong> calculators?</span>
              </div>
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition self-start sm:self-auto cursor-pointer"
              >
                Enable in Settings
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
  );
};
