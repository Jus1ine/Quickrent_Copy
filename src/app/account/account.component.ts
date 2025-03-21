import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChatService } from '../services/chat.service';
import { PropertyService, Property, Reservation } from '../services/property.service';
import { LocalStorageService } from '../services/local-storage.service';
import { UserService } from '../services/user.service';

interface ChatMessage {
  content: string;
  type: 'sent' | 'received';
  time: string;
}

interface ChatContact {
  id: string;
  type: string;
  name: string;
  time: string;
  seen: boolean;
  content: string;
  unread: number;
  avatar: string;
  conversation: ChatMessage[];
}

interface Apartment {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  status: Property['status'];
}

interface BookmarkItem {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  activeTab: 'messages' | 'apartments' | 'bookmarks' | 'about' = 'messages';
  selectedContact: ChatContact | null = null;
  properties: Property[] = [];
  messages: ChatContact[] = [
    {
      id: '1',
      type: 'renter',
      name: 'John Doe',
      time: 'Today, 9:52pm',
      seen: true,
      content: 'Hello',
      unread: 0,
      avatar: 'assets/profile.jpg',
      conversation: [
        { content: 'Hello', type: 'received', time: 'Today, 9:52pm' },
        { content: 'Hi there!', type: 'sent', time: 'Today, 9:53pm' }
      ]
    },
    {
      id: '2',
      type: 'renter',
      name: 'Jane Smith',
      time: 'Today, 12:11pm',
      seen: false,
      content: 'Is this available?1',
      unread: 1,
      avatar: 'assets/profile.jpg',
      conversation: [
        { content: 'Is this available?1', type: 'received', time: 'Today, 12:11pm' }
      ]
    },
    {
      id: '3',
      type: 'renter',
      name: 'Micheal Smith',
      time: 'Today, 12:11pm',
      seen: false,
      content: 'Is this available?2',
      unread: 1,
      avatar: 'assets/profile.jpg',
      conversation: [
        { content: 'Is this available?2', type: 'received', time: 'Today, 12:11pm' }
      ]
    },
    {
      id: '4',
      type: 'renter',
      name: 'Joe doe Smith',
      time: 'Today, 12:11pm',
      seen: false,
      content: 'Is this available?3',
      unread: 1,
      avatar: 'assets/profile.jpg',
      conversation: [
        { content: 'Is this available?3', type: 'received', time: 'Today, 12:11pm' }
      ]
    }
  ];

  isEditingName: boolean = false;
  userName: string = 'Name';
  userType: string = 'Renter';
  userEmail: string = 'Gmail';
  selectedFile: File | null = null;
  showModal: boolean = false;
  previewImage: string = 'assets/profile.jpg';

  // Add new properties for chat functionality
  currentMessage: string = '';

  // Add properties for other tabs
  userApartments: Apartment[] = [];

  bookmarkedApartments = [
    {
      id: '1',
      title: 'Luxury Condo',
      location: 'Downtown',
      price: 1500,
      image: 'assets/apartment2.jpg'
    }
  ];

  aboutInfo = {
    bio: 'I am a property owner with multiple apartments in the city.',
    phone: '+1234567890',
    address: '123 Main St, City',
    joinDate: 'January 2024'
  };

  // Add new properties for apartment editing
  showApartmentModal: boolean = false;
  editingApartment: Apartment | null = null;

  // Add this property
  bookmarks: BookmarkItem[] = [];

  // Add reservations
  propertyReservations: Reservation[] = [];

  // Add new property for reservation modal
  showReservationsModal = false;
  selectedPropertyReservations: Reservation[] = [];
  selectedPropertyId: string | null = null;

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private chatService: ChatService,
    private propertyService: PropertyService,
    private localStorageService: LocalStorageService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Subscribe to chat contacts
    this.chatService.contacts$.subscribe(contacts => {
      this.messages = contacts;
    });

    // Subscribe to properties
    this.propertyService.getProperties().subscribe((properties: Property[]) => {
      // Clear existing apartments before updating
      this.userApartments = [];
      
      // Only map unique properties based on ID
      const uniqueProperties = properties.reduce((acc: Property[], prop: Property) => {
        if (!acc.some((item: Property) => item.id === prop.id)) {
          acc.push(prop);
        }
        return acc;
      }, [] as Property[]);

      // Map unique properties to userApartments
      this.userApartments = uniqueProperties.map((prop: Property) => ({
        id: prop.id,
        title: prop.name,
        location: prop.location,
        price: prop.price,
        image: prop.imageUrl || 'assets/apartment1.jpg',
        status: prop.status
      }));
    });

    this.loadBookmarks();

    // Initialize user data
    const userData = this.userService.getUserData();
    this.userName = userData.name;
    this.userEmail = userData.email;
    this.previewImage = userData.profileImage;
    
    // Get user type from localStorage
    const storedUserType = localStorage.getItem('userType');
    if (storedUserType) {
      this.userType = storedUserType.charAt(0).toUpperCase() + storedUserType.slice(1); // Capitalize first letter
    }

