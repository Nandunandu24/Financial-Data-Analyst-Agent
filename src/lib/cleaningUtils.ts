import { Dataset, ColumnMetadata, DataRow } from '../types';

export type CleaningAction = 
  | { type: 'remove_duplicates' }
  | { type: 'drop_column', columnName: string }
  | { type: 'fill_missing', columnName: string, strategy: 'median' | 'mean' | 'mode' | 'static', value?: any }
  | { type: 'drop_missing', columnName: string }
  | { type: 'rename_column', oldName: string, newName: string }
  | { type: 'remove_outliers', columnName: string, method: 'iqr' | 'zscore' };

export function applyCleaning(dataset: Dataset, actions: CleaningAction[]): Dataset {
  let newData = [...dataset.data];
  let newColumns = [...dataset.columns];

  for (const action of actions) {
    switch (action.type) {
      case 'remove_duplicates': {
        const seen = new Set();
        newData = newData.filter(row => {
          const s = JSON.stringify(row);
          if (seen.has(s)) return false;
          seen.add(s);
          return true;
        });
        break;
      }

      case 'drop_column': {
        newData = newData.map(row => {
          const { [action.columnName]: _, ...rest } = row;
          return rest;
        });
        newColumns = newColumns.filter(c => c.name !== action.columnName);
        break;
      }

      case 'drop_missing': {
        newData = newData.filter(row => row[action.columnName] !== null && row[action.columnName] !== undefined && row[action.columnName] !== '');
        break;
      }

      case 'fill_missing': {
        const values = newData
          .map(row => row[action.columnName])
          .filter(v => v !== null && v !== undefined && v !== '');
        
        let fillValue = action.value;

        if (action.strategy === 'mean' && values.length > 0) {
          fillValue = values.reduce((a, b) => Number(a) + Number(b), 0) / values.length;
        } else if (action.strategy === 'median' && values.length > 0) {
          const sorted = [...values].sort((a, b) => Number(a) - Number(b));
          fillValue = sorted[Math.floor(sorted.length / 2)];
        } else if (action.strategy === 'mode' && values.length > 0) {
          const counts: Record<string, number> = {};
          values.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
          fillValue = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
          // Try to cast back to original type if number
          if (typeof values[0] === 'number') fillValue = Number(fillValue);
        }

        newData = newData.map(row => {
          if (row[action.columnName] === null || row[row[action.columnName]] === undefined || row[action.columnName] === '') {
            return { ...row, [action.columnName]: fillValue };
          }
          return row;
        });
        break;
      }

      case 'remove_outliers': {
        const values = newData
          .map(row => row[action.columnName])
          .filter(v => typeof v === 'number') as number[];
        
        if (values.length < 4) break;

        if (action.method === 'iqr') {
          const sorted = [...values].sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const lower = q1 - 1.5 * iqr;
          const upper = q3 + 1.5 * iqr;
          
          newData = newData.filter(row => {
            const v = row[action.columnName];
            if (typeof v !== 'number') return true;
            return v >= lower && v <= upper;
          });
        } else if (action.method === 'zscore') {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
          
          newData = newData.filter(row => {
            const v = row[action.columnName];
            if (typeof v !== 'number') return true;
            return Math.abs((v - mean) / std) <= 3;
          });
        }
        break;
      }

      case 'rename_column': {
        newData = newData.map(row => {
          const { [action.oldName]: val, ...rest } = row;
          return { ...rest, [action.newName]: val };
        });
        newColumns = newColumns.map(c => 
          c.name === action.oldName ? { ...c, name: action.newName } : c
        );
        break;
      }
    }
  }

  // Recalculate column metadata after cleaning
  const keys = newColumns.map(c => c.name);
  const updatedColumns: ColumnMetadata[] = keys.map(key => {
    const values = newData.map(row => row[key]).filter(v => v !== null && v !== undefined);
    const uniqueValues = new Set(values);
    const existingCol = newColumns.find(c => c.name === key);
    
    return {
      name: key,
      type: existingCol?.type || 'string',
      sampleValues: values.slice(0, 5),
      uniqueCount: uniqueValues.size,
      missingCount: newData.length - values.length
    };
  });

  return {
    ...dataset,
    data: newData,
    columns: updatedColumns
  };
}
