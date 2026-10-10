const audio = document.querySelector('#audio');
const library = document.querySelector('#library');
const stories = document.querySelector('#stories');
const status = document.querySelector('#status');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const floatingPlayer = document.querySelector('.player');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--player-height', `${floatingPlayer.getBoundingClientRect().height}px`);
}).observe(floatingPlayer);
let tracks = [];
let selected = -1;

function render() {
  library.replaceChildren();
  stories.replaceChildren();
  const visible = [...tracks.filter(track => track.type !== 'story'), ...tracks.filter(track => track.type === 'story')];
  document.querySelector('#count').textContent = `${tracks.length} recording${tracks.length === 1 ? '' : 's'}`;
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = tracks.length ? 'No recordings in this collection yet.' : 'No recordings yet. Once audio files are added, they’ll be ready to play here.';
    library.append(empty);
  }
  for (const track of visible) {
    const index = tracks.indexOf(track);
    const button = document.createElement('button');
    button.className = 'track';
    button.setAttribute('aria-current', String(selected === index));
    if (track.type === 'story') {
      button.className = 'story';
      button.setAttribute('aria-label', `Play ${track.title}`);
      const cover = document.createElement('img');
      cover.src = track.thumbnail;
      cover.alt = track.title;
      cover.loading = 'lazy';
      cover.decoding = 'async';
      button.append(cover);
      button.addEventListener('click', () => select(index));
      stories.append(button);
      continue;
    }
    const icon = document.createElement('span');
    icon.className = 'icon'; icon.textContent = track.type === 'song' ? '♫' : '◌'; icon.setAttribute('aria-hidden', 'true');
    const details = document.createElement('span'); details.className = 'details';
    const title = document.createElement('strong'); title.textContent = track.title;
    const subtitle = document.createElement('small'); subtitle.textContent = track.description || (track.type === 'song' ? 'Song' : 'Message');
    details.append(title, subtitle); button.append(icon, details);
    button.addEventListener('click', () => select(index)); library.append(button);
  }
  previous.disabled = selected <= 0;
  next.disabled = selected < 0 || selected >= tracks.length - 1;
}

async function select(index) {
  if (!tracks[index]) return;
  selected = index;
  const track = tracks[index];
  document.querySelector('#now-title').textContent = track.title;
  document.querySelector('#description').textContent = track.description || '';
  status.textContent = '';
  audio.src = track.file;
  render();
  try { await audio.play(); }
  catch { status.textContent = 'Tap Play in the player to start this recording.'; }
}
previous.addEventListener('click', () => select(selected - 1));
next.addEventListener('click', () => select(selected + 1));
audio.addEventListener('error', () => { status.textContent = 'This recording could not load. Check your connection or try another recording.'; });
audio.addEventListener('ended', () => {
  const followUp = tracks.findIndex(track => track.file.split('/').pop() === 'goodnightlilbuddy.m4a');
  if (tracks[selected]?.file.split('/').pop() === 'edelweiss.m4a' && followUp !== -1) {
    select(followUp);
    return;
  }
  if (document.querySelector('#continuous').checked && selected < tracks.length - 1) select(selected + 1);
});
async function load() {
  try {
    const response = await fetch('recordings.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Library unavailable');
    const data = await response.json();
    if (!Array.isArray(data) || data.some(track => typeof track.title !== 'string' || typeof track.file !== 'string' || !['message', 'song', 'story'].includes(track.type) || (track.type === 'story' && typeof track.thumbnail !== 'string'))) throw new Error('Invalid library');
    tracks = data;
    render();
  } catch {
    render();
    status.textContent = 'The recording list could not load. Please refresh and try again.';
  }
}
load();
