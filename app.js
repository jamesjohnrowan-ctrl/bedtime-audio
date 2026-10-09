const audio = document.querySelector('#audio');
const library = document.querySelector('#library');
const status = document.querySelector('#status');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const floatingPlayer = document.querySelector('.player');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--player-height', `${floatingPlayer.getBoundingClientRect().height}px`);
}).observe(floatingPlayer);
let tracks = [];
let selected = -1;
let filter = 'all';

function render() {
  library.replaceChildren();
  const visible = tracks.filter(track => filter === 'all' || track.type === filter);
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
  if (document.querySelector('#continuous').checked && selected < tracks.length - 1) select(selected + 1);
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
async function load() {
  try {
    const response = await fetch('recordings.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Library unavailable');
    const data = await response.json();
    if (!Array.isArray(data) || data.some(track => typeof track.title !== 'string' || typeof track.file !== 'string' || !['message', 'song'].includes(track.type))) throw new Error('Invalid library');
    tracks = data;
    render();
  } catch {
    render();
    status.textContent = 'The recording list could not load. Please refresh and try again.';
  }
}
load();
