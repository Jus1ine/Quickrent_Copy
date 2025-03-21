import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-topnav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topnav.component.html',
  styleUrl: './topnav.component.css',
})
export class TopnavComponent implements OnInit {
  showDropdown = false;
  userName = 'User Name';
  userEmail = 'user@example.com';
  profileImage = '/assets/default-profile.png';

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Subscribe to user data changes
    this.userService.userData$.subscribe(userData => {
      this.userName = userData.name;
      this.userEmail = userData.email;
      this.profileImage = userData.profileImage;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  navigateToProfile() {
    this.router.navigate(['/account']);
    this.closeDropdown();
  }

  navigateToSettings() {
    // You can replace this with the actual settings route
    this.router.navigate(['/account']);
    this.closeDropdown();
  }

  logout() {
    // Clear any stored user data/tokens
    localStorage.clear();
    // Reset user data in service
    this.userService.updateUserData({
      name: 'User Name',
      email: 'user@example.com', 
      profileImage: '/assets/default-profile.png'
    });
    // Navigate to login page
    this.router.navigate(['/login']);
    this.closeDropdown();
  }
}
