import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService, Property } from '../services/property.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  properties: Property[] = [];
  apartments: Property[] = [];
  filteredApartments: Property[] = [];
  searchQuery: string = '';
  private subscription: Subscription;
  recentlyRatedId: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.subscription = this.propertyService.getProperties().subscribe(properties => {
      this.properties = properties;
      this.apartments = properties;
      this.updateFilteredApartments();
    });
  }

  ngOnInit() {
    // Check for rated property from URL params
    this.route.queryParams.subscribe(params => {
      const ratedPropertyId = params['ratedProperty'];
      if (ratedPropertyId) {
        this.recentlyRatedId = ratedPropertyId;
      }
    });

    this.subscription.add(
      this.propertyService.getProperties().subscribe((properties: Property[]) => {
        console.log('Home received updated properties:', properties);
        this.properties = properties;
        this.apartments = properties;
        this.updateFilteredApartments();
        
        // If we have a recently rated property, scroll to it
        if (this.recentlyRatedId) {
          setTimeout(() => {
            const element = document.getElementById(`apartment-${this.recentlyRatedId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Remove highlight after animation
              setTimeout(() => {
                this.recentlyRatedId = null;
              }, 3000);
            }
          }, 100);
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateFilteredApartments() {
    // First filter by search query if exists
    let filtered = !this.searchQuery.trim() ? [...this.apartments] : 
      this.apartments.filter(property =>
        property.location.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        property.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    
    // Filter out properties without ratings
    filtered = filtered.filter(property => 
      property.rating !== undefined && 
      property.rating !== null && 
      property.rating > 0
    );
    
    // Sort by rating (highest first) and then by total ratings (most rated first)
    filtered.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      const totalRatingsA = a.totalRatings || 0;
      const totalRatingsB = b.totalRatings || 0;
      
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return totalRatingsB - totalRatingsA;
    });
    
    this.filteredApartments = filtered;
    console.log('Filtered and sorted properties (rated only):', this.filteredApartments);
  }

  search() {
    this.updateFilteredApartments();
  }

  navigateToDescription(propertyId: string) {
    this.router.navigate(['/description', propertyId]);
  }
}