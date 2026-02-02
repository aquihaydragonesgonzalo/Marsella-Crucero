export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  locationName: string;
  coords?: Coordinates;
  description: string;
  keyDetails?: string;
  priceEUR: number;
  type: 'arrival' | 'transport' | 'visit' | 'walking' | 'shopping' | 'limit' | 'departure';
  completed: boolean;
  audioGuideText?: string;
  image?: string;
  notes?: string;
}

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
}

export interface Pronunciation {
  word: string;
  phonetic: string;
  simplified: string;
  meaning: string;
}

export interface WeatherData {
  hourly: {
    time: string[];
    temperature: number[];
    code: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}