// mobile_app\types\user.d.ts

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  provider: string;
  googleId?: string;
  avatar?: string;
  googleLocationId?: string;
  googleLocationName: string;
  googleLocationCategory?: string;
  businessCategory?: string;
  createdAt: string;
  updatedAt: string;
}
