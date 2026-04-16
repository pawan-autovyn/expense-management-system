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
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
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
