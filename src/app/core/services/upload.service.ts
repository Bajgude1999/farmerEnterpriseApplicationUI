import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Http } from '../common/http';
import { UploadDto } from '../models/upload.model';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(Http);

  /** Uploads a file to /v1/upload/save and returns the stored file's URL. */
  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .postForFile<{ data: string }>(`${environment.apiBaseUrl}/v1/upload/save`, formData)
      .pipe(map((res) => res.data));
  }

  /** The backend serves uploaded files directly by URL — no extra API call needed to "get" one. */
  getFileUrl(profilePhoto: string | null | undefined): string | null {
    if (!profilePhoto) return null;
    return profilePhoto.startsWith('http') ? profilePhoto : `${environment.apiBaseUrl}/${profilePhoto}`;
  }

uploadFileWithPayload(
  file: File,
  meta: UploadDto
): Observable<string> {

  const formData = new FormData();

  formData.append('file', file);

  formData.append(
    'uploadDto',
    new Blob(
      [JSON.stringify(meta)],
      { type: 'application/json' }
    )
  );

  return this.http
    .postForMultiFile<{ data: string }>(
      `${environment.apiBaseUrl}/v1/upload/update`,
      formData
    )
    .pipe(
      map(res => res.data)
    );
}
}