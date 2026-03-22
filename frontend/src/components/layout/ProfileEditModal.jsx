import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';

const ProfileEditModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state) => state.auth);
  const [editProfile, setEditProfile] = useState({ name: '', bio: '', profilePhoto: null });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setEditProfile({ name: user?.name || '', bio: user?.bio || '', profilePhoto: null });
    }
  }, [user]);

  useEffect(() => {
    if (editProfile.profilePhoto) {
      const url = URL.createObjectURL(editProfile.profilePhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [editProfile.profilePhoto]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!editProfile.name.trim() && !editProfile.profilePhoto && !editProfile.bio.trim()) {
      setToast({ message: 'Please update at least name or photo', type: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      if (editProfile.name.trim()) {
        formData.append('name', editProfile.name);
      }
      if (editProfile.profilePhoto) {
        formData.append('profilePhoto', editProfile.profilePhoto);
      }
      if (editProfile.bio.trim()) {
        formData.append('bio', editProfile.bio.trim());
      }

      const result = await dispatch(updateProfile(formData));

      if (result.type === 'auth/updateProfile/fulfilled') {
        setToast({ message: 'Profile updated successfully', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 1500);
        setEditProfile({ name: '', bio: '', profilePhoto: null });
      } else {
        setToast({ 
          message: result.payload || 'Failed to update profile', 
          type: 'error' 
        });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setToast({ 
        message: 'Failed to update profile', 
        type: 'error' 
      });
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select a valid image file', type: 'error' });
      return;
    }
    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      setToast({ message: 'Image must be under 2 MB', type: 'error' });
      return;
    }
    setEditProfile({ ...editProfile, profilePhoto: file });
  };

  const handleRemovePhoto = () => {
    setEditProfile({ ...editProfile, profilePhoto: null });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-slate-100">Edit Profile</h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={editProfile.name}
              onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
              placeholder={user?.name}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Photo
            </label>
            {previewUrl && (
              <div className="mb-3 flex items-center gap-3">
                <img src={previewUrl} alt="Selected preview" className="h-16 w-16 rounded-lg object-cover border border-slate-700" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Remove Photo
                </button>
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              onChange={handlePhotoSelect}
              disabled={isLoading}
              className="hidden"
              accept="image/*"
              capture="environment"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              {editProfile.profilePhoto ? 'Change Photo' : 'Choose Photo'}
            </button>
            {editProfile.profilePhoto && (
              <p className="mt-2 text-sm text-slate-400">
                {editProfile.profilePhoto.name}
              </p>
            )}
          </div>

          {/* Bio Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bio
            </label>
            <textarea
              value={editProfile.bio}
              onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
              placeholder="Tell people about you (like Instagram bio)"
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">Max 500 characters</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
                onClick={() => {
                onClose();
                setEditProfile({ name: '', bio: '', profilePhoto: null });
              }}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!editProfile.name.trim() && !editProfile.profilePhoto)}
              className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>

        {/* Toast Notification */}
        {(toast || error) && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${
            (toast?.type === 'success' || (!error && toast?.type !== 'error')) 
              ? 'bg-emerald-950/95 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/95 border border-red-500/40 text-red-300'
          }`}>
            {toast?.message || error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEditModal;
