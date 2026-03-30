import { useCallback, useState } from 'react';
import { DocumentUpload, DocumentText } from 'iconsax-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IconWrapper } from '@/components/icons/IconWrapper';
import { iconConfig } from '@/lib/iconConfig';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all duration-300 cursor-pointer",
        isDragging ? "border-primary bg-primary/5 scale-105" : "border-muted hover:border-primary/50",
        isLoading && "pointer-events-none opacity-50"
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <IconWrapper 
            icon={<DocumentUpload variant="Bulk" />}
            {...iconConfig.csvVisualizer.upload}
            className={cn(
              "transition-all duration-300",
              isDragging && "scale-110"
            )}
          />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">
            {isLoading ? 'Processing...' : 'Upload Portfolio CSV'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Drag & drop your Zerodha or Upstox portfolio CSV here, or click to browse
          </p>
          <div className="flex gap-2 justify-center text-xs text-muted-foreground">
            <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center gap-1.5 font-medium">
              <DocumentText variant="Bold" size={14} className="text-primary" /> Zerodha
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center gap-1.5 font-medium">
              <DocumentText variant="Bold" size={14} className="text-primary" /> Upstox
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
