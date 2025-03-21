import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'your-api-endpoint'; // Replace with your actual API endpoint

  constructor(private http: HttpClient) {}

  addApartment(apartment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/apartments`, apartment);
  }

  getApartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/apartments`);
  }
} 