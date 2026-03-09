'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  onFiles: (files: File[]) => void;
}

export function FileUpload({
  accept = 'image/*,.pdf',
  maxSizeMB = 10,
  multiple = false,
  label = 'Arrastra archivos aquí o haz clic para seleccionar',
  onFiles,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      setError('');
      const valid: File[] = [];
      const maxBytes = maxSizeMB * 1024 * 1024;
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxBytes) {
          setError(`"${files[i].name}" excede ${maxSizeMB} MB`);
          continue;
        }
        valid.push(files[i]);
      }
      const result = multiple ? valid : valid.slice(0, 1);
      setSelected(result);
      // Generate image previews
      const newPreviews: Record<number, string> = {};
      result.forEach((file, i) => {
        if (file.type.startsWith('image/')) {
          newPreviews[i] = URL.createObjectURL(file);
        }
      });
      // Revoke old preview URLs
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
      setPreviews(newPreviews);
      if (result.length > 0) onFiles(result);
    },
    [maxSizeMB, multiple, onFiles],
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    if (previews[index]) URL.revokeObjectURL(previews[index]);
    setSelected((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onFiles(next);
      return next;
    });
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">{label}</p>
        <p className="mt-1 text-xs text-gray-400">Máx. {maxSizeMB} MB{accept !== '*' ? ` · ${accept}` : ''}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {selected.length > 0 && (
        <div className="mt-3 space-y-2">
          {selected.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[i]} alt={file.name} className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
              )}
              <span className="min-w-0 flex-1 truncate text-gray-700">{file.name}</span>
              <span className="shrink-0 text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => removeFile(i)} className="shrink-0 text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
