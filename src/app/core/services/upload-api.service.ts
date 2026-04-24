import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Attachment } from '../../models/app.models';
import { API_CONFIG } from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class UploadApiService {
  private readonly http = inject(HttpClient);

  async uploadReceipt(file: File): Promise<Attachment> {
    try {
      const formData = new FormData();

      formData.append('file', file, file.name);

      return await firstValueFrom(
        this.http.post<Attachment>(`${API_CONFIG.baseUrl}/uploads/receipts`, formData),
      );
    } catch (error) {
      throw new Error(this.resolveUploadError(error));
    }
  }

  private resolveUploadError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;

      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Receipt upload failed. Please try again.';
  }
}
