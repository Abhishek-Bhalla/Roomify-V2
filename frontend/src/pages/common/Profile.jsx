import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Trash2 } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import ImageCropper from '../../components/common/ImageCropper';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

  const goHome = () => {
    const role = user?.role;
    if (role === 'admin') navigate('/admin');
    else if (role === 'approver') navigate('/approver');
    else if (role === 'maintenance') navigate('/maintenance');
    else navigate('/requester');
  };

  const onFileChange = (e) => {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
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
      formData.append('avatar', blob, `${user.id}.jpg`);
      const res = await userAPI.uploadAvatar(user.id, formData);
      updateUser(res.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove your profile photo? It will revert to your initials.')) return;
    setIsRemoving(true);
    setError(null);
    try {
      const res = await userAPI.removeAvatar(user.id);
      updateUser(res.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove profile picture.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details and profile picture</p>
      </div>

      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <Avatar user={user} size={128} />
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 truncate">{user.name}</h2>
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
            <span
              className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
              style={{ background: '#2563EB' }}
            >
              {user.role}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
          >
            <Camera size={16} className="mr-2" />
            {isUploading ? 'Uploading...' : user.profilePicture ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {user.profilePicture && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isUploading || isRemoving}
            >
              <Trash2 size={16} className="mr-2" />
              {isRemoving ? 'Removing...' : 'Remove Photo'}
            </Button>
          )}
          <Button variant="outline" onClick={goHome}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          JPG, JPEG, PNG, or WebP up to 5 MB. Photos are cropped to a square.
        </p>
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
    </div>
  );
};

export default Profile;