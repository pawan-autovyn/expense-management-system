import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../constants/api.constants';

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  requirePasswordReset: boolean;
  signOutOtherDevices: boolean;
}

export interface UpdatePasswordResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private readonly http = inject(HttpClient);

  updatePassword(payload: UpdatePasswordRequest): Observable<UpdatePasswordResponse> {
    return this.http.patch<UpdatePasswordResponse>(
      `${API_CONFIG.baseUrl}${API_CONFIG.usersPath}/me/password`,
      payload,
    );
  }
}
