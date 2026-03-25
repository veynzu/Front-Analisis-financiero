export interface Active {
  id: number;
  name: string;
  symbol: string;
  priceCount: number;
}

export interface ActivesResponse {
  actives: Active[];
  count: number;
}

export interface Price {
  id: number;
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface PricesResponse {
  active: {
    id: number;
    name: string;
    symbol: string;
  };
  prices: Price[];
  count: number;
}

export interface JobStartResponse {
  status: string;
  message: string;
}

export interface JobStatusResponse {
  progress: number;
  processedSymbols: string[];
  running: boolean;
}

export interface SortResult {
  algorithmName: string;
  bigOComplexity: string;
  size: number;
  timeInMilliseconds: number;
}
