import { Component } from '@angular/core';
import {
  RouterOutlet,
  RouterModule,
  Router,
  NavigationEnd,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopnavComponent } from './topnav/topnav.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FormsModule,
    TopnavComponent,
  ],
  template: `
    <app-topnav *ngIf="showNavbar"></app-topnav>
    <router-outlet></router-outlet>
  `,
  styles: [],
})
export class AppComponent {
  title = 'quickrent';
  showNavbar = true;

  constructor(private router: Router) {
    // Subscribe to router events to detect when we're on the landing page or auth pages
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        
        // Hide navbar on landing page and auth pages
        this.showNavbar = !(
          url === '/landing' || 
          url === '/' || 
          url === '/login' || 
          url === '/signup' || 
          url === '/forgot-password'
        );
      });
  }

  isAuthPage(): boolean {
    const currentUrl = this.router.url;
    return ['/login', '/signup', '/forgot-password'].includes(currentUrl);
  }
}
