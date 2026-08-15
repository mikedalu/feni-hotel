export interface StaffUser {
  id: string;
  username: string;
  role: string;
  active: boolean;
}

export interface CreateStaffUserRequest {
  username: string;
  password?: string;
  role: string;
}

export interface AdminResetPasswordRequest {
  newPassword?: string;
}
