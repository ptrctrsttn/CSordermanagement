import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useState } from 'react';

interface CsvUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  label?: string;
}

export function CsvUploader({ onUpload, accept = ".csv", label = "Upload CSV" }: CsvUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  return (
    <Button variant="outline" className="flex items-center gap-2" disabled={isUploading}>
      <Upload size={16} />
      <label className="cursor-pointer">
        {isUploading ? "Uploading..." : label}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </Button>
  );
} 