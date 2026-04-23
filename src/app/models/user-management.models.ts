export type UserRole = 'admin' | 'operation-manager' | 'recommender';

export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserMasterData {
  role: string[];
}

export interface CreateUserFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  department: string;
  title: string;
  locationId: string;
  status: UserStatus;
  password: string;
  avatarUrl?: string;
}

export type CreateUserRequest = CreateUserFormValue;

export interface CreateUserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  department: string;
  title: string;
  locationId?: string;
  status: UserStatus;
  createdAt: string;
}

export interface UserDirectoryItem {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber: string;
  phone: string;
  role: UserRole;
  department: string;
  title: string;
  location: string;
  avatarUrl: string;
  assignedBudget: number;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
