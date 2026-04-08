import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { IconComponent } from '../icon/icon.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'badge';
  cell?: (row: unknown) => string | number;
}

export interface TableAction {
  id: string;
  label: string;
  icon: string;
  visible?: (row: unknown) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, EmptyStateComponent, IconComponent, StatusBadgeComponent],
  template: `
    @if (rows().length) {
      <div class="table-wrapper glass-card">
        <table class="data-table">
          <thead>
            <tr>
              @for (column of columns(); track column.key) {
                <th>{{ column.label }}</th>
              }
              @if (actions().length) {
                <th class="table-actions">Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track rowTrackBy()(row)) {
              <tr>
                @for (column of columns(); track column.key) {
                  <td>
                    @switch (column.type ?? 'text') {
                      @case ('currency') {
                        {{ resolveCell(row, column) | currency: 'INR' : 'symbol' : '1.0-0' }}
                      }
                      @case ('date') {
                        {{ resolveCell(row, column) | date: 'MMM d, y' }}
                      }
                      @case ('badge') {
                        <app-status-badge [label]="resolveCell(row, column).toString()" />
                      }
                      @default {
                        {{ resolveCell(row, column) }}
                      }
                    }
                  </td>
                }
                @if (actions().length) {
                  <td class="table-actions">
                    @for (action of actions(); track action.id) {
                      @if (!action.visible || action.visible(row)) {
                        <button
                          type="button"
                          class="table-action-button"
                          [attr.aria-label]="action.label"
                          (click)="actionTriggered.emit({ actionId: action.id, row })"
                        >
                          <app-icon [name]="action.icon" [size]="16" />
                        </button>
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <app-empty-state
        title="Nothing to show"
        description="Try changing filters or create a new expense entry."
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<unknown[]>();
  readonly actions = input<TableAction[]>([]);
  readonly rowTrackBy = input<(row: unknown) => string | number>((row) =>
    typeof row === 'object' && row !== null && 'id' in row ? String((row as { id: unknown }).id) : String(row),
  );
  readonly actionTriggered = output<{ actionId: string; row: unknown }>();

  protected resolveCell(row: unknown, column: TableColumn): string | number {
    if (column.cell) {
      return column.cell(row);
    }

    if (typeof row === 'object' && row !== null && column.key in row) {
      return String((row as Record<string, unknown>)[column.key]);
    }

    return '';
  }
}
