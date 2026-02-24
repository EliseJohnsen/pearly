"use client";

import { useState, useRef } from "react";

interface UploadImageProps {
  onImageSelected: (file: File, preview: string) => void;
  initialPreview?: string | null;
}

export default function UploadImage({ onImageSelected, initialPreview }: UploadImageProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      onImageSelected(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
            isDragging
              ? "border-[#6B4E71] bg-[#F5F0F6]"
              : "border-[#C4B5C7] bg-[#F9F5FA] hover:border-[#6B4E71] hover:bg-[#F5F0F6]"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-[#E8DDE9] flex items-center justify-center">
              <svg
                className="w-12 h-12 text-[#6B4E71]"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-[#6B4E71]">
              <p className="text-sm font-medium">
                Dra og slipp bilde her, eller klikk for å velge
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-[#C4B5C7] rounded-2xl bg-[#F9F5FA]">
          <button
            onClick={handleRemoveImage}
            className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            aria-label="Fjern bilde"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
