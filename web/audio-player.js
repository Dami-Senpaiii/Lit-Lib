import { canAccessWork, getCurrentUser, protectedFetch } from './auth.js';

const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const audioPlayer = document.getElementById('audioPlayer');
const accessNotice = document.getElementById('accessNotice');

const clean = (value) => String(value ?? '').trim();

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Fehler beim Laden: ${path}`);
  }
  return response.json();
}

function getWorkId() {
  const params = new URLSearchParams(window.location.search);
  return clean(params.get('workId'));
}

async function init() {
  const workId = getWorkId();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    playerTitle.textContent = 'Anmeldung erforderlich';
    playerMeta.textContent = 'Bitte zuerst in der Bibliothek anmelden.';
    audioPlayer.remove();
    return;
  }

  if (!workId) {
    playerTitle.textContent = 'Kein Werk ausgewählt';
    playerMeta.textContent = 'Bitte öffne ein Werk in der Bibliothek.';
    return;
  }

  try {
    const [works, authors, periods] = await Promise.all([
      loadJson(new URL('../mock/works.json', import.meta.url)),
      loadJson(new URL('../mock/authors.json', import.meta.url)),
      loadJson(new URL('../mock/literary_periods.json', import.meta.url)),
    ]);

    const work = works.find((item) => item.id === workId);
    if (!work) {
      playerTitle.textContent = 'Werk nicht gefunden';
      playerMeta.textContent = `Unbekannte Werk-ID: ${workId}`;
      return;
    }

    if (!(await canAccessWork(work))) {
      playerTitle.textContent = 'Zugriff verweigert';
      playerMeta.textContent = 'Deine Rolle erlaubt keinen Zugriff auf dieses Werk.';
      audioPlayer.remove();
      return;
    }

    const author = authors.find((item) => item.id === work.author_id);
    const period = periods.find((item) => item.id === work.period_id);

    playerTitle.textContent = clean(work.title);
    playerMeta.textContent = `${clean(author?.name || 'Unbekannt')} · ${clean(period?.name || 'Unbekannt')}`;

    const audioResponse = await protectedFetch(new URL('../mock/ff-16b-2c-44100hz.mp3', import.meta.url), 'media.audio.read');
    const audioBlob = await audioResponse.blob();
    audioPlayer.src = URL.createObjectURL(audioBlob);

    accessNotice.textContent = `Audio geladen für ${currentUser.name}. Dateizugriff wurde über Rollenrechte geprüft.`;
  } catch (error) {
    console.error(error);
    playerTitle.textContent = 'Werk konnte nicht geladen werden';
    playerMeta.textContent = 'Bitte später erneut versuchen.';
    accessNotice.textContent = error.message;
  }
}

init();
