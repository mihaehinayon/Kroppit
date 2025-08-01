"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { useNotification, useOpenUrl } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";
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
  const [cropShape, setCropShape] = useState<'rectangle' | 'circle'>('rectangle');
  const [showCroppedResult, setShowCroppedResult] = useState(false);
  
  // Use refs for dragging state to avoid stale closure issues
  const isDraggingCropRef = useRef(false);
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<string>('');
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);

  // Direct DOM update for immediate visual feedback
  const updateCropOverlay = useCallback((newCrop: CropData) => {
    const overlay = cropOverlayRef.current;
    if (overlay) {
      overlay.style.left = newCrop.x + 'px';
      overlay.style.top = newCrop.y + 'px';
      overlay.style.width = newCrop.width + 'px';
      overlay.style.height = newCrop.height + 'px';
    }
  }, []);

  // Throttled update function for smooth rendering
  const updateCropData = useCallback((newCrop: CropData) => {
    // Update DOM immediately for instant visual feedback
    updateCropOverlay(newCrop);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setCropData(newCrop);
      animationFrameRef.current = null;
    });
  }, [updateCropOverlay]);

  // Global mouse and touch event handlers for dragging and resizing
  useEffect(() => {
    const getEventPosition = (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const canvasRect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return { x: 0, y: 0 };
      }
      
      return {
        x: clientX - canvasRect.left,
        y: clientY - canvasRect.top
      };
    };

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const pos = getEventPosition(e);

      if (isDraggingCropRef.current) {
        const deltaX = pos.x - dragStartRef.current.x;
        const deltaY = pos.y - dragStartRef.current.y;
        
        const newX = cropStartRef.current.x + deltaX;
        const newY = cropStartRef.current.y + deltaY;
        
        // Constrain to canvas bounds
        const constrainedX = Math.max(0, Math.min(newX, canvas.width - cropStartRef.current.width));
        const constrainedY = Math.max(0, Math.min(newY, canvas.height - cropStartRef.current.height));
        
        updateCropData({
          x: constrainedX,
          y: constrainedY,
          width: cropStartRef.current.width,
          height: cropStartRef.current.height
        });
      } else if (isResizingRef.current) {
        const handle = resizeHandleRef.current;
        const startCrop = cropStartRef.current;
        const newCrop = { ...startCrop };

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
          
          // Circle resize handles - maintain perfect 1:1 aspect ratio
          case 'circle-nw': // circle top-left - anchor bottom-right corner
            {
              // Anchor the bottom-right corner, resize from top-left
              const anchorX = startCrop.x + startCrop.width;
              const anchorY = startCrop.y + startCrop.height;
              
              // Calculate how much the top-left moved
              const newX = Math.max(0, startCrop.x + deltaX);
              const newY = Math.max(0, startCrop.y + deltaY);
              
              // Calculate new size based on distance from anchor
              const newWidth = Math.max(20, anchorX - newX);
              const newHeight = Math.max(20, anchorY - newY);
              const newSize = Math.min(newWidth, newHeight); // Keep it circular
              
              newCrop.x = anchorX - newSize;
              newCrop.y = anchorY - newSize;
              newCrop.width = newSize;
              newCrop.height = newSize;
            }
            break;
          case 'circle-ne': // circle top-right - anchor bottom-left corner
            {
              const anchorX = startCrop.x;
              const anchorY = startCrop.y + startCrop.height;
              
              const newX = startCrop.x + startCrop.width + deltaX;
              const newY = Math.max(0, startCrop.y + deltaY);
              
              const newWidth = Math.max(20, newX - anchorX);
              const newHeight = Math.max(20, anchorY - newY);
              const newSize = Math.min(newWidth, newHeight);
              
              newCrop.x = anchorX;
              newCrop.y = anchorY - newSize;
              newCrop.width = newSize;
              newCrop.height = newSize;
            }
            break;
          case 'circle-sw': // circle bottom-left - anchor top-right corner
            {
              const anchorX = startCrop.x + startCrop.width;
              const anchorY = startCrop.y;
              
              const newX = Math.max(0, startCrop.x + deltaX);
              const newY = startCrop.y + startCrop.height + deltaY;
              
              const newWidth = Math.max(20, anchorX - newX);
              const newHeight = Math.max(20, newY - anchorY);
              const newSize = Math.min(newWidth, newHeight);
              
              newCrop.x = anchorX - newSize;
              newCrop.y = anchorY;
              newCrop.width = newSize;
              newCrop.height = newSize;
            }
            break;
          case 'circle-se': // circle bottom-right - anchor top-left corner
            {
              const anchorX = startCrop.x;
              const anchorY = startCrop.y;
              
              const newX = startCrop.x + startCrop.width + deltaX;
              const newY = startCrop.y + startCrop.height + deltaY;
              
              const newWidth = Math.max(20, newX - anchorX);
              const newHeight = Math.max(20, newY - anchorY);
              const newSize = Math.min(newWidth, newHeight);
              
              newCrop.x = anchorX;
              newCrop.y = anchorY;
              newCrop.width = newSize;
              newCrop.height = newSize;
            }
            break;
        }

        // Ensure crop area doesn't exceed canvas bounds
        if (newCrop.x + newCrop.width > canvas.width) {
          newCrop.width = canvas.width - newCrop.x;
        }
        if (newCrop.y + newCrop.height > canvas.height) {
          newCrop.height = canvas.height - newCrop.y;
        }

        // For circles, ensure width and height are always equal after bounds checking
        if (handle.startsWith('circle-')) {
          const minSize = Math.min(newCrop.width, newCrop.height);
          newCrop.width = minSize;
          newCrop.height = minSize;
        }

        updateCropData(newCrop);
      }
    };

    const handleGlobalEnd = () => {
      if (isDraggingCropRef.current) {
        console.log('Global end - stopping drag');
        isDraggingCropRef.current = false;
        setIsDraggingCrop(false);
      }
      if (isResizingRef.current) {
        console.log('Global end - stopping resize');
        isResizingRef.current = false;
        resizeHandleRef.current = '';
      }
    };

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('touchcancel', handleGlobalEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
      
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [updateCropData]);

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
          const handleNativeMouseDown = () => {
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
  const initializeCropArea = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = Math.min(canvas.width * 0.7, 200);
    const height = Math.min(canvas.height * 0.7, 200);
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    console.log('Initializing crop area:', { x, y, width, height });
    setCropData({ x, y, width, height });
  }, []);



  // Perform crop operation
  const performCrop = useCallback(() => {
    console.log('Krop Photo button clicked!');
    console.log('Image:', !!image);
    console.log('Crop data:', cropData);
    console.log('Scale:', scale);
    
    if (!image || cropData.width === 0 || cropData.height === 0) {
      console.log('No image or crop area selected');
      alert('Please select an area to crop first!');
      return;
    }

    const canvas = previewCanvasRef.current;
    if (!canvas) {
      console.log('Preview canvas not found');
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
      console.log('Could not get canvas context');
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
    
    // Check if the cropped image is too large for Farcaster
    const imageSizeBytes = Math.round((imageData.length * 3) / 4); // Approximate size from base64
    const imageSizeMB = (imageSizeBytes / (1024 * 1024)).toFixed(2);
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB Farcaster limit
    
    console.log(`📏 Cropped image size: ${imageSizeMB} MB`);
    
    if (imageSizeBytes > maxSizeBytes) {
      console.log(`❌ Cropped image too large for Farcaster: ${imageSizeMB} MB > 10 MB`);
      sendNotification({
        title: 'Image Too Large',
        body: `Cropped image is ${imageSizeMB} MB. Farcaster requires < 10 MB. Try a smaller crop area.`
      });
      return; // Don't proceed with crop
    } else if (imageSizeBytes > maxSizeBytes * 0.8) { // Warning at 8+ MB
      console.log(`⚠️ Cropped image is large: ${imageSizeMB} MB (close to 10 MB limit)`);
      sendNotification({
        title: 'Large Image Warning',
        body: `Image is ${imageSizeMB} MB. Consider a smaller crop for faster sharing.`
      });
    }
    
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
    setShowCroppedResult(true);
    setIsProcessing(false);
    console.log('✅ Crop operation completed!');
    
    // Show cropped result on main canvas
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const mainCtx = mainCanvas.getContext('2d');
      if (mainCtx) {
        // Calculate display dimensions to fit canvas while maintaining aspect ratio
        const maxWidth = mainCanvas.width;
        const maxHeight = mainCanvas.height;
        const aspectRatio = canvas.width / canvas.height;
        
        let displayWidth = maxWidth;
        let displayHeight = maxWidth / aspectRatio;
        
        if (displayHeight > maxHeight) {
          displayHeight = maxHeight;
          displayWidth = maxHeight * aspectRatio;
        }
        
        // Center the cropped image
        const x = (maxWidth - displayWidth) / 2;
        const y = (maxHeight - displayHeight) / 2;
        
        // Clear main canvas and draw cropped result
        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        mainCtx.drawImage(canvas, x, y, displayWidth, displayHeight);
        
        console.log('✅ Cropped result displayed on main canvas');
      }
    }
  }, [image, cropData, scale, cropShape]);

  // Download cropped image
  const downloadImage = useCallback(() => {
    if (!croppedImageData) {
      console.log('No cropped image data available');
      alert('Please crop an image first!');
      return;
    }

    console.log('Starting download process...');

    // Detect environment and device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isFarcaster = window.parent !== window || window.location !== window.parent.location;
    
    console.log('Environment detection - Mobile:', isMobile, 'Farcaster:', isFarcaster);

    // Farcaster Mini App environment - use MiniKit openUrl
    if (isFarcaster) {
      try {
        // Create a data URL that opens directly in browser
        const dataUrl = croppedImageData;
        
        // Use MiniKit openUrl to open the image data URL in external browser
        openUrl(dataUrl);
        
        sendNotification({
          title: 'Image Opening!',
          body: 'Image will open in your browser where you can save it.'
        });
        
        console.log('Farcaster: Used openUrl with data URL');
        return;
      } catch (error) {
        console.error('Farcaster openUrl failed:', error);
        
        // Fallback: Try to copy image data to clipboard
        try {
          navigator.clipboard.writeText(croppedImageData).then(() => {
            sendNotification({
              title: 'Image Copied!',
              body: 'Image data copied to clipboard. Paste in browser to view/save.'
            });
          });
          return;
        } catch (clipboardError) {
          console.error('Clipboard fallback failed:', clipboardError);
          alert('Download not available in Farcaster environment. Try opening the app in your browser.');
          return;
        }
      }
    }

    // Regular mobile browser
    if (isMobile) {
      try {
        // For mobile: Open image in new tab for long-press save
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Kropped Image - Long press to save</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    background: var(--app-background); 
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                  img { 
                    max-width: 100%; 
                    max-height: 80vh; 
                    height: auto; 
                    border-radius: 8px;
                    box-shadow: 0 4px 20px var(--app-overlay-light);
                  }
                  .instructions {
                    color: var(--app-foreground);
                    text-align: center;
                    margin-top: 20px;
                    font-size: 16px;
                    opacity: 0.8;
                  }
                  .instructions strong {
                    color: var(--app-success);
                  }
                </style>
              </head>
              <body>
                <img src="${croppedImageData}" alt="Kropped Image" />
                <div class="instructions">
                  <strong>Mobile Users:</strong><br>
                  Long press the image above and select "Save to Photos" or "Download Image"
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
          
          sendNotification({
            title: 'Image Ready!',
            body: 'Long press the image to save to your device.'
          });
        } else {
          throw new Error('Could not open new window');
        }
      } catch (error) {
        console.error('Mobile download method failed:', error);
        alert('Please allow pop-ups to download images on mobile devices.');
      }
      return;
    }

    // Desktop download method
    try {
      const link = document.createElement('a');
      link.href = croppedImageData;
      link.download = `kropped-image-${Date.now()}.png`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);

      sendNotification({
        title: 'Photo Kropped!',
        body: 'Your photo has been successfully cropped and downloaded.'
      });

    } catch (error) {
      console.error('Desktop download failed, trying fallback:', error);
      
      // Fallback: Try canvas blob method
      const canvas = previewCanvasRef.current;
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kropped-image-${Date.now()}.png`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              URL.revokeObjectURL(url);
            }, 1000);

            sendNotification({
              title: 'Photo Kropped!',
              body: 'Your photo has been successfully cropped and downloaded.'
            });
          } else {
            throw new Error('Failed to create blob');
          }
        }, 'image/png');
      } else {
        throw new Error('No canvas available');
      }
    }
  }, [croppedImageData, sendNotification, openUrl]);

  // Upload image to temporary hosting for casting
  // Compress image for optimal Farcaster performance
  const compressImageForFarcaster = useCallback(async (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate optimal dimensions (min 600x400, max 3000x2000, maintain aspect ratio)
        let { width, height } = img;
        const maxWidth = 1200; // Sweet spot for quality vs file size
        const maxHeight = 800;
        const minWidth = 600;
        const minHeight = 400;
        
        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Scale up if too small (but only slightly to avoid quality loss)
        if (width < minWidth && height < minHeight) {
          const ratio = Math.min(minWidth / width, minHeight / height);
          if (ratio <= 1.5) { // Only scale up if not too aggressive
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to optimized PNG (good balance of quality and compression)
        const compressedData = canvas.toDataURL('image/png', 0.95);
        console.log('🔵 COMPRESS DEBUG: Original size vs compressed:', imageData.length, 'vs', compressedData.length);
        console.log('🔵 COMPRESS DEBUG: Final dimensions:', width, 'x', height);
        
        resolve(compressedData);
      };
      img.src = imageData;
    });
  }, []);

  // Create temporary upload for Vercel hosting
  const uploadImageForVercel = useCallback(async (imageData: string): Promise<string | null> => {
    try {
      console.log('🔵 UPLOAD DEBUG: Creating temporary image for Vercel hosting');
      
      // Compress image for optimal Farcaster performance
      const compressedImageData = await compressImageForFarcaster(imageData);
      
      // Convert base64 to blob for upload
      const response = await fetch(compressedImageData);
      const blob = await response.blob();
      console.log('🔵 UPLOAD DEBUG: Blob size after compression:', blob.size);
      
      // Upload to temporary storage for Vercel to proxy
      const formData = new FormData();
      formData.append('image', blob, 'kropped-image.png');
      
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
      
      const result = await uploadResponse.json();
      console.log('🔵 UPLOAD DEBUG: Temporary upload success! URL:', result.url);
      
      return result.url;
      
    } catch (error) {
      console.error('🔵 UPLOAD DEBUG: Upload failed:', error);
      sendNotification({
        title: 'Upload Failed',
        body: 'Could not prepare image for casting.'
      });
      return null;
    }
  }, [sendNotification, compressImageForFarcaster]);

  // Retry logic for composeCast timeouts
  const castWithRetry = useCallback(async (castData: any, maxRetries = 2) => {
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`🎯 CAST DEBUG: Attempt ${retryCount + 1}/${maxRetries + 1}`);
        return await sdk.actions.composeCast(castData);
      } catch (error) {
        console.log(`🎯 CAST DEBUG: Attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries && (
          error.message?.toLowerCase().includes('timeout') ||
          error.message?.toLowerCase().includes('network') ||
          error.name === 'TimeoutError'
        )) {
          retryCount++;
          const delay = Math.min(1000 * retryCount, 3000); // Progressive delay: 1s, 2s, 3s max
          console.log(`🎯 CAST DEBUG: Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }, []);

  // Share to Farcaster directly
  const shareToFarcaster = useCallback(async () => {
    if (!croppedImageData) {
      sendNotification({
        title: 'No Image',
        body: 'Please crop an image first!'
      });
      return;
    }

    console.log('🎯 CAST DEBUG: Starting Farcaster cast process...');
    setIsProcessing(true);
    
    // Show initial loading notification
    sendNotification({
      title: 'Preparing Cast...',
      body: 'Uploading your cropped image to Farcaster...'
    });
    
    try {
      console.log('🎯 CAST DEBUG: Uploading image to get public URL...');
      // Upload image and get URL (back to working approach)
      const imageUrl = await uploadImageForVercel(croppedImageData);
      console.log('🎯 CAST DEBUG: Image upload result:', imageUrl ? 'Success' : 'Failed');
      
      if (imageUrl) {
        console.log('🎯 CAST DEBUG: Using composeCast API with direct image URL...');
        
        // TEMP FIX: Try friend's working pattern - direct image URL in embeds
        // OLD VERSION (for rollback): const brandedImageUrl = `${window.location.origin}/api/generate-image?imageUrl=${encodeURIComponent(imageUrl)}`;
        
        const castData = {
          text: "Kroppit keeping it simple: crop and cast in one flow.",
          embeds: [
            imageUrl, // Direct image URL first
            "https://kroppit.vercel.app" // Mini app URL second
          ],
          channelKey: "miniapps"
        };
      
      console.log('🎯 CAST DEBUG: Cast data:', castData);
      console.log('🎯 CAST DEBUG: SDK available:', typeof sdk);
      console.log('🎯 CAST DEBUG: composeCast available:', typeof sdk?.actions?.composeCast);
        
        try {
          // Check SDK availability first
          if (!sdk?.actions?.composeCast) {
            throw new Error('Farcaster SDK not available - make sure you\'re in a Farcaster client');
          }
          
          // Use the working composeCast implementation with embeds
          console.log('🎯 CAST DEBUG: Calling composeCast with embeds...');
          console.log('🎯 CAST DEBUG: Cast data being sent:', castData);
          
          const result = await sdk.actions.composeCast({
            text: "Kroppit keeping it simple: crop and cast in one flow.",
            embeds: [imageUrl, "https://kroppit.vercel.app"],
            channelKey: "miniapps"
          });
          
          console.log('🎯 CAST DEBUG: composeCast result:', result);
          
          if (result) {
            console.log('🎯 CAST DEBUG: Cast created successfully!');
            sendNotification({
              title: 'Cast Created! 🎉',
              body: 'Your cropped image has been shared to Farcaster!'
            });
          } else {
            console.log('🎯 CAST DEBUG: User cancelled cast');
            sendNotification({
              title: 'Cast Cancelled',
              body: 'Cast creation was cancelled by user.'
            });
          }
          
          // Reset the UI to allow for new cropping
          setShowPreview(false);
          setCroppedImageData(null);
          setShowCroppedResult(false);
          
          return; // Success - exit early
          
        } catch (composeCastError) {
          console.error('🎯 CAST DEBUG: composeCast error:', composeCastError);
          
          // Show specific error messages based on the error type
          if (composeCastError.message?.includes('not available')) {
            sendNotification({
              title: 'Farcaster Required',
              body: 'Please open this app in Farcaster to share casts.'
            });
          } else if (composeCastError.message?.toLowerCase().includes('timeout')) {
            sendNotification({
              title: 'Cast Timed Out',
              body: 'The cast composer is having issues. Please try again in a moment.'
            });
          } else {
            sendNotification({
              title: 'Cast Failed',
              body: `Could not open cast composer: ${composeCastError.message || 'Unknown error'}`
            });
          }
          
          throw composeCastError; // Re-throw to be caught by outer try-catch
        }
      } else {
        throw new Error('Failed to upload image - no URL returned');
      }
    } catch (error) {
      console.error('🎯 CAST DEBUG: Share to Farcaster error:', error);
      sendNotification({
        title: 'Cast Failed',
        body: `Could not share to Farcaster: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
      console.log('🎯 CAST DEBUG: Cast process completed.');
    }
  }, [croppedImageData, uploadImageForVercel, openUrl, sendNotification]);

  // Unified handler for both mouse and touch events
  const handleStartDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    console.log('Starting drag');
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    
    const pos = {
      x: clientX - canvasRect.left,
      y: clientY - canvasRect.top
    };
    
    isDraggingCropRef.current = true;
    setIsDraggingCrop(true);
    dragStartRef.current = pos;
    cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
    
    console.log('Drag started at:', pos);
  }, [cropData]);

  // Unified handler for resize start
  const handleStartResize = useCallback((e: React.MouseEvent | React.TouchEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    
    const pos = { x: clientX - canvasRect.left, y: clientY - canvasRect.top };
    
    isResizingRef.current = true;
    resizeHandleRef.current = handle;
    dragStartRef.current = pos;
    cropStartRef.current = { x: cropData.x, y: cropData.y, width: cropData.width, height: cropData.height };
  }, [cropData]);

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


  // Reset crop
  const resetCrop = useCallback(() => {
    if (image) {
      // Reset visual state first
      setShowCroppedResult(false);
      setShowPreview(false);
      setCroppedImageData(null);
      
      // Reset crop shape to default rectangle
      setCropShape('rectangle');
      
      // Redraw original image on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        drawImage(image, canvas);
      }
      
      // Reset crop area
      initializeCropArea(image);
    }
  }, [image, initializeCropArea, drawImage]);

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
            <div className="text-[var(--app-foreground)] mb-2">
              <p className={`${isDragOver ? 'font-medium' : 'text-lg font-medium'}`}>
                {isDragOver ? 'Drop your photo here!' : 'Create perfect crops for Farcaster'}
              </p>
              <p className="text-sm text-[var(--app-foreground-muted)]">
                {isDragOver ? 'Release to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            {!isDragOver && (
              <Button variant="primary" size="sm" className="mt-4">
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
              
              
              {/* Draggable crop area - hide when showing result */}
              {cropData.width > 0 && cropData.height > 0 && !showCroppedResult && (
                <div
                  ref={cropOverlayRef}
                  className={`absolute border-2 border-white shadow-lg cursor-move ${cropShape === 'circle' ? 'rounded-full' : ''}`}
                  style={{
                    left: cropData.x + 'px',
                    top: cropData.y + 'px',
                    width: cropData.width + 'px',
                    height: cropData.height + 'px',
                    zIndex: 1000,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={handleStartDrag}
                  onTouchStart={handleStartDrag}
                >

                  {/* Corner resize handles */}
                  {cropShape === 'rectangle' && (
                    <>
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 cursor-nw-resize"
                        style={{ left: '-6px', top: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'nw')}
                        onTouchStart={(e) => handleStartResize(e, 'nw')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 cursor-ne-resize"
                        style={{ right: '-6px', top: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'ne')}
                        onTouchStart={(e) => handleStartResize(e, 'ne')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 cursor-sw-resize"
                        style={{ left: '-6px', bottom: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'sw')}
                        onTouchStart={(e) => handleStartResize(e, 'sw')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 cursor-se-resize"
                        style={{ right: '-6px', bottom: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'se')}
                        onTouchStart={(e) => handleStartResize(e, 'se')}
                      />
                    </>
                  )}

                  {/* Circle resize handles - only corner handles for proportional resize */}
                  {cropShape === 'circle' && (
                    <>
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-full cursor-nw-resize"
                        style={{ left: '-6px', top: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'circle-nw')}
                        onTouchStart={(e) => handleStartResize(e, 'circle-nw')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-full cursor-ne-resize"
                        style={{ right: '-6px', top: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'circle-ne')}
                        onTouchStart={(e) => handleStartResize(e, 'circle-ne')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-full cursor-sw-resize"
                        style={{ left: '-6px', bottom: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'circle-sw')}
                        onTouchStart={(e) => handleStartResize(e, 'circle-sw')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-full cursor-se-resize"
                        style={{ right: '-6px', bottom: '-6px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'circle-se')}
                        onTouchStart={(e) => handleStartResize(e, 'circle-se')}
                      />
                    </>
                  )}

                  {/* Edge resize handles - only for rectangle crops */}
                  {cropShape === 'rectangle' && (
                    <>
                      <div
                        className="absolute w-full h-1 cursor-n-resize"
                        style={{ left: '0', top: '-3px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'n')}
                        onTouchStart={(e) => handleStartResize(e, 'n')}
                      />
                      <div
                        className="absolute w-full h-1 cursor-s-resize"
                        style={{ left: '0', bottom: '-3px', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 's')}
                        onTouchStart={(e) => handleStartResize(e, 's')}
                      />
                      <div
                        className="absolute w-1 h-full cursor-w-resize"
                        style={{ left: '-3px', top: '0', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'w')}
                        onTouchStart={(e) => handleStartResize(e, 'w')}
                      />
                      <div
                        className="absolute w-1 h-full cursor-e-resize"
                        style={{ right: '-3px', top: '0', zIndex: 1001 }}
                        onMouseDown={(e) => handleStartResize(e, 'e')}
                        onTouchStart={(e) => handleStartResize(e, 'e')}
                      />
                    </>
                  )}
                </div>
              )}
              
              {/* Overlay to show grayed out areas - only when not dragging and not showing result */}
              {cropData.width > 0 && cropData.height > 0 && !isDraggingCrop && !showCroppedResult && (
                <>
                  {cropShape === 'circle' ? (
                    /* Circle overlay - everything except the circle */
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle ${Math.min(cropData.width, cropData.height) / 2}px at ${cropData.x + cropData.width / 2}px ${cropData.y + cropData.height / 2}px, transparent ${Math.min(cropData.width, cropData.height) / 2}px, var(--app-overlay) ${Math.min(cropData.width, cropData.height) / 2 + 1}px)`,
                        zIndex: 1
                      }}
                    />
                  ) : (
                    /* Rectangle overlay */
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: 'var(--app-overlay)',
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
            <div className="text-sm font-medium text-[var(--app-foreground)] text-center">Aspect Ratio:</div>
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
        
        {/* Share button - show after cropping */}
        {showPreview && (
          <Button
            onClick={shareToFarcaster}
            variant="primary"
            size="sm"
            className="w-full"
            icon={isProcessing ? undefined : <Icon name="star" size="sm" />}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Publishing Cast...
              </div>
            ) : (
              'Share on Farcaster'
            )}
          </Button>
        )}


        {/* New photo button when preview is shown */}
        {showPreview && (
          <Button
            onClick={() => {
              // Reset all state
              setImage(null);
              setShowPreview(false);
              setCroppedImageData(null);
              setShowCroppedResult(false);
              setCropData({ x: 0, y: 0, width: 0, height: 0 });
              setIsProcessing(false);
              setIsDraggingCrop(false);
              setCropShape('rectangle');
              setScale(1);
              
              // Reset refs
              isDraggingCropRef.current = false;
              isResizingRef.current = false;
              resizeHandleRef.current = '';
              dragStartRef.current = { x: 0, y: 0 };
              cropStartRef.current = { x: 0, y: 0, width: 0, height: 0 };
              
              // Clear file input to allow re-uploading the same file
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              
              // Cancel any pending animation frames
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }
              
              // Immediately open file picker dialog
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 100);
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