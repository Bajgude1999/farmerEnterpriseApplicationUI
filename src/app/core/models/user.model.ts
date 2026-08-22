export interface RoleOption {
  roleCd: number;
  roleName: string;
}

export interface Address {
  id?: string;
  fullName?: string;
  mobile?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pin?: string;
  optionalMobNo?: string;
  landmark?: string;
  address?: string;
  isDefault?: boolean;
}

export interface User {
  userCd: number;
  fullName: string;
  mobNo: string;
  email?: string;
  roleCd?: number;
  roleName?: string;
  addresses?: Address[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface OtpLoginRequest {
  mobile: string;
  otp: string;
}

export interface RegisterRequest {
  fullName: string;
  mobile: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  userCd: number;
  fullName: string;
  mobNo: string;
  email?: string;
  roleCd?: number;
  roleName?: string;
  addresses?: Address[];
}

export interface UserMaster {
  userCd?: number | null;
  fullName: string;
  mobNo: string;
  email?: string;
  password?: string;
  roleCd: number | null;
  roleName?: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pin: string;
  profilePhoto?: string;
  verified: boolean;
  block: boolean;
  active: boolean;
  optionalMobNo?: string;
  landmark?: string;
  address?: string;
}