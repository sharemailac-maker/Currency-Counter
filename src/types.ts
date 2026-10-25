export type DenominationType = 'note' | 'coin';
export type DenominationStatus = 'circulation' | 'rare' | 'delisted';

export interface Denomination {
  id: string;
  type: DenominationType;
  value: number;
  label: string;
  subtitle?: string;
  colorBg?: string;
  colorBorder?: string;
  colorText?: string;
  isCustom?: boolean;
  status?: DenominationStatus; // 'circulation' (active) | 'rare' | 'delisted'
}

export interface CountryCurrency {
  id: string; // ISO 2 or unique ID
  countryName: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  flag: string;
  locale: string;
  numberSystem: 'lakhs' | 'millions';
  mainUnitSingular: string;
  mainUnitPlural: string;
  fractionUnitSingular: string;
  fractionUnitPlural: string;
  region?: 'Asia' | 'Americas' | 'Europe' | 'Middle East' | 'Oceania' | 'Africa';
  coords?: { x: number; y: number }; // Percentage 0-100 on circular globe
  denominations: Denomination[];
}

export type DenominationCounts = Record<string, number>;

export interface SavedTally {
  id: string;
  countryId: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  timestamp: number;
  title: string;
  remark?: string; // Optional detailed remark / narration / accounting reason
  employeeName?: string; // Name of accounting employee / cashier
  employeeId?: string; // Optional employee badge / employee ID
  department?: string; // Department (e.g. Accounts & Finance, Treasury, Retail, Front Desk)
  counts: DenominationCounts;
  totalAmount: number;
  totalNotes: number;
  totalCoins: number;
  totalPieces: number;
  amountInWords: string;
  notesSummary: string;
}

export type TallySortOption = 
  | 'date-desc' 
  | 'date-asc' 
  | 'amount-desc' 
  | 'amount-asc' 
  | 'employee-asc' 
  | 'department-asc';

export interface DepartmentFinancialSummary {
  department: string;
  totalAmount: number;
  tallyCount: number;
  totalPieces: number;
  currencySymbol: string;
  currencyCode: string;
  employees: string[];
  avgTallyAmount: number;
  sharePercentage: number;
}

export interface MasterEmployee {
  id: string;
  employeeCode?: string;
  name: string;
  department: string;
  designation?: string;
  phone?: string;
  email?: string;
}

export type FinancialCalculatorType = 'fd' | 'sip' | 'rd' | 'loan_emi';
export type ActiveCalculatorType = 'none' | FinancialCalculatorType;
