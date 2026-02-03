'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function FileUpload({
  onUpload,
  accept = '.pdf,.doc,.docx,.xlsx,.xls',
  multiple = false,
  maxSize = 10,
  label = 'Dateien hochladen',
  description = 'PDF, Word oder Excel (max. 10MB)',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Datei ist zu groß (max. ${maxSize}MB)`;
    }

    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return type.toLowerCase() === fileExtension;
      }
      return file.type.match(type);
    })) {
      return 'Dateityp nicht unterstützt';
    }

    return null;
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);

      newFiles.push({
        file,
        status: error ? 'error' : 'uploading',
        progress: 0,
        error: error || undefined,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    const validFiles = newFiles.filter((f) => f.status !== 'error');

    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        await onUpload(validFiles.map((f) => f.file));
        setFiles((prev) =>
          prev.map((f) =>
            validFiles.some((vf) => vf.file === f.file)
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            validFiles.some((vf) => vf.file === f.file)
              ? { ...f, status: 'error', error: 'Upload fehlgeschlagen' }
              : f
          )
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onUpload]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center text-center">
          <Upload
            className={`w-12 h-12 mb-4 ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
          <p className="text-lg font-medium text-gray-700">{label}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <Button variant="outline" className="mt-4" disabled={isUploading}>
            {isUploading ? 'Wird hochgeladen...' : 'Datei auswählen'}
          </Button>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {f.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(f.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {f.status === 'uploading' && (
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
                {f.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {f.status === 'error' && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-xs text-red-500">{f.error}</span>
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
