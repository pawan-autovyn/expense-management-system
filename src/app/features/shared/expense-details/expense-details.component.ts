import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { DirectoryService } from '../../../core/services/directory.service';
import { ExpenseRepositoryService } from '../../../core/services/expense-repository.service';
import { ActivityTimelineComponent, TimelineItem } from '../../../shared/components/activity-timeline/activity-timeline.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ReceiptPreviewModalComponent } from '../../../shared/components/receipt-preview-modal/receipt-preview-modal.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-expense-details',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ActivityTimelineComponent,
    EmptyStateComponent,
    ReceiptPreviewModalComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './expense-details.component.html',
  styleUrl: './expense-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly directoryService = inject(DirectoryService);
  private readonly expenseRepository = inject(ExpenseRepositoryService);
  protected previewOpen = false;
  protected readonly expense = computed(() =>
    this.expenseRepository.getExpenseById(this.route.snapshot.paramMap.get('id') ?? ''),
  );
  protected readonly categoryName = computed(
    () => this.directoryService.getCategoryById(this.expense()?.categoryId ?? '')?.name ?? 'Unknown',
  );
  protected readonly timelineItems = computed<TimelineItem[]>(() =>
    (this.expense()?.auditTrail ?? []).map((entry) => ({
      id: entry.id,
      title: entry.action,
      description: `${entry.actor}: ${entry.note}`,
      date: entry.date,
      tone: entry.tone,
    })),
  );

  constructor() {
    const expenseId = this.route.snapshot.paramMap.get('id');

    if (expenseId) {
      void this.expenseRepository.fetchExpenseById(expenseId);
    }
  }
}
