/* Profile completion progress indicator */
export function ProfileProgress({ percent = 60 }) {
  const suggestions = [
    percent < 40 ? 'Add a profile photo' : null,
    percent < 70 ? 'Write a short bio' : null,
    percent < 90 ? 'Add your hobbies' : null,
  ].filter(Boolean);
  return `
    <div class="profile-progress" style="max-width:480px;padding:1.5rem;background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(194,65,12,0.08);">
      <h3 style="font-size:1.1rem;font-weight:700;color:#c2410c;margin-bottom:.5rem;">Profile Completion</h3>
      <div style="height:12px;background:#f0ebe5;border-radius:999px;overflow:hidden;margin-bottom:.75rem;">
        <div style="width:${percent}%;height:100%;background:#c2410c;border-radius:999px;transition:width .5s ease;"></div>
      </div>
      <p style="font-weight:700;color:#2d1810;margin-bottom:.25rem;">${percent}% complete</p>
      ${suggestions.length > 0 ? `<ul style="padding-left:1.25rem;color:#5a3e2b;font-size:.9rem;margin-top:.5rem;">` + suggestions.map(s => `<li>${s}</li>`).join('') + `</ul>` : '<p style="font-size:.9rem;color:#5a3e2b;margin-top:.5rem;">Your profile is almost complete!</p>'}
    </div>
  `;
}
