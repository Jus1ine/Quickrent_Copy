import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Apartment {
  id: number;
  name: string;
  location: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  price: number;
  image: string;
  description: string;
  ownerImage?: string;
  rating: number;
  totalRatings: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApartmentService {
  private apartments: Apartment[] = [
    {
      id: 1,
      name: "Modern Studio Apartment",
      location: "Olongapo City",
      squareFeet: 215,
      bedrooms: 2,
      bathrooms: 1,
      parking: 1,
      price: 25000,
      image: "apartment1.jpg",
      description: "Modern and cozy studio apartment with complete amenities",
      ownerImage: "assets/default-avatar.png",
      rating: 0,
      totalRatings: 0
    },
    // ... other apartments
  ];

  private apartmentsSubject = new BehaviorSubject<Apartment[]>(this.apartments);
  private recentlyRatedIdSubject = new BehaviorSubject<number | null>(null);

  getApartments(): Observable<Apartment[]> {
    return this.apartmentsSubject.asObservable();
  }

  getRecentlyRatedId(): Observable<number | null> {
    return this.recentlyRatedIdSubject.asObservable();
  }

  updateApartmentRating(id: number, newRating: number): void {
    const apartmentIndex = this.apartments.findIndex(apt => apt.id === id);
    if (apartmentIndex !== -1) {
      const apartment = this.apartments[apartmentIndex];
      
      // Calculate new rating
      const newTotalRatings = apartment.totalRatings + 1;
      const totalRatingPoints = (apartment.rating * apartment.totalRatings) + newRating;
      const calculatedNewRating = totalRatingPoints / newTotalRatings;

      // Create new apartment object with updated ratings
      const updatedApartment = {
        ...apartment,
        rating: Number(calculatedNewRating.toFixed(1)),
        totalRatings: newTotalRatings
      };

      // Create a new array with the updated apartment
      const updatedApartments = [...this.apartments];
      updatedApartments[apartmentIndex] = updatedApartment;
      
      // Update the internal array and emit changes
      this.apartments = updatedApartments;
      this.apartmentsSubject.next(this.apartments);
      this.recentlyRatedIdSubject.next(id);

      // Log the update
      console.log('Rating Update:', {
        apartmentId: id,
        oldRating: apartment.rating,
        newRating: updatedApartment.rating,
        oldTotalRatings: apartment.totalRatings,
        newTotalRatings: updatedApartment.totalRatings
      });
    }
  }

  // Add method to get a single apartment
  getApartment(id: number): Observable<Apartment | undefined> {
    return this.apartmentsSubject.pipe(
      map(apartments => apartments.find(apt => apt.id === id))
    );
  }
} 