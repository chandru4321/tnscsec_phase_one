import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AuthService {

  // private loginApi = 'https://jk901cnt-5000.inc1.devtunnels.ms/api/auth/login';
  // private loginApi = 'https://72bnm96r-5000.inc1.devtunnels.ms/api/auth/login';
  private loginApi = 'http://localhost:4000/api/auth/login';
  private logoutApi = this.loginApi.replace(/\/login$/, '/logout');


  private tokenKey = 'token'; // 🔥 FIX

  // Everything login() stores in localStorage for the session
  private static readonly SESSION_KEYS = [
    'token', 'auth_token', 'username', 'role', 'uid',
    'department_id', 'district_id', 'zone_id',
    'department_name', 'district_name', 'zone_name'
  ];


  constructor(private http: HttpClient) { }

  login(username: string, password: string) {
    return this.http.post(this.loginApi, { username, password });
  }

  storeToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // POST /api/auth/logout — the backend revokes this token, so it stops
  // working even if it was copied. The interceptor adds the Bearer header.
  logout() {
    return this.http.post(this.logoutApi, {});
  }

  // Remove every session value stored at login
  clearSession(): void {
    AuthService.SESSION_KEYS.forEach(key => localStorage.removeItem(key));
  }

}
