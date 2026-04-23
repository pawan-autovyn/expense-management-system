import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Attachment } from '../../models/app.models';
import { API_CONFIG } from '../constants/api.constants';

interface UploadUrlResponse {
  key: string;
  fileUrl: string;
  uploadUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadApiService {
  private readonly http = inject(HttpClient);

  async uploadReceipt(file: File): Promise<Attachment> {
    try {
      const upload = await firstValueFrom(
        this.http.post<UploadUrlResponse>(`${API_CONFIG.baseUrl}/uploads/receipts/presign`, {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
        }),
      );

      const response = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return {
        id: `att-${Date.now()}`,
        key: upload.key,
        name: file.name,
        url: upload.fileUrl,
        mimeType: file.type || 'application/octet-stream',
      };
    } catch {
      return {
        id: `att-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type || 'application/octet-stream',
      };
    }
  }
}
