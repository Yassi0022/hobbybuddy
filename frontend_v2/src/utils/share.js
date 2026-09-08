export function shareVibe(archetype) {
  if (window.plausible) window.plausible('Share Clicked', { props: { channel: 'native' } });
  const shareText = `I just found my vibe on HobbyBuddy — I'm a "${archetype}"! 🧠✨\n\nTake the free personality quiz and find your people:`;
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
  if (window.plausible) window.plausible('Share Clicked', { props: { channel: 'whatsapp' } });
  const text = encodeURIComponent(
    `I just found my vibe on HobbyBuddy — I'm a "${archetype}"! 🧠✨ Take the free personality quiz: ${window.location.origin}/register?ref=${localStorage.getItem('userId')}`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

export function shareToTelegram(archetype) {
  if (window.plausible) window.plausible('Share Clicked', { props: { channel: 'telegram' } });
  const text = encodeURIComponent(`I just found my vibe on HobbyBuddy — I'm a "${archetype}"! 🧠✨`);
  const url = encodeURIComponent(`${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

export function shareToTwitter(archetype) {
  if (window.plausible) window.plausible('Share Clicked', { props: { channel: 'twitter' } });
  const text = encodeURIComponent(
    `I just found my vibe on HobbyBuddy — I'm a "${archetype}"! 🧠✨ Take the free personality quiz and find your people.`
  );
  const url = encodeURIComponent(`${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

export function copyInviteLink() {
  if (window.plausible) window.plausible('Share Clicked', { props: { channel: 'clipboard' } });
  const userId = localStorage.getItem('userId');
  const inviteUrl = window.location.origin + '/register?ref=' + userId;
  const shareText = `Join me on HobbyBuddy! 🧠✨ Take the free personality quiz and find your people: ${inviteUrl}`;
  return navigator.clipboard.writeText(shareText);
}
