import toast from 'react-hot-toast';

/**
 * Show a toast notification using react-hot-toast.
 * Drop-in replacement for the old DOM-based toast.
 *
 * @param {string} message  — text to display
 * @param {'success'|'error'|'info'} type  — toast variant
 */
export function showToast(message, type = 'error') {
  if (type === 'success') toast.success(message);
  else if (type === 'error') toast.error(message);
  else toast(message);
}
