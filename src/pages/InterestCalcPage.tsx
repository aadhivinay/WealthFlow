import React, { useState, useMemo } from 'react';
import { useAppStore, fmt, CURRENCY_SYMBOLS } from '@/store/AppContext';
import Modal from '@/components/Modal';
import { Calculator, Home, TrendingUp, PiggyBank, FileText, Download, X, Wheat } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CurrencyCode } from '@/types';

type CalcTab = 'emi' | 'si' | 'ci' | 'fd-rd';

/* ---------- Numeric text input (no sliders) ---------- */
const NumInput: React.FC<{
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  suffix?: string;
  prefix?: string;
  placeholder?: string;
}> = ({ label, value, onChange, suffix, prefix, placeholder }) => (
  <div>
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <div className="relative mt-1">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onFocus={e => e.target.select()}
        onChange={e => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'} py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900`}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}
    </div>
  </div>
);

/* ---------- Interest Mode Toggle ---------- */
type InterestMode = 'standard' | 'village';

const InterestModeToggle: React.FC<{ mode: InterestMode; onChange: (m: InterestMode) => void }> = ({ mode, onChange }) => (
  <div className="flex gap-2">
    <button
      onClick={() => onChange('standard')}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        mode === 'standard' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      }`}
    >
      <Calculator size={14} /> % per annum
    </button>
    <button
      onClick={() => onChange('village')}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        mode === 'village' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      }`}
    >
      <Wheat size={14} /> ₹ per ₹100/mo
    </button>
  </div>
);

