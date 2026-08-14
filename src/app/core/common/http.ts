import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Http {

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('fp_auth_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  post(url: string, body: any) {
    return this.http.post(url, body, {
      headers: this.getHeaders()
    });
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