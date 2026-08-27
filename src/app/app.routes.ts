import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { RepairListComponent } from './features/repair-list/repair-list.component';
import { RepairDetailComponent } from './features/repair-detail/repair-detail.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'repair-list', component: RepairListComponent },
  { path: 'repair/:id', component: RepairDetailComponent },
];
