import { useState, useRef } from 'react';
import { showToast } from '../../utils/toast';

/**
 * PhotoUpload — drag-and-drop / click-to-select image uploader.
 *
 * - Accepts up to `maxPhotos` images
 * - Converts each file to Base64 for storage
 * - Backward-compatible: accepts existing URL strings on init
 * - Circular remove button on each preview
 */
export default function PhotoUpload({ photos, onChange, maxPhotos = 3 }) {
  const [dragOver, setDragOver] = useState(null); // index or 'append'
  const fileInputRefs = useRef([]);

  /** Read a File object → Base64 data URL */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Image must be under 5 MB'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /** Place a file at a specific slot index */
  const placeFile = async (file, index) => {
    try {
      const base64 = await fileToBase64(file);
      const next = [...photos];
      next[index] = base64;
      onChange(next);
    } catch (err) {
      showToast(err.message || 'Invalid image', 'error');
    }
  };

  /** Handle file(s) dropped or selected for a specific slot */
  const handleFiles = (files, index) => {
    if (!files || files.length === 0) return;
    placeFile(files[0], index);
  };

  /** Remove a photo at index */
  const removePhoto = (index) => {
    const next = [...photos];
    next[index] = '';
    // Collapse empties to the end
    const filled = next.filter(Boolean);
    while (filled.length < maxPhotos) filled.push('');
    onChange(filled.slice(0, maxPhotos));
  };

  // ── Drag handlers ────────────────────────────────────────
  const onDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(index);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    handleFiles(e.dataTransfer.files, index);
  };

  // ── Styles ───────────────────────────────────────────────
  const slotSize = 120;
  const slotStyle = (isDragOver) => ({
    width: slotSize,
    height: slotSize,
    borderRadius: 14,
    border: isDragOver
      ? '2px dashed var(--color-accent-warm)'
      : '2px dashed var(--color-input-border)',
    background: isDragOver
      ? 'rgba(194, 65, 12, 0.04)'
      : 'var(--color-input-bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  });

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {photos.map((photo, i) => (
        <div key={i}>
          {/* Hidden file input */}
          <input
            ref={(el) => (fileInputRefs.current[i] = el)}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files, i)}
          />

          {photo ? (
            /* ── Filled slot: preview + remove ── */
            <div style={{ position: 'relative', width: slotSize, height: slotSize }}>
              <div
                style={{
                  width: slotSize,
                  height: slotSize,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '2px solid var(--color-border)',
                }}
              >
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  lineHeight: 1,
                }}
                title="Remove photo"
              >
                ✕
              </button>
              {/* Click to replace */}
              <div
                onClick={() => fileInputRefs.current[i]?.click()}
                onDragOver={(e) => onDragOver(e, i)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, i)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 8,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                Replace
              </div>
            </div>
          ) : (
            /* ── Empty slot: drop zone ── */
            <div
              style={slotStyle(dragOver === i)}
              onClick={() => fileInputRefs.current[i]?.click()}
              onDragOver={(e) => onDragOver(e, i)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, i)}
            >
              <i
                className="fas fa-cloud-upload-alt"
                style={{
                  fontSize: '1.5rem',
                  color: dragOver === i
                    ? 'var(--color-accent-warm)'
                    : 'var(--color-text-light)',
                  marginBottom: 8,
                  transition: 'color 0.2s',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  padding: '0 8px',
                }}
              >
                Drop or click
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
