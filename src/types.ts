export type UserRole = 'admin' | 'labor' | 'public' | 'company';

export interface UserProfile {
  uid: string;
  name?: string;
  mobile?: string;
  role: UserRole;
  aadhar?: string;
  'company id'?: string;
}

export interface WasteLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface WasteReport {
  id?: string;
  reporterUid: string;
  type: 'illegal' | 'professional';
  category: string;
  amount?: number;
  unit?: 'tons' | 'kg';
  location: WasteLocation;
  imageUrl?: string;
  timestamp: string;
  status: 'pending' | 'in-progress' | 'resolved';
  urgency: 'high' | 'medium' | 'low';
  nearestCenterId?: string;
  'company id'?: string;
  reporterDetails?: {
    name: string;
    mobile?: string;
    email?: string;
  };
}

export interface RecyclingCenter {
  id: string;
  name: string;
  location: WasteLocation;
  acceptedCategories: string[];
}
