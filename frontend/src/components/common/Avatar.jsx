import { useState } from 'react';
import { resolveAssetUrl } from '../../services/api';

/**
 * Unified avatar renderer.
 *
 * - Renders the user's profilePicture as an <img> when present.
 * - Falls back to the initials circle (blue background, white letter) if the
 *   picture is missing or the URL 404s (which can happen after a Railway
 *   redeploy wipes the ephemeral filesystem).
 */
const Avatar = ({ user, size = 32, className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const sizePx = typeof size === 'number' ? `${size}px` : size;
  const fontPx = typeof size === 'number' ? Math.max(10, Math.round(size * 0.42)) : 14;

  const name = user?.name || '';
  const initial = (name?.trim?.()?.[0] || '?').toUpperCase();
  const url = !imgFailed ? resolveAssetUrl(user?.profilePicture) : '';

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'User avatar'}
        onError={() => setImgFailed(true)}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: sizePx, height: sizePx }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        background: '#2563EB',
        fontSize: `${fontPx}px`,
        lineHeight: 1,
      }}
      aria-label={name || 'User'}
    >
      {initial}
    </div>
  );
};

export default Avatar;