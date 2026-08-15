export interface RoomResponse {
  id: string;
  roomNumber: string;
  roomType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'OUT_OF_ORDER';
  basePrice: number;
  currentPrice: number;
  active: boolean;
}

export interface RoomRequest {
  roomNumber: string;
  roomType: string;
  basePrice: number;
}

export interface RoomStatusUpdateRequest {
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'OUT_OF_ORDER';
}
