import { Routes } from '@angular/router';
import { RepaymentCalculatorComponent } from './pages/repayment-calculator/repayment-calculator.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SavingsCalculatorComponent } from './pages/savings-calculator/savings-calculator.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  {
    path: 'repayment-calculator',
    component: RepaymentCalculatorComponent,
  },
  {
    path: 'savings-calculator',
    component: SavingsCalculatorComponent,
  },
];
