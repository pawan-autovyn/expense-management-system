export interface CsvColumn<T extends object> {
  label: string;
  key?: keyof T;
  getValue?: (row: T) => unknown;
}

function stringifyCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replaceAll('"', '""');
}

export function buildCsvContent<T extends object>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const header = columns.map((column) => `"${stringifyCsvValue(column.label)}"`).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.getValue ? column.getValue(row) : column.key ? row[column.key] : '';

        return `"${stringifyCsvValue(value)}"`;
      })
      .join(','),
  );

  return [header, ...body].join('\n');
}

export function downloadCsv(filename: string, csvContent: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
