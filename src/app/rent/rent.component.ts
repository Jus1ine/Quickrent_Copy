import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../services/property.service';
import { Subscription } from 'rxjs';

interface Apartment extends Omit<Property, 'features'> {
  features: string[];
  parking: number;
}

@Component({
  selector: 'app-rent',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './rent.component.html',
  styleUrls: ['./rent.component.css']
})
export class RentComponent implements OnInit, OnDestroy {
  sortOrder: string = '';
  activeFilter: string | null = null;
  selectedCurrency: 'USD' | 'PHP' = 'PHP';
  isChatOpen: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  
  filters = {
    location: 'All',
    propertyType: 'All',
    price: 'All',
    baths: 'Zero',
    beds: 'Zero',
    more: 'unspecified'
  };

  locations = ['All', 'Olongapo', 'Subic', 'Gapo'];
  propertyTypes = ['All', 'Apartment', 'House', 'Condo', 'Studio'];
  priceRangesUSD = ['All', '$0-$500', '$500-$1000', '$1000-$1500'];
  priceRangesPHP = ['All', '₱0-₱25000', '₱25000-₱50000', '₱50000-₱75000'];
  bathOptions = ['Zero', '1', '2', '3', '4+'];
  bedOptions = ['Zero', '1', '2', '3', '4+'];
  moreOptions = ['Furnished', 'Unfurnished', 'Pet Friendly', 'With Parking'];

  apartments: Apartment[] = [];
  filteredApartments: Apartment[] = [];
  messages: any[] = [
    { type: 'bot', content: 'Hello! How can I help you today?', time: '2m ago. Seen' },
    { type: 'bot', content: 'Please select an option:', time: 'Just now' }
  ];

  @ViewChild('chatMessages') private messagesContainer!: ElementRef;
  private subscription: Subscription;

  constructor(
    private router: Router,
    private propertyService: PropertyService
  ) {
    this.subscription = this.propertyService.getProperties().subscribe((properties: Property[]) => {
      this.apartments = properties.map((prop: Property): Apartment => ({
        ...prop,
        parking: prop.features.includes('hasParking') ? 1 : 0
      }));
    });
    this.filteredApartments = [];
  }

  ngOnInit() {
    // Subscribe to property changes
    this.propertyService.getProperties().subscribe((properties: Property[]) => {
      // Convert properties to Apartment type
      this.apartments = properties.map((prop: Property): Apartment => ({
        ...prop,
        parking: prop.features.includes('hasParking') ? 1 : 0
      }));

      // Update filtered apartments
      this.filteredApartments = [...this.apartments];
      this.calculateTotalPages();
      this.applyFilters();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Filter methods
  toggleFilter(filter: string) {
    this.activeFilter = this.activeFilter === filter ? null : filter;
  }

  selectOption(filter: keyof typeof this.filters, value: string) {
    this.filters[filter] = value;
    this.activeFilter = null;
  }

  applyFilters() {
    this.filteredApartments = this.apartments.filter(apartment => {
      if (this.filters.location !== 'All' && apartment.location !== this.filters.location) return false;
      if (this.filters.propertyType !== 'All' && apartment.type !== this.filters.propertyType.toLowerCase()) return false;
      if (this.filters.beds !== 'Zero' && apartment.bedrooms !== parseInt(this.filters.beds)) return false;
      if (this.filters.baths !== 'Zero' && apartment.bathrooms !== parseInt(this.filters.baths)) return false;
      
      // Price filter
      if (this.filters.price !== 'All') {
        const [min, max] = this.filters.price
          .replace(/[₱$]/g, '')
          .split('-')
          .map(str => parseInt(str.trim()));
        
        const price = this.selectedCurrency === 'USD' ? 
          this.convertPrice(apartment.price) : apartment.price;
        
        if (price < min || price > max) return false;
      }

      // Features filter
      if (this.filters.more !== 'unspecified') {
        const feature = this.filters.more.toLowerCase().replace(' ', '');
        if (!apartment.features.includes(feature)) return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.calculateTotalPages();
  }

  // Pagination methods
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredApartments.length / this.itemsPerPage);
  }

  getCurrentPageItems(): Apartment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredApartments.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Navigation methods
  navigateToDescription(apartmentId: string) {
    this.router.navigate(['/description', apartmentId]);
  }

  // Currency conversion
  convertPrice(price: number): number {
    return this.selectedCurrency === 'USD' ? Math.round(price / 50) : price;
  }

  getPriceRanges() {
    return this.selectedCurrency === 'USD' ? this.priceRangesUSD : this.priceRangesPHP;
  }

  // Chat methods
  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  selectChoice(choice: number) {
    const userChoice = {
      type: 'user',
      content: `Choice ${choice}`,
      time: 'Just now'
    };
    this.messages.push(userChoice);
    
    setTimeout(() => {
      const botResponse = {
        type: 'bot',
        content: `You selected Choice ${choice}`,
        time: 'Just now'
      };
      this.messages.push(botResponse);
    }, 500);
  }

  // Sorting
  sortApartments(value: string) {
    this.sortOrder = value;
    this.filteredApartments.sort((a, b) => {
      if (value === 'price_high') return b.price - a.price;
      if (value === 'price_low') return a.price - b.price;
      return 0;
    });
  }

  // Image handling
  getImageUrl(imageUrl: string): string {
    return imageUrl.startsWith('data:image') ? imageUrl : `assets/${imageUrl}`;
  }

  // Add these methods
  applyButtonClick() {
    this.applyFilters();
    this.activeFilter = null;
  }

  trackByApartmentId(index: number, apartment: Apartment): string {
    return apartment.id;
  }

  // Keep this method for manual clearing if needed
  clearAllData() {
    this.propertyService.clearProperties();
  }

  // Clear just the property data without affecting UI structure
  clearPropertyData() {
    this.propertyService.clearPropertyData();
  }
}

