import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface BudgetCardView {
  id: string;
  title: string;
  assignee: string;
  used: number;
  budget: number;
  percent: number;
  tone: 'success' | 'warning' | 'danger';
}

interface MonthlyBudgetBar {
  label: string;
  budget: number;
  actual: number;
  budgetHeight: number;
  actualHeight: number;
}

@Component({
  selector: 'app-admin-budgets',
  standalone: true,
  imports: [CurrencyPipe, IconComponent],
  templateUrl: './admin-budgets.component.html',
  styleUrl: './admin-budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBudgetsComponent {
  protected readonly overage = 1500;
  protected readonly axisTicks = ['200000', '150000', '100000', '50000'];
  protected readonly featuredBudgets: BudgetCardView[] = [
    {
      id: 'travel',
      title: 'Travel',
      assignee: 'Rahul S.',
      used: 45000,
      budget: 50000,
      percent: 90,
      tone: 'warning',
    },
    {
      id: 'fuel',
      title: 'Fuel',
      assignee: 'All',
      used: 28500,
      budget: 30000,
      percent: 95,
      tone: 'warning',
    },
    {
      id: 'office-supplies',
      title: 'Office Supplies',
      assignee: 'Priya M.',
      used: 12000,
      budget: 25000,
      percent: 48,
      tone: 'success',
    },
    {
      id: 'repairs',
      title: 'Repairs',
      assignee: 'Sneha R.',
      used: 22000,
      budget: 40000,
      percent: 55,
      tone: 'success',
    },
    {
      id: 'marketing',
      title: 'Marketing',
      assignee: 'Vikram D.',
      used: 36500,
      budget: 35000,
      percent: 104,
      tone: 'danger',
    },
    {
      id: 'utilities',
      title: 'Utilities',
      assignee: 'Amit K.',
      used: 14000,
      budget: 20000,
      percent: 70,
      tone: 'success',
    },
  ];
  protected readonly budgetBars: MonthlyBudgetBar[] = [
    { label: 'Jan', budget: 200000, actual: 164000, budgetHeight: 100, actualHeight: 82 },
    { label: 'Feb', budget: 200000, actual: 186000, budgetHeight: 100, actualHeight: 93 },
    { label: 'Mar', budget: 200000, actual: 157000, budgetHeight: 100, actualHeight: 79 },
    { label: 'Apr', budget: 200000, actual: 196000, budgetHeight: 100, actualHeight: 98 },
    { label: 'May', budget: 200000, actual: 172000, budgetHeight: 100, actualHeight: 86 },
    { label: 'Jun', budget: 200000, actual: 188000, budgetHeight: 100, actualHeight: 94 },
  ];
}
