import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ChevronLeft, ChevronRight, Sparkles, Wand2, Play, Pause, 
  Volume2, VolumeX, Grid, Presentation, Edit3, Save, CheckCircle2, 
  Plus, Trash2, Printer, Palette, RotateCcw, AlertCircle, LayoutGrid, Check, HelpCircle
} from 'lucide-react';
import { generateStory } from '../services/geminiService';
import { Dataset, DataStory, StorySlide, VizConfig } from '../types';
import { Visualizer } from './Visualizer';
import { motion, AnimatePresence } from 'motion/react';

interface DataStorytellerProps {
  dataset: Dataset;
}

const NARRATION_VOICES = [
  { name: 'Executive Analyst (Female)', lang: 'en-US' },
  { name: 'Enterprise Lead (Male)', lang: 'en-GB' }
];

const THEMES = {
  classic: {
    id: 'classic',
    name: 'PowerBI Slate',
    outerBg: 'bg-[#F3F4F6]',
    slideBg: 'bg-white',
    textMain: 'text-[#1E293B]',
    textMuted: 'text-[#64748B]',
    accent: '#118DFF',
    accentBg: 'bg-[#118DFF]/10 text-[#118DFF]',
    border: 'border-[#E2E8F0]',
    titleFont: 'font-sans font-extrabold',
    bodyFont: 'font-sans text-sm'
  },
  dark: {
    id: 'dark',
    name: 'Midnight Room',
    outerBg: 'bg-[#0f172a]',
    slideBg: 'bg-[#1e293b]',
    textMain: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: '#38bdf8',
    accentBg: 'bg-sky-500/10 text-sky-400',
    border: 'border-slate-800',
    titleFont: 'font-sans font-black',
    bodyFont: 'font-sans text-sm'
  },
  editorial: {
    id: 'editorial',
    name: 'Warm Editorial',
    outerBg: 'bg-[#FDFBF7]',
    slideBg: 'bg-white',
    textMain: 'text-[#1A1A1A]',
    textMuted: 'text-[#5A5A5A]',
    accent: '#854D0E',
    accentBg: 'bg-amber-100/60 text-amber-900',
    border: 'border-amber-200/50',
    titleFont: 'font-serif font-black tracking-tight',
    bodyFont: 'font-serif text-[15px] leading-relaxed'
  },
  teal: {
    id: 'teal',
    name: 'Sage Board",',
    outerBg: 'bg-teal-50/40',
    slideBg: 'bg-white',
    textMain: 'text-teal-950',
    textMuted: 'text-teal-700/80',
    accent: '#0d9488',
    accentBg: 'bg-teal-100 text-teal-900',
    border: 'border-teal-100',
    titleFont: 'font-sans font-bold',
    bodyFont: 'font-sans text-sm'
  }
};

