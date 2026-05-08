export type WikipediaSummary = {
  extract: string;
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
  thumbnail?: {
    source: string;
  };
};

export type WikidataEntity = {
  sitelinks?: Record<string, { title: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value: string } } }>>;
  descriptions?: Record<string, { value: string }>;
};

export type WikidataResponse = {
  entities: Record<string, WikidataEntity>;
};

export type WikipediaPageImage = {
  thumbnail?: {
    source: string;
  };
};

export type WikipediaQueryResponse = {
  query?: {
    pages?: Record<string, WikipediaPageImage>;
  };
};
