export function shareVibe(archetype) {
  const userName = localStorage.getItem('userName') || 'Buddy';
  const shareText = `I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨\n\nTake the free personality quiz and find your hobby twin:`;
  const shareUrl = window.location.origin + '/register?ref=' + localStorage.getItem('userId');

  if (navigator.share) {
    navigator.share({
      title: 'HobbyBuddy — My Personality Vibe',
      text: shareText,
      url: shareUrl,
    }).catch(() => {
      navigator.clipboard.writeText(shareText + ' ' + shareUrl);
    });
  } else {
    navigator.clipboard.writeText(shareText + ' ' + shareUrl);
  }
}

export function shareToWhatsApp(archetype) {
  const text = encodeURIComponent(
    `I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨ Take the free personality quiz: ${window.location.origin}/register?ref=${localStorage.getItem('userId')}`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

export function shareToTelegram(archetype) {
  const text = encodeURIComponent(`I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨`);
  const url = encodeURIComponent(`${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

export function shareToTwitter(archetype) {
  const text = encodeURIComponent(
    `I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨ Take the free personality quiz and find your hobby twin.`
  );
  const url = encodeURIComponent(`${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

export function copyInviteLink() {
  const userId = localStorage.getItem('userId');
  const inviteUrl = window.location.origin + '/register?ref=' + userId;
  const shareText = `Join me on HobbyBuddy! 🧠✨ Find your hobby twin with AI-powered personality matching: ${inviteUrl}`;
  return navigator.clipboard.writeText(shareText);
}
