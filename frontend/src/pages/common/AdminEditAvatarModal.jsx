import { useRef, useState } from 'react';
import { X, Camera, Trash2 } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import ImageCropper from '../../components/common/ImageCropper';
import Button from '../../components/common/Button';
import { userAPI } from '../../services/api';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Admin-only modal to overwrite or remove a target user's avatar.
 * Receives the latest user record via `user` prop and calls `onUpdated(user)`
 * with the new server-side user record so the parent can refresh its list.
 */
const AdminEditAvatarModal = ({ user, onClose, onUpdated }) => {
  const fileInputRef = useRef(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

  const onFileChange = (e) => {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_MIMETYPES.includes(file.type)) {
      setError('Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File too large. Maximum size is 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result);
      setPickerOpen(true);
    };
    reader.onerror = () => setError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleCropDone = async (blob) => {
    setPickerOpen(false);
    setPendingImage(null);
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', blob, `${user._id}.jpg`);
      const res = await userAPI.uploadAvatar(user._id, formData);
      onUpdated(res.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${user.name}'s profile photo?`)) return;
    setIsRemoving(true);
    setError(null);
    try {
      const res = await userAPI.removeAvatar(user._id);
      onUpdated(res.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove avatar.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Edit Avatar</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <Avatar user={user} size={120} />
            <p className="font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRemoving}
              className="flex-1"
            >
              <Camera size={16} className="mr-2" />
              {isUploading ? 'Uploading...' : 'Upload New Photo'}
            </Button>
            {user.profilePicture && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={isUploading || isRemoving}
              >
                <Trash2 size={16} className="mr-2" />
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            JPG, JPEG, PNG, or WebP up to 5 MB. Cropped to a square.
          </p>
        </div>
      </div>

      {pickerOpen && pendingImage && (
        <ImageCropper
          imageSrc={pendingImage}
          onCropDone={handleCropDone}
          onCancel={() => {
            setPickerOpen(false);
            setPendingImage(null);
          }}
        />
      )}
    </>
  );
};

export default AdminEditAvatarModal;