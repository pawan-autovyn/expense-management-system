import { buildCsvContent } from './export.utils';

describe('export utils', () => {
  it('builds quoted CSV output with escaped values', () => {
    const csv = buildCsvContent(
      [
        {
          id: 'exp-1',
          title: 'Pantry, tea',
          amount: 1680,
        },
      ],
      [
        { label: 'ID', key: 'id' },
        { label: 'Title', key: 'title' },
        { label: 'Amount', key: 'amount' },
      ],
    );

    expect(csv).toBe('"ID","Title","Amount"\n"exp-1","Pantry, tea","1680"');
  });
});
