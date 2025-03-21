import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
})
export class LandingpageComponent {
  constructor(private router: Router) {}

  selectUserType(type: 'renter' | 'landowner') {
    // Store the user type in localStorage or your auth service
    localStorage.setItem('userType', type);

    // Navigate to the appropriate dashboard based on user type
    if (type === 'renter') {
      this.router.navigate(['/rent']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
