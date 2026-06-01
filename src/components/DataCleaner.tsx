import React, { useState } from 'react';
import { 
  Trash2, RefreshCw, Eraser, Filter, Check, AlertTriangle, Zap, 
  Save, FolderOpen, Calendar, ArrowRight, Play, Info, Sparkles 
} from 'lucide-react';
import { Dataset, ColumnMetadata } from '../types';
import { applyCleaning, CleaningAction } from '../lib/cleaningUtils';

interface DataCleanerProps {
  dataset: Dataset;
  onDatasetUpdated: (dataset: Dataset) => void;
}

interface SavedSequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  actions: CleaningAction[];
}

export function DataCleaner({ dataset, onDatasetUpdated }: DataCleanerProps) {
  const [step, setStep] = useState(1);
  const [pendingActions, setPendingActions] = useState<CleaningAction[]>([]);
  const [notif, setNotif] = useState<string | null>(null);

  // Load preset sequences from persistent storage (local storage)
  const [savedSequences, setSavedSequences] = useState<SavedSequence[]>(() => {
    try {
      const stored = localStorage.getItem('analyst_iq_cleaner_presets');
      return stored ? JSON.parse(stored) : [
        {
          id: 'demo-preset',
          name: 'Core Duplicate & Outlier Recipe',
          description: 'Standard enterprise pipeline: drops redundant rows, mode/mean filling, and outlier IQR mapping.',
          createdAt: 'System Base',
          actions: [
            { type: 'remove_duplicates' },
            { type: 'remove_outliers', columnName: dataset.columns.find(c => c.type === 'number')?.name || 'value', method: 'iqr' }
          ]
        }
      ];
    } catch (_) {
      return [];
    }
  });

  const [newSeqName, setNewSeqName] = useState('');
  const [newSeqDesc, setNewSeqDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addAction = (action: CleaningAction) => {
    setPendingActions(prev => [...prev, action]);
  };

  const removePending = (index: number) => {
    setPendingActions(prev => prev.filter((_, i) => i !== index));
  };

  const applyChanges = () => {
    const updated = applyCleaning(dataset, pendingActions);
    onDatasetUpdated(updated);
    setPendingActions([]);
    setNotif(`Step ${step} sequence complete. Dataset updated successfully.`);
    if (step === 1) setStep(2);
    else setStep(1);
    setTimeout(() => setNotif(null), 3000);
  };

  const saveSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim() || pendingActions.length === 0) return;

    const newSeq: SavedSequence = {
      id: Math.random().toString(36).substring(2, 9),
      name: newSeqName.trim(),
      description: newSeqDesc.trim() || 'Custom set of database transformations',
      createdAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      actions: [...pendingActions]
    };

    const updated = [newSeq, ...savedSequences];
    setSavedSequences(updated);
    localStorage.setItem('analyst_iq_cleaner_presets', JSON.stringify(updated));
    setNewSeqName('');
    setNewSeqDesc('');
    setIsSaving(false);
    setNotif(`Formula "${newSeq.name}" saved successfully to recipes!`);
    setTimeout(() => setNotif(null), 3000);
  };

  const loadSequence = (preset: SavedSequence, method: 'replace' | 'append') => {
    if (method === 'replace') {
      setPendingActions(preset.actions);
    } else {
      setPendingActions(prev => [...prev, ...preset.actions]);
    }
    setNotif(`Loaded ${preset.actions.length} actions from recipe "${preset.name}"`);
    setTimeout(() => setNotif(null), 3500);
  };

  const deleteSequence = (id: string) => {
    const updated = savedSequences.filter(s => s.id !== id);
    setSavedSequences(updated);
    localStorage.setItem('analyst_iq_cleaner_presets', JSON.stringify(updated));
  };

  // Inspect if column specified in action fits currently loaded columns
  const isActionCompatible = (action: CleaningAction): { compatible: boolean; message: string } => {
    const colNames = dataset.columns.map(c => c.name);
    
    switch (action.type) {
      case 'remove_duplicates':
        return { compatible: true, message: 'All record matching' };
      
      case 'drop_column':
        return { 
          compatible: colNames.includes(action.columnName),
          message: colNames.includes(action.columnName) 
            ? `Targets field "${action.columnName}"` 
            : `Col "${action.columnName}" missing (will skip)`
        };
      
      case 'drop_missing':
        return { 
          compatible: colNames.includes(action.columnName),
          message: colNames.includes(action.columnName) 
            ? `Targets field "${action.columnName}"` 
            : `Col "${action.columnName}" missing`
        };
      
      case 'fill_missing':
        return { 
          compatible: colNames.includes(action.columnName),
          message: colNames.includes(action.columnName) 
            ? `Targets field "${action.columnName}" (${action.strategy})` 
            : `Col "${action.columnName}" missing`
        };
      
      case 'remove_outliers':
        return { 
          compatible: colNames.includes(action.columnName),
          message: colNames.includes(action.columnName) 
            ? `Targets field "${action.columnName}" (${action.method})` 
            : `Col "${action.columnName}" missing`
        };
      
      case 'rename_column':
        return { 
          compatible: colNames.includes(action.oldName),
          message: colNames.includes(action.oldName) 
            ? `Targets field "${action.oldName}" -> "${action.newName}"` 
            : `Source "${action.oldName}" missing`
        };
      
      default:
        return { compatible: true, message: 'Valid' };
    }
  };

  const columnsWithMissing = dataset.columns.filter(c => c.missingCount > 0);
  const numericColumns = dataset.columns.filter(c => c.type === 'number');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-ink uppercase tracking-wider flex items-center gap-2">
            <Eraser className="w-5 h-5 text-[#118DFF]" /> Database Transformation Lab
          </h2>
          <p className="text-xs text-brand-muted font-medium mt-1">
            Step {step} of 2: {step === 1 ? 'Logical Integrity (Duplicates & Nulls)' : 'Statistical Refinement (Outlier Filtering & Pruning)'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-brand-ink/5 p-1 rounded-xl">
             <button 
              onClick={() => { setStep(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${step === 1 ? 'bg-white shadow-sm text-[#118DFF]' : 'opacity-40 hover:opacity-100 text-[#1E293B]'}`}
             >
               Step 1
             </button>
             <button 
              onClick={() => { setStep(2); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${step === 2 ? 'bg-white shadow-sm text-[#118DFF]' : 'opacity-40 hover:opacity-100 text-[#1E293B]'}`}
             >
               Step 2
             </button>
          </div>
          {pendingActions.length > 0 && (
            <button 
              onClick={applyChanges}
              className="bg-[#118DFF] hover:bg-brand-ink text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow transition-all active:scale-95"
            >
              <Check className="w-4 h-4" /> Finalize Sequence ({pendingActions.length})
            </button>
          )}
        </div>
      </div>

      {notif && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-2.5 animate-pulse shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {notif}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main transformation building column */}
        <div className="lg:col-span-8 space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-lg border border-[#DEE2E6] shadow-sm">
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#1E293B] mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <RefreshCw className="w-3.5 h-3.5 text-[#118DFF]" /> Logical & Structural Integrity
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Standard deduplication recipe block */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-black uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
                        <span className="w-1.5 h-3.5 bg-[#118DFF] rounded-sm" /> Full Record Deduplication
                      </div>
                      <p className="text-[11px] text-brand-muted leading-relaxed">
                        Scans for absolute matching rows and drops duplicate entries. Keeps the primary record instance.
                      </p>
                    </div>
                    <button 
                      onClick={() => addAction({ type: 'remove_duplicates' })}
                      className="w-full py-2.5 bg-brand-ink hover:bg-[#118DFF] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                    >
                      Queue Dedupe Rule
                    </button>
                  </div>

                  {/* Null resolving logic block */}
                  {columnsWithMissing.length > 0 ? (
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4">
                       <div className="space-y-1.5">
                         <div className="text-xs font-black uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
                           <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm" /> Null Resolution Engine
                         </div>
                         <p className="text-[11px] text-brand-muted leading-relaxed">
                           Apply specific value calculation strategies for empty column entries in numeric indices.
                         </p>
                       </div>
                       
                       <div className="overflow-y-auto max-h-48 pr-1 space-y-2">
                         {columnsWithMissing.map(col => (
                           <div key={col.name} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200 flex-wrap gap-2">
                             <div className="text-[10px] font-black font-mono text-slate-700 truncate max-w-[120px]" title={col.name}>
                               {col.name} ({col.missingCount} ∅)
                             </div>
                             <div className="flex gap-1 shrink-0">
                                <button 
                                  onClick={() => addAction({ type: 'fill_missing', columnName: col.name, strategy: 'median' })}
                                  className="text-[9px] font-black px-2 py-1 bg-slate-50 hover:bg-brand-ink hover:text-white rounded border border-slate-200 transition-colors"
                                >
                                  Median
                                </button>
                                <button 
                                  onClick={() => addAction({ type: 'fill_missing', columnName: col.name, strategy: 'mean' })}
                                  className="text-[9px] font-black px-2 py-1 bg-slate-50 hover:bg-brand-ink hover:text-white rounded border border-slate-200 transition-colors"
                                >
                                  Mean
                                </button>
                                <button 
                                  onClick={() => addAction({ type: 'fill_missing', columnName: col.name, strategy: 'mode' })}
                                  className="text-[9px] font-black px-2 py-1 bg-slate-50 hover:bg-brand-ink hover:text-white rounded border border-slate-200 transition-colors"
                                >
                                  Mode
                                </button>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center text-center text-emerald-800">
                       <Check className="w-8 h-8 mb-2 text-emerald-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest block">No Null Cells Found</span>
                       <p className="text-[10px] text-emerald-700/80 mt-1">All columns in this dataset are fully loaded!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-white p-6 rounded-lg border border-[#DEE2E6] shadow-sm">
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#1E293B] mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Filter className="w-3.5 h-3.5 text-[#118DFF]" /> Outlier Filtering & Statistical Refinement
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {numericColumns.length > 0 ? (
                      numericColumns.map(col => (
                        <div key={col.name} className="p-4 rounded-xl bg-slate-50 border border-slate-250 space-y-4">
                           <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                              <div className="text-xs font-black font-mono text-slate-700 truncate max-w-[150px]">{col.name}</div>
                              <span className="text-[8px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Numeric</span>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => addAction({ type: 'remove_outliers', columnName: col.name, method: 'iqr' })}
                                className="py-2.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-brand-ink hover:text-white transition-all shadow-sm"
                              >
                                Filter IQR Outliers
                              </button>
                              <button 
                                onClick={() => addAction({ type: 'remove_outliers', columnName: col.name, method: 'zscore' })}
                                className="py-2.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-brand-ink hover:text-white transition-all shadow-sm"
                              >
                                Z-Score (3 STD)
                              </button>
                           </div>
                        </div>
                      ))
                   ) : (
                     <div className="col-span-full p-12 text-center bg-slate-50 rounded-lg border border-slate-150 text-slate-400 italic text-xs">
                        No numeric columns detected for statistical refinement.
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {/* Prunings */}
          <div className="bg-white p-6 rounded-lg border border-[#DEE2E6] shadow-sm">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <Trash2 className="w-3.5 h-3.5 text-red-500" /> Prune Columns Block
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dataset.columns.map(col => (
                <div key={col.name} className="flex flex-col justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-red-200 transition-all shadow-sm group relative overflow-hidden">
                  <span className="text-[10px] font-mono font-black text-slate-700 truncate mb-2">{col.name}</span>
                  <button 
                    onClick={() => addAction({ type: 'drop_column', columnName: col.name })}
                    className="mt-auto px-2 py-1 text-red-600 hover:bg-red-50 rounded text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Drop Column
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Queue & Persistent presets columns */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Queue panel */}
          <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest flex items-center gap-2">
                <Eraser className="w-3.5 h-3.5 text-[#118DFF]" /> Processing Queue
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                {pendingActions.length} Actions queued
              </span>
            </div>
            
            {pendingActions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-[9px] uppercase font-black tracking-widest leading-loose opacity-60">
                  Transaction queue empty.<br/>Select action cards to process.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {pendingActions.map((action, i) => {
                  const check = isActionCompatible(action);
                  return (
                    <div key={i} className={`group flex flex-col p-3 rounded-lg border transition-all ${check.compatible ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/60 border-amber-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">
                            {action.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold font-mono text-brand-ink truncate max-w-[150px]">
                            {(action as any).columnName || 'Full Dataset'}
                          </span>
                        </div>
                        <button 
                          onClick={() => removePending(i)} 
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-white rounded-md transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${check.compatible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {check.compatible ? 'Compatible' : 'Incompatible'}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold truncate max-w-[170px]" title={check.message}>
                          {check.message}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* In-queue formula saver trigger */}
            {pendingActions.length > 0 && (
              <div className="pt-3 border-t border-slate-100 mt-4">
                {!isSaving ? (
                  <button
                    onClick={() => setIsSaving(true)}
                    className="w-full bg-[#FAF9F6] border border-slate-200 hover:border-slate-300 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#1E293B] flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5 text-[#118DFF]" /> Save this Pipeline Recipe
                  </button>
                ) : (
                  <form onSubmit={saveSequence} className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <span className="text-[9px] font-black uppercase text-[#1E293B]">Save cleaning pipeline</span>
                      <button 
                        type="button" 
                        onClick={() => setIsSaving(false)}
                        className="text-[9px] font-bold text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-500 block">Recipe Name</label>
                      <input
                        type="text"
                        required
                        value={newSeqName}
                        onChange={(e) => setNewSeqName(e.target.value)}
                        placeholder="e.g., Marketing Sheet Cleanup"
                        className="w-full bg-white border border-slate-200 p-1.5 text-xs font-bold rounded"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-500 block">Description</label>
                      <input
                        type="text"
                        value={newSeqDesc}
                        onChange={(e) => setNewSeqDesc(e.target.value)}
                        placeholder="e.g., Duplicates drop + IQR Outliers"
                        className="w-full bg-white border border-slate-200 p-1.5 text-xs rounded"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand-ink text-white py-2 rounded text-[9px] font-black uppercase tracking-widest shadow"
                    >
                      Confirm Save Formula
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Persistent Recipe presets management block */}
          <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FolderOpen className="w-4 h-4 text-[#118DFF]" />
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#1E293B]" title="Saved Recipe presets">
                Formula Recipes Library
              </h3>
            </div>

            <p className="text-[10px] text-brand-muted leading-relaxed">
              These saved sequences of transformations are cached in your workspace, ready to be applied instantly to completely different spreadsheet uploads!
            </p>

            <div className="space-y-3">
              {savedSequences.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-[10px] italic">
                  No custom formulas saved yet. Create a queue sequence to record.
                </div>
              ) : (
                savedSequences.map((preset) => (
                  <div 
                    key={preset.id} 
                    className="p-3 bg-[#FAF9F6] rounded-xl border border-slate-200 space-y-2.5 flex flex-col hover:border-[#118DFF]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-700 block max-w-[170px] truncate" title={preset.name}>
                          {preset.name}
                        </span>
                        <span className="text-[9px] text-[#6B7280] block leading-relaxed line-clamp-2">
                          {preset.description}
                        </span>
                      </div>

                      {preset.id !== 'demo-preset' && (
                        <button
                          onClick={() => deleteSequence(preset.id)}
                          className="text-[#6B7280] hover:text-red-500 p-1 hover:bg-slate-100 rounded transition-colors shrink-0"
                          title="Delete formula template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Pre-render list of actions of this template sequence */}
                    <div className="flex flex-wrap gap-1 border-t border-dashed border-slate-200 pt-2">
                      {preset.actions.map((act, actIdx) => (
                        <div 
                          key={actIdx} 
                          className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-slate-500"
                        >
                          {act.type === 'remove_duplicates' ? 'dedupe' : (act as any).columnName || 'action'}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => loadSequence(preset, 'replace')}
                        className="bg-brand-ink text-white hover:bg-[#118DFF] rounded p-1.5 text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        title="Delete any currently queued actions and load this"
                      >
                        <Play className="w-2.5 h-2.5" /> Load Formula
                      </button>
                      <button
                        onClick={() => loadSequence(preset, 'append')}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded p-1.5 text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 transition-all"
                        title="Append key actions to your active processing queue"
                      >
                        Add to Queue
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
