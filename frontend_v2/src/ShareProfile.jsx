/* Share profile component — copy link + social buttons */
export function ShareProfile({ profileUrl }) {
  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => alert('Profile link copied!'));
  };
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=Check%20out%20my%20profile%20on%20HobbyBuddy!`, '_blank');
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank');
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, '_blank');
  return `
    <div class="share-profile">
      <button onclick="(${copyLink.toString()})()">Copy Link</button>
      <button onclick="(${shareTwitter.toString()})()">Twitter</button>
      <button onclick="(${shareFacebook.toString()})()">Facebook</button>
      <button onclick="(${shareLinkedIn.toString()})()">LinkedIn</button>
    </div>
  `;
}
