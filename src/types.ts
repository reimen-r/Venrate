export interface ExchangeRate {
  id: string;
  name: string;
  code: string;
  rate: number;
  change: number;
  category: 'official' | 'parallel' | 'crypto' | 'other';
  lastUpdated: string;
}

export interface PriceAlert {
  id: string;
  currencyId: string;
  currencyName: string;
  condition: 'greater' | 'less' | 'equal';
  targetValue: number;
  createdDate: string;
}

export interface HistoricalDataPoint {
  date: string;
  rate: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface IntelligentAlerts {
  fluctuations: boolean;
  dailySummary: boolean;
  bcvParallelGap: boolean;
}
