import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Sparkles, Settings2, BarChart2, LineChart as LineIcon, PieChart as PieIcon, 
  LayoutGrid, Sliders, Info, Percent, TrendingUp, ArrowDown, ArrowUp, Activity
} from 'lucide-react';
import { VizConfig, DataRow } from '../types';

interface VisualizerProps {
  config: VizConfig;
  data: DataRow[];
}

const POWERBI_PALETTES = {
  classic: {
    name: 'PowerBI Classic',
    colors: ['#118DFF', '#12239E', '#E6E6E6', '#F2C811', '#E0400A', '#008080', '#5F6B6D'],
    bg: 'bg-[#118DFF]/5',
    border: 'border-l-[#118DFF]'
  },
  vibrant: {
    name: 'Vibrant Pulse',
    colors: ['#008080', '#7E22CE', '#EC4899', '#059669', '#EAB308', '#2563EB', '#4B5563'],
    bg: 'bg-teal-50/50',
    border: 'border-l-teal-600'
  },
  warm: {
    name: 'Autumn Sun',
    colors: ['#EA580C', '#D97706', '#EAB308', '#B91C1C', '#854D0E', '#78350F', '#6B7280'],
    bg: 'bg-orange-50/50',
    border: 'border-l-orange-600'
  },
  neon: {
    name: 'Midnight Bloom',
    colors: ['#22C55E', '#06B6D4', '#A855F7', '#EC4899', '#EAB308', '#F43F5E', '#10B981'],
    bg: 'bg-[#22C55E]/5',
    border: 'border-l-emerald-500'
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const detailData = payload[0].payload;
    return (
      <div className="bg-[#1E1E24]/95 text-white backdrop-blur-md p-4 border border-zinc-700 rounded-lg shadow-xl max-w-[300px] font-mono text-xs">
        <div className="text-[10px] font-bold text-zinc-400 mb-2 border-b border-zinc-700/50 pb-1.5 flex justify-between items-center">
          <span>{label || 'Data Element'}</span>
          <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
        
        <div className="space-y-1.5 font-sans">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-3.5 rounded-sm" 
                  style={{ backgroundColor: entry.color || entry.fill }} 
                />
                <span className="font-semibold text-zinc-300">{entry.name}</span>
              </div>
              <span className="font-mono font-bold tabular-nums text-white">
                {String(entry.value).includes('.') ? Number(entry.value).toFixed(2) : Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-700/50">
          <div className="text-[8px] uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Context Dimensions</div>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(detailData).slice(0, 3).map(([key, value]) => {
              if (key === payload[0].dataKey || key === label) return null;
              if (typeof value === 'object' || value === null) return null;
              
              return (
                <div key={key} className="flex justify-between items-center text-[10px] gap-4">
                  <span className="text-zinc-400 capitalize truncate max-w-[100px]">{key}</span>
                  <span className="text-zinc-200 truncate max-w-[150px] font-bold">{String(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function Visualizer({ config, data }: VisualizerProps) {
  const [activeType, setActiveType] = useState<'line' | 'bar' | 'scatter' | 'area' | 'pie'>(config.type);
  const [paletteKey, setPaletteKey] = useState<keyof typeof POWERBI_PALETTES>('classic');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Sync activeType when config changes
  useEffect(() => {
    setActiveType(config.type);
  }, [config.type]);

  const activePalette = POWERBI_PALETTES[paletteKey];
  const themeColors = activePalette.colors;

  const chartMargins = { top: 20, right: 30, bottom: 40, left: 20 };
  const axisStyle = {
    fontSize: 9,
    fontFamily: 'JetBrains Mono',
    fill: '#4A5568',
    fontWeight: 700
  };

  // Robust key matching and auto-fallbacks
  const { resolvedXKey, resolvedYKey } = useMemo(() => {
    const sampleRow = data[0] || {};
    const datasetKeys = Object.keys(sampleRow);
    if (datasetKeys.length === 0) return { resolvedXKey: '', resolvedYKey: '' };

    const findBestMatch = (targetKey: string | undefined) => {
      if (!targetKey) return '';
      const lowerTarget = targetKey.toLowerCase().replace(/[_-]/g, ' ');
      
      // 1. Exact case-insensitive match
      let match = datasetKeys.find(k => k.toLowerCase() === lowerTarget);
      if (match) return match;

      // 2. Matching with stripping whitespaces/underscores
      match = datasetKeys.find(k => k.toLowerCase().replace(/[_-]/g, ' ') === lowerTarget);
      if (match) return match;

      // 3. Contains match
      match = datasetKeys.find(k => {
        const lowerK = k.toLowerCase().replace(/[_-]/g, ' ');
        return lowerK.includes(lowerTarget) || lowerTarget.includes(lowerK);
      });
      if (match) return match;

      return '';
    };

    let rx = findBestMatch(config.xAxis);
    let ry = findBestMatch(config.yAxis);

    // Dynamic fallback if keys aren't matched
    if (!rx) {
      // Find first string/date column or first column
      rx = datasetKeys.find(k => typeof sampleRow[k] === 'string') || datasetKeys[0] || '';
    }
    if (!ry) {
      // Find first number column or second column
      ry = datasetKeys.find(k => typeof sampleRow[k] === 'number') || datasetKeys[1] || datasetKeys[0] || '';
    }

    return { resolvedXKey: rx, resolvedYKey: ry };
  }, [data, config.xAxis, config.yAxis]);

  const targetXKey = config.xAxis || resolvedXKey;
  const targetYKey = config.yAxis || resolvedYKey;

  // Robustly sanitize data for plotting
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((row, idx) => {
      // Coerce y-axis to valid numbers for plotting
      const rawY = row[resolvedYKey];
      let yVal = 0;
      if (typeof rawY === 'number') {
        yVal = rawY;
      } else if (rawY !== undefined && rawY !== null) {
        let cleanStr = String(rawY).trim();
        // Handle negative numbers like (1,234.50)
        if (cleanStr.startsWith('(') && cleanStr.endsWith(')')) {
          cleanStr = '-' + cleanStr.slice(1, -1);
        }
        // Strip out currencies, trailing characters but keep minus and decimals
        const cleaned = cleanStr
          .replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        yVal = isNaN(parsed) ? 0 : parsed;
      }

      // Format empty or missing xValues gracefully
      const rawX = row[resolvedXKey];
      let xVal = rawX;
      if (rawX === undefined || rawX === null || rawX === '') {
        xVal = `Row ${idx + 1}`;
      } else if (typeof rawX === 'object') {
        xVal = JSON.stringify(rawX);
      } else {
        xVal = String(rawX);
      }

      return {
        ...row,
        [targetYKey]: yVal,
        [targetXKey]: xVal
      };
    });
  }, [data, resolvedXKey, resolvedYKey, targetXKey, targetYKey]);

  // Aggregated measures matching Power BI standard KPI boxes
  const stats = useMemo(() => {
    const numericValues = processedData
      .map(row => Number(row[targetYKey]))
      .filter(v => !isNaN(v) && v !== null && v !== undefined);

    const count = processedData.length;
    if (numericValues.length === 0) {
      return { sum: 0, avg: 0, max: 0, min: 0, count };
    }

    const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / numericValues.length;
    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    return { sum, avg, max, min, count };
  }, [processedData, targetYKey]);

  const renderChart = () => {
    switch (activeType) {
      case 'bar':
        return (
          <BarChart data={processedData} margin={chartMargins}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />}
            <XAxis dataKey={targetXKey} {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} tickMargin={10} />
            <YAxis {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
            <Bar dataKey={targetYKey} radius={[3, 3, 0, 0]} animationDuration={1000}>
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={themeColors[index % themeColors.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={processedData} margin={chartMargins}>
            {showGrid && <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />}
            <XAxis dataKey={targetXKey} {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} tickMargin={10} />
            <YAxis {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={targetYKey} 
              stroke={themeColors[0]} 
              strokeWidth={3} 
              dot={{ r: 3, fill: themeColors[0], strokeWidth: 1, stroke: '#fff' }} 
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} 
              animationDuration={800} 
            />
          </LineChart>
        );
      case 'scatter':
        return (
          <ScatterChart margin={chartMargins}>
            {showGrid && <CartesianGrid strokeDasharray="5 5" stroke="#E2E8F0" />}
            <XAxis dataKey={targetXKey} name={targetXKey} {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
            <YAxis dataKey={targetYKey} name={targetYKey} {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Points" data={processedData} fill={themeColors[0]} fillOpacity={0.6} stroke={themeColors[0]} strokeWidth={1} />
          </ScatterChart>
        );
      case 'area':
        return (
          <AreaChart data={processedData} margin={chartMargins}>
            <defs>
              <linearGradient id={`gradient-${targetYKey}-${paletteKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColors[0]} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={themeColors[0]} stopOpacity={0}/>
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />}
            <XAxis dataKey={targetXKey} {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} tickMargin={10} />
            <YAxis {...axisStyle} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={targetYKey} stroke={themeColors[0]} strokeWidth={2.5} fill={`url(#gradient-${targetYKey}-${paletteKey})`} animationDuration={1000} />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={processedData.slice(0, 10)}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey={targetYKey}
              nameKey={targetXKey}
              animationDuration={1000}
            >
              {processedData.slice(0, 10).map((_, index) => (
                <Cell key={`cell-${index}`} fill={themeColors[index % themeColors.length]} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );
      default:
        return null;
    }
  };

  const formattedSum = stats.sum >= 1000000 
    ? `${(stats.sum / 1000000).toFixed(2)}M` 
    : stats.sum >= 1000 
    ? `${(stats.sum / 1000).toFixed(1)}k` 
    : stats.sum.toFixed(1);

  const formattedAvg = stats.avg >= 1000 
    ? `${(stats.avg / 1000).toFixed(1)}k` 
    : stats.avg.toFixed(1);

  return (
    <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
      {/* Power BI top color accent bar */}
      <div className={`h-[5px] w-full transition-colors`} style={{ backgroundColor: themeColors[0] }} />

      {/* Title & Actions Bar */}
      <div className="p-6 pb-4 border-b border-[#F3F4F6] flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-sans font-black text-brand-muted/70 uppercase tracking-widest block">
              Field Matrix
            </span>
            <h3 className="text-base font-extrabold text-[#111827] leading-tight font-sans tracking-tight">
              {config.title}
            </h3>
            <p className="text-xs text-[#6B7280] font-medium leading-relaxed mt-0.5">
              {config.description}
            </p>
          </div>

          {/* Direct Controls Row */}
          <div className="flex items-center gap-1.5 shrink-0 bg-[#F3F4F6] p-1.5 rounded-lg border border-slate-200 shadow-inner">
            <button 
              onClick={() => setActiveType('bar')}
              className={`p-1.5 rounded-md transition-all ${activeType === 'bar' ? 'bg-white shadow-sm text-[#118DFF]' : 'text-[#4B5563] hover:text-black'}`}
              title="Power BI Clustered Bar"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveType('line')}
              className={`p-1.5 rounded-md transition-all ${activeType === 'line' ? 'bg-white shadow-sm text-[#118DFF]' : 'text-[#4B5563] hover:text-black'}`}
              title="Data Trend Line"
            >
              <LineIcon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveType('area')}
              className={`p-1.5 rounded-md transition-all ${activeType === 'area' ? 'bg-white shadow-sm text-[#118DFF]' : 'text-[#4B5563] hover:text-black'}`}
              title="Stacked Area Volume"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveType('pie')}
              className={`p-1.5 rounded-md transition-all ${activeType === 'pie' ? 'bg-white shadow-sm text-[#118DFF]' : 'text-[#4B5563] hover:text-black'}`}
              title="Category Pie"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Formatting & Config row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Palette themes picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-extrabold text-[#4B5563] uppercase tracking-wider">Palette:</span>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
              {Object.keys(POWERBI_PALETTES).map((key) => (
                <button
                  key={key}
                  onClick={() => setPaletteKey(key as keyof typeof POWERBI_PALETTES)}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${paletteKey === key ? 'bg-white text-brand-ink shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`text-[10px] uppercase font-bold tracking-tight px-2 py-1 rounded transition-all ${showGrid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
            >
              {showGrid ? 'Grid: ON' : 'Grid: OFF'}
            </button>

            <button 
              onClick={() => setShowStats(!showStats)}
              className={`text-[10px] uppercase font-bold tracking-tight px-2 py-1 rounded transition-all ${showStats ? 'bg-[#118DFF]/10 text-[#118DFF] border border-[#118DFF]/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
            >
              Indicators
            </button>
          </div>
        </div>
      </div>

      {/* Statistics and Aggregate KPI Tiles Bar (Highly Authentic Power BI design!) */}
      {showStats && (
        <div className="bg-[#FAF9F6] border-b border-[#ECECEE] p-4 grid grid-cols-4 gap-2 text-center select-none">
          <div className="bg-white p-2 rounded border border-[#E4E4E7] shadow-sm flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Percent className="w-2.5 h-2.5 text-[#118DFF]" /> Record count
            </span>
            <span className="text-sm font-black text-[#1E293B] tabular-nums mt-0.5">{stats.count}</span>
          </div>

          <div className="bg-white p-2 rounded border border-[#E4E4E7] shadow-sm flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> SUM {targetYKey}
            </span>
            <span className="text-sm font-black text-[#1E293B] tabular-nums mt-0.5">{formattedSum}</span>
          </div>

          <div className="bg-white p-2 rounded border border-[#E4E4E7] shadow-sm flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ArrowUp className="w-2.5 h-2.5 text-blue-500" /> AVERAGE
            </span>
            <span className="text-sm font-black text-[#1E293B] tabular-nums mt-0.5">{formattedAvg}</span>
          </div>

          <div className="bg-white p-2 rounded border border-[#E4E4E7] shadow-sm flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ArrowDown className="w-2.5 h-2.5 text-red-500" /> MAX PLOT
            </span>
            <span className="text-sm font-black text-[#1E293B] tabular-nums mt-0.5">
              {stats.max >= 1000 ? `${(stats.max / 1000).toFixed(1)}k` : stats.max.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Main Chart Section */}
      <div className="h-[320px] w-full p-6 bg-white relative" style={{ minHeight: '320px' }}>
        <ResponsiveContainer key={`${activeType}-${targetXKey}-${targetYKey}-${paletteKey}`} width="100%" height="100%" minHeight={320}>
          {renderChart() || <div />}
        </ResponsiveContainer>
      </div>

      {/* Legend Mapping Bar - Power BI authentic layout */}
      <div className="bg-[#FAF9F6] px-6 py-4 border-t border-[#ECECEE] flex items-center justify-between font-sans shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <LayoutGrid className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#4B5563] text-[10px] font-bold uppercase tracking-wider truncate">
            X-Axis: <span className="text-black font-extrabold">{targetXKey}</span> • Y-Axis (Metric): <span className="text-black font-extrabold">{targetYKey}</span>
          </span>
        </div>
        
        {/* Dynamic color legend indicators */}
        <div className="flex gap-1.5 shrink-0 ml-4 max-w-[200px] overflow-hidden">
          {themeColors.slice(0, 4).map((c, idx) => (
            <div 
              key={idx} 
              className="w-2 h-2 rounded-full cursor-help hover:scale-125 transition-all shadow-sm" 
              style={{ backgroundColor: c }} 
              title={`Legend Component Color #${idx + 1}`}
            />
          ))}
          {themeColors.length > 4 && (
            <span className="text-[8px] font-mono text-zinc-400 font-bold">+{themeColors.length - 4}</span>
          )}
        </div>
      </div>
    </div>
  );
}
