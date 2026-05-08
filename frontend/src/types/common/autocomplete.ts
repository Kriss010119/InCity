export type Suggestion = {
  display_name: string;
  lat: number;
  lon: number;
  place_id: string;
  type?: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    street?: string;
    house_number?: string;
    country?: string;
    postcode?: string;
  };
};

export type SelectedLocation = {
  lat: number;
  lng: number;
  address: string;
  placeId: string;
  details?: {
    city?: string;
    street?: string;
    house?: string;
    postcode?: string;
    country?: string;
  };
};

export type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: SelectedLocation) => void;
  isLocked?: boolean;
  placeholder?: string;
};
