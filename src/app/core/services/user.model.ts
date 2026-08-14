export interface Address {
  id?: string;
  fullName: string;
  mobile: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pin: string;
  isDefault?: boolean;
}

export interface RoleOption {
  roleCd: number;
  roleName: string;
}

export interface User {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  addresses: Address[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface OtpLoginRequest {
  mobile: string;
  otp: string;
}

// Mirrors com.sahakarya.auth.master.user.dto.UserDto
export interface RegisterRequest {
  userId?: number;
  fullName: string;
  mobNo: string;
  email?: string;
  password: string;
  roleCd?: number;
  roleName?: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pin: string;
  adharNo: string;
  profilePhoto?: string; // base64-encoded image
  verified?: boolean;
  block?: boolean;
  active?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}