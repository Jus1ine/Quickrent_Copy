import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Property {
  id: string;
  name: string;
  location: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  area: string;
  imageUrl: string;
  images: string[];
  country: string;
  state: string;
  city: string;
  zipCode: string;
  address: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
    fullAddress: string;
  };
  comments?: string;
  description?: string;
  ownerImage?: string;
  createdAt: string;
  status: 'available' | 'rented' | 'pending';
  virtualTourImage?: string;
  ownerName: string;
  rating?: number;
  totalRatings?: number;
  ratings?: Rating[];
}

export interface Rating {
  rating: number;
  comment: string;
  timestamp: Date;
  userName?: string;
  isCurrentUser?: boolean;
}

export interface Reservation {
  id?: string;
  propertyId: string;
  propertyTitle?: string;
  propertyImage?: string;
  renterName?: string;
  renterEmail?: string;
  renterImage?: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  totalPrice: number;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private properties: Property[] = [];
  private propertiesSubject = new BehaviorSubject<Property[]>([]);
  private reservations: Reservation[] = [];

  constructor() {
    // Initialize or load properties
    this.loadProperties();
  }

  private loadProperties() {
    // Load from localStorage or initialize empty array
    const savedProperties = localStorage.getItem('properties');
    this.properties = savedProperties ? JSON.parse(savedProperties) : [];
    this.propertiesSubject.next(this.properties);
  }

  private saveProperties() {
    // Save to localStorage and update subject
    localStorage.setItem('properties', JSON.stringify(this.properties));
    this.propertiesSubject.next(this.properties);
  }

  getProperties(): Observable<Property[]> {
    return this.propertiesSubject.asObservable();
  }

  removeProperty(propertyId: string) {
    // Remove from properties array
    this.properties = this.properties.filter(p => p.id !== propertyId);
    
    // Save changes and notify subscribers
    this.saveProperties();

    // Also remove from bookmarks in localStorage
    this.removeFromBookmarks(propertyId);

    return true;
  }

  private removeFromBookmarks(propertyId: string) {
    // Remove the property from bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const updatedBookmarks = bookmarks.filter((bookmark: any) => bookmark.id !== propertyId);
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  }

  clearProperties() {
    this.properties = [];
    localStorage.removeItem('properties');
    this.propertiesSubject.next([]);
    console.log('All properties cleared');
  }

  addProperty(property: Property) {
    // Add to beginning of array
    this.properties = [property, ...this.properties];
    
    // Save to localStorage
    localStorage.setItem('properties', JSON.stringify(this.properties));
    
    // Notify subscribers
    this.propertiesSubject.next([...this.properties]);
    
    console.log('Properties after adding:', this.properties);
  }

  getProperty(id: string): Observable<Property | undefined> {
    return new BehaviorSubject(this.properties.find(p => p.id === id));
  }

  updatePropertyRating(propertyId: string, rating: number, comment: string) {
    const propertyIndex = this.properties.findIndex(p => p.id === propertyId);
    
    if (propertyIndex !== -1) {
      const property = this.properties[propertyIndex];
      const currentRating = property.rating || 0;
      const currentTotalRatings = property.totalRatings || 0;
      
      // Calculate new rating
      const newTotalRatings = currentTotalRatings + 1;
      const newRating = ((currentRating * currentTotalRatings) + rating) / newTotalRatings;
      
      // Create new rating object
      const newRatingObj: Rating = {
        rating: rating,
        comment: comment,
        timestamp: new Date(),
        userName: 'You',
        isCurrentUser: true
      };
      
      // Add to ratings array
      if (!property.ratings) {
        property.ratings = [];
      }
      property.ratings.unshift(newRatingObj);
      
      // Update property
      this.properties[propertyIndex] = {
        ...property,
        rating: newRating,
        totalRatings: newTotalRatings
      };
      
      // Save to localStorage and notify subscribers
      localStorage.setItem('properties', JSON.stringify(this.properties));
      this.propertiesSubject.next([...this.properties]);
      
      return true;
    }
    
    return false;
  }

  addReservation(reservation: Reservation): Observable<boolean> {
    // Get current user info
    const userData = localStorage.getItem('userData');
    let renterName = 'Guest';
    let renterEmail = 'guest@example.com';
    let renterImage = 'assets/profile.jpg';
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        renterName = user.name || renterName;
        renterEmail = user.email || renterEmail;
        renterImage = user.profileImage || renterImage;
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    
    // Get property details
    const property = this.properties.find(p => p.id === reservation.propertyId);
    
    // Create complete reservation object
    const newReservation: Reservation = {
      ...reservation,
      id: this.generateId(),
      renterName,
      renterEmail,
      renterImage,
      propertyTitle: property?.name || 'Unknown Property',
      propertyImage: property?.imageUrl || 'assets/apartment1.jpg',
      createdAt: new Date().toISOString(),
    };
    
    // Get existing reservations
    const reservationsString = localStorage.getItem('reservations') || '[]';
    try {
      const reservations = JSON.parse(reservationsString) as Reservation[];
      // Add new reservation
      reservations.push(newReservation);
      // Save back to localStorage
      localStorage.setItem('reservations', JSON.stringify(reservations));
      return of(true);
    } catch (e) {
      console.error('Error adding reservation', e);
      return of(false);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  getReservations(propertyId: string): Reservation[] {
    return this.reservations.filter((res: Reservation) => res.propertyId === propertyId);
  }

  updateProperty(id: string, updates: Partial<Property>): Observable<boolean> {
    try {
      const index = this.properties.findIndex(p => p.id === id);
      if (index !== -1) {
        // Create updated property
        const updatedProperty = {
          ...this.properties[index],
          ...updates
        };
        
        // Replace the old property with the updated one
        this.properties[index] = updatedProperty;
        
        // Save to localStorage
        localStorage.setItem('properties', JSON.stringify(this.properties));
        console.log('Properties saved to localStorage:', this.properties);
        
        // Update the BehaviorSubject
        this.propertiesSubject.next([...this.properties]);
        return of(true);
      }
      return of(false);
    } catch (error) {
      console.error('Error updating property:', error);
      return of(false);
    }
  }

  clearAllData() {
    try {
      // Clear properties array
      this.properties = [];
      
      // Clear localStorage
      localStorage.removeItem('properties');
      
      // Also clear any rating-related localStorage items
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('rated_')) {
          localStorage.removeItem(key);
        }
      }
      
      // Update the BehaviorSubject
      this.propertiesSubject.next([]);
      
      console.log('All property data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing property data:', error);
      return false;
    }
  }

  clearPropertyData() {
    try {
      // Get the current properties with their ratings
      const propertiesWithRatings: Property[] = this.properties.map(property => {
        // Create a new property with minimal data but keeping the required fields
        return {
          id: property.id,
          name: property.name || 'Property',
          location: property.location || 'Location',
          price: property.price || 0,
          type: property.type || 'apartment',
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          features: property.features || [],
          area: property.area || '0 sq ft',
          imageUrl: property.imageUrl || '',
          images: property.images || [],
          country: property.country || '',
          state: property.state || '',
          city: property.city || '',
          zipCode: property.zipCode || '',
          address: property.address || {
            country: '',
            state: '',
            city: '',
            zipCode: '',
            fullAddress: ''
          },
          comments: property.comments || '',
          createdAt: property.createdAt || new Date().toISOString(),
          status: property.status || 'available',
          ownerName: property.ownerName || 'Owner',
          rating: property.rating || 0,
          totalRatings: property.totalRatings || 0,
          ratings: property.ratings || []
        };
      });
      
      // Update properties with the minimal data
      this.properties = propertiesWithRatings;
      
      // Save to localStorage
      localStorage.setItem('properties', JSON.stringify(this.properties));
      
      // Notify subscribers
      this.propertiesSubject.next([...this.properties]);
      
      console.log('Property data cleared while preserving ratings and comments');
      return true;
    } catch (error) {
      console.error('Error clearing property data:', error);
      return false;
    }
  }

  // Get all reservations for the logged-in user's properties
  getMyPropertyReservations(): Observable<Reservation[]> {
    // In a real app, this would be an API call
    // For now, we'll simulate with localStorage
    const reservationsString = localStorage.getItem('reservations') || '[]';
    try {
      const reservations = JSON.parse(reservationsString) as Reservation[];
      // Get only reservations for properties owned by current user
      const userProperties = this.properties.map(p => p.id);
      return of(reservations.filter(r => userProperties.includes(r.propertyId)));
    } catch (e) {
      console.error('Error parsing reservations', e);
      return of([]);
    }
  }
  
  // Approve a reservation
  approveReservation(reservationId: string): Observable<boolean> {
    // Get all reservations
    const reservationsString = localStorage.getItem('reservations') || '[]';
    try {
      const reservations = JSON.parse(reservationsString) as Reservation[];
      const index = reservations.findIndex(r => r.id === reservationId);
      
      if (index !== -1) {
        reservations[index].status = 'approved';
        // Update in localStorage
        localStorage.setItem('reservations', JSON.stringify(reservations));
        return of(true);
      }
      return of(false);
    } catch (e) {
      console.error('Error approving reservation', e);
      return of(false);
    }
  }
  
  // Reject a reservation
  rejectReservation(reservationId: string): Observable<boolean> {
    // Get all reservations
    const reservationsString = localStorage.getItem('reservations') || '[]';
    try {
      const reservations = JSON.parse(reservationsString) as Reservation[];
      const index = reservations.findIndex(r => r.id === reservationId);
      
      if (index !== -1) {
        reservations[index].status = 'rejected';
        // Update in localStorage
        localStorage.setItem('reservations', JSON.stringify(reservations));
        return of(true);
      }
      return of(false);
    } catch (e) {
      console.error('Error rejecting reservation', e);
      return of(false);
    }
  }
}