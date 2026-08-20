import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class Http {

  constructor(private http: HttpClient) {
    
  }
  private readonly ENCRYPTION_KEY = environment.encriptionKey;

  private getHeaders(): HttpHeaders {
  const encryptedToken = localStorage.getItem('fp_auth_token');

  if (!encryptedToken) {
    return new HttpHeaders();
  }

 

    const token = this.decrypt(encryptedToken);

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });


    return new HttpHeaders();
  
}

  post(url: string, body: any) {
    return this.http.post(url, body, {
      headers: this.getHeaders()
    });
  }
  decrypt(encrypted: string): string {
      const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(this.ENCRYPTION_KEY), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      });
  
      return decrypted.toString(CryptoJS.enc.Utf8);
    }
  postForMultiFile<T>(url: string, body: any): Observable<T> {
  return this.http.post<T>(url, body, {
    headers: this.getHeaders()
  });
}
  put(url: string, body: any) {
  return this.http.put(url, body, {
    headers: this.getHeaders()
  });
}
putWithPayload(
  url: string,
  body: any,
  params?: { [key: string]: string },
  responseType: 'json' | 'text' = 'json'
): Observable<any> {

  return this.http.put(url, body, {
    headers: this.getHeaders(),
    params,
    responseType: responseType as any
  });
}
postForFile<T>(url: string, body: any): Observable<T> {
  return this.http.post<T>(url, body, {
    headers: this.getHeaders()
  });
}

  get<T>(url: string) {
  return this.http.get<T>(url, {
    headers: this.getHeaders()
  });
}
getWithPayload<T>(url: string, params?: any) {
  return this.http.get<T>(url, {
    headers: this.getHeaders(),
    params: params
  });
}
postWithPayload<T>(url: string, payload: any) {
  return this.http.post<T>(url, payload, {
    headers: this.getHeaders()
  });
}
}