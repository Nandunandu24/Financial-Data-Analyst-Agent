import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, FileType, CheckCircle2 } from 'lucide-react';
import { Dataset, ColumnMetadata, DataRow } from '../types';

interface FileUploadProps {
  onDataLoaded: (dataset: Dataset) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processFile = (file: File) => {
    setLoading(true);
    const fileName = file.name;
    const isJson = file.type === 'application/json' || fileName.endsWith('.json');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (isJson) {
        try {
          const data = JSON.parse(content);
          handleParsedData(fileName, Array.isArray(data) ? data : [data]);
        } catch (err) {
          alert('Invalid JSON file');
          setLoading(false);
        }
      } else {
        Papa.parse(content, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            handleParsedData(fileName, results.data as DataRow[]);
          },
          error: () => {
            alert('Error parsing CSV');
            setLoading(false);
          }
        });
      }
    };
    reader.readAsText(file);
  };

  const handleParsedData = (name: string, data: DataRow[]) => {
    if (data.length === 0) {
      alert('File is empty');
      setLoading(false);
      return;
    }

    const keys = Object.keys(data[0]);
    const columns: ColumnMetadata[] = keys.map(key => {
      const values = data.map(row => row[key]).filter(v => v !== null && v !== undefined);
      const uniqueValues = new Set(values);
      const isNumber = values.length > 0 && values.every(v => typeof v === 'number');
      const isDate = values.length > 0 && values.every(v => !isNaN(Date.parse(String(v))));
      
      return {
        name: key,
        type: isNumber ? 'number' : (isDate ? 'date' : 'string'),
        sampleValues: values.slice(0, 5),
        uniqueCount: uniqueValues.size,
        missingCount: data.length - values.length
      };
    });

    onDataLoaded({ name, data, columns });
    setLoading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div 
      className={`relative group h-64 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center p-8 bg-white/50
        ${isDragging ? 'border-brand-ink bg-white/80' : 'border-brand-line/20 hover:border-brand-line/40'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <input 
        type="file" 
        accept=".csv,.json" 
        onChange={onFileChange} 
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={loading}
      />
      
      <div className={`p-4 rounded-full bg-brand-ink/5 group-hover:scale-110 transition-transform ${loading ? 'animate-pulse' : ''}`}>
        {loading ? <CheckCircle2 className="w-8 h-8 opacity-50" /> : <Upload className="w-8 h-8" />}
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium">
          {loading ? 'Processing your data...' : 'Drop your dataset here'}
        </h3>
        <p className="text-sm text-brand-muted mt-1">
          Supports CSV and JSON files. Up to 10MB.
        </p>
      </div>
      
      <div className="mt-6 flex gap-4">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-line/10 rounded-full text-xs font-mono">
          <FileType className="w-3.5 h-3.5" /> .CSV
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-line/10 rounded-full text-xs font-mono">
          <FileType className="w-3.5 h-3.5" /> .JSON
        </span>
      </div>
    </div>
  );
}
