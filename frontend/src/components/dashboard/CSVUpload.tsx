'use client';
import { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface UploadResult {
  message: string;
  total_processed: number;
  total_errors: number;
  errors: Array<{ row: number; error: string }>;
}

export default function CSVUpload({ onSuccess }: { onSuccess: () => void }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) { setError('Only CSV files accepted'); return; }
    setFile(f); setResult(null); setError('');
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const res = await api.orders.uploadCSV(file);
      setResult(res);
      if (res.total_processed > 0) setTimeout(onSuccess, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Upload className="w-4 h-4 text-brand-400" /> Upload Order CSV
      </h3>

      {!file && !result && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            drag ? 'border-brand-500 bg-brand-500/5' : 'border-slate-700 hover:border-slate-500'
          }`}
        >
          <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">Drop CSV here or <span className="text-brand-400">browse</span></p>
          <p className="text-xs text-slate-600">Required: product_name, length, width, height, weight, quantity</p>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {file && !result && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
            <FileText className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={reset} className="text-slate-600 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
          <button
            onClick={upload}
            disabled={uploading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Upload & Optimize All'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-400">{result.message}</p>
              <p className="text-xs text-slate-500">{result.total_errors} errors</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Row errors:</p>
              {result.errors.slice(0, 3).map((e, i) => (
                <p key={i} className="text-xs text-slate-500">Row {e.row}: {e.error}</p>
              ))}
            </div>
          )}
          <button onClick={reset} className="w-full py-2 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">Upload Another</button>
        </div>
      )}

      {/* Template hint */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">
          CSV columns: <code className="text-slate-500">product_name, length, width, height, weight, quantity</code>
        </p>
      </div>
    </div>
  );
}
