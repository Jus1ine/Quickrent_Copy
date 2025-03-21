import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotPasswordComponent } from './forgotpassword/forgotpassword.component';
import { HomeComponent } from './home/home.component';
import { RentComponent } from './rent/rent.component';
import { AccountComponent } from './account/account.component';
import { UploadComponent } from './upload/upload.component';
import { DescriptionComponent } from './description/description.component';
import { ApartmentDetailsComponent } from './apartment-details/apartment-details.component';
import { LandingpageComponent } from './landingpage/landingpage.component';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'landing', component: LandingpageComponent },
  { path: 'rent', component: RentComponent },
  { path: 'account', component: AccountComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'description/:id', component: DescriptionComponent },
  { path: 'apartments/:id', component: ApartmentDetailsComponent },
  { path: '**', redirectTo: '/landing' },
];
