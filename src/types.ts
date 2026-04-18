
export interface ProductionData {
  plan: number;
  actual: number;
  fuel: number;
}

export interface WeatherData {
  rainPlan: number;
  rainActual: number;
  slipperyPlan: number;
  slipperyActual: number;
  rainfall: number;
}

export interface ProductivityData {
  t100: number;
  t50: number;
  t30: number;
}

export interface PAData {
  loader: number;
  hauler: number;
  cg: number;
  grader: number;
  bulldozer: number;
  support: number;
}

export interface DailyRecord {
  date: string;
  timestamp: number; // For sorting
  ob: ProductionData;
  cg: ProductionData;
  weather: WeatherData;
  productivity: ProductivityData;
  pa: PAData;
}

export interface User {
  uid: string;
  name: string;
  email?: string;
  position: string;
  photoURL?: string;
}

export interface ChatAttachment {
  type: 'image' | 'video' | 'document';
  name: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
}
