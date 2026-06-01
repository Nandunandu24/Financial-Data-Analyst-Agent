import React from 'react';
import { Database, Table, AlertCircle, Hash, Type } from 'lucide-react';
import { Dataset } from '../types';

interface DataSummaryProps {
  dataset: Dataset;
}

export function DataSummary({ dataset }: DataSummaryProps) {
  return (
    <div className="space-y-8">
      {/* KPI Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-brand-line/10 rounded-2xl overflow-hidden bg-white shadow-sm">
        <StatCard 
          icon={<Database className="w-4 h-4" />} 
          label="Total Records" 
          value={dataset.data.length.toLocaleString()} 
          borderRight
        />
        <StatCard 
          icon={<Table className="w-4 h-4" />} 
          label="Dimensions" 
          value={dataset.columns.length.toString()} 
          borderRight
        />
        <StatCard 
          icon={<Hash className="w-4 h-4" />} 
          label="Numeric Fields" 
          value={dataset.columns.filter(c => c.type === 'number').length.toString()} 
          borderRight
        />
        <StatCard 
          icon={<AlertCircle className="w-4 h-4 text-red-500/70" />} 
          label="Data Quality" 
          value={`${((1 - (dataset.columns.reduce((a, c) => a + c.missingCount, 0) / (dataset.data.length * dataset.columns.length))) * 100).toFixed(1)}%`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column Analysis Table */}
        <div className="lg:col-span-12 glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-line/5 bg-brand-ink/[0.02] flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-brand-ink" />
              Column Metadata & Health
            </h4>
            <div className="text-[10px] font-mono text-brand-muted uppercase">N={dataset.columns.length} Fields</div>
          </div>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-ink/[0.01]">
                <th className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted text-left border-b border-brand-line/5">Field Name</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted text-left border-b border-brand-line/5">Type</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted text-right border-b border-brand-line/5">Unique</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted text-right border-b border-brand-line/5">Missing</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase text-brand-muted text-left border-b border-brand-line/5">Distribution Scan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line/5">
              {dataset.columns.map((col) => (
                <tr key={col.name} className="hover:bg-brand-ink/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold font-mono tracking-tight group-hover:text-brand-ink transition-colors">{col.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-md bg-brand-ink/5 text-[9px] font-bold font-mono uppercase tracking-wider text-brand-muted">
                      {col.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-mono font-medium">{col.uniqueCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-mono ${col.missingCount > 0 ? 'text-red-500 font-bold' : 'text-brand-muted opacity-40'}`}>
                      {col.missingCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {col.sampleValues.slice(0, 3).map((v, i) => (
                        <div key={i} className="px-1.5 py-0.5 rounded bg-white border border-brand-line/5 text-[9px] font-mono text-brand-muted truncate max-w-[80px]">
                          {String(v)}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, borderRight }: { icon: React.ReactNode, label: string, value: string, borderRight?: boolean }) {
  return (
    <div className={`p-6 flex flex-col gap-4 bg-white hover:bg-brand-ink/[0.01] transition-colors ${borderRight ? 'border-r border-brand-line/10' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-brand-muted font-mono">{label}</div>
        <div className="opacity-40">{icon}</div>
      </div>
      <div className="text-3xl font-mono tracking-tighter font-medium tabular-nums">{value}</div>
    </div>
  );
}