/* ---------- Years + Months input ---------- */
const TenureInput: React.FC<{
  years: number;
  months: number;
  onYears: (v: number) => void;
  onMonths: (v: number) => void;
}> = ({ years, months, onYears, onMonths }) => (
  <div>
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loan Tenure</label>
    <div className="grid grid-cols-2 gap-3 mt-1">
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={years}
          onFocus={e => e.target.select()}
          onChange={e => onYears(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Yr</span>
      </div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={months}
          onFocus={e => e.target.select()}
          onChange={e => onMonths(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Mo</span>
      </div>
    </div>
  </div>
);

/* ---------- Result Row ---------- */
const ResultRow: React.FC<{ label: string; value: string; highlight?: boolean; color?: string }> = ({ label, value, highlight, color }) => (
  <div className={`flex items-center justify-between py-2.5 ${highlight ? 'border-t border-slate-100 dark:border-slate-700 pt-3' : ''}`}>
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`text-sm font-bold ${color ?? 'text-slate-900 dark:text-slate-100'}`}>{value}</span>
  </div>
);

/* ---------- Document Export Modal ---------- */
const DocumentExportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  calcType: string;
  results: { principal: number; rate: number; years: number; months: number; totalInterest: number; finalAmount: number; emi?: number };
  currency: CurrencyCode;
}> = ({ open, onClose, calcType, results, currency }) => {
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState(false);

  const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const tenureStr = `${results.years} Year(s) ${results.months} Month(s)`;

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handleDownload = () => {
    const doc = `WEALTHFLOW - LOAN AGREEMENT SUMMARY
${'='.repeat(40)}

Issued To: ${recipient || '_______________'}
Date: ${timestamp}

Loan Type: ${calcType}
Purpose / Notes: ${notes || 'N/A'}

Principal Amount: ${fmt(results.principal, currency)}
Interest Rate: ${results.rate}% per annum
Duration: ${tenureStr}

Total Interest: ${fmt(results.totalInterest, currency)}
${results.emi ? `Monthly EMI: ${fmt(results.emi, currency)}\n` : ''}Final Payable Amount: ${fmt(results.finalAmount, currency)}

${'='.repeat(40)}

Signature: ____________________
         ${recipient || 'Recipient'}

Generated by WealthFlow Engine
`;

    const blob = new Blob([doc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WealthFlow_Agreement_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setGenerated(false);
    setRecipient('');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Generate Agreement">
      {!generated ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recipient Name</label>
            <input
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="Enter borrower/lender name"
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes / Purpose</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Purpose of loan, terms, etc."
              rows={3}
              className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Generate Summary
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-2">
                <FileText size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Loan Agreement Summary</h3>
              <p className="text-xs text-slate-400 mt-1">{timestamp}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Issued To</span><span className="font-semibold text-slate-900 dark:text-slate-100">{recipient || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Type</span><span className="font-semibold text-slate-900 dark:text-slate-100">{calcType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Principal</span><span className="font-semibold text-slate-900 dark:text-slate-100">{fmt(results.principal, currency)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Rate</span><span className="font-semibold text-slate-900 dark:text-slate-100">{results.rate}% p.a.</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Duration</span><span className="font-semibold text-slate-900 dark:text-slate-100">{tenureStr}</span></div>
              {results.emi && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Monthly EMI</span><span className="font-semibold text-emerald-600">{fmt(results.emi, currency)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2"><span className="text-slate-500 dark:text-slate-400">Total Interest</span><span className="font-semibold text-rose-500">{fmt(results.totalInterest, currency)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Final Payable</span><span className="font-bold text-slate-900 dark:text-slate-100">{fmt(results.finalAmount, currency)}</span></div>
              {notes && <div className="pt-2 border-t border-slate-200 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400 text-xs">Notes: </span><span className="text-slate-700 dark:text-slate-300 text-xs">{notes}</span></div>}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-1">Signature</p>
              <div className="border-b border-slate-300 dark:border-slate-600 w-32 mx-auto h-6" />
              <p className="text-xs text-slate-400 mt-1">{recipient || 'Recipient'}</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            <Download size={18} /> Download Document
          </button>
          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-slate-500 py-2"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
};

/* ---------- Main Page ---------- */
const InterestCalcPage: React.FC = () => {
  const prefs = useAppStore(s => s.prefs);
  const currency = prefs.currency;
  const [tab, setTab] = useState<CalcTab>('emi');
  const [docOpen, setDocOpen] = useState(false);
  const [docData, setDocData] = useState<{ principal: number; rate: number; years: number; months: number; totalInterest: number; finalAmount: number; emi?: number }>({ principal: 0, rate: 0, years: 0, months: 0, totalInterest: 0, finalAmount: 0 });

  const tabs: { id: CalcTab; label: string; icon: React.ReactNode }[] = [
    { id: 'emi', label: 'EMI', icon: <Home size={16} /> },
    { id: 'si', label: 'Simple', icon: <TrendingUp size={16} /> },
    { id: 'ci', label: 'Compound', icon: <Calculator size={16} /> },
    { id: 'fd-rd', label: 'FD/RD', icon: <PiggyBank size={16} /> },
  ];

  const openDocExport = (data: typeof docData) => {
    setDocData(data);
    setDocOpen(true);
  };

  return (
    <div className="space-y-5 page-enter">
      <div>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">Interest Calculator</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Standalone tool — results are not saved to your ledger</p>
      </div>

      <div className="flex gap-2 overflow-x-auto app-scroll pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'emi' && <EMICalculator currency={currency} onExport={openDocExport} />}
      {tab === 'si' && <SICalculator currency={currency} onExport={openDocExport} />}
      {tab === 'ci' && <CICalculator currency={currency} onExport={openDocExport} />}
      {tab === 'fd-rd' && <FDRDCalculator currency={currency} onExport={openDocExport} />}

      <DocumentExportModal
        open={docOpen}
        onClose={() => setDocOpen(false)}
        calcType={tab === 'emi' ? 'EMI Loan' : tab === 'si' ? 'Simple Interest' : tab === 'ci' ? 'Compound Interest' : 'FD/RD'}
        results={docData}
        currency={currency}
      />
    </div>
  );
};

/* ---------- EMI Calculator ---------- */
const EMICalculator: React.FC<{ currency: CurrencyCode; onExport: (d: { principal: number; rate: number; years: number; months: number; totalInterest: number; finalAmount: number; emi?: number }) => void }> = ({ currency, onExport }) => {
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(0);
  const [interestMode, setInterestMode] = useState<InterestMode>('standard');

  const { emi, totalInterest, totalPayment, annualRate, monthlyInterestAmount } = useMemo(() => {
    const n = years * 12 + months;
    if (n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0, annualRate: 0, monthlyInterestAmount: 0 };

    if (interestMode === 'village') {
      // ₹ per ₹100 per month mode (village/informal loan)
      // e.g. rate=2 means ₹2 interest per ₹100 per month
      const monthlyInt = Math.max(0, (Math.max(0, principal) / 100) * Math.max(0, rate));
      const totalInt = Math.max(0, monthlyInt * n);
      const totalPay = Math.max(0, principal) + totalInt;
      const annual = Math.max(0, rate) * 12;
      return { emi: Math.max(0, totalPay / n), totalInterest: totalInt, totalPayment: totalPay, annualRate: annual, monthlyInterestAmount: monthlyInt };
    }

    // Standard % per annum EMI
    const r = rate / 12 / 100;
    if (r === 0) return { emi: Math.max(0, principal / n), totalInterest: 0, totalPayment: Math.max(0, principal), annualRate: rate, monthlyInterestAmount: 0 };
    const e = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = e * n;
    return { emi: Math.max(0, e), totalInterest: Math.max(0, total - principal), totalPayment: Math.max(0, total), annualRate: rate, monthlyInterestAmount: 0 };
  }, [principal, rate, years, months, interestMode]);

  const principalPct = totalPayment > 0 ? Math.max(0, Math.min(100, Math.round((principal / totalPayment) * 100))) : 0;
  const interestPct = Math.max(0, 100 - principalPct);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <InterestModeToggle mode={interestMode} onChange={setInterestMode} />
        <NumInput label="Loan Amount" value={principal} onChange={setPrincipal} prefix={CURRENCY_SYMBOLS[currency]} placeholder="500000" />
        <NumInput label={interestMode === 'village' ? 'Interest (₹ per ₹100 per month)' : 'Interest Rate'} value={rate} onChange={setRate} suffix={interestMode === 'village' ? '₹/100' : '%'} placeholder={interestMode === 'village' ? '2' : '8.5'} />
        {interestMode === 'village' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
            <p>Equivalent annual rate: <span className="font-bold">{annualRate}%</span> p.a.</p>
            <p>Monthly interest: <span className="font-bold">{fmt(monthlyInterestAmount, currency)}</span></p>
          </div>
        )}
        <TenureInput years={years} months={months} onYears={setYears} onMonths={setMonths} />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 uppercase font-medium">Monthly EMI</span>
          <span className="text-2xl font-bold text-emerald-600">{fmt(emi, currency)}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500" style={{ width: `${principalPct}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${interestPct}%` }} />
        </div>
        <div className="flex items-center justify-center gap-4 text-xs mt-2">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Principal {principalPct}%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Interest {interestPct}%</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <ResultRow label="Monthly EMI" value={fmt(emi, currency)} color="text-emerald-600" />
        <ResultRow label="Total Interest" value={fmt(totalInterest, currency)} color="text-rose-500" />
        <ResultRow label="Total Payment" value={fmt(totalPayment, currency)} highlight color="text-slate-900 dark:text-slate-100" />
      </div>

      <button
        onClick={() => onExport({ principal, rate, years, months, totalInterest, finalAmount: totalPayment, emi })}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
      >
        <FileText size={18} /> Generate Agreement / Document
      </button>
    </motion.div>
  );
};

/* ---------- Simple Interest ---------- */
const SICalculator: React.FC<{ currency: CurrencyCode; onExport: (d: { principal: number; rate: number; years: number; months: number; totalInterest: number; finalAmount: number; emi?: number }) => void }> = ({ currency, onExport }) => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(3);
  const [months, setMonths] = useState(0);
  const [interestMode, setInterestMode] = useState<InterestMode>('standard');

  const { interest, total, annualRate, monthlyInterestAmount } = useMemo(() => {
    const n = years * 12 + months;
    if (interestMode === 'village') {
      const monthlyInt = Math.max(0, (Math.max(0, principal) / 100) * Math.max(0, rate));
      const totalInt = Math.max(0, monthlyInt * n);
      return { interest: totalInt, total: Math.max(0, principal) + totalInt, annualRate: Math.max(0, rate) * 12, monthlyInterestAmount: monthlyInt };
    }
    const t = years + months / 12;
    const i = Math.max(0, (Math.max(0, principal) * Math.max(0, rate) * t) / 100);
    return { interest: i, total: Math.max(0, principal) + i, annualRate: rate, monthlyInterestAmount: 0 };
  }, [principal, rate, years, months, interestMode]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <InterestModeToggle mode={interestMode} onChange={setInterestMode} />
        <NumInput label="Principal" value={principal} onChange={setPrincipal} prefix={CURRENCY_SYMBOLS[currency]} placeholder="100000" />
        <NumInput label={interestMode === 'village' ? 'Interest (₹ per ₹100 per month)' : 'Interest Rate'} value={rate} onChange={setRate} suffix={interestMode === 'village' ? '₹/100' : '%'} placeholder={interestMode === 'village' ? '2' : '7'} />
        {interestMode === 'village' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
            <p>Equivalent annual rate: <span className="font-bold">{annualRate}%</span> p.a.</p>
            <p>Monthly interest: <span className="font-bold">{fmt(monthlyInterestAmount, currency)}</span></p>
          </div>
        )}
        <TenureInput years={years} months={months} onYears={setYears} onMonths={setMonths} />
      </div>
      <div className="glass-card rounded-2xl p-5">
        <ResultRow label="Total Interest" value={fmt(interest, currency)} color="text-emerald-600" />
        <ResultRow label="Maturity Value" value={fmt(total, currency)} highlight color="text-slate-900 dark:text-slate-100" />
      </div>
      <button
        onClick={() => onExport({ principal, rate, years, months, totalInterest: interest, finalAmount: total })}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
      >
        <FileText size={18} /> Generate Agreement / Document
      </button>
    </motion.div>
  );
};

/* ---------- Compound Interest ---------- */
const CICalculator: React.FC<{ currency: CurrencyCode; onExport: (d: { principal: number; rate: number; years: number; months: number; totalInterest: number; finalAmount: number; emi?: number }) => void }> = ({ currency, onExport }) => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(0);
  const [freq, setFreq] = useState(4);

  const { interest, total } = useMemo(() => {
    const t = years + months / 12;
    const n = freq;
    const amount = Math.max(0, principal) * Math.pow(1 + Math.max(0, rate) / 100 / n, n * t);
    return { interest: Math.max(0, amount - principal), total: Math.max(0, amount) };
  }, [principal, rate, years, months, freq]);

  const freqOptions = [
    { value: 1, label: 'Annually' },
    { value: 2, label: 'Semi-Annual' },
    { value: 4, label: 'Quarterly' },
    { value: 12, label: 'Monthly' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <NumInput label="Principal" value={principal} onChange={setPrincipal} prefix={CURRENCY_SYMBOLS[currency]} placeholder="100000" />
        <NumInput label="Interest Rate" value={rate} onChange={setRate} suffix="%" placeholder="8" />
        <TenureInput years={years} months={months} onYears={setYears} onMonths={setMonths} />
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Compounding Frequency</label>
          <div className="flex gap-2 flex-wrap">
            {freqOptions.map(f => (
              <button
                key={f.value}
                onClick={() => setFreq(f.value)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  freq === f.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5">
        <ResultRow label="Total Interest Earned" value={fmt(interest, currency)} color="text-emerald-600" />
        <ResultRow label="Final Amount" value={fmt(total, currency)} highlight color="text-slate-900 dark:text-slate-100" />
      </div>
      <button
        onClick={() => onExport({ principal, rate, years, months, totalInterest: interest, finalAmount: total })}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
      >
        <FileText size={18} /> Generate Agreement / Document
      </button>
    </motion.div>
  );
};

/* ---------- FD / RD Calculator ---------- */
const FDRDCalculator: React.FC<{ currency: CurrencyCode; onExport: (d: { principal: number; rate: number; years: number; months: number; totalInterest: number; finalAmount: number; emi?: number }) => void }> = ({ currency, onExport }) => {
  const [mode, setMode] = useState<'FD' | 'RD'>('FD');
  const [principal, setPrincipal] = useState(100000);
  const [monthlyDep, setMonthlyDep] = useState(5000);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(3);
  const [months, setMonths] = useState(0);

  const { maturity, totalInvested, interest } = useMemo(() => {
    const t = years + months / 12;
    const r = rate / 100;
    const n = 4;
    if (mode === 'FD') {
      const m = Math.max(0, principal) * Math.pow(1 + r / n, n * t);
      return { maturity: Math.max(0, m), totalInvested: Math.max(0, principal), interest: Math.max(0, m - principal) };
    }
    // RD with quarterly compounding (standard Indian bank formula)
    // i = r/400 (quarterly rate), n = total months
    // M = P * ((1+i)^n - 1) / (1 - (1+i)^(-1/3))
    const totalMonths = years * 12 + months;
    const i = rate / 400;
    const P = Math.max(0, monthlyDep);
    if (i === 0 || totalMonths === 0) {
      return { maturity: P * totalMonths, totalInvested: P * totalMonths, interest: 0 };
    }
    const factor = Math.pow(1 + i, totalMonths);
    const m = P * (factor - 1) / (1 - Math.pow(1 + i, -1 / 3));
    const invested = P * totalMonths;
    return { maturity: Math.max(0, m), totalInvested: invested, interest: Math.max(0, m - invested) };
  }, [mode, principal, monthlyDep, rate, years, months]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('FD')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${mode === 'FD' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700'}`}>Fixed Deposit</button>
        <button onClick={() => setMode('RD')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${mode === 'RD' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700'}`}>Recurring Deposit</button>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        {mode === 'FD' ? (
          <NumInput label="Deposit Amount" value={principal} onChange={setPrincipal} prefix={CURRENCY_SYMBOLS[currency]} placeholder="100000" />
        ) : (
          <NumInput label="Monthly Deposit" value={monthlyDep} onChange={setMonthlyDep} prefix={CURRENCY_SYMBOLS[currency]} placeholder="5000" />
        )}
        <NumInput label="Interest Rate" value={rate} onChange={setRate} suffix="%" placeholder="6.5" />
        <TenureInput years={years} months={months} onYears={setYears} onMonths={setMonths} />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <ResultRow label="Total Invested" value={fmt(totalInvested, currency)} />
        <ResultRow label="Interest Earned" value={fmt(interest, currency)} color="text-emerald-600" />
        <ResultRow label="Maturity Value" value={fmt(maturity, currency)} highlight color="text-slate-900 dark:text-slate-100" />
      </div>

      <button
        onClick={() => onExport({ principal: mode === 'FD' ? principal : monthlyDep, rate, years, months, totalInterest: interest, finalAmount: maturity })}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
      >
        <FileText size={18} /> Generate Agreement / Document
      </button>
    </motion.div>
  );
};

export default InterestCalcPage;
