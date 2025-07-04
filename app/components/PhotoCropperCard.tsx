"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { useNotification, useOpenUrl } from "@coinbase/onchainkit/minikit";
import { Button, Icon } from "./DemoComponents";

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PhotoCropperCardProps {
  className?: string;
}

export function PhotoCropperCard({ 
  className = "" 
}: PhotoCropperCardProps) {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mini Kit hooks
  const sendNotification = useNotification();
  const openUrl = useOpenUrl();

  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropData, setCropData] = useState<CropData>({ x: 0, y: 0, width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [croppedImageData, setCroppedImageData] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cropShape, setCropShape] = useState<'rectangle' | 'circle'>('rectangle');
  const [isCasting, setIsCasting] = useState(false);
  
  // Use refs for dragging state to avoid stale closure issues
  const isDraggingCropRef = useRef(false);
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<string>('');
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Global mouse event handlers for dragging and resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      const pos = {
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      };

      if (isDraggingCropRef.current) {
        const deltaX = pos.x - dragStartRef.current.x;
        const deltaY = pos.y - dragStartRef.current.y;
        
        const newX = cropStartRef.current.x + deltaX;
        const newY = cropStartRef.current.y + deltaY;
        
        // Constrain to canvas bounds
        const constrainedX = Math.max(0, Math.min(newX, canvas.width - cropData.width));
        const constrainedY = Math.max(0, Math.min(newY, canvas.height - cropData.height));
        
        setCropData(prevCrop => ({
          x: constrainedX,
          y: constrainedY,
          width: prevCrop.width,
          height: prevCrop.height
        }));
      } else if (isResizingRef.current) {
        const handle = resizeHandleRef.current;
        const startCrop = cropStartRef.current;
        let newCrop = { ...startCrop };

        const deltaX = pos.x - dragStartRef.current.x;
        const deltaY = pos.y - dragStartRef.current.y;

        // Calculate new dimensions based on resize handle
        switch (handle) {
          case 'nw': // top-left
            newCrop.x = Math.max(0, startCrop.x + deltaX);
            newCrop.y = Math.max(0, startCrop.y + deltaY);
            newCrop.width = Math.max(20, startCrop.width - deltaX);
            newCrop.height = Math.max(20, startCrop.height - deltaY);
            break;
          case 'ne': // top-right
            newCrop.y = Math.max(0, startCrop.y + deltaY);
            newCrop.width = Math.max(20, startCrop.width + deltaX);
            newCrop.height = Math.max(20, startCrop.height - deltaY);
            break;
          case 'sw': // bottom-left
            newCrop.x = Math.max(0, startCrop.x + deltaX);
            newCrop.width = Math.max(20, startCrop.width - deltaX);
            newCrop.height = Math.max(20, startCrop.height + deltaY);
            break;
          case 'se': // bottom-right
            newCrop.width = Math.max(20, startCrop.width + deltaX);
            newCrop.height = Math.max(20, startCrop.height + deltaY);
            break;
          case 'n': // top edge
            newCrop.y = Math.max(0, startCrop.y + deltaY);
            newCrop.height = Math.max(20, startCrop.height - deltaY);
            break;
          case 's': // bottom edge
            newCrop.height = Math.max(20, startCrop.height + deltaY);
            break;
          case 'w': // left edge
            newCrop.x = Math.max(0, startCrop.x + deltaX);
            newCrop.width = Math.max(20, startCrop.width - deltaX);
            break;
          case 'e': // right edge
            newCrop.width = Math.max(20, startCrop.width + deltaX);
            break;
        }

        // Ensure crop area doesn't exceed canvas bounds
        if (newCrop.x + newCrop.width > canvas.width) {
          newCrop.width = canvas.width - newCrop.x;
        }
        if (newCrop.y + newCrop.height > canvas.height) {
          newCrop.height = canvas.height - newCrop.y;
        }

        setCropData(newCrop);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingCropRef.current) {
        console.log('🎯 Global mouse up - stopping drag');
        isDraggingCropRef.current = false;
        setIsDraggingCrop(false);
      }
      if (isResizingRef.current) {
        console.log('🎯 Global mouse up - stopping resize');
        isResizingRef.current = false;
        resizeHandleRef.current = '';
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [cropData]);

  // Effect to setup canvas when image changes
  useEffect(() => {
    console.log('useEffect triggered, image:', !!image);
    console.log('Canvas ref current:', canvasRef.current);
    console.log('Canvas ref type:', typeof canvasRef.current);
    
    if (image) {
      // Try multiple times to find the canvas
      let attempts = 0;
      const trySetup = () => {
        attempts++;
        console.log(`Attempt ${attempts} to find canvas:`, !!canvasRef.current);
        
        if (canvasRef.current) {
          console.log('Canvas found! Setting up...');
          setupCanvas(image);
          initializeCropArea(image);
          setIsProcessing(false);
          
          // Add native event listeners as backup
          const canvas = canvasRef.current;
          const handleNativeMouseDown = (e: MouseEvent) => {
            console.log('NATIVE mouse down event triggered!');
          };
          
          canvas.addEventListener('mousedown', handleNativeMouseDown);
          
          // Cleanup
          return () => {
            canvas.removeEventListener('mousedown', handleNativeMouseDown);
          };
        } else if (attempts < 10) {
          console.log('Canvas not found, retrying in 50ms...');
          setTimeout(trySetup, 50);
          return false;
        } else {
          console.log('Failed to find canvas after 10 attempts');
          setIsProcessing(false);
          return false;
        }
      };
      
      trySetup();
    }
  }, [image]);

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    
    if (file && file.type.startsWith('image/')) {
      console.log('Loading image:', file.name, file.type, file.size);
      loadImage(file);
    } else {
      console.log('Invalid file type or no file selected');
      if (file) {
        alert('Please select an image file (PNG, JPG, GIF)');
      }
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    console.log('Files dropped:', files.length);
    
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        console.log('Loading dropped image:', file.name, file.type, file.size);
        loadImage(file);
      } else {
        alert('Please drop an image file (PNG, JPG, GIF)');
      }
    }
  }, []);

  // Load and setup image
  const loadImage = useCallback((file: File) => {
    console.log('loadImage called with:', file);
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('FileReader onload triggered');
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded successfully:', img.width, 'x', img.height);
        setImage(img);
        // Canvas setup will happen in useEffect
      };
      img.onerror = (error) => {
        console.error('Image loading error:', error);
        setIsProcessing(false);
        alert('Error loading image. Please try a different file.');
      };
      img.src = e.target?.result as string;
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setIsProcessing(false);
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Setup canvas with proper scaling
  const setupCanvas = useCallback((img: HTMLImageElement) => {
    console.log('setupCanvas called');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not found');
      return;
    }

    const maxWidth = 320;
    const maxHeight = 320;
    let { width, height } = img;
    console.log('Original image dimensions:', width, 'x', height);

    // Calculate scale to fit within max dimensions
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const newScale = Math.min(widthRatio, heightRatio);
      setScale(newScale);
      width *= newScale;
      height *= newScale;
      console.log('Scaled to:', width, 'x', height, 'scale:', newScale);
    } else {
      setScale(1);
      console.log('No scaling needed');
    }

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);

    drawImage(img, canvas);
  }, []);

  // Draw image on canvas
  const drawImage = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  // Initialize crop area
  const initializeCropArea = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = Math.min(canvas.width * 0.7, 200);
    const height = Math.min(canvas.height * 0.7, 200);
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    console.log('🎯 Initializing crop area:', { x, y, width, height });
    setCropData({ x, y, width, height });
  }, []);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  // Check if mouse is over crop area
  const isMouseOverCrop = useCallback((mouseX: number, mouseY: number) => {
    return mouseX >= cropData.x && 
           mouseX <= cropData.x + cropData.width &&
           mouseY >= cropData.y && 
           mouseY <= cropData.y + cropData.height;
  }, [cropData]);


  // Perform crop operation
  const performCrop = useCallback(() => {
    console.log('🎯 Krop Photo button clicked!');
    console.log('Image:', !!image);
    console.log('Crop data:', cropData);
    console.log('Scale:', scale);
    
    if (!image || cropData.width === 0 || cropData.height === 0) {
      console.log('❌ No image or crop area selected');
      alert('Please select an area to crop first!');
      return;
    }

    const canvas = previewCanvasRef.current;
    if (!canvas) {
      console.log('❌ Preview canvas not found');
      return;
    }

    console.log('✅ Starting crop operation...');
    setIsProcessing(true);

    // Calculate actual crop dimensions
    const actualCrop = {
      x: cropData.x / scale,
      y: cropData.y / scale,
      width: cropData.width / scale,
      height: cropData.height / scale
    };
    
    console.log('Actual crop dimensions:', actualCrop);

    canvas.width = actualCrop.width;
    canvas.height = actualCrop.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Could not get canvas context');
      return;
    }

    console.log('✅ Drawing cropped image...');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (cropShape === 'circle') {
      // For circular crop, we need to create a circular mask
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 2;
      
      // Save the context state
      ctx.save();
      
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
      
      // Draw the image within the circular clip
      ctx.drawImage(
        image,
        actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
        0, 0, actualCrop.width, actualCrop.height
      );
      
      // Restore the context state
      ctx.restore();
    } else {
      // Regular rectangular crop
      ctx.drawImage(
        image,
        actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
        0, 0, actualCrop.width, actualCrop.height
      );
    }

    const imageData = canvas.toDataURL('image/png');
    console.log('✅ Image data created, length:', imageData.length);
    
    // Also copy to display canvas
    const displayCanvas = document.getElementById('displayPreviewCanvas') as HTMLCanvasElement;
    if (displayCanvas) {
      displayCanvas.width = actualCrop.width;
      displayCanvas.height = actualCrop.height;
      const displayCtx = displayCanvas.getContext('2d');
      if (displayCtx) {
        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        
        if (cropShape === 'circle') {
          // Apply circular clipping for display canvas too
          const centerX = displayCanvas.width / 2;
          const centerY = displayCanvas.height / 2;
          const radius = Math.min(displayCanvas.width, displayCanvas.height) / 2;
          
          displayCtx.save();
          displayCtx.beginPath();
          displayCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          displayCtx.clip();
          displayCtx.drawImage(canvas, 0, 0);
          displayCtx.restore();
        } else {
          displayCtx.drawImage(canvas, 0, 0);
        }
        
        console.log('✅ Display canvas updated');
      }
    }
    
    setCroppedImageData(imageData);
    setShowPreview(true);
    setIsProcessing(false);
    console.log('✅ Crop operation completed!');
  }, [image, cropData, scale, cropShape]);

  // Download cropped image
  const downloadImage = useCallback(() => {
    if (!croppedImageData) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kropped-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Send notification
        sendNotification({
          title: '📸 Photo Kropped!',
          body: 'Your photo has been successfully cropped and downloaded.'
        });
      }
    }, 'image/png');
  }, [croppedImageData, sendNotification]);

  // Share to Farcaster - downloads image and opens compose
  const shareToFarcaster = useCallback(async () => {
    if (!croppedImageData) {
      alert('Please crop an image first!');
      return;
    }

    if (isCasting) return; // Prevent double-clicking

    setIsCasting(true);

    try {
      // Auto-download the cropped image first
      const link = document.createElement('a');
      link.download = 'kropped-image.png';
      link.href = croppedImageData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Open Farcaster compose with pre-filled text
      const shareText = "Just kropped the perfect photo! 📸✨ Made with Kroppit\n\n(Upload the downloaded image to complete your cast)";
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
      
      // Use MiniKit's openUrl for better integration
      openUrl(shareUrl);
      
      // Send success notification
      sendNotification({
        type: 'success',
        message: 'Image downloaded! Complete your cast in Farcaster 🎉'
      });
    } catch (error) {
      console.error('Failed to prepare cast:', error);
      sendNotification({
        type: 'error',
        message: 'Failed to prepare cast. Please try again.'
      });
    } finally {
      setIsCasting(false);
    }
  }, [croppedImageData, openUrl, sendNotification, isCasting]);

  // Set crop size
  const setCropSize = useCallback((size: 'square' | 'landscape' | 'portrait' | 'circle') => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    let width, height;
    const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
    
    switch (size) {
      case 'square':
        width = height = maxSize;
        setCropShape('rectangle');
        break;
      case 'landscape':
        width = canvas.width * 0.8;
        height = width * 0.6; // 16:9-ish ratio
        setCropShape('rectangle');
        break;
      case 'portrait':
        height = canvas.height * 0.8;
        width = height * 0.75; // 4:3-ish ratio
        setCropShape('rectangle');
        break;
      case 'circle':
        width = height = maxSize;
        setCropShape('circle');
        break;
    }

    // Keep current position, just change size
    const x = cropData.x;
    const y = cropData.y;
    
    // Ensure it fits within canvas
    const finalWidth = Math.min(width, canvas.width - x);
    const finalHeight = Math.min(height, canvas.height - y);
    
    setCropData({ x, y, width: finalWidth, height: finalHeight });
  }, [cropData, image]);

  // Set crop position
  const setCropPosition = useCallback((position: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const { width, height } = cropData;
    let x, y;

    switch (position) {
      case 'top-left':
        x = 0; y = 0;
        break;
      case 'top-center':
        x = (canvas.width - width) / 2; y = 0;
        break;
      case 'top-right':
        x = canvas.width - width; y = 0;
        break;
      case 'center-left':
        x = 0; y = (canvas.height - height) / 2;
        break;
      case 'center':
        x = (canvas.width - width) / 2; y = (canvas.height - height) / 2;
        break;
      case 'center-right':
        x = canvas.width - width; y = (canvas.height - height) / 2;
        break;
      case 'bottom-left':
        x = 0; y = canvas.height - height;
        break;
      case 'bottom-center':
        x = (canvas.width - width) / 2; y = canvas.height - height;
        break;
      case 'bottom-right':
        x = canvas.width - width; y = canvas.height - height;
        break;
      default:
        return;
    }

    // Ensure bounds
    x = Math.max(0, Math.min(x, canvas.width - width));
    y = Math.max(0, Math.min(y, canvas.height - height));
    
    setCropData({ x, y, width, height });
  }, [cropData, image]);

  // Reset crop
  const resetCrop = useCallback(() => {
    if (image) {
      initializeCropArea(image);
    }
    setShowPreview(false);
    setCroppedImageData(null);
  }, [image, initializeCropArea]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden ${className}`}>
      <div className="p-5 space-y-4">
        
        {/* Upload Area */}
        {!image && (
          <div 
            onClick={openFilePicker}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
              ${isDragOver 
                ? 'border-[var(--app-accent)] bg-[var(--app-accent)]/5 scale-105' 
                : 'border-[var(--app-card-border)] hover:border-[var(--app-accent)]'
              }
            `}
          >
            <div className={`text-3xl mb-3 transition-transform duration-200 ${isDragOver ? 'scale-110' : ''}`}>
              {isDragOver ? '📁' : '📸'}
            </div>
            <div className="text-[var(--app-foreground)] mb-2">
              <p className="font-medium">
                {isDragOver ? 'Drop your photo here!' : 'Upload your photo'}
              </p>
              <p className="text-sm text-[var(--app-foreground-muted)]">
                {isDragOver ? 'Release to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            {!isDragOver && (
              <Button variant="primary" size="sm">
                Choose File
              </Button>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Canvas Area - Always render but conditionally show */}
        <div className={`space-y-4 ${!image ? 'hidden' : ''}`}>
          <div className="flex justify-center">
            <div className="relative inline-block">
              {/* Canvas for displaying image */}
              <canvas
                ref={canvasRef}
                className="border-2 border-[var(--app-card-border)] rounded-lg max-w-full"
                style={{ 
                  display: 'block'
                }}
              />
              
              
              {/* Draggable crop area */}
              {cropData.width > 0 && cropData.height > 0 && (
                <div
                  className={`absolute border-2 border-white shadow-lg cursor-move transition-all ${cropShape === 'circle' ? 'rounded-full' : ''}`}
                  style={{
                    left: cropData.x + 'px',
                    top: cropData.y + 'px',
                    width: cropData.width + 'px',
                    height: cropData.height + 'px',
                    zIndex: 1000,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={(e) => {
                    console.log('🎯 Starting drag');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    
                    const canvasRect = canvas.getBoundingClientRect();
                    const pos = {
                      x: e.clientX - canvasRect.left,
                      y: e.clientY - canvasRect.top
                    };
                    
                    isDraggingCropRef.current = true;
                    setIsDraggingCrop(true);
                    dragStartRef.current = pos;
                    cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    
                    console.log('🎯 Drag started at:', pos);
                  }}
                >

                  {/* Corner resize handles */}
                  <div
                    className="absolute w-3 h-3 bg-white border border-gray-400 cursor-nw-resize"
                    style={{ left: '-6px', top: '-6px', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'nw';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-gray-400 cursor-ne-resize"
                    style={{ right: '-6px', top: '-6px', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'ne';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-gray-400 cursor-sw-resize"
                    style={{ left: '-6px', bottom: '-6px', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'sw';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-gray-400 cursor-se-resize"
                    style={{ right: '-6px', bottom: '-6px', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'se';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />

                  {/* Edge resize handles */}
                  <div
                    className="absolute w-full h-1 cursor-n-resize"
                    style={{ left: '0', top: '-3px', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'n';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                  <div
                    className="absolute w-full h-1 cursor-s-resize"
                    style={{ left: '0', bottom: '-3px', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 's';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                  <div
                    className="absolute w-1 h-full cursor-w-resize"
                    style={{ left: '-3px', top: '0', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'w';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                  <div
                    className="absolute w-1 h-full cursor-e-resize"
                    style={{ right: '-3px', top: '0', zIndex: 1001 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      
                      const canvasRect = canvas.getBoundingClientRect();
                      const pos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                      
                      isResizingRef.current = true;
                      resizeHandleRef.current = 'e';
                      dragStartRef.current = pos;
                      cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
                    }}
                  />
                </div>
              )}
              
              {/* Overlay to show grayed out areas - only when not dragging */}
              {cropData.width > 0 && cropData.height > 0 && !isDraggingCrop && (
                <>
                  {cropShape === 'circle' ? (
                    /* Circle overlay - everything except the circle */
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle ${Math.min(cropData.width, cropData.height) / 2}px at ${cropData.x + cropData.width / 2}px ${cropData.y + cropData.height / 2}px, transparent ${Math.min(cropData.width, cropData.height) / 2}px, rgba(0,0,0,0.4) ${Math.min(cropData.width, cropData.height) / 2 + 1}px)`,
                        zIndex: 1
                      }}
                    />
                  ) : (
                    /* Rectangle overlay */
                    <div
                      className="absolute inset-0 bg-black/40 pointer-events-none"
                      style={{
                        clipPath: `polygon(
                          0% 0%, 
                          0% 100%, 
                          ${cropData.x}px 100%, 
                          ${cropData.x}px ${cropData.y}px, 
                          ${cropData.x + cropData.width}px ${cropData.y}px, 
                          ${cropData.x + cropData.width}px ${cropData.y + cropData.height}px, 
                          ${cropData.x}px ${cropData.y + cropData.height}px, 
                          ${cropData.x}px 100%, 
                          100% 100%, 
                          100% 0%
                        )`,
                        zIndex: 1
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Crop Size Controls */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--app-foreground)] text-center">Crop Dimensions:</div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setCropSize('square')}
                variant="secondary"
                size="sm"
                className="w-12 h-12 p-2"
                title="Square (1:1)"
              >
                <div className="w-6 h-6 border-2 border-current rounded-sm"></div>
              </Button>
              <Button
                onClick={() => setCropSize('landscape')}
                variant="secondary"
                size="sm"
                className="w-12 h-12 p-2"
                title="Landscape (16:9)"
              >
                <div className="w-7 h-4 border-2 border-current rounded-sm"></div>
              </Button>
              <Button
                onClick={() => setCropSize('portrait')}
                variant="secondary"
                size="sm"
                className="w-12 h-12 p-2"
                title="Portrait (3:4)"
              >
                <div className="w-4 h-7 border-2 border-current rounded-sm"></div>
              </Button>
              <Button
                onClick={() => setCropSize('circle')}
                variant="secondary"
                size="sm"
                className="w-12 h-12 p-2"
                title="Circle"
              >
                <div className="w-6 h-6 border-2 border-current rounded-full"></div>
              </Button>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={resetCrop}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={performCrop}
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Krop Image'}
            </Button>
          </div>
        </div>

        {/* Hidden preview canvas - always exists */}
        <canvas
          ref={previewCanvasRef}
          style={{ display: 'none' }}
        />
        
        {/* Download/Share buttons - show after cropping */}
        {showPreview && (
          <div className="flex gap-2">
            <Button
              onClick={downloadImage}
              variant="primary"
              size="sm"
              className="flex-1"
              icon={<Icon name="arrow-right" size="sm" />}
            >
              Download
            </Button>
            <Button
              onClick={shareToFarcaster}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isCasting}
              icon={<Icon name="star" size="sm" />}
            >
              {isCasting ? 'Preparing...' : 'Share to Farcaster'}
            </Button>
          </div>
        )}


        {/* New photo button when preview is shown */}
        {showPreview && (
          <Button
            onClick={() => {
              setImage(null);
              setShowPreview(false);
              setCroppedImageData(null);
            }}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Upload New Photo
          </Button>
        )}
      </div>
    </div>
  );
}