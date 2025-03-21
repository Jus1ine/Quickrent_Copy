import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface Apartment {
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
  petFriendly: string;
  hasParking: string;
  furnished: string;
}

@Component({
  selector: 'app-apartment-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './apartment-details.component.html',
  styleUrls: ['./apartment-details.component.css']
})
export class ApartmentDetailsComponent implements OnInit {
  apartment: Apartment | undefined;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // For now, we'll use mock data. Later you can fetch this from a service
    const mockApartments: Apartment[] = [
      {
        id: 1,
        name: "Modern Studio Apartment",
        location: "Olongapo City",
        squareFeet: 215,
        bedrooms: 2,
        bathrooms: 1,
        petFriendly: 'yes',
        hasParking: 'yes',
        furnished: 'yes',
        parking: 1,
        price: 25000,
        image: "apartment1.jpg",
        description: "Modern and cozy studio apartment with complete amenities"
      },
      {
        id: 2,
        name: "Luxury Condo Unit",
        location: "Subic Bay",
        squareFeet: 300,
        bedrooms: 3,
        bathrooms: 2,
        petFriendly: 'yes',
        hasParking: 'yes',
        furnished: 'yes',
        parking: 2,
        price: 35000,
        image: "apartment2.jpg",
        description: "Spacious luxury condo with ocean view"
      },
      {
        id: 3,
        name: "Family Home",
        location: "Gordon Heights",
        squareFeet: 400,
        bedrooms: 4,
        bathrooms: 3,
        petFriendly: 'yes',
        hasParking: 'yes',
        furnished: 'yes',
        parking: 2,
        price: 45000,
        image: "apartment3.jpg",
        description: "Perfect family home in a quiet neighborhood"
      }
    ];

    this.route.params.subscribe(params => {
      const id = +params['id']; // Convert string to number
      this.apartment = mockApartments.find(apt => apt.id === id);
    });
  }
}
