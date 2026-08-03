import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import Button from './Button';

/**
 * Wrap react-easy-crop with a zoom slider and a fixed 1:1 aspect ratio.
 * On Save, draws the cropped region to a 256x256 canvas and returns a JPEG Blob.
 *
 * Props:
 *   imageSrc  — data URL or object URL of the source image (required)
 *   onCropDone(blob) — called with the cropped JPEG Blob (jpeg mime, 0.9 quality)
 *   onCancel()       — called when the user closes without saving
 */
const OUTPUT_SIZE = 256;

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to create image blob'));
        resolve(blob);
      },
      'image/jpeg',
      0.9
    );
  });
}

const ImageCropper = ({ imageSrc, onCropDone, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    setError(null);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropDone(blob);
    } catch (err) {
      setError(err.message || 'Failed to crop image');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-semibold text-gray-800">Crop your photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative w-full" style={{ height: 320, background: '#1f2937' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: '#E5E7EB' }}>
          <label className="block text-xs text-gray-500 mb-1">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {error && (
          <div className="px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: '#E5E7EB' }}>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Check size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;