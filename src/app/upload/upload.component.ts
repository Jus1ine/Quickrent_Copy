import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService, Property } from '../services/property.service';

interface ImagePreview {
  url: string;
  file: File;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  uploadForm: FormGroup;
  propertyImages: ImagePreview[] = [];
  virtualImage: ImagePreview | null = null;

  // Add cities array
  cities: string[] = ['Olongapo', 'Subic', 'Gapo'];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private propertyService: PropertyService
  ) {
    this.uploadForm = this.fb.group({
      type: ['', Validators.required],
      propertyName: ['', Validators.required],
      currency: ['PHP', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      bedroom: ['', [Validators.required, Validators.min(0)]],
      bathroom: ['', [Validators.required, Validators.min(0)]],
      city: ['', Validators.required],
      furnished: [false],
      unfurnished: [false],
      petFriendly: [false],
      hasParking: [false],
      comments: [''],
      country: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  navigateBack() {
    this.router.navigate(['/rent']);
  }

  onPropertyImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const remainingSlots = 5 - this.propertyImages.length;
      const filesToAdd = Array.from(input.files).slice(0, remainingSlots);
      
      filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            this.propertyImages.push({
              url: e.target.result,
              file: file
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  onVirtualImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          this.virtualImage = {
            url: e.target.result,
            file: file
          };
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.propertyImages.splice(index, 1);
  }

  removeVirtualImage() {
    this.virtualImage = null;
  }

  onSubmit() {
    if (this.uploadForm.valid && this.propertyImages.length > 0) {
      const formValue = this.uploadForm.value;
      const property: Property = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        name: formValue.propertyName,
        location: formValue.city,
        price: Number(formValue.price),
        type: formValue.type,
        bedrooms: Number(formValue.bedroom),
        bathrooms: Number(formValue.bathroom),
        features: this.getSelectedFeatures(),
        area: '0 sq ft',
        imageUrl: this.propertyImages[0]?.url || '',
        images: this.propertyImages.map(img => img.url),
        virtualTourImage: this.virtualImage?.url,
        status: 'available',
        country: formValue.country,
        state: formValue.state,
        city: formValue.city,
        zipCode: formValue.zipCode,
        address: {
          country: formValue.country,
          state: formValue.state,
          city: formValue.city,
          zipCode: formValue.zipCode,
          fullAddress: formValue.address
        },
        comments: formValue.comments || 'No comments available',
        ownerName: 'Property Owner',
        rating: 0,
        totalRatings: 0
      };

      try {
        this.propertyService.addProperty(property);
        this.router.navigate(['/rent']);
      } catch (error) {
        console.error('Error adding property:', error);
      }
    } else {
      if (this.propertyImages.length === 0) {
        alert('Please upload at least one property image');
      }
      this.markFormGroupTouched(this.uploadForm);
    }
  }

  private getSelectedFeatures(): string[] {
    const features = [];
    if (this.uploadForm.get('furnished')?.value) features.push('furnished');
    if (this.uploadForm.get('unfurnished')?.value) features.push('unfurnished');
    if (this.uploadForm.get('petFriendly')?.value) features.push('petFriendly');
    if (this.uploadForm.get('hasParking')?.value) features.push('hasParking');
    return features;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
