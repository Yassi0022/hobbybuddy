/* Social sharing buttons — Twitter, Facebook, LinkedIn, WhatsApp with pre-filled message */
export function SocialShare({ url = 'https://hobbybuddy.vercel.app', text = 'Join me on HobbyBuddy — personality-first friendship matching!' }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  return `
    <div class="social-share">
      <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">Twitter</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">Facebook</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">LinkedIn</a>
      <a href="https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">WhatsApp</a>
    </div>
  `;
}