    // Load reservations
    this.loadReservations();
  }

  setActiveTab(tab: 'messages' | 'apartments' | 'bookmarks' | 'about') {
    this.activeTab = tab;
    
    // Reload bookmarks when switching to the bookmarks tab
    if (tab === 'bookmarks') {
      this.loadBookmarks();
    }
  }

  selectConversation(contact: ChatContact) {
    this.selectedContact = contact;
    // Mark messages as read when selected
    contact.unread = 0;
    contact.seen = true;
  }

  navigateToRent() {
    this.router.navigate(['/rent']);
  }

  navigateToUpload() {
    this.router.navigate(['/upload']);
  }

  onChangeProfile(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Create a URL for the selected image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleEditName() {
    this.isEditingName = !this.isEditingName;
  }

  saveName() {
    this.isEditingName = false;
    // Here you would typically save to backend
  }

  triggerFileInput() {
    const fileInput = this.elementRef.nativeElement.querySelector('#profile-upload');
    if (fileInput) {
      fileInput.click();
    }
  }

  openEditModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveChanges() {
    this.userService.updateUserData({
      name: this.userName,
      email: this.userEmail,
      profileImage: this.previewImage
    });
    this.closeModal();
  }

  // Add new methods for chat functionality
  sendMessage() {
    if (this.currentMessage.trim() && this.selectedContact) {
      // Add message to chat service
      this.chatService.addMessage(this.selectedContact.id, this.currentMessage, true); // true because landlord is sending
      this.currentMessage = '';
    }
  }

  // Add methods for apartment management
  removeApartment(id: string) {
    if (confirm('Are you sure you want to remove this apartment?')) {
        // Call the service method to remove the property
        const removed = this.propertyService.removeProperty(id);
        if (removed) {
            // Update local array
            this.userApartments = this.userApartments.filter(apt => apt.id !== id);
            // Show success message
            this.showNotification('Apartment removed successfully');
        }
    }
  }

  private showNotification(message: string) {
    // You can implement a proper notification system here
    alert(message);
  }

  removeBookmark(id: string): void {
    const bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
    this.localStorageService.setItem('bookmarks', bookmarks);
    this.bookmarks = bookmarks;
  }

  // Add new methods for apartment editing
  editApartment(apartment: any) {
    this.editingApartment = { ...apartment };
    this.showApartmentModal = true;
  }

  saveApartmentChanges() {
    if (this.editingApartment) {
      const index = this.userApartments.findIndex(apt => apt.id === this.editingApartment?.id);
      if (index !== -1) {
        const updates: Partial<Property> = {
          name: this.editingApartment.title,
          location: this.editingApartment.location,
          price: this.editingApartment.price,
          status: this.editingApartment.status as Property['status']
        };
        
        this.propertyService.updateProperty(this.editingApartment.id, updates)
          .subscribe(success => {
            if (success) {
              this.userApartments[index] = { ...this.editingApartment! };
            }
            this.closeApartmentModal();
          });
      }
    }
  }

  closeApartmentModal() {
    this.showApartmentModal = false;
    this.editingApartment = null;
  }

  // Add these methods
  loadBookmarks(): void {
    this.bookmarks = this.localStorageService.getItem('bookmarks') || [];
    console.log('Loaded bookmarks:', this.bookmarks);
  }

  viewPropertyDetails(id: string): void {
    this.router.navigate(['/description', id]);
  }

  // Load reservations for the logged-in user's properties
  loadReservations() {
    this.propertyService.getMyPropertyReservations().subscribe(reservations => {
      this.propertyReservations = reservations;
    });
  }
  
  // Approve a reservation
  approveReservation(reservationId: string | undefined) {
    if (!reservationId) return;
    
    this.propertyService.approveReservation(reservationId).subscribe(success => {
      if (success) {
        // Find the reservation in the selected property reservations
        const index = this.selectedPropertyReservations.findIndex(r => r.id === reservationId);
        if (index !== -1) {
          // Update status
          this.selectedPropertyReservations[index].status = 'approved';
          
          // Calculate and show remaining days immediately
          const remainingDays = this.getRemainingDays(this.selectedPropertyReservations[index].endDate);
          
          // Show confirmation with countdown information
          alert(`Reservation approved! The renter can stay for ${remainingDays} days until ${this.formatDate(this.selectedPropertyReservations[index].endDate)}.`);
        }
      }
    });
  }
  
  // Reject a reservation
  rejectReservation(reservationId: string | undefined) {
    if (!reservationId) return;
    
    this.propertyService.rejectReservation(reservationId).subscribe(success => {
      if (success) {
        // Update propertyReservations array
        const index = this.propertyReservations.findIndex(r => r.id === reservationId);
        if (index !== -1) {
          this.propertyReservations[index].status = 'rejected';
        }
        
        // Also update selectedPropertyReservations array
        const selectedIndex = this.selectedPropertyReservations.findIndex(r => r.id === reservationId);
        if (selectedIndex !== -1) {
          this.selectedPropertyReservations[selectedIndex].status = 'rejected';
          alert(`Reservation rejected successfully.`);
        }
      }
    });
  }
  
  // Get remaining days for a reservation
  getRemainingDays(endDate: string): number {
    const end = new Date(endDate);
    const today = new Date();
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  // Format date as readable string
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Open reservations modal for a specific property
  openReservationsModal(propertyId: string) {
    this.selectedPropertyId = propertyId;
    this.propertyService.getMyPropertyReservations().subscribe(reservations => {
      // Filter reservations for this specific property
      this.selectedPropertyReservations = reservations.filter(r => r.propertyId === propertyId);
      this.showReservationsModal = true;
    });
  }

  // Close reservations modal
  closeReservationsModal() {
    this.showReservationsModal = false;
    this.selectedPropertyReservations = [];
    this.selectedPropertyId = null;
  }

  // Check if the user is a landowner
  isLandowner(): boolean {
    return this.userType.toLowerCase() === 'landowner';
  }
}
