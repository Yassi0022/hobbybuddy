/* Invite friends feature — email form + personalized message + multiple emails */
export function InviteFriends() {
  return `
    <form onsubmit="event.preventDefault(); const emails=this.querySelector('textarea').value.split(',').map(e=>e.trim()).filter(Boolean); if(emails.length===0) return alert('Please enter at least one email'); alert('Invites sent to: '+emails.join(', ')); this.querySelector('textarea').value='';" class="invite-form">
      <h3>Invite Friends</h3>
      <p>Send a personalized invite to friends who might enjoy HobbyBuddy.</p>
      <label for="invite-msg">Personal message (optional)</label>
      <textarea id="invite-msg" rows="3" placeholder="I'd love for you to join me on HobbyBuddy — let's find some fun hobbies together!" style="width:100%;padding:.75rem;border-radius:8px;border:1px solid #e6ddd5;font-family:inherit;background:#fff8f5"></textarea>
      <label for="invite-emails" style="margin-top:1rem;display:block;font-weight:600">Friend emails (comma-separated)</label>
      <textarea id="invite-emails" rows="3" placeholder="friend1@example.com, friend2@example.com" required style="width:100%;padding:.75rem;border-radius:8px;border:1px solid #e6ddd5;font-family:inherit;background:#fff8f5"></textarea>
      <button type="submit" style="margin-top:1rem;padding:.75rem 1.75rem;background:#c2410c;color:#fff;border:none;border-radius:999px;font-weight:600;cursor:pointer">Send Invites</button>
    </form>
  `;
}
