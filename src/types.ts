export interface DataRow {
  [key: string]: any;
}

export interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: any[];
  uniqueCount: number;
  missingCount: number;
}

export interface Dataset {
  name: string;
  data: DataRow[];
  columns: ColumnMetadata[];
}

export interface VizConfig {
  type: 'line' | 'bar' | 'scatter' | 'area' | 'pie';
  xAxis: string;
  yAxis: string;
  title: string;
  description: string;
  colors?: string[];
  stacked?: boolean;
}

export interface AnalysisResponse {
  insights: string[];
  suggestions: string[];
  suggestedVisualizations: VizConfig[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface StorySlide {
  title: string;
  content: string;
  visualization?: VizConfig;
  insight: string;
}

export interface DataStory {
  title: string;
  summary: string;
  slides: StorySlide[];
}
