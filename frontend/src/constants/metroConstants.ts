import type { MetroLine } from "../types";

export const MOSCOW_METRO_LINES: MetroLine[] = [
  { number: "1", name: "Сокольническая", color: "#E4292C", lightColor: "#FF6B6B", darkColor: "#D92326" },
  { number: "2", name: "Замоскворецкая", color: "#3E9A4F", lightColor: "#6FBF6F", darkColor: "#2D7A3A" },
  { number: "3", name: "Арбатско-Покровская", color: "#2673B0", lightColor: "#5A9BD5", darkColor: "#1E5A8D" },
  { number: "4", name: "Филёвская", color: "#68C6E0", lightColor: "#8DD4E8", darkColor: "#4BAEC8" },
  { number: "5", name: "Кольцевая", color: "#A86E3B", lightColor: "#C48A55", darkColor: "#8B562E" },
  { number: "6", name: "Калужско-Рижская", color: "#F2A600", lightColor: "#FFC233", darkColor: "#D48F00" },
  { number: "7", name: "Таганско-Краснопресненская", color: "#9D2068", lightColor: "#C43D86", darkColor: "#7A1950" },
  { number: "8", name: "Калининско-Солнцевская", color: "#E94B3C", lightColor: "#F26A58", darkColor: "#C73A2C" },
  { number: "9", name: "Серпуховско-Тимирязевская", color: "#7A7A7A", lightColor: "#999999", darkColor: "#5E5E5E" },
  { number: "10", name: "Люблинско-Дмитровская", color: "#C3D64B", lightColor: "#D4E16E", darkColor: "#A8BD35" },
  { number: "11", name: "Большая Кольцевая", color: "#7BB3B3", lightColor: "#9CCACA", darkColor: "#5E9494" },
  { number: "12", name: "Бутовская", color: "#9D9D9D", lightColor: "#B8B8B8", darkColor: "#787878" },
  { number: "13", name: "Некрасовская", color: "#F272B3", lightColor: "#F599C9", darkColor: "#E055A0" },
  { number: "14", name: "МЦК", color: "#D40000", lightColor: "#E63333", darkColor: "#B00000" },
  { number: "15", name: "МЦД-1", color: "#F74042", lightColor: "#FA6E6F", darkColor: "#D62A2C" },
  { number: "16", name: "МЦД-2", color: "#F9C600", lightColor: "#FFDA4D", darkColor: "#E0B000" },
  { number: "17", name: "МЦД-3", color: "#00A0DD", lightColor: "#33B8E8", darkColor: "#0084B8" },
  { number: "18", name: "МЦД-4", color: "#A062BE", lightColor: "#BE85D6", darkColor: "#884F9F" },
];

export const METRO_LINE_ALIASES: Record<string, string> = {
  "8a": "8",
  "11a": "11",
};

export const SAINT_PETERSBURG_METRO_LINES: MetroLine[] = [
  { number: "1", name: "Кировско-Выборгская", color: "#E31E24" },
  { number: "2", name: "Московско-Петроградская", color: "#0066B4" },
  { number: "3", name: "Невско-Василеостровская", color: "#6BB43C" },
  { number: "4", name: "Правобережная", color: "#F0962C" },
  { number: "5", name: "Фрунзенско-Приморская", color: "#7C297A" },
];

export const EKATERINBURG_METRO_LINES: MetroLine[] = [
  { number: "1", name: "Первая линия", color: "#E31E24" },
];

export const NOVOSIBIRSK_METRO_LINES: MetroLine[] = [
  { number: "1", name: "Ленинская", color: "#E31E24" },
  { number: "2", name: "Дзержинская", color: "#0066B4" },
];

export const detectMetroCity = (stationName: string): 'moscow' | 'spb' | 'ekaterinburg' | 'novosibirsk' | 'other' => {
  const moscowStations = ['Третьяковская', 'Октябрьская', 'Краснопресненская', 'Китай-город', 'Баррикадная'];
  const spbStations = ['Невский проспект', 'Гостиный двор', 'Площадь Восстания'];
  const ekbStations = ['Проспект Космонавтов', 'Уральская', 'Динамо'];
  const nskStations = ['Площадь Ленина', 'Речной Вокзал', 'Сибирская'];
  
  if (moscowStations.some(s => stationName.includes(s))) {
    return 'moscow';
  }
  if (spbStations.some(s => stationName.includes(s))) {
    return 'spb';
  }
  if (ekbStations.some(s => stationName.includes(s))) {
    return 'ekaterinburg';
  }
  if (nskStations.some(s => stationName.includes(s))) {
    return 'novosibirsk';
  }
  return 'other';
};


export const getMetroLineColor = (
  routeNumber: string, 
  city: 'moscow' | 'spb' | 'ekaterinburg' | 'novosibirsk' | 'other' = 'moscow'
): string => {
  let lines: MetroLine[] = [];
  
  switch (city) {
    case 'moscow':
      lines = MOSCOW_METRO_LINES;
      break;
    case 'spb':
      lines = SAINT_PETERSBURG_METRO_LINES;
      break;
    case 'ekaterinburg':
      lines = EKATERINBURG_METRO_LINES;
      break;
    case 'novosibirsk':
      lines = NOVOSIBIRSK_METRO_LINES;
      break;
    default:
      return '#bf5151ff';
  }
  
  const normalizedNumber = METRO_LINE_ALIASES[routeNumber] || routeNumber;
  const line = lines.find(l => l.number === normalizedNumber);
  return line?.color || '#bf5151ff';
};


export const getMetroLineInfo = (
  routeNumber: string,
  city: 'moscow' | 'spb' | 'ekaterinburg' | 'novosibirsk' | 'other' = 'moscow'
): MetroLine | null => {
  let lines: MetroLine[] = [];
  
  switch (city) {
    case 'moscow':
      lines = MOSCOW_METRO_LINES;
      break;
    case 'spb':
      lines = SAINT_PETERSBURG_METRO_LINES;
      break;
    case 'ekaterinburg':
      lines = EKATERINBURG_METRO_LINES;
      break;
    case 'novosibirsk':
      lines = NOVOSIBIRSK_METRO_LINES;
      break;
    default:
      return null;
  }
  
  const normalizedNumber = METRO_LINE_ALIASES[routeNumber] || routeNumber;
  return lines.find(l => l.number === normalizedNumber) || null;
};


export const getMetroLineName = (routeNumber: string, city: 'moscow' | 'spb' | 'ekaterinburg' | 'novosibirsk' | 'other' = 'moscow'): string => {
  const info = getMetroLineInfo(routeNumber, city);
  return info?.name || `Линия ${routeNumber}`;
};