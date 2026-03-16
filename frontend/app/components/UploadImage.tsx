"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { useUIString } from "../hooks/useSanityData";

interface UploadImageProps {
  onImageSelected: (file: File, preview: string, aspectRatio: "3:4" | "4:3" | "1:1") => void;
  initialPreview?: string | null;
}

// Helper function to create an image element from a URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

// Helper function to crop the image using Canvas API
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg", 0.95);
  });
};

// Helper function to convert Blob to File
const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

export default function UploadImage({ onImageSelected, initialPreview }: UploadImageProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI Strings
  const adaptYourImageText = useUIString('adapt_your_image') || "Tilpass bildet ditt";
  const dragDropImageText = useUIString('drag_drop_image') || "Dra og slipp bilde her, eller klikk for å velge";
  const clickToSelectText = useUIString('click_to_select_image') || "Klikk for å velge bilde";
  const selectFormatZoomText = useUIString('select_format_zoom_adjust') || "Velg format, zoom og juster bildet slik du ønsker det";
  const applyCropText = useUIString('apply_crop') || "Bruk beskjæring";
  const cancelText = useUIString('cancel') || "Avbryt";
  const removeImageText = useUIString('remove_image') || "Fjern bilde";

  // Crop state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"3:4" | "4:3" | "1:1">("3:4");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Cancel crop and return to upload state
  const handleCancelCrop = useCallback(() => {
    setShowCropper(false);
    setOriginalImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Handle focus trap and escape key
  useEffect(() => {
    if (!showCropper) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelCrop();
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Prevent background scroll

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showCropper, handleCancelCrop]);

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setOriginalImage(previewUrl);
      setShowCropper(true); // Show cropper instead of preview
    };
    reader.readAsDataURL(file);
  };

  const getAspectValue = (ratio: "3:4" | "4:3" | "1:1"): number => {
    switch (ratio) {
      case "3:4":
        return 3 / 4;
      case "4:3":
        return 4 / 3;
      case "1:1":
        return 1;
    }
  };

  // Confirm crop and proceed
  const handleConfirmCrop = async () => {
    if (!originalImage || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(originalImage, croppedAreaPixels);
      const croppedFile = blobToFile(croppedBlob, "cropped-image.jpg");
      const croppedUrl = URL.createObjectURL(croppedBlob);

      setPreview(croppedUrl);
      setShowCropper(false);
      onImageSelected(croppedFile, croppedUrl, selectedAspectRatio);
    } catch (error) {
      console.error("Crop error:", error);
    }
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
    if (file) {
      // Accept if MIME type starts with "image/" or if file has HEIC/HEIF extension
      const isImage = file.type.startsWith("image/");
      const isHeic = /\.(heic|heif)$/i.test(file.name);
      if (isImage || isHeic) {
        handleFileChange(file);
      }
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
      {!preview && !showCropper ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
            isDragging
              ? "border-dark-purple bg-primary-pink"
              : "border-purple bg-primary-light-pink hover:border-dark-purple hover:bg-primary-pink"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-lavender-pink flex items-center justify-center">
              <svg
                className="w-12 h-12 text-dark-purple"
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
            <div className="text-dark-purple">
              <p className="hidden md:block text-sm font-medium">
                {dragDropImageText}
              </p>
              <p className="md:hidden text-sm font-medium">
                {clickToSelectText}
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : showCropper && originalImage ? (
        // Cropper Modal with Backdrop
        <>
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleCancelCrop}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-modal-title"
          >
            <div
              ref={modalRef}
              className="w-full md:w-1/3 max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col relative"
              style={{ maxHeight: "95vh" }}
            >
              {/* Close button X in top right corner */}
              <button
                onClick={handleCancelCrop}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                aria-label={cancelText}
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

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 p-6 md:p-8">
                <div className="space-y-2">
                {/* Header */}
                <div className="text-center mb-2">
                  <h2 id="crop-modal-title" className="text-2xl font-bold text-dark-purple mb-2">
                    {adaptYourImageText}
                  </h2>
                  <p className="text-sm text-dark-purple/70">
                    {selectFormatZoomText}
                  </p>
                </div>

                {/* Cropper Container */}
                <div
                  className="relative bg-primary-light-pink rounded-2xl overflow-hidden border-2 border-purple aspect-square"
                >
                  <Cropper
                    image={originalImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={getAspectValue(selectedAspectRatio)}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(croppedArea, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels);
                    }}
                    showGrid={true}
                    objectFit="contain"
                  />
                </div>

                {/* Zoom Controls (Desktop Only) */}
                <div className="hidden md:flex relative items-center justify-center gap-4">
                  <button
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="w-8 h-8 bg-white border-2 border-purple rounded-full flex items-center justify-center text-dark-purple font-bold hover:border-dark-purple transition-colors text-xl"
                  >
                    −
                  </button>
                  <span className="text-dark-purple font-medium min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="w-8 h-8 bg-white border-2 border-purple rounded-full flex items-center justify-center text-dark-purple font-bold hover:border-dark-purple transition-colors text-xl"
                  >
                    +
                  </button>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <button
                    onClick={() => setSelectedAspectRatio("3:4")}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      selectedAspectRatio === "3:4"
                        ? "bg-dark-purple text-white border-dark-purple"
                        : "bg-white border-purple text-dark-purple hover:border-dark-purple"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        width="20"
                        height="24"
                        viewBox="0 0 12 16"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <rect
                          x="1"
                          y="1"
                          width="10"
                          height="14"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <span>3:4</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedAspectRatio("1:1")}
                    className={`py-2 px-4 rounded-xl border-2 font-medium transition-all ${
                      selectedAspectRatio === "1:1"
                        ? "bg-dark-purple text-white border-dark-purple"
                        : "bg-white border-purple text-dark-purple hover:border-dark-purple"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <rect
                          x="1"
                          y="1"
                          width="14"
                          height="14"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <span>1:1</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedAspectRatio("4:3")}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      selectedAspectRatio === "4:3"
                        ? "bg-dark-purple text-white border-dark-purple"
                        : "bg-white border-purple text-dark-purple hover:border-dark-purple"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        width="24"
                        height="20"
                        viewBox="0 0 16 12"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <rect
                          x="1"
                          y="1"
                          width="14"
                          height="10"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <span>4:3</span>
                    </div>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleConfirmCrop}
                    className="w-full py-3 px-6 bg-dark-purple text-white font-semibold rounded-full hover:bg-purple-extra-dark transition-colors"
                  >
                    {applyCropText}
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : preview ? (
        // Preview UI
        <div className="relative border-2 border-dashed border-purple rounded-2xl bg-primary-light-pink">
          <button
            onClick={handleRemoveImage}
            className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            aria-label={removeImageText}
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
            className="w-full h-auto rounded-2xl"
          />
        </div>
      ) : null}
    </div>
  );
}
