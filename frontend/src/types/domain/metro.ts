export type MetroLine = {
  number: string;
  name: string;
  color: string;
  alternativeNumbers?: string[];
};

export type CityType =
  | 'moscow'
  | 'spb'
  | 'ekaterinburg'
  | 'novosibirsk'
  | 'samara'
  | 'ekb'
  | 'kazan'
  | 'nizhnynovgorod'
  | 'other';
