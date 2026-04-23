import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API_CONFIG } from '../constants/api.constants';
import {
  CreateUserRequest,
  CreateUserResponse,
  UserDirectoryItem,
} from '../../models/user-management.models';

interface CreateUserApiResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  department: string;
  title?: string;
  locationId?: string;
  status: string;
  createdAt: string;
}

interface UserDirectoryApiResponse {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber: string;
  phone: string;
  role: string;
  department: string;
  title: string;
  location: string;
  avatarUrl: string;
  assignedBudget: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementApiService {
  private readonly http = inject(HttpClient);

  listUsers(): Observable<UserDirectoryItem[]> {
    return this.http
      .get<UserDirectoryApiResponse[]>(`${API_CONFIG.baseUrl}${API_CONFIG.usersPath}`)
      .pipe(
        map((response) =>
          response.map((user) => ({
            _id: user._id,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            phone: user.phone,
            role: this.normalizeRole(user.role),
            department: user.department,
            title: user.title,
            location: user.location,
            avatarUrl: user.avatarUrl,
            assignedBudget: user.assignedBudget,
            status: this.normalizeStatus(user.status),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
        ),
      );
  }

  createUser(payload: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http
      .post<CreateUserApiResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.usersPath}`, {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        password: payload.password,
        phoneNumber: payload.phoneNumber,
        role: payload.role,
        department: payload.department,
        title: payload.title,
        locationId: payload.locationId,
        status: payload.status,
        avatarUrl: payload.avatarUrl,
      })
      .pipe(
        map((response) => ({
          _id: response._id,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          phoneNumber: response.phoneNumber,
          role: this.normalizeRole(response.role),
          department: response.department,
          title: response.title ?? '',
          locationId: response.locationId,
          status: this.normalizeStatus(response.status),
          createdAt: response.createdAt,
        })),
      );
  }

  private normalizeRole(role: string): CreateUserResponse['role'] {
    const normalizedRole = role.trim().toLowerCase();

    if (normalizedRole === 'admin') {
      return 'admin';
    }

    if (normalizedRole === 'recommender') {
      return 'recommender';
    }

    return 'operation-manager';
  }

  private normalizeStatus(status: string): CreateUserResponse['status'] {
    const normalizedStatus = status.trim().toLowerCase();

    if (normalizedStatus === 'inactive' || normalizedStatus === 'blocked') {
      return normalizedStatus;
    }

    return 'active';
  }
}
