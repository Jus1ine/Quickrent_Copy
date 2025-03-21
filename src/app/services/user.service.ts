import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserData {
  name: string;
  email: string;
  profileImage: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDataSubject = new BehaviorSubject<UserData>({
    name: 'User Name',
    email: 'user@example.com',
    profileImage: 'assets/profile.jpg'
  });

  userData$: Observable<UserData> = this.userDataSubject.asObservable();

  constructor() {
    this.loadUserData();
  }

  private loadUserData(): void {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        this.userDataSubject.next(parsedData);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  updateUserData(userData: Partial<UserData>): void {
    const currentData = this.userDataSubject.value;
    const updatedData = { ...currentData, ...userData };
    
    // Update the subject
    this.userDataSubject.next(updatedData);
    
    // Save to local storage
    localStorage.setItem('userData', JSON.stringify(updatedData));
  }

  getUserData(): UserData {
    return this.userDataSubject.value;
  }
} 