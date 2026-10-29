import React, { useState, useMemo } from 'react';
import { ActiveCalculatorType, CountryCurrency } from '../types';
import { 
  PiggyBank, 
  TrendingUp, 
  CalendarClock, 
  Calculator, 
  RotateCcw, 
  Printer, 
  Coins, 
  Sparkles,
  Percent,
  Calendar,
  Check,
  Copy,
  ArrowRight,
  Heart
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { GiftFooter } from './GiftFooter';
import { escapeHtml } from '../utils/security';

interface FinancialCalculatorsProps {
  activeCalculator: ActiveCalculatorType;
  currentCountry: CountryCurrency;
  counterTotalAmount: number;
}

export type InterestType = 'simple' | 'compound';
export type CompoundingFrequency = 12 | 4 | 2 | 1; // 12=Monthly, 4=Quarterly, 2=Half-Yearly, 1=Yearly

export const FinancialCalculators: React.FC<FinancialCalculatorsProps> = ({
  activeCalculator,
  currentCountry,
  counterTotalAmount,
}) => {
  const currencySymbol = currentCountry.currencySymbol;
  const currencyCode = currentCountry.currencyCode;

  // Copy state feedback
  const [copied, setCopied] = useState(false);

  // 1. Fixed Deposit (FD) State
  const [fdPrincipal, setFdPrincipal] = useState<string>(() => 
    counterTotalAmount > 0 ? String(counterTotalAmount) : '100000'
  );
  const [fdRate, setFdRate] = useState<string>('7.1'); // 7.1%
  const [fdYears, setFdYears] = useState<number>(3);
  const [fdMonths, setFdMonths] = useState<number>(0);
  const [fdInterestType, setFdInterestType] = useState<InterestType>('compound');
  const [fdFrequency, setFdFrequency] = useState<CompoundingFrequency>(4); // Quarterly by default

  // 2. SIP State
  const [sipMonthly, setSipMonthly] = useState<string>(() => 
    counterTotalAmount > 0 && counterTotalAmount <= 50000 ? String(counterTotalAmount) : '5000'
  );
  const [sipRate, setSipRate] = useState<string>('12.0'); // 12% expected return
  const [sipYears, setSipYears] = useState<number>(5);
  const [sipCompounding, setSipCompounding] = useState<CompoundingFrequency>(12); // Monthly compounding

  // 3. Recurring Deposit (RD) State
  const [rdMonthly, setRdMonthly] = useState<string>(() => 
    counterTotalAmount > 0 && counterTotalAmount <= 50000 ? String(counterTotalAmount) : '5000'
  );
  const [rdRate, setRdRate] = useState<string>('6.8'); // 6.8%
  const [rdMonths, setRdMonths] = useState<number>(24); // 24 months
  const [rdInterestType, setRdInterestType] = useState<InterestType>('compound');
  const [rdFrequency, setRdFrequency] = useState<CompoundingFrequency>(4); // Quarterly compounding standard

  // 4. Loan EMI State
  const [loanPrincipal, setLoanPrincipal] = useState<string>(() => 
    counterTotalAmount > 0 ? String(counterTotalAmount) : '500000'
  );
  const [loanRate, setLoanRate] = useState<string>('8.5'); // 8.5%
  const [loanYears, setLoanYears] = useState<number>(10);
  const [loanInterestType, setLoanInterestType] = useState<'reducing' | 'flat'>('reducing'); // Reducing balance vs flat simple rate

  // Frequency labels helper
  const frequencyLabel = (freq: CompoundingFrequency) => {
    switch (freq) {
      case 12: return 'Monthly (12/yr)';
      case 4: return 'Quarterly (4/yr)';
      case 2: return 'Half-Yearly (2/yr)';
      case 1: return 'Yearly (1/yr)';
    }
  };

  // --- Calculations ---

  // 1. FD Calculation
  const fdResult = useMemo(() => {
    const P = parseFloat(fdPrincipal.replace(/,/g, '')) || 0;
    const r = (parseFloat(fdRate) || 0) / 100;
    const t = fdYears + fdMonths / 12;

    if (P <= 0 || t <= 0) {
      return { principal: P, interest: 0, maturity: P, totalTenureMonths: Math.round(t * 12) };
    }

    if (fdInterestType === 'simple') {
      const interest = P * r * t;
      const maturity = P + interest;
      return { principal: P, interest, maturity, totalTenureMonths: Math.round(t * 12) };
    } else {
      const n = fdFrequency;
      const maturity = P * Math.pow(1 + r / n, n * t);
      const interest = Math.max(0, maturity - P);
      return { principal: P, interest, maturity, totalTenureMonths: Math.round(t * 12) };
    }
  }, [fdPrincipal, fdRate, fdYears, fdMonths, fdInterestType, fdFrequency]);

  // 2. SIP Calculation
  const sipResult = useMemo(() => {
    const P = parseFloat(sipMonthly.replace(/,/g, '')) || 0;
    const annualR = (parseFloat(sipRate) || 0) / 100;
    const totalMonths = sipYears * 12;

    if (P <= 0 || totalMonths <= 0) {
      return { invested: 0, returns: 0, maturity: 0, totalMonths };
    }

    const invested = P * totalMonths;
    let maturity = 0;

    if (annualR <= 0) {
      maturity = invested;
    } else {
      // Periodic rate based on chosen compounding frequency
      const periodsPerYear = sipCompounding; // 12, 4, 2, 1
      const ratePerPeriod = annualR / periodsPerYear;
      const monthlyRate = Math.pow(1 + ratePerPeriod, periodsPerYear / 12) - 1;

      // Future value of ordinary annuity with monthly investments at beginning of each month
      maturity = P * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    }

    const returns = Math.max(0, maturity - invested);
    return { invested, returns, maturity, totalMonths };
  }, [sipMonthly, sipRate, sipYears, sipCompounding]);

  // 3. RD Calculation
  const rdResult = useMemo(() => {
    const P = parseFloat(rdMonthly.replace(/,/g, '')) || 0;
    const r = (parseFloat(rdRate) || 0) / 100;
    const N = rdMonths;

    if (P <= 0 || N <= 0) {
      return { invested: 0, interest: 0, maturity: 0, totalMonths: N };
    }

    const invested = P * N;

    if (rdInterestType === 'simple') {
      // Sum of simple interest for each monthly installment: P * r * (N - k + 1) / 12
      // = P * (r / 12) * [N * (N + 1) / 2]
      const interest = P * (r / 12) * ((N * (N + 1)) / 2);
      const maturity = invested + interest;
      return { invested, interest, maturity, totalMonths: N };
    } else {
      // Compounded at chosen frequency: Monthly (12), Quarterly (4), Half-Yearly (2), or Yearly (1)
      const n = rdFrequency;
      let maturity = 0;
      for (let k = 1; k <= N; k++) {
        const remainingYears = (N - k + 1) / 12;
        maturity += P * Math.pow(1 + r / n, n * remainingYears);
      }
      const interest = Math.max(0, maturity - invested);
      return { invested, interest, maturity, totalMonths: N };
    }
  }, [rdMonthly, rdRate, rdMonths, rdInterestType, rdFrequency]);

  // 4. Loan EMI Calculation
  const loanResult = useMemo(() => {
    const P = parseFloat(loanPrincipal.replace(/,/g, '')) || 0;
    const annualR = (parseFloat(loanRate) || 0) / 100;
    const totalMonths = loanYears * 12;

    if (P <= 0 || totalMonths <= 0) {
      return { emi: 0, principal: P, totalInterest: 0, totalPayment: P, totalMonths };
    }

    if (loanInterestType === 'reducing') {
      // Standard Reducing Balance Loan EMI (Monthly Compounding)
      const r = annualR / 12;
      let emi = 0;
      if (r === 0) {
        emi = P / totalMonths;
      } else {
        emi = (P * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);
      }
      const totalPayment = emi * totalMonths;
      const totalInterest = Math.max(0, totalPayment - P);
      return { emi, principal: P, totalInterest, totalPayment, totalMonths };
    } else {
      // Flat Simple Interest Rate
      const totalInterest = P * annualR * loanYears;
      const totalPayment = P + totalInterest;
      const emi = totalPayment / totalMonths;
      return { emi, principal: P, totalInterest, totalPayment, totalMonths };
    }
  }, [loanPrincipal, loanRate, loanYears, loanInterestType]);

  // Copy details of current calculation to clipboard
  const handleCopyDetails = async () => {
    let summaryText = '';
    const dateStr = new Date().toLocaleString();

    if (activeCalculator === 'fd') {
      summaryText = `Fixed Deposit (FD) Calculation Slip\n` +
        `----------------------------------------\n` +
        `Date: ${dateStr}\n` +
        `Principal Amount: ${currencySymbol} ${Math.round(fdResult.principal).toLocaleString()} ${currencyCode}\n` +
        `Interest Type: ${fdInterestType === 'simple' ? 'Simple Interest' : `Compounding Interest (${frequencyLabel(fdFrequency)})`}\n` +
        `Interest Rate: ${fdRate}% p.a.\n` +
        `Tenure: ${fdYears} Years${fdMonths > 0 ? `, ${fdMonths} Months` : ''} (${fdResult.totalTenureMonths} Months total)\n` +
        `----------------------------------------\n` +
        `Total Interest Earned: ${currencySymbol} ${Math.round(fdResult.interest).toLocaleString()} ${currencyCode}\n` +
        `Maturity Payout Amount: ${currencySymbol} ${Math.round(fdResult.maturity).toLocaleString()} ${currencyCode}\n` +
        `----------------------------------------\n` +
        `Calculated via Currency Counter • 100% Offline`;
    } else if (activeCalculator === 'sip') {
      summaryText = `SIP Investment Plan Calculation Slip\n` +
        `----------------------------------------\n` +
        `Date: ${dateStr}\n` +
        `Monthly Investment: ${currencySymbol} ${parseFloat(sipMonthly || '0').toLocaleString()} ${currencyCode}\n` +
        `Expected Annual Return: ${sipRate}% p.a.\n` +
        `Compounding Frequency: ${frequencyLabel(sipCompounding)}\n` +
        `Investment Period: ${sipYears} Years (${sipResult.totalMonths} Installments)\n` +
        `----------------------------------------\n` +
        `Total Amount Invested: ${currencySymbol} ${Math.round(sipResult.invested).toLocaleString()} ${currencyCode}\n` +
        `Estimated Wealth Gain: ${currencySymbol} ${Math.round(sipResult.returns).toLocaleString()} ${currencyCode}\n` +
        `Expected Maturity Value: ${currencySymbol} ${Math.round(sipResult.maturity).toLocaleString()} ${currencyCode}\n` +
        `----------------------------------------\n` +
        `Calculated via Currency Counter • 100% Offline`;
    } else if (activeCalculator === 'rd') {
      summaryText = `Recurring Deposit (RD) Calculation Slip\n` +
        `----------------------------------------\n` +
        `Date: ${dateStr}\n` +
        `Monthly Deposit: ${currencySymbol} ${parseFloat(rdMonthly || '0').toLocaleString()} ${currencyCode}\n` +
        `Interest Type: ${rdInterestType === 'simple' ? 'Simple Interest' : `Compounding Interest (${frequencyLabel(rdFrequency)})`}\n` +
        `Interest Rate: ${rdRate}% p.a.\n` +
        `Tenure: ${rdMonths} Months (${(rdMonths / 12).toFixed(1)} Years)\n` +
        `----------------------------------------\n` +
        `Total Amount Invested: ${currencySymbol} ${Math.round(rdResult.invested).toLocaleString()} ${currencyCode}\n` +
        `Total Interest Earned: ${currencySymbol} ${Math.round(rdResult.interest).toLocaleString()} ${currencyCode}\n` +
        `Maturity Payout Amount: ${currencySymbol} ${Math.round(rdResult.maturity).toLocaleString()} ${currencyCode}\n` +
        `----------------------------------------\n` +
        `Calculated via Currency Counter • 100% Offline`;
    } else if (activeCalculator === 'loan_emi') {
      summaryText = `Loan EMI & Repayment Calculation Slip\n` +
        `----------------------------------------\n` +
        `Date: ${dateStr}\n` +
        `Loan Principal Amount: ${currencySymbol} ${Math.round(loanResult.principal).toLocaleString()} ${currencyCode}\n` +
        `Interest Type: ${loanInterestType === 'reducing' ? 'Reducing Balance (Monthly Compounding)' : 'Flat Simple Interest Rate'}\n` +
        `Interest Rate: ${loanRate}% p.a.\n` +
        `Loan Tenure: ${loanYears} Years (${loanResult.totalMonths} Monthly EMIs)\n` +
        `----------------------------------------\n` +
        `Monthly EMI: ${currencySymbol} ${Math.round(loanResult.emi).toLocaleString()} / month\n` +
        `Total Interest Payable: ${currencySymbol} ${Math.round(loanResult.totalInterest).toLocaleString()} ${currencyCode}\n` +
        `Total Repayment (Principal + Interest): ${currencySymbol} ${Math.round(loanResult.totalPayment).toLocaleString()} ${currencyCode}\n` +
        `----------------------------------------\n` +
        `Calculated via Currency Counter • 100% Offline`;
    }

    await copyToClipboard(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Strict Single-Page Printing via isolated iframe
  const handlePrint = () => {
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

      const safeSymbol = escapeHtml(currencySymbol);
      const safeCode = escapeHtml(currencyCode);

      let title = '';
      let rowsHtml = '';
      let highlightLabel = '';
      let highlightValue = '';
      let highlightSub = '';

      if (activeCalculator === 'fd') {
        title = 'FIXED DEPOSIT (FD) CALCULATION VOUCHER';
        highlightLabel = 'Maturity Payout Value';
        highlightValue = `${safeSymbol} ${Math.round(fdResult.maturity).toLocaleString()}`;
        highlightSub = `Principal + Total Interest after ${escapeHtml(fdYears)}Y ${fdMonths > 0 ? `${escapeHtml(fdMonths)}M` : ''}`;
        rowsHtml = `
          <tr><td>Principal Amount</td><td class="font-bold text-right font-mono">${safeSymbol} ${Math.round(fdResult.principal).toLocaleString()} ${safeCode}</td></tr>
          <tr><td>Interest Type</td><td class="font-bold text-right">${fdInterestType === 'simple' ? 'Simple Interest' : `Compounding (${escapeHtml(frequencyLabel(fdFrequency))})`}</td></tr>
          <tr><td>Annual Interest Rate</td><td class="font-bold text-right font-mono">${escapeHtml(fdRate)}% p.a.</td></tr>
          <tr><td>Deposit Tenure</td><td class="font-bold text-right font-mono">${escapeHtml(fdYears)} Years ${fdMonths > 0 ? `${escapeHtml(fdMonths)} Months` : ''} (${fdResult.totalTenureMonths} mo)</td></tr>
          <tr><td>Total Interest Earned</td><td class="font-bold text-right font-mono text-emerald" style="color: #15803d;">+ ${safeSymbol} ${Math.round(fdResult.interest).toLocaleString()}</td></tr>
        `;
      } else if (activeCalculator === 'sip') {
        title = 'SIP INVESTMENT WEALTH VOUCHER';
        highlightLabel = 'Expected Maturity Wealth';
        highlightValue = `${safeSymbol} ${Math.round(sipResult.maturity).toLocaleString()}`;
        highlightSub = `Invested amount + Compounded wealth gains`;
        rowsHtml = `
          <tr><td>Monthly SIP Amount</td><td class="font-bold text-right font-mono">${safeSymbol} ${parseFloat(sipMonthly || '0').toLocaleString()} / month</td></tr>
          <tr><td>Expected Return Rate</td><td class="font-bold text-right font-mono">${escapeHtml(sipRate)}% p.a.</td></tr>
          <tr><td>Compounding Frequency</td><td class="font-bold text-right">${escapeHtml(frequencyLabel(sipCompounding))}</td></tr>
          <tr><td>Investment Period</td><td class="font-bold text-right font-mono">${escapeHtml(sipYears)} Years (${sipResult.totalMonths} Installments)</td></tr>
          <tr><td>Total Amount Invested</td><td class="font-bold text-right font-mono">${safeSymbol} ${Math.round(sipResult.invested).toLocaleString()}</td></tr>
          <tr><td>Estimated Wealth Gain</td><td class="font-bold text-right font-mono" style="color: #15803d;">+ ${safeSymbol} ${Math.round(sipResult.returns).toLocaleString()}</td></tr>
        `;
      } else if (activeCalculator === 'rd') {
        title = 'RECURRING DEPOSIT (RD) CALCULATION VOUCHER';
        highlightLabel = 'Maturity Payout Value';
        highlightValue = `${safeSymbol} ${Math.round(rdResult.maturity).toLocaleString()}`;
        highlightSub = `Total Deposited + Interest`;
        rowsHtml = `
          <tr><td>Monthly Installment</td><td class="font-bold text-right font-mono">${safeSymbol} ${parseFloat(rdMonthly || '0').toLocaleString()} / month</td></tr>
          <tr><td>Interest Type</td><td class="font-bold text-right">${rdInterestType === 'simple' ? 'Simple Interest' : `Compounding (${escapeHtml(frequencyLabel(rdFrequency))})`}</td></tr>
          <tr><td>Annual Interest Rate</td><td class="font-bold text-right font-mono">${escapeHtml(rdRate)}% p.a.</td></tr>
          <tr><td>Total Tenure</td><td class="font-bold text-right font-mono">${escapeHtml(rdMonths)} Months (${(rdMonths / 12).toFixed(1)} Years)</td></tr>
          <tr><td>Total Amount Deposited</td><td class="font-bold text-right font-mono">${safeSymbol} ${Math.round(rdResult.invested).toLocaleString()}</td></tr>
          <tr><td>Total Interest Earned</td><td class="font-bold text-right font-mono" style="color: #15803d;">+ ${safeSymbol} ${Math.round(rdResult.interest).toLocaleString()}</td></tr>
        `;
      } else if (activeCalculator === 'loan_emi') {
        title = 'LOAN EMI & REPAYMENT VOUCHER';
        highlightLabel = 'Monthly Loan EMI';
        highlightValue = `${safeSymbol} ${Math.round(loanResult.emi).toLocaleString()} / mo`;
        highlightSub = `Fixed monthly installment for ${escapeHtml(loanYears)} years (${loanResult.totalMonths} payments)`;
        rowsHtml = `
          <tr><td>Loan Principal Amount</td><td class="font-bold text-right font-mono">${safeSymbol} ${Math.round(loanResult.principal).toLocaleString()} ${safeCode}</td></tr>
          <tr><td>Interest Rate Model</td><td class="font-bold text-right">${loanInterestType === 'reducing' ? 'Reducing Balance (Monthly Compounding)' : 'Flat Simple Interest Rate'}</td></tr>
          <tr><td>Annual Interest Rate</td><td class="font-bold text-right font-mono">${escapeHtml(loanRate)}% p.a.</td></tr>
          <tr><td>Loan Tenure</td><td class="font-bold text-right font-mono">${escapeHtml(loanYears)} Years (${loanResult.totalMonths} Months)</td></tr>
          <tr><td>Total Interest Payable</td><td class="font-bold text-right font-mono" style="color: #b45309;">${safeSymbol} ${Math.round(loanResult.totalInterest).toLocaleString()}</td></tr>
          <tr><td>Total Repayment Amount</td><td class="font-bold text-right font-mono">${safeSymbol} ${Math.round(loanResult.totalPayment).toLocaleString()}</td></tr>
        `;
      }

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
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
    .voucher-box {
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
    .highlight-box {
      background: #f0fdf4;
      border: 1.5px solid #16a34a;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 10px 0;
    }
    .highlight-label {
      font-size: 11px;
      font-weight: 700;
      color: #15803d;
      text-transform: uppercase;
    }
    .highlight-amount {
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
  <div class="voucher-box">
    <div class="header">
      <div class="app-title">CURRENCY COUNTER</div>
      <div class="sub-title">100% Offline Financial Calculations & Cash Tools</div>
      <div class="doc-title">${title}</div>
      <div style="font-size: 10px; color: #555; margin-top: 4px;">Date/Time: ${dateStr}</div>
    </div>

    <table>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="highlight-box">
      <div class="flex items-center justify-between">
        <div>
          <div class="highlight-label">${highlightLabel}</div>
          <div style="font-size: 10px; color: #166534;">${highlightSub}</div>
        </div>
        <div class="highlight-amount">
          ${highlightValue}
        </div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-line">
        Customer / Investor Signature
      </div>
      <div class="sig-line">
        Authorized Financial Officer
      </div>
    </div>

    <div class="footer">
      Generated with Currency Counter • 100% Offline • Gift from Yatinkumar Chauhan
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

  if (activeCalculator === 'none') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            {activeCalculator === 'fd' && <PiggyBank className="w-6 h-6" />}
            {activeCalculator === 'sip' && <TrendingUp className="w-6 h-6" />}
            {activeCalculator === 'rd' && <CalendarClock className="w-6 h-6" />}
            {activeCalculator === 'loan_emi' && <Calculator className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                {activeCalculator === 'fd' && 'Fixed Deposit (FD) Calculator'}
                {activeCalculator === 'sip' && 'SIP Wealth Investment Calculator'}
                {activeCalculator === 'rd' && 'Recurring Deposit (RD) Calculator'}
                {activeCalculator === 'loan_emi' && 'Loan EMI & Repayment Calculator'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {activeCalculator === 'fd' && 'Calculate returns with simple or compounding interest at monthly, quarterly, half-yearly, or yearly frequencies'}
              {activeCalculator === 'sip' && 'Estimate your wealth creation from systematic monthly investment plans'}
              {activeCalculator === 'rd' && 'Calculate returns on monthly recurring deposits with simple or quarterly/annual compounding'}
              {activeCalculator === 'loan_emi' && 'Calculate monthly EMI, reducing balance compounding vs flat simple interest'}
            </p>
          </div>
        </div>

        {/* Action Controls: Use Counter Total, Copy Icon, Print 1-Page Icon */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {counterTotalAmount > 0 && (
            <button
              onClick={() => {
                const amtStr = String(counterTotalAmount);
                if (activeCalculator === 'fd') setFdPrincipal(amtStr);
                else if (activeCalculator === 'sip') setSipMonthly(amtStr);
                else if (activeCalculator === 'rd') setRdMonthly(amtStr);
                else if (activeCalculator === 'loan_emi') setLoanPrincipal(amtStr);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Use Counter Total ({currencySymbol}{counterTotalAmount.toLocaleString()})</span>
            </button>
          )}

          {/* Copy Icon Button */}
          <button
            onClick={handleCopyDetails}
            title="Copy full calculation breakdown to clipboard"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Single Page Print Button */}
          <button
            onClick={handlePrint}
            title="Print 1-Page Financial Calculation Voucher"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Print Slip</span>
          </button>
        </div>
      </div>

      {/* CALCULATOR 1: FIXED DEPOSIT (FD) */}
      {activeCalculator === 'fd' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* Total Principal */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Deposit / Principal Amount ({currencySymbol})
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {currencySymbol}{parseFloat(fdPrincipal.replace(/,/g, '') || '0').toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="500"
                step="500"
                value={fdPrincipal}
                onChange={(e) => setFdPrincipal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="1000"
                max="5000000"
                step="5000"
                value={parseFloat(fdPrincipal.replace(/,/g, '')) || 0}
                onChange={(e) => setFdPrincipal(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Interest Type: Simple vs Compounding */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Interest Rate Method
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setFdInterestType('compound')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    fdInterestType === 'compound'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Compounding Interest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFdInterestType('simple')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    fdInterestType === 'simple'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Simple Interest</span>
                </button>
              </div>
            </div>

            {/* Compounding Frequency Options (if Compounding selected) */}
            {fdInterestType === 'compound' && (
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Compounding Frequency
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Monthly', value: 12 as const },
                    { label: 'Quarterly', value: 4 as const },
                    { label: 'Half-Yearly', value: 2 as const },
                    { label: 'Yearly', value: 1 as const },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFdFrequency(item.value)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border cursor-pointer ${
                        fdFrequency === item.value
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Compounded {frequencyLabel(fdFrequency)}
                </p>
              </div>
            )}

            {/* Interest Rate Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Annual Interest Rate (% p.a.)
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {fdRate}%
                </span>
              </div>
              <input
                type="number"
                min="0.1"
                max="25"
                step="0.05"
                value={fdRate}
                onChange={(e) => setFdRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="2"
                max="15"
                step="0.1"
                value={parseFloat(fdRate) || 0}
                onChange={(e) => setFdRate(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Tenure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Tenure (Years): {fdYears} Y
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={fdYears}
                  onChange={(e) => setFdYears(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Tenure (Months): {fdMonths} M
                </label>
                <input
                  type="range"
                  min="0"
                  max="11"
                  value={fdMonths}
                  onChange={(e) => setFdMonths(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 rounded-3xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Fixed Deposit Maturity Payout
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                  {fdInterestType === 'simple' ? 'Simple' : `Compounded (${frequencyLabel(fdFrequency).split(' ')[0]})`}
                </span>
              </div>
              <div className="mt-2 text-3xl font-black font-mono text-emerald-950 dark:text-white">
                {currencySymbol}{Math.round(fdResult.maturity).toLocaleString()}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Total payout after {fdYears > 0 ? `${fdYears} yr ` : ''}{fdMonths > 0 ? `${fdMonths} mo` : ''}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Principal Invested</span>
                <span className="text-sm font-black font-mono text-stone-900 dark:text-white">
                  {currencySymbol}{Math.round(fdResult.principal).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Total Interest Earned</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  + {currencySymbol}{Math.round(fdResult.interest).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Effective Return</span>
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                  {fdResult.principal > 0 ? ((fdResult.interest / fdResult.principal) * 100).toFixed(2) : 0}% total gain
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div>
              <div className="h-3 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex">
                <div 
                  className="bg-stone-400 dark:bg-stone-500 h-full" 
                  style={{ width: `${fdResult.maturity > 0 ? (fdResult.principal / fdResult.maturity) * 100 : 50}%` }}
                  title="Principal"
                />
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${fdResult.maturity > 0 ? (fdResult.interest / fdResult.maturity) * 100 : 50}%` }}
                  title="Interest"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" /> Principal ({Math.round(fdResult.maturity > 0 ? (fdResult.principal / fdResult.maturity) * 100 : 0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Interest ({Math.round(fdResult.maturity > 0 ? (fdResult.interest / fdResult.maturity) * 100 : 0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 2: SIP (SYSTEMATIC INVESTMENT PLAN) */}
      {activeCalculator === 'sip' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* Monthly Investment */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Monthly Investment Amount ({currencySymbol})
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {currencySymbol}{parseFloat(sipMonthly.replace(/,/g, '') || '0').toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="100"
                step="500"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="500"
                max="200000"
                step="500"
                value={parseFloat(sipMonthly.replace(/,/g, '')) || 0}
                onChange={(e) => setSipMonthly(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Expected Return Rate */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Expected Return Rate (% p.a.)
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {sipRate}%
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="35"
                step="0.1"
                value={sipRate}
                onChange={(e) => setSipRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="4"
                max="25"
                step="0.25"
                value={parseFloat(sipRate) || 0}
                onChange={(e) => setSipRate(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Compounding Frequency Selection */}
            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
              <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Compounding Frequency
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Monthly', value: 12 as const },
                  { label: 'Quarterly', value: 4 as const },
                  { label: 'Half-Yearly', value: 2 as const },
                  { label: 'Yearly', value: 1 as const },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSipCompounding(item.value)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border cursor-pointer ${
                      sipCompounding === item.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Period */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Time Period: {sipYears} Years
                </label>
                <span className="text-xs font-mono text-stone-500">
                  ({sipYears * 12} Installments)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                value={sipYears}
                onChange={(e) => setSipYears(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 rounded-3xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Expected Maturity Wealth
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                  {frequencyLabel(sipCompounding).split(' ')[0]} Compound
                </span>
              </div>
              <div className="mt-2 text-3xl font-black font-mono text-emerald-950 dark:text-white">
                {currencySymbol}{Math.round(sipResult.maturity).toLocaleString()}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Projected total value after {sipYears} years
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Total Invested</span>
                <span className="text-sm font-black font-mono text-stone-900 dark:text-white">
                  {currencySymbol}{Math.round(sipResult.invested).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Estimated Wealth Gain</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  + {currencySymbol}{Math.round(sipResult.returns).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Gain Multiplier</span>
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                  {sipResult.invested > 0 ? (sipResult.maturity / sipResult.invested).toFixed(2) : 1}x initial capital
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div>
              <div className="h-3 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex">
                <div 
                  className="bg-stone-400 dark:bg-stone-500 h-full" 
                  style={{ width: `${sipResult.maturity > 0 ? (sipResult.invested / sipResult.maturity) * 100 : 50}%` }}
                  title="Invested"
                />
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${sipResult.maturity > 0 ? (sipResult.returns / sipResult.maturity) * 100 : 50}%` }}
                  title="Wealth Gain"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" /> Invested ({Math.round(sipResult.maturity > 0 ? (sipResult.invested / sipResult.maturity) * 100 : 0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Wealth Gain ({Math.round(sipResult.maturity > 0 ? (sipResult.returns / sipResult.maturity) * 100 : 0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 3: RECURRING DEPOSIT (RD) */}
      {activeCalculator === 'rd' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* Monthly Deposit */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Monthly RD Installment ({currencySymbol})
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {currencySymbol}{parseFloat(rdMonthly.replace(/,/g, '') || '0').toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="500"
                step="500"
                value={rdMonthly}
                onChange={(e) => setRdMonthly(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={parseFloat(rdMonthly.replace(/,/g, '')) || 0}
                onChange={(e) => setRdMonthly(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Interest Type: Simple vs Compounding */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Interest Rate Method
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setRdInterestType('compound')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    rdInterestType === 'compound'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Compounding Interest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRdInterestType('simple')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    rdInterestType === 'simple'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Simple Interest</span>
                </button>
              </div>
            </div>

            {/* Compounding Frequency Options (if Compounding selected) */}
            {rdInterestType === 'compound' && (
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Compounding Frequency
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Monthly', value: 12 as const },
                    { label: 'Quarterly', value: 4 as const },
                    { label: 'Half-Yearly', value: 2 as const },
                    { label: 'Yearly', value: 1 as const },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRdFrequency(item.value)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border cursor-pointer ${
                        rdFrequency === item.value
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Compounded {frequencyLabel(rdFrequency)} (Bank standard is quarterly)
                </p>
              </div>
            )}

            {/* Interest Rate */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Interest Rate (% p.a.)
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {rdRate}%
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                step="0.05"
                value={rdRate}
                onChange={(e) => setRdRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="3"
                max="12"
                step="0.1"
                value={parseFloat(rdRate) || 0}
                onChange={(e) => setRdRate(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Tenure in Months */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Deposit Tenure: {rdMonths} Months
                </label>
                <span className="text-xs font-mono text-stone-500">
                  ({(rdMonths / 12).toFixed(1)} Years)
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="120"
                step="3"
                value={rdMonths}
                onChange={(e) => setRdMonths(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 rounded-3xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Recurring Deposit Maturity
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                  {rdInterestType === 'simple' ? 'Simple' : `Compounded (${frequencyLabel(rdFrequency).split(' ')[0]})`}
                </span>
              </div>
              <div className="mt-2 text-3xl font-black font-mono text-emerald-950 dark:text-white">
                {currencySymbol}{Math.round(rdResult.maturity).toLocaleString()}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Total maturity after {rdMonths} monthly installments
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Total Deposited</span>
                <span className="text-sm font-black font-mono text-stone-900 dark:text-white">
                  {currencySymbol}{Math.round(rdResult.invested).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Total Interest Earned</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  + {currencySymbol}{Math.round(rdResult.interest).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Interest Percentage</span>
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                  {rdResult.invested > 0 ? ((rdResult.interest / rdResult.invested) * 100).toFixed(2) : 0}% gain on deposits
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div>
              <div className="h-3 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex">
                <div 
                  className="bg-stone-400 dark:bg-stone-500 h-full" 
                  style={{ width: `${rdResult.maturity > 0 ? (rdResult.invested / rdResult.maturity) * 100 : 50}%` }}
                  title="Deposited"
                />
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${rdResult.maturity > 0 ? (rdResult.interest / rdResult.maturity) * 100 : 50}%` }}
                  title="Interest"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" /> Deposited ({Math.round(rdResult.maturity > 0 ? (rdResult.invested / rdResult.maturity) * 100 : 0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Interest ({Math.round(rdResult.maturity > 0 ? (rdResult.interest / rdResult.maturity) * 100 : 0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR 4: LOAN EMI */}
      {activeCalculator === 'loan_emi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* Loan Principal */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Loan Principal Amount ({currencySymbol})
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {currencySymbol}{parseFloat(loanPrincipal.replace(/,/g, '') || '0').toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min="10000"
                step="10000"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="10000"
                max="10000000"
                step="10000"
                value={parseFloat(loanPrincipal.replace(/,/g, '')) || 0}
                onChange={(e) => setLoanPrincipal(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Interest Model: Reducing Balance vs Flat Simple Rate */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Loan Interest Rate Model
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setLoanInterestType('reducing')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    loanInterestType === 'reducing'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Reducing Balance EMI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoanInterestType('flat')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    loanInterestType === 'flat'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Flat Simple Rate</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {loanInterestType === 'reducing' 
                  ? 'Standard banking EMI formula with monthly reducing balance' 
                  : 'Flat interest calculated on initial principal for total tenure'}
              </p>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Interest Rate (% p.a.)
                </label>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {loanRate}%
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="30"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <input
                type="range"
                min="4"
                max="24"
                step="0.25"
                value={parseFloat(loanRate) || 0}
                onChange={(e) => setLoanRate(e.target.value)}
                className="w-full mt-2 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Tenure in Years */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Loan Tenure: {loanYears} Years
                </label>
                <span className="text-xs font-mono text-stone-500">
                  ({loanYears * 12} Monthly EMIs)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={loanYears}
                onChange={(e) => setLoanYears(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 rounded-3xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Monthly Loan EMI
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                  {loanInterestType === 'reducing' ? 'Reducing' : 'Flat'}
                </span>
              </div>
              <div className="mt-2 text-3xl font-black font-mono text-emerald-950 dark:text-white">
                {currencySymbol}{Math.round(loanResult.emi).toLocaleString()}
                <span className="text-xs font-bold text-stone-500 font-sans"> / month</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Fixed monthly installment for {loanYears} years ({loanYears * 12} months)
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Principal Amount</span>
                <span className="text-sm font-black font-mono text-stone-900 dark:text-white">
                  {currencySymbol}{Math.round(loanResult.principal).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Total Interest Payable</span>
                <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                  {currencySymbol}{Math.round(loanResult.totalInterest).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">Total Repayment Amount</span>
                <span className="text-sm font-black font-mono text-stone-900 dark:text-white">
                  {currencySymbol}{Math.round(loanResult.totalPayment).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div>
              <div className="h-3 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${loanResult.totalPayment > 0 ? (loanResult.principal / loanResult.totalPayment) * 100 : 50}%` }}
                  title="Principal"
                />
                <div 
                  className="bg-amber-500 h-full" 
                  style={{ width: `${loanResult.totalPayment > 0 ? (loanResult.totalInterest / loanResult.totalPayment) * 100 : 50}%` }}
                  title="Interest"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Principal ({Math.round(loanResult.totalPayment > 0 ? (loanResult.principal / loanResult.totalPayment) * 100 : 0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Interest ({Math.round(loanResult.totalPayment > 0 ? (loanResult.totalInterest / loanResult.totalPayment) * 100 : 0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift from Yatinkumar Chauhan Notice at bottom of other calculator */}
      <GiftFooter className="pt-2" />
    </div>
  );
};
