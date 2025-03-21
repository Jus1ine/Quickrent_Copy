import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PropertyService, Property, Rating } from '../services/property.service';
import { ChatService, ChatMessage as ServiceChatMessage } from '../services/chat.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { LocalStorageService } from '../services/local-storage.service';

interface ChatMessage {
  text: string;
  sent: boolean;
  time: string;
}

interface Reservation {
  propertyId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  totalPrice: number;
}

@Component({
  selector: 'app-description',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.css'],
  styles: [`
    .rating-section {
      margin-top: 20px;
      padding: 15px;
      border-top: 1px solid #eee;
    }
    
    .stars {
      display: flex;
      gap: 5px;
      margin: 10px 0;
    }
    
    .fa-star {
      cursor: pointer;
      color: #ddd;
    }
    
    .fa-star.active {
      color: #ffd700;
    }
    
    .rating-stats {
      font-size: 0.9em;
      color: #666;
    }
  `]
})
export class DescriptionComponent implements OnInit, AfterViewChecked {
  apartment: Property | null = null;
  currentImageIndex = 0;
  images: string[] = [];

  showChatModal = false;
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private shouldScrollToBottom = false;

  userRating = 0;
  hasRated = false;

  activeTab: 'property' | 'description' | 'ratings' = 'description';

  showReserveModal = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  totalPrice: number = 0;
  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // Max 1 year ahead

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  userComment: string = '';
  ratings: Rating[] = [];
  
  showThankYouModal = false;

  showRatingModal = false;

  isBookmarked: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private chatService: ChatService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    console.log('Description component initialized');
    this.route.params.subscribe(params => {
      const id = params['id'];
      console.log('Loading property with ID:', id);
      this.propertyService.getProperty(id).subscribe(property => {
        if (property) {
          console.log('Property loaded:', property);
          this.apartment = property;
          this.loadRatings();
          this.checkIfUserHasRated();
          this.checkIfBookmarked();
        } else {
          console.error('Property not found with ID:', id);
        }
      });
    });
  }

  getImageUrl(): string {
    if (!this.apartment?.images) return '';
    return this.apartment.images[this.currentImageIndex];
  }

  nextImage() {
    if (!this.apartment?.images) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.apartment.images.length;
  }

  previousImage() {
    if (!this.apartment?.images) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.apartment.images.length) % this.apartment.images.length;
  }

  toggleChat() {
    this.showChatModal = !this.showChatModal;
    if (this.showChatModal) {
      // Load existing messages if any
      if (this.apartment) {
        const existingMessages = this.chatService.getMessages(this.apartment.id);
        if (existingMessages && existingMessages.length > 0) {
          this.chatMessages = existingMessages.map((msg: ServiceChatMessage) => ({
            text: msg.content,
            sent: msg.type === 'received', // If message is 'received' by landlord, it was sent by renter
            time: msg.time
          }));
        }
      }
      this.shouldScrollToBottom = true;
    }
  }

  toggleReserveModal() {
    this.showReserveModal = !this.showReserveModal;
    if (this.showReserveModal) {
      // Reset form
      this.startDate = null;
      this.endDate = null;
      this.totalPrice = 0;
      // Reset minDate to today
      this.minDate = new Date();
      this.minDate.setHours(0, 0, 0, 0);
    }
  }

  onDateSelection(date: Date | null) {
    if (!date) return;
    
    if (!this.startDate || (this.startDate && this.endDate)) {
      // First click or new selection after both dates were selected
      this.startDate = date;
      this.endDate = null;
    } else {
      // Second click - select end date
      if (date < this.startDate) {
        // If end date is before start date, swap them
        this.endDate = this.startDate;
        this.startDate = date;
      } else {
        this.endDate = date;
      }
      this.calculateTotalPrice();
    }
  }

  // Helper method to highlight selected date range
  isInRange(date: Date): boolean {
    if (!this.startDate || !this.endDate) return false;
    return date >= this.startDate && date <= this.endDate;
  }

  // Helper method to check if a date is the start or end date
  isStartOrEndDate(date: Date): boolean {
    if (!date) return false;
    const isStart = this.startDate ? date.getTime() === this.startDate.getTime() : false;
    const isEnd = this.endDate ? date.getTime() === this.endDate.getTime() : false;
    return isStart || isEnd;
  }

  calculateTotalPrice() {
    if (this.apartment && this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      // Set time to midnight for accurate day calculation
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const months = days / 30; // Approximate months
      this.totalPrice = Math.ceil(months * (this.apartment.price || 0));
    } else {
      this.totalPrice = 0;
    }
  }

  submitReservation() {
    if (!this.apartment || !this.startDate || !this.endDate) return;

    // Format dates safely
    const formattedStartDate = this.formatDate(this.startDate);
    const formattedEndDate = this.formatDate(this.endDate);

    const reservation: Reservation = {
      propertyId: this.apartment.id,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      status: 'pending',
      totalPrice: this.totalPrice
    };

    // Add reservation to property service
    this.propertyService.addReservation(reservation).subscribe(
      (success) => {
        if (success) {
          // Send message to landlord about the reservation
          const message = `I would like to reserve this property from ${formattedStartDate} to ${formattedEndDate}`;
          this.sendMessage(message);
          
          // Close modal and show confirmation
          this.toggleReserveModal();
          alert('Reservation request sent! Please wait for the landlord to approve.');
        } else {
          alert('Failed to submit reservation. Please try again.');
        }
      }
    );
  }

  // Helper method to safely format dates
  private formatDate(date: Date): string {
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  sendMessage(customMessage?: string) {
    const messageToSend = customMessage || this.newMessage;
    
    if (messageToSend.trim() && this.apartment) {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
      }).toLowerCase();

      // Add user (renter) message to local chat
      const userMessage = {
        text: messageToSend,
        sent: true,
        time: currentTime
      };
      this.chatMessages.push(userMessage);

      // Check if this is the first message
      const existingMessages = this.chatService.getMessages(this.apartment.id);
      if (existingMessages.length === 0) {
        // First message - create contact
        const contact = {
          id: this.apartment.id,
          type: 'renter',
          name: 'Potential Renter',
          time: currentTime,
          seen: false,
          content: messageToSend,
          unread: 1,
          avatar: 'assets/profile.jpg',
          conversation: []
        };
        this.chatService.addContact(contact);
      }
      
      // Add message to chat service
      this.chatService.addMessage(this.apartment.id, messageToSend, false);
      
      // Only clear input if it's not a custom message
      if (!customMessage) {
        this.newMessage = '';
      }
      this.shouldScrollToBottom = true;
    }
  }

  scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  setRating(rating: number) {
    console.log('Setting rating to:', rating);
    this.userRating = rating;
  }

  loadRatings() {
    try {
      console.log('Loading ratings for apartment:', this.apartment);
      if (this.apartment?.ratings && this.apartment.ratings.length > 0) {
        // Make a deep copy to avoid reference issues
        this.ratings = JSON.parse(JSON.stringify(this.apartment.ratings));
        
        // Ensure timestamps are properly converted to Date objects
        this.ratings = this.ratings.map(rating => ({
          ...rating,
          timestamp: new Date(rating.timestamp)
        }));
        
        // Sort ratings by date (newest first)
        this.ratings.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        console.log('Loaded and sorted ratings:', this.ratings);
      } else {
        this.ratings = [];
        console.log('No ratings found for this property');
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
      this.ratings = [];
    }
  }

  setActiveTab(tab: 'property' | 'description' | 'ratings') {
    this.activeTab = tab;
    if (tab === 'ratings') {
      this.loadRatings(); // Refresh ratings when tab is opened
    }
  }

  toggleRatingModal() {
    console.log('Toggle rating modal called, current state:', this.showRatingModal);
    this.showRatingModal = !this.showRatingModal;
    console.log('New modal state:', this.showRatingModal);
    
    if (!this.showRatingModal) {
      // Reset form when closing modal without submitting
      this.userRating = 0;
      this.userComment = '';
    }
  }

  submitRating() {
    try {
      console.log('Submit rating called with rating:', this.userRating, 'and comment:', this.userComment);
      
      if (!this.apartment || !this.userRating || !this.userComment.trim()) {
        console.error('Cannot submit rating: missing apartment, rating, or comment');
        return;
      }
      
      // Create a new rating object
      const newRating: Rating = {
        rating: this.userRating,
        comment: this.userComment.trim(),
        timestamp: new Date(),
        userName: 'You',
        isCurrentUser: true
      };
      
      console.log('Created new rating object:', newRating);
      
      // Create a deep copy of the apartment
      const updatedApartment = JSON.parse(JSON.stringify(this.apartment));
      
      // Initialize ratings array if needed
      if (!updatedApartment.ratings) {
        updatedApartment.ratings = [];
      }
      
      // Add the new rating
      updatedApartment.ratings.unshift(newRating);
      
      // Calculate new average rating
      const currentRating = updatedApartment.rating || 0;
      const currentTotalRatings = updatedApartment.totalRatings || 0;
      const newTotalRatings = currentTotalRatings + 1;
      const newRatingAvg = ((currentRating * currentTotalRatings) + this.userRating) / newTotalRatings;
      
      updatedApartment.rating = newRatingAvg;
      updatedApartment.totalRatings = newTotalRatings;
      
      console.log('Updated apartment with new rating:', updatedApartment);
      
      // Update the property in the service
      this.propertyService.updateProperty(updatedApartment.id, {
        ratings: updatedApartment.ratings,
        rating: updatedApartment.rating,
        totalRatings: updatedApartment.totalRatings
      }).subscribe({
        next: (success) => {
          if (success) {
            console.log('Rating submitted successfully');
            
            // Update local apartment object
            this.apartment = updatedApartment;
            
            // Close rating modal
            this.showRatingModal = false;
            
            // Clear form
            this.userComment = '';
            this.userRating = 0;
            
            // Show thank you modal
            this.showThankYouModal = true;
            console.log('Thank you modal should be visible:', this.showThankYouModal);
            
            // Reload ratings
            this.loadRatings();
            
            // Force change detection
            setTimeout(() => {
              console.log('Thank you modal is still visible:', this.showThankYouModal);
            }, 100);
          } else {
            console.error('Failed to submit rating');
            alert('Failed to submit your rating. Please try again.');
          }
        },
        error: (err) => {
          console.error('Error submitting rating:', err);
          alert('Error submitting your rating. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error in submitRating:', error);
      alert('An error occurred while submitting your rating. Please try again.');
    }
  }
  
  closeThankYouModal() {
    try {
      console.log('Closing thank you modal');
      this.showThankYouModal = false;
    } catch (error) {
      console.error('Error closing thank you modal:', error);
    }
  }

  checkIfUserHasRated() {
    try {
      if (this.apartment) {
        const hasRated = localStorage.getItem(`rated_${this.apartment.id}`);
        this.hasRated = hasRated === 'true';
        console.log(`Checking if user has rated property ${this.apartment.id}:`, this.hasRated);
      }
    } catch (error) {
      console.error('Error checking if user has rated:', error);
      this.hasRated = false;
    }
  }

  navigateToDescription(apartmentId: number) {
    this.router.navigate(['/description', apartmentId]);
  }

  chatWithLandlord() {
    if (this.apartment) {
      this.toggleChat();
      
      // If no messages yet, send an initial greeting
      if (this.chatMessages.length === 0) {
        setTimeout(() => {
          this.sendMessage('Hi, I\'m interested in this property. Is it still available?');
        }, 500);
      }
    }
  }

  updateRating(rating: number) {
    this.userRating = rating;
    console.log('Rating updated to:', rating);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-image.jpg';
  }

  checkIfBookmarked(): void {
    if (this.apartment) {
      const bookmarks = this.localStorageService.getItem('bookmarks') || [];
      this.isBookmarked = bookmarks.some((bookmark: any) => bookmark.id === this.apartment?.id);
    }
  }

  toggleBookmark(): void {
    if (!this.apartment) return;
    
    let bookmarks = this.localStorageService.getItem('bookmarks') || [];
    
    if (this.isBookmarked) {
      // Remove from bookmarks
      bookmarks = bookmarks.filter((bookmark: any) => bookmark.id !== this.apartment?.id);
      this.isBookmarked = false;
    } else {
      // Add to bookmarks
      bookmarks.push({
        id: this.apartment.id,
        title: this.apartment.name,
        price: this.apartment.price,
        location: this.apartment.location,
        image: this.apartment.images && this.apartment.images.length > 0 ? this.apartment.images[0] : null,
        type: this.apartment.type,
        bedrooms: this.apartment.bedrooms,
        bathrooms: this.apartment.bathrooms,
        area: this.apartment.area
      });
      this.isBookmarked = true;
    }
    
    this.localStorageService.setItem('bookmarks', bookmarks);
  }

  // New methods for separate date selection
  onMoveInDateSelected(date: Date | null) {
    if (!date) return;
    
    this.startDate = date;
    
    // If end date is before new start date, reset end date
    if (this.endDate && this.endDate < this.startDate) {
      this.endDate = null;
    }
    
    // Recalculate price if both dates are selected
    if (this.startDate && this.endDate) {
      this.calculateTotalPrice();
    }
  }
  
  onMoveOutDateSelected(date: Date | null) {
    if (!date) return;
    
    // Ensure move-out date is not before move-in date
    if (this.startDate && date >= this.startDate) {
      this.endDate = date;
      this.calculateTotalPrice();
    } else if (!this.startDate) {
      // If for some reason user selects move-out first, set it as move-in
      this.startDate = date;
    }
  }
}
