import React from 'react';
import { Dataset } from '../types';

interface DataTableProps {
  dataset: Dataset;
}

export function DataTable({ dataset }: DataTableProps) {
  const displayData = dataset.data.slice(0, 100);

  return (
    <div className="glass-panel overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-line/5 bg-brand-ink/[0.02] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-brand-ink animate-pulse" />
            Live Data Feed
          </h4>
          <span className="text-[9px] px-2 py-0.5 rounded bg-brand-ink/5 font-mono text-brand-muted uppercase">Rows: 001-100</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => <div key={i} className="size-1 rounded-full bg-brand-line/10" />)}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="border-b border-brand-line/10 bg-brand-ink/[0.01]">
              <th className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted tracking-wider w-16">idx</th>
              {dataset.columns.map(col => (
                <th key={col.name} className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted tracking-wider border-l border-brand-line/5 whitespace-nowrap">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line/5 font-mono">
            {displayData.map((row, i) => (
              <tr key={i} className="hover:bg-brand-ink/5 transition-all group">
                <td className="px-6 py-2.5 text-[10px] text-brand-muted/40 font-mono italic">
                  {(i + 1).toString().padStart(3, '0')}
                </td>
                {dataset.columns.map(col => (
                  <td 
                    key={col.name} 
                    className={`px-6 py-2.5 text-xs border-l border-brand-line/5 truncate max-w-[240px] group-hover:text-brand-ink transition-colors ${
                      typeof row[col.name] === 'number' ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {row[col.name] === null || row[col.name] === undefined 
                      ? <span className="opacity-20 italic">null</span> 
                      : String(row[col.name])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
