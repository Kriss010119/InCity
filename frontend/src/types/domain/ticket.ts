export type TrainTicketDetails = {
  orderType: 'train';
  orderId: string;
  createdAt: string;
  details: {
    departureStationCode: string;
    arrivalStationCode: string;
    departureDate: string;
    arrivalDate: string;
    departureTime: string;
    arrivalTime: string;
    passengers: number;
  };
};

export type HotelTicketDetails = {
  orderType: 'hotel';
  orderId: string;
  createdAt: string;
  details: {
    hotelName: string;
    coordinates: { latitude: number; longitude: number };
    checkIn: string;
    checkOut: string;
  };
};

export type TicketDetails = TrainTicketDetails | HotelTicketDetails;

export type TicketData = {
  ticketNumber: string;
  ticketDetails: TicketDetails;
};
