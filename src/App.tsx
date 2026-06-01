import React, { useState, useMemo } from 'react';
import { Layout, LineChart as ChartIcon, MessageSquare, Database, Sparkles, LogOut, BookOpen, Wand2 } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DataSummary } from './components/DataSummary';
import { DataTable } from './components/DataTable';
import { Visualizer } from './components/Visualizer';
import { AnalystChat } from './components/AnalystChat';
import { DataStoryteller } from './components/DataStoryteller';
import { DataCleaner } from './components/DataCleaner';
import { Dataset, AnalysisResponse, VizConfig } from './types';
import { getVisualizationForQuery } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'visualize' | 'data' | 'insights' | 'story' | 'clean'>('summary');
  
  // Power BI style User Query Option states
  const [userQuery, setUserQuery] = useState('');
  const [userVizConfig, setUserVizConfig] = useState<VizConfig | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Auto-generate query suggestions based on loaded columns
  const querySuggestions = useMemo(() => {
    if (!dataset) return [];
    const numeric = dataset.columns.filter(c => c.type === 'number').map(c => c.name);
    const categorical = dataset.columns.filter(c => c.type === 'string' || c.type === 'boolean' || c.type === 'date').map(c => c.name);

    const suggest = [];
    if (categorical.length > 0 && numeric.length > 0) {
      suggest.push(`bar chart of ${numeric[0]} by ${categorical[0]}`);
    }
    if (numeric.length > 1) {
      suggest.push(`scatter plot of ${numeric[0]} vs ${numeric[1]}`);
    } else if (numeric.length > 0 && categorical.length > 0) {
      suggest.push(`line chart of ${numeric[0]} grouped by ${categorical[0]}`);
    }
    if (categorical.length > 0) {
      suggest.push(`pie chart of ${categorical[0]} values`);
    } else if (numeric.length > 0) {
      suggest.push(`area chart of ${numeric[0]}`);
    }
    return suggest;
  }, [dataset]);

  const onDataLoaded = (data: Dataset) => {
    setDataset(data);
    setAnalysis(null);
    setUserVizConfig(null);
    setUserQuery('');
    setQueryError(null);
  };

  const onDatasetUpdated = (updated: Dataset) => {
    setDataset(updated);
    setUserVizConfig(null);
  };

  const reset = () => {
    setDataset(null);
    setAnalysis(null);
    setUserVizConfig(null);
    setUserQuery('');
    setQueryError(null);
    setActiveTab('summary');
  };

  const handleQuerySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuery.trim() || !dataset) return;

    setIsQuerying(true);
    setQueryError(null);
    try {
      const config = await getVisualizationForQuery(userQuery, dataset);
      if (config && config.xAxis && config.yAxis) {
        setUserVizConfig(config);
      } else {
        setQueryError("Could not map this query to columns in the dataset. Try specifying column names or using query suggestions below.");
      }
    } catch (err) {
      setQueryError("An error occurred during visualization layout generation. Let's try another wording.");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-16 border-b border-brand-line/10 flex items-center justify-between px-6 bg-white shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-ink rounded-lg flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">AnalystIQ</span>
        </div>
        
        {dataset && (
          <div className="flex items-center gap-6">
            <div className="flex bg-brand-ink/5 p-1 rounded-xl">
              <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={<Layout className="w-3.5 h-3.5" />} label="Overview" />
              <TabButton active={activeTab === 'clean'} onClick={() => setActiveTab('clean')} icon={<Wand2 className="w-3.5 h-3.5" />} label="Clean" />
              <TabButton active={activeTab === 'story'} onClick={() => setActiveTab('story')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Story" />
              <TabButton active={activeTab === 'visualize'} onClick={() => setActiveTab('visualize')} icon={<ChartIcon className="w-3.5 h-3.5" />} label="Visuals" />
              <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database className="w-3.5 h-3.5" />} label="Raw Data" />
            </div>
            <button 
              onClick={reset}
              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors group relative"
              title="Unload Dataset"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 overflow-auto bg-brand-bg flex flex-col">
        <AnimatePresence mode="wait">
          {!dataset ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl w-full mx-auto p-12 py-24"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">The Next-Gen Data Analyst</h1>
                <p className="text-brand-muted text-lg max-w-xl mx-auto">
                  Upload your spreadsheet and let AnalystIQ handle the cleaning, analysis, and visualization for you.
                </p>
              </div>
              <FileUpload onDataLoaded={onDataLoaded} />
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full"
            >
              <div className="lg:col-span-8 space-y-6">
                {activeTab === 'summary' && (
                  <DataSummary dataset={dataset} />
                )}

                {activeTab === 'clean' && (
                  <DataCleaner dataset={dataset} onDatasetUpdated={onDatasetUpdated} />
                )}

                {activeTab === 'story' && (
                  <DataStoryteller dataset={dataset} />
                )}
                
                {activeTab === 'visualize' && (
                  <div className="space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-brand-line/10 shadow-sm">
                      <div>
                        <h2 className="text-xl font-black text-brand-ink uppercase tracking-wider flex items-center gap-2">
                          <ChartIcon className="w-5 h-5 text-[#118DFF]" /> Power BI Interactive Workspace
                        </h2>
                        <p className="text-xs text-brand-muted font-medium mt-1">
                          Query your sheet details using natural language or explore AI-engineered metrics.
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <div className="px-3 py-1 bg-[#118DFF]/5 border border-[#118DFF]/20 rounded-full text-[10px] font-black text-[#118DFF] uppercase tracking-widest flex items-center gap-1.5">
                          <div className="size-1.5 rounded-full bg-[#118DFF] animate-ping" />
                          {analysis?.suggestedVisualizations.length || 0} Auto Reports Loaded
                        </div>
                      </div>
                    </div>

                    {/* Natural Language Query Box - Power BI Q&A feature style */}
                    <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <div className="w-1.5 h-4 bg-[#118DFF] rounded-sm" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-brand-ink">
                          Enterprise Q&A: Ask questions about your data variables
                        </h3>
                      </div>

                      <form onSubmit={handleQuerySubmit} className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Type a chart request... e.g., 'bar chart of sales vs categories' or 'scatter plot of price and rating'"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-[#FAF9F6] border border-slate-200 rounded-lg text-sm text-[#1E293B] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#118DFF]/20 focus:border-[#118DFF] transition-all font-sans"
                          />
                          <div className="absolute right-3 top-3.5 text-slate-400">
                            <Sparkles className="w-4 h-4 animate-pulse text-[#118DFF]" />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isQuerying || !userQuery.trim()}
                          className={`px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest text-white transition-all flex items-center gap-2 shrink-0 ${
                            isQuerying || !userQuery.trim()
                              ? 'bg-slate-300 cursor-not-allowed'
                              : 'bg-brand-ink hover:bg-[#118DFF] shadow-md'
                          }`}
                        >
                          {isQuerying ? 'Analyzing...' : 'Generate Visual'}
                        </button>
                      </form>

                      {/* Pill suggestions */}
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mr-1">Suggested Prompts:</span>
                          {querySuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setUserQuery(suggestion);
                                // Set in query & trigger immediately
                                setTimeout(() => {
                                  const triggerBtn = document.getElementById('nl-qna-trigger-hidden');
                                  if (triggerBtn) triggerBtn.click();
                                }, 80);
                              }}
                              className="text-[10px] bg-slate-100 hover:bg-[#118DFF]/10 hover:text-[#118DFF] border border-slate-200 rounded-full px-3 py-1 text-slate-600 font-bold transition-all"
                            >
                              {suggestion}
                            </button>
                          ))}
                          {/* Hidden button to bypass browser form trigger */}
                          <button id="nl-qna-trigger-hidden" type="submit" className="hidden" onClick={() => handleQuerySubmit()} />
                        </div>

                        {/* Interactive columns tags/chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-dashed border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mr-1">Variables list (click to add):</span>
                          {dataset.columns.map((col, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const current = userQuery.endsWith(' ') || userQuery === '' ? userQuery : userQuery + ' ';
                                setUserQuery(current + col.name);
                              }}
                              className="text-[10px] bg-[#FAF9F6] border border-slate-200/80 hover:border-[#118DFF]/40 rounded px-2.5 py-0.5 text-[#1E293B] font-mono font-bold flex items-center gap-1.5 transition-all group"
                            >
                              <span className={`text-[8px] px-1 font-sans font-extrabold rounded ${col.type === 'number' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                                {col.type === 'number' ? '#' : 'Aa'}
                              </span>
                              <span className="group-hover:text-[#118DFF]">{col.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Custom query load rendering area */}
                    {(isQuerying || userVizConfig || queryError) && (
                      <div className="space-y-4">
                        <div className="bg-[#FAF9F6] rounded-xl border border-[#DEE2E6] overflow-hidden">
                          {isQuerying && (
                            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                              <div className="rounded-full bg-[#118DFF]/10 p-4 animate-spin border-t-2 border-b-2 border-[#118DFF]">
                                <Sparkles className="w-6 h-6 text-[#118DFF]" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-[#111827]">Consulting AnalystIQ Gemini Agent...</h4>
                                <p className="text-xs text-slate-400">Inspecting spreadsheet dimensions & mapping chart axes model</p>
                              </div>
                            </div>
                          )}

                          {queryError && !isQuerying && (
                            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                              <div className="size-10 rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center text-sm font-extrabold font-sans">!</div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-[#111827]">Axis Mapping Alert</h4>
                                <p className="text-xs text-slate-500 max-w-md">{queryError}</p>
                              </div>
                              <button
                                onClick={() => setQueryError(null)}
                                className="text-[10px] font-black uppercase text-[#118DFF] hover:underline"
                              >
                                Clear alert
                              </button>
                            </div>
                          )}

                          {userVizConfig && !isQuerying && (
                            <div className="relative">
                              {/* Special header indicating custom chart */}
                              <div className="bg-[#118DFF] text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Active Custom Perspective Generated from: "{userVizConfig.title}"</span>
                                </div>
                                <button
                                  onClick={() => setUserVizConfig(null)}
                                  className="bg-white/20 hover:bg-white/30 text-white font-black px-2.5 py-1 rounded transition-all text-[9px]"
                                >
                                  Close Custom View
                                </button>
                              </div>
                              <div className="p-6">
                                <Visualizer config={userVizConfig} data={dataset.data} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* General gallery header */}
                    <div className="border-b border-slate-200 pb-2">
                      <h3 className="text-xs font-black text-brand-muted uppercase tracking-wider">
                        Power BI Structured Smart Tile Reports
                      </h3>
                    </div>

                    {/* Suggested Visualizations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                      {analysis?.suggestedVisualizations.map((v, i) => (
                        <div 
                          key={i} 
                          className={`${i === 0 ? 'lg:col-span-4 lg:row-span-2' : 'lg:col-span-2'} min-h-[500px] flex flex-col`}
                        >
                          <Visualizer config={v} data={dataset.data} />
                        </div>
                      ))}
                    </div>

                    {!analysis && (
                      <div className="h-96 bg-white border border-[#DEE2E6] rounded-xl flex flex-col items-center justify-center opacity-70 italic text-sm">
                        <Sparkles className="w-8 h-8 mb-4 text-[#118DFF] animate-pulse" />
                        <span className="font-bold text-slate-700">AnalystIQ is calculating optimal dimensions...</span>
                        <p className="text-xs text-brand-muted mt-2">Uploading metadata to extract structured report metrics</p>
                      </div>
                    )}
                  </div>
                )/*activeTab === 'visualize'*/}

                {activeTab === 'data' && (
                  <DataTable dataset={dataset} />
                )}

                {activeTab !== 'clean' && activeTab !== 'story' && analysis && analysis.insights.length > 0 && (
                  <div className="glass-panel p-6">
                    <h3 className="text-sm font-mono font-bold uppercase mb-4 flex items-center gap-2 tracking-widest">
                      <Sparkles className="w-3.5 h-3.5" /> Automated Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.insights.map((insight, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/50 border border-brand-line/5 text-sm leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-ink mt-2 shrink-0" />
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 sticky top-6 self-start space-y-6">
                <AnalystChat 
                  dataset={dataset} 
                  onAnalysisResult={setAnalysis} 
                />
                
                {activeTab !== 'clean' && analysis && analysis.suggestions.length > 0 && (
                  <div className="glass-panel p-4">
                    <h4 className="text-[10px] font-bold uppercase text-brand-muted mb-3 flex items-center gap-1.5 tracking-wider">
                      <MessageSquare className="w-3 h-3" /> Integrity Alerts
                    </h4>
                    <div className="space-y-2">
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} className="text-xs p-2.5 rounded-lg bg-white/60 border border-brand-line/5 flex items-start gap-2">
                          <div className="size-4 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center text-yellow-700 text-[10px] shrink-0 mt-0.5">!</div>
                          {s}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab('clean')}
                      className="w-full mt-4 py-2 border border-brand-ink/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-ink hover:text-white transition-all"
                    >
                      Open Cleaning Lab
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${
        active 
          ? 'bg-white shadow-sm text-brand-ink' 
          : 'text-brand-muted hover:text-brand-ink hover:bg-white/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
