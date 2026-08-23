export interface BookingResponse {
  id: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  title?: string;
  occupation?: string;
  nextOfKinPhone?: string;
  address?: string;
  lga?: string;
  nationality?: string;
  stateOfOrigin?: string;
  passportNo?: string;
  nin?: string;
  purposeOfVisit?: string;
  arrivingFrom?: string;
  goingTo?: string;
  idScanUrl?: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  roomType: string;
  checkInTime: string;
  paymentMethod: string;
  totalCost: number;
  status: 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'OVERDUE';
  createdAt: string;
  processedByUsername: string;
  priceOverrideReason?: string;
}

export interface BookingRequest {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;

  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  roomType: string;
  checkInTime: string;

  paymentMethod: string;
  totalCost: number;

  title?: string;
  occupation?: string;
  nextOfKinPhone?: string;
  address?: string;
  lga?: string;
  nationality?: string;
  stateOfOrigin?: string;
  passportNo?: string;
  nin?: string;
  purposeOfVisit?: string;
  arrivingFrom?: string;
  goingTo?: string;

  overrideReason?: string;
  printerIp?: string;
}

export interface ChangeRoomRequest {
  newRoomNumber: string;
  newRoomType: string;
  newTotalCost: number;
  paymentMethod: string;
}

export interface ExtendBookingRequest {
  newCheckOutDate: string;
  additionalCost: number;
  paymentMethod: string;
}
