import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ResumeInfo } from '../types';

interface Props {
  onResumeUpload: (info: ResumeInfo) => void;
}

const MAX_SIZE_MB = 10;

export default function ResumeUploader({ onResumeUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (f: File): string | null => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf'))
      return 'Only PDF files are accepted. Please upload a .pdf resume.';
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    const err = validate(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleUpload = () => {
    if (!file) return;
    onResumeUpload({
      name: file.name,
      size: file.size,
      uploadTimestamp: new Date().toISOString(),
    });
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="w-full max-w-xl mx-auto animate-slide-up">
      {/* Drop Zone */}
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-300
          ${isDragging
            ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5 cursor-default'
            : 'border-white/20 bg-white/[0.03] hover:border-violet-500/50 hover:bg-violet-500/5'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
          id="resume-file-input"
          aria-label="Upload PDF resume"
        />

        {file ? (
          /* File selected state */
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30
                           flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-emerald-300 text-lg">Resume Ready</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <FileText className="w-4 h-4" />
                <span className="max-w-[200px] truncate font-medium text-slate-300">{file.name}</span>
                <span>·</span>
                <span>{formatSize(file.size)}</span>
              </div>
              <p className="text-xs text-slate-500">
                Uploaded {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400
                         transition-colors duration-200"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" /> Remove file
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all
              ${isDragging
                ? 'bg-violet-500/30 border-violet-400'
                : 'bg-violet-500/10 border-violet-500/30'}`}
            >
              <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-violet-300' : 'text-violet-400'}`} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-200">
                {isDragging ? 'Drop your resume here' : 'Upload your Resume'}
              </p>
              <p className="text-sm text-slate-400">
                Drag & drop or{' '}
                <span className="text-violet-400 font-medium underline underline-offset-2">
                  browse files
                </span>
              </p>
              <p className="text-xs text-slate-500">PDF only · Max {MAX_SIZE_MB}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10
                       border border-red-500/30 animate-slide-up">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* CTA Button */}
      {file && (
        <button
          onClick={handleUpload}
          className="btn-success w-full mt-4 py-3.5 text-base animate-slide-up"
          aria-label="Start interview"
        >
          <CheckCircle className="w-5 h-5" />
          Start My Interview
        </button>
      )}
    </div>
  );
}