export function DataStoryteller({ dataset }: DataStorytellerProps) {
  const [story, setStory] = useState<DataStory | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState('');
  
  // Custom enhanced interactive states
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>('classic');
  const [viewMode, setViewMode] = useState<'slides' | 'storyboard'>('slides');
  const [isNarrating, setIsNarrating] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isEditing, setIsEditing] = useState(false);
  
  // Custom manual edit state for selected slide
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedInsight, setEditedInsight] = useState('');
  const [editedX, setEditedX] = useState('');
  const [editedY, setEditedY] = useState('');
  const [editedType, setEditedType] = useState<VizConfig['type']>('bar');

  // AI interactive prompt modifier inside the slide deck
  const [aiCommand, setAiCommand] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const activeTheme = THEMES[themeKey];

  // Synthesis control
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    window.speechSynthesis?.cancel();
    setIsNarrating(false);
    try {
      const result = await generateStory(dataset, focus);
      setStory(result);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const speakCurrentSlide = () => {
    if (!story) return;
    window.speechSynthesis?.cancel();
    
    if (isNarrating) {
      setIsNarrating(false);
      return;
    }

    const currentSlide = story.slides[currentSlideIndex];
    const speechText = `${currentSlide.title}. ${currentSlide.content}. Critical impact takeaway: ${currentSlide.insight}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    
    // Choose voice matching English
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    
    utterance.rate = speechRate;
    utterance.onend = () => {
      setIsNarrating(false);
    };
    utterance.onerror = () => {
      setIsNarrating(false);
    };

    setIsNarrating(true);
    window.speechSynthesis.speak(utterance);
  };

  const nextSlide = () => {
    if (story && currentSlideIndex < story.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      window.speechSynthesis?.cancel();
      setIsNarrating(false);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      window.speechSynthesis?.cancel();
      setIsNarrating(false);
    }
  };

  // Sync edit form fields with current slide
  useEffect(() => {
    if (story?.slides[currentSlideIndex]) {
      const current = story.slides[currentSlideIndex];
      setEditedTitle(current.title);
      setEditedContent(current.content);
      setEditedInsight(current.insight);
      if (current.visualization) {
        setEditedX(current.visualization.xAxis);
        setEditedY(current.visualization.yAxis);
        setEditedType(current.visualization.type);
      }
    }
  }, [currentSlideIndex, story, isEditing]);

  const saveEditedSlide = () => {
    if (!story) return;
    const updatedSlides = [...story.slides];
    const original = updatedSlides[currentSlideIndex];
    
    updatedSlides[currentSlideIndex] = {
      ...original,
      title: editedTitle,
      content: editedContent,
      insight: editedInsight,
      visualization: original.visualization ? {
        ...original.visualization,
        xAxis: editedX,
        yAxis: editedY,
        type: editedType,
        title: editedTitle
      } : undefined
    };

    setStory({
      ...story,
      slides: updatedSlides
    });
    setIsEditing(false);
  };

  const deleteSlide = (indexToDelete: number) => {
    if (!story || story.slides.length <= 1) return;
    const remaining = story.slides.filter((_, idx) => idx !== indexToDelete);
    setStory({
      ...story,
      slides: remaining
    });
    // Adjust active index
    if (currentSlideIndex >= remaining.length) {
      setCurrentSlideIndex(remaining.length - 1);
    }
  };

  const handleInsertSlide = () => {
    if (!story) return;
    
    const numericCols = dataset.columns.filter(c => c.type === 'number').map(c => c.name);
    const catCols = dataset.columns.filter(c => c.type === 'string' || c.type === 'boolean').map(c => c.name);
    
    const newSlide: StorySlide = {
      title: 'Custom Dimension Breakdown',
      content: 'This custom report highlights key breakdowns of variables discovered during deep-dive calculations.',
      insight: 'A strong positive trend indicates key business momentum across the mapped data points.',
      visualization: {
        type: 'bar',
        xAxis: catCols[0] || dataset.columns[0]?.name || '',
        yAxis: numericCols[0] || dataset.columns[0]?.name || '',
        title: 'Custom Metric Comparison',
        description: 'Visual tracking generated by analyst'
      }
    };

    const newSlides = [...story.slides];
    newSlides.splice(currentSlideIndex + 1, 0, newSlide);
    setStory({
      ...story,
      slides: newSlides
    });
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  // Prompt Gemini to insert or modify story deck live!
  const handleAiRefinement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCommand.trim() || !story) return;

    setAiGenerating(true);
    setAiMessage(null);
    try {
      const promptText = `
        You are a presentation logic engine. 
        Modify the current presentation based on the user request.
        Request: "${aiCommand}"
        
        Dataset Structure: ${JSON.stringify(dataset.columns.map(c => ({ name: c.name, type: c.type })))}
        Current Presentation Title: "${story.title}"
        Current Slide Context: ${JSON.stringify(story.slides[currentSlideIndex])}
        
        Provide the result strictly as a single new or modified Slide object in JSON.
        Returned keys MUST be:
        1. title (string)
        2. content (string)
        3. insight (string)
        4. visualization (object with type [line, bar, scatter, area, pie], xAxis, yAxis, title)
      `;

      // Inline Gemini call
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const resp = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              insight: { type: Type.STRING },
              visualization: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['line', 'bar', 'scatter', 'area', 'pie'] },
                  xAxis: { type: Type.STRING },
                  yAxis: { type: Type.STRING },
                  title: { type: Type.STRING }
                },
                required: ['type', 'xAxis', 'yAxis', 'title']
              }
            },
            required: ['title', 'content', 'insight']
          }
        }
      });

      const chunk = JSON.parse(resp.text || '{}') as StorySlide;
      
      if (chunk && chunk.title) {
        const withDesc = {
          ...chunk,
          visualization: chunk.visualization ? {
            ...chunk.visualization,
            description: chunk.insight
          } : undefined
        };

        // Option A: Add as new slide, Option B: Overwrite current. Let's append as a brand new slide!
        const updated = [...story.slides];
        updated.splice(currentSlideIndex + 1, 0, withDesc);
        setStory({
          ...story,
          slides: updated
        });
        setCurrentSlideIndex(currentSlideIndex + 1);
        setAiMessage("Successfully created a custom AI slide and inserted it as Slide #" + (currentSlideIndex + 2));
        setAiCommand('');
      } else {
        setAiMessage("Could not understand command layout. Try using explicit column names.");
      }
    } catch (err) {
      console.error(err);
      setAiMessage("Could not execute refinement. Verify columns type formatting matching.");
    } finally {
      setAiGenerating(false);
    }
  };

  const printDocument = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-[600px] bg-white rounded-lg border border-[#DEE2E6] shadow-sm flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#118DFF]/10 border-t-[#118DFF] rounded-full animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#118DFF] animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h4 className="font-extrabold text-brand-ink">Aura-Story Narrative Builder</h4>
          <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
            Weaving key correlation vectors, outlier groups, and distribution curves into structured presentation slides...
          </p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-6">
          <div className="p-4 rounded-full bg-[#118DFF]/5 border border-[#118DFF]/10">
            <BookOpen className="w-10 h-10 text-[#118DFF]" />
          </div>
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[10px] font-black tracking-widest text-[#118DFF] uppercase">Storytelling Engine</span>
            <h2 className="text-2xl font-black text-brand-ink leading-tight">Compile Your Spreadsheet into a Narrative Presentation</h2>
            <p className="text-xs text-brand-muted font-medium leading-relaxed">
              Let AnalystIQ study the distributions, correlations, and trend dimensions of your sheet details, then build a step-by-step executive slide deck with individual insights.
            </p>
          </div>
          
          <div className="w-full max-w-md space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 block text-left">
                Theme or Goal Focus (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g., Target productivity growth, find anomalies, highlight top performers" 
                className="w-full bg-[#FAF9F6] border border-slate-200 rounded-lg px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#118DFF] transition-all"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              />
            </div>

            <button 
              onClick={handleGenerate}
              className="w-full bg-brand-ink hover:bg-[#118DFF] text-white rounded-lg py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
            >
              <Wand2 className="w-4 h-4" /> Synthesize Presentation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = story.slides[currentSlideIndex];

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto w-full">
      {/* Narrative Hub Menu */}
      <div className="bg-white p-4 rounded-lg border border-[#DEE2E6] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-[#118DFF] uppercase tracking-widest block">ACTIVE BOARD</span>
          <h3 className="text-base font-black text-brand-ink tracking-tight">{story.title}</h3>
        </div>

        {/* Presentation Controls toolbar */}
        <div className="flex items-center gap-3">
          {/* Theme customizer */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-400" /> Style:
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200 gap-0.5 font-sans">
              {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((tKey) => (
                <button
                  key={tKey}
                  onClick={() => setThemeKey(tKey)}
                  className={`text-[9px] px-2 py-1 rounded font-black transition-all ${themeKey === tKey ? 'bg-white text-brand-ink shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {THEMES[tKey].name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* View toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode('slides')}
              className={`p-1.5 rounded transition-all flex items-center gap-1 text-[10px] uppercase font-bold ${viewMode === 'slides' ? 'bg-white text-[#118DFF] shadow-sm' : 'text-slate-500'}`}
              title="Slide Deck View"
            >
              <Presentation className="w-3.5 h-3.5" /> Slides
            </button>
            <button
              onClick={() => setViewMode('storyboard')}
              className={`p-1.5 rounded transition-all flex items-center gap-1 text-[10px] uppercase font-bold ${viewMode === 'storyboard' ? 'bg-white text-[#118DFF] shadow-sm' : 'text-slate-500'}`}
              title="Storyboard Grid Layout"
            >
              <Grid className="w-3.5 h-3.5" /> Storyboard
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Export tools */}
          <button
            onClick={printDocument}
            className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 transition-all flex items-center gap-1.5 text-[10px] uppercase font-bold"
            title="Print Presentation Layout"
          >
            <Printer className="w-3.5 h-3.5" /> In-App Export
          </button>

          <button
            onClick={() => setStory(null)}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition-all text-[10px] uppercase font-bold"
          >
            Unload
          </button>
        </div>
      </div>

      {viewMode === 'slides' ? (
        /* SINGLE SLIDEDECK EXPERIENCE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Sidebar with slide indexes & editor controls */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Quick overview of all presentation chapters */}
            <div className="bg-white p-4 rounded-lg border border-[#DEE2E6] shadow-sm space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Slide Navigator
              </span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {story.slides.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      window.speechSynthesis?.cancel();
                      setIsNarrating(false);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-2.5 rounded border text-[11px] font-sans flex items-center justify-between gap-3 transition-all ${
                      currentSlideIndex === idx 
                        ? 'bg-[#118DFF]/5 border-[#118DFF] text-brand-ink font-bold' 
                        : 'bg-[#FAF9F6] border-slate-150 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[9px] size-4 rounded-full flex items-center justify-center font-bold font-mono ${currentSlideIndex === idx ? 'bg-[#118DFF] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {idx + 1}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </div>
                    
                    {story.slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(idx);
                        }}
                        className="text-slate-400 hover:text-red-500 p-0.5 transition-colors shrink-0"
                        title="Delete this slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                ))}
              </div>

              {/* Action buttons to add slides manually */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={handleInsertSlide}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-black uppercase text-[9px] tracking-wide py-2 rounded border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3 h-3" /> Add Blank Slide
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`w-full font-black uppercase text-[9px] tracking-wide py-2 rounded flex items-center justify-center gap-1.5 transition-all ${isEditing ? 'bg-[#118DFF]/10 text-[#118DFF] border border-[#118DFF]/40' : 'bg-slate-100 hover:bg-slate-200 text-[#1E293B] border border-slate-200'}`}
                >
                  <Edit3 className="w-3 h-3" /> {isEditing ? 'Close Editor' : 'Edit Current'}
                </button>
              </div>
            </div>

            {/* Main Interactive Slide Panel with Narrative */}
            <div className={`${activeTheme.slideBg} p-6 rounded-lg border ${activeTheme.border} shadow-sm flex-1 flex flex-col justify-between relative overflow-hidden transition-all duration-300`}>
              <div className="absolute top-0 left-0 w-[4px] h-full" style={{ backgroundColor: activeTheme.accent }} />

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className={`px-2.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider ${activeTheme.accentBg}`}>
                    Frame {currentSlideIndex + 1} of {story.slides.length}
                  </div>

                  {/* Narration Assist Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={speakCurrentSlide}
                      className={`p-1.5 rounded transition-all border flex items-center gap-1 text-[9px] font-bold ${isNarrating ? 'bg-teal-50 border-teal-200 text-teal-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-black'}`}
                      title="Audio Narrative Speak"
                    >
                      {isNarrating ? <Volume2 className="w-3 h-3 text-teal-600" /> : <Volume2 className="w-3 h-3" />}
                      Speech
                    </button>
                    {isNarrating && (
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1 rounded">
                        <span className="text-[8px] font-bold text-slate-400">Rate:</span>
                        <button onClick={() => setSpeechRate(0.8)} className={`text-[8px] px-0.5 font-bold ${speechRate === 0.8 ? 'text-black font-black' : 'text-slate-400'}`}>0.8x</button>
                        <button onClick={() => setSpeechRate(1.0)} className={`text-[8px] px-0.5 font-bold ${speechRate === 1.0 ? 'text-black font-black' : 'text-slate-400'}`}>1x</button>
                        <button onClick={() => setSpeechRate(1.2)} className={`text-[8px] px-0.5 font-bold ${speechRate === 1.2 ? 'text-black font-black' : 'text-slate-400'}`}>1.2x</button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  /* Slide editing layout */
                  <div className="space-y-3 font-sans pt-1">
                    <span className="text-[10px] uppercase font-black text-[#118DFF] tracking-wider block">Slide Custom Editor</span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Slide Title"
                        className="w-full bg-[#FAF9F6] border border-slate-200 rounded p-2 text-xs font-bold"
                      />
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Slide Narrative Description"
                        rows={4}
                        className="w-full bg-[#FAF9F6] border border-slate-200 rounded p-2 text-xs font-medium leading-relaxed"
                      />
                      <input
                        type="text"
                        value={editedInsight}
                        onChange={(e) => setEditedInsight(e.target.value)}
                        placeholder="Slide Takeaway Insight"
                        className="w-full bg-[#FAF9F6] border border-[#DEE2E6] rounded p-2 text-xs italic font-bold"
                      />

                      {currentSlide.visualization && (
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Visual Chart Mapping</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase">X Axis</label>
                              <select 
                                value={editedX} 
                                onChange={(e) => setEditedX(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-[10px] rounded p-1"
                              >
                                {dataset.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase">Y Axis (Metric)</label>
                              <select 
                                value={editedY} 
                                onChange={(e) => setEditedY(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-[10px] rounded p-1"
                              >
                                {dataset.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-slate-400 uppercase block">Chart Form</label>
                            <select 
                              value={editedType} 
                              onChange={(e) => setEditedType(e.target.value as VizConfig['type'])}
                              className="w-full bg-white border border-slate-200 text-[10px] rounded p-1"
                            >
                              <option value="bar">Bar Chart</option>
                              <option value="line">Line Chart</option>
                              <option value="area">Area Chart</option>
                              <option value="pie">Pie Chart</option>
                              <option value="scatter">Scatter Plot</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveEditedSlide}
                        className="flex-1 bg-brand-ink hover:bg-emerald-600 text-white font-bold text-[10px] uppercase py-2 rounded flex items-center justify-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Edits
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10px] font-bold py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Regular slide description */
                  <div className="space-y-4">
                    <h3 className={`${activeTheme.titleFont} text-xl tracking-tight leading-tight ${activeTheme.textMain}`}>
                      {currentSlide.title}
                    </h3>

                    <p className={`${activeTheme.bodyFont} font-medium leading-relaxed ${activeTheme.textMuted}`}>
                      {currentSlide.content}
                    </p>

                    <div className={`p-4 rounded-xl border italic text-xs ${activeTheme.accentBg} ${activeTheme.border}`}>
                      <span className="font-extrabold not-italic text-[10px] uppercase tracking-wider block mb-1">
                        Insight Target
                      </span>
                      "{currentSlide.insight}"
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation trigger button row */}
              <div className="flex items-center gap-2 pt-6 border-t border-slate-100 mt-6">
                <button 
                  onClick={prevSlide}
                  disabled={currentSlideIndex === 0}
                  className="flex-1 bg-[#FAF9F6] border border-slate-200 rounded-lg py-2.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 text-xs font-bold font-sans disabled:opacity-30 transition-all text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button 
                  onClick={nextSlide}
                  disabled={currentSlideIndex === story.slides.length - 1}
                  className="flex-1 bg-brand-ink text-white rounded-lg py-2.5 flex items-center justify-center gap-1.5 hover:bg-[#118DFF] text-xs font-black uppercase tracking-wider disabled:opacity-30 transition-all shadow"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Custom prompt command loop */}
            <div className="bg-white p-4 rounded-lg border border-[#DEE2E6] shadow-sm space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#118DFF]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Narrative Assistant Q&A
                </span>
              </div>
              <form onSubmit={handleAiRefinement} className="space-y-2">
                <p className="text-[10px] text-slate-400">Instruct Gemini to generate or adapt presentation segments:</p>
                <div className="relative">
                  <input
                    type="text"
                    value={aiCommand}
                    onChange={(e) => setAiCommand(e.target.value)}
                    placeholder="e.g., 'Add slide on user scores vs age'"
                    className="w-full pl-3 pr-8 py-2 bg-[#FAF9F6] border border-slate-200 rounded text-[11px] placeholder-slate-400 focus:outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-2 text-[#118DFF]">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {aiGenerating && (
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 bg-amber-50 rounded border border-amber-200/50 p-2">
                    <span className="animate-spin size-2 rounded-full border border-[#118DFF] border-t-transparent" />
                    Calculating structural layout model mapping...
                  </div>
                )}
                {aiMessage && (
                  <div className="text-[9px] text-slate-600 bg-slate-50 rounded border border-slate-200/50 p-2">
                    {aiMessage}
                  </div>
                )}
              </form>
            </div>

          </div>

          {/* Interactive Visualizer Canvas wrapper */}
          <div className="lg:col-span-8 overflow-hidden bg-white rounded-lg border border-[#DEE2E6] shadow-sm flex flex-col justify-between">
            <div className={`p-4 bg-slate-50 border-b border-[#ECECEE] text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                <span>Executive visual representation supporting "Slide {currentSlideIndex + 1}"</span>
              </div>
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex-1 min-h-[440px] p-6">
              {currentSlide.visualization ? (
                <Visualizer 
                  config={{
                    ...currentSlide.visualization,
                    description: currentSlide.insight
                  }} 
                  data={dataset.data} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center italic text-brand-muted text-xs space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-350" />
                  <span>No visualization was requested or mapped for this frame module</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STORYBOARD ALL-IN-ONE SYSTEM GRID VIEW (Print & Share ready!) */
        <div className="space-y-6">
          <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#DEE2E6] text-center space-y-1">
            <h4 className="text-sm font-extrabold text-[#111827]">Full Narrative Report Deck Snapshot</h4>
            <p className="text-xs text-brand-muted max-w-lg mx-auto">
              This layout renders all presentation slides and visual insights matching the report stream, optimized for executive exports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-12">
            {story.slides.map((s, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm overflow-hidden flex flex-col justify-between page-break-avoid"
              >
                {/* Header line referencing frame index */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">Chapter {index + 1} of {story.slides.length}</span>
                  <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{s.visualization?.type || 'narrative'}</span>
                </div>

                <div className="p-5 space-y-4">
                  <h4 className="text-sm font-black text-brand-ink">{s.title}</h4>
                  <p className="text-xs text-brand-muted leading-relaxed">{s.content}</p>
                  
                  <div className="p-3 bg-zinc-50 rounded border border-zinc-150 italic text-[11px] text-zinc-650">
                    <span className="font-bold uppercase text-[9px] not-italic text-zinc-400 block mb-0.5">Critical Insight:</span>
                    "{s.insight}"
                  </div>
                </div>

                {s.visualization && (
                  <div className="h-[280px] p-4 border-t border-slate-100 bg-white">
                    <Visualizer 
                      config={{
                        ...s.visualization,
                        description: s.insight
                      }} 
                      data={dataset.data} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
