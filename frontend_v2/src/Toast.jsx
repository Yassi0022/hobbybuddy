/* Toast notifications */
export function showToast(message, _type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
