export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: 'admin' | 'manager' | 'technician' | 'sales';
  dealershipId: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Dealership {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  isActive: boolean;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  settings: {
    allowUserRegistration: boolean;
    requireApproval: boolean;
    maxUsers: number;
    features: {
      analytics: boolean;
      multiLocation: boolean;
      customReports: boolean;
      apiAccess: boolean;
    };
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  dealership: Dealership | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterDealershipData {
  dealershipName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  dealershipEmail: string;
  website?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'manager' | 'technician' | 'sales';
}