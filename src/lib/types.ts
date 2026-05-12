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

export interface TopVolumeActive {
  id: number;
  name: string;
  symbol: string;
}

export interface TopVolumeDay {
  id: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  active: TopVolumeActive;
}

export type TimeSeriesField = "close" | "open" | "high" | "low" | "volume";

export interface PriceDataPoint {
  date: string;
  valueObtained: number;
}

export interface EuclideanDistancePoint {
  date: string;
  distance: number;
}

export interface EuclideanData {
  executionTime: number;
  distanceList: EuclideanDistancePoint[];
}

export interface WarpingPathPoint {
  dateX: string;
  dateY: string;
  cost: number;
}

export interface DtwData {
  totalCost: number;
  executionTime: number;
  warpingPath: WarpingPathPoint[];
  costTable: (number | "Infinity")[][];
}

export interface PearsonData {
  coefficient: number;
  description: string;
  executionTime: number;
}

export interface CosineData {
  similarity: number;
  description: string;
  executionTimeMs: number;
}

export interface TimeSeriesSimilarityResponse {
  status: string;
  firstActivePriceData: PriceDataPoint[];
  secondActivePriceData: PriceDataPoint[];
  euclidean: EuclideanData;
  dtw: DtwData;
  pearson: PearsonData;
  cosine: CosineData;
  [key: string]: unknown;
}

// ============================================================
// R3 — Análisis de patrones y volatilidad
// ============================================================

export interface PatternResult {
  activeSymbol: string;
  activeName: string;
  patternName: string;
  patternDescription: string;
  windowSize: number;
  totalWindows: number;
  patternOccurrences: number;
  frequencyPercentage: number;
  occurrenceDates: string[];
}

export type RiskCategory = "CONSERVADOR" | "MODERADO" | "AGRESIVO";

export interface VolatilityResult {
  activeSymbol: string;
  activeName: string;
  meanDailyReturn: number;
  standardDeviation: number;
  historicalVolatility: number;
  riskCategory: RiskCategory;
  dataPointsUsed: number;
}

export interface VolatilityRankingResponse {
  ranking: VolatilityResult[];
  totalActives: number;
  categoryDistribution: Record<RiskCategory, number>;
}

// ============================================================
// R4 — Matriz de correlación
// ============================================================

export type CorrelationField = "open" | "high" | "low" | "close" | "volume";

export interface CorrelationMatrixResponse {
  labels: string[];
  matrix: (number | null)[][];
  executionTime: number;
}

// ============================================================
// R4 — Gráfico de velas + SMA
// ============================================================

export interface CandlestickPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma: number | null;
}

export interface CandlestickResponse {
  activeId: number;
  activeSymbol: string;
  activeName: string;
  smaPeriod: number;
  data: CandlestickPoint[];
}
