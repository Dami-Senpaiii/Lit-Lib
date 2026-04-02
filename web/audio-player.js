const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');

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

    const author = authors.find((item) => item.id === work.author_id);
    const period = periods.find((item) => item.id === work.period_id);

    playerTitle.textContent = clean(work.title);
    playerMeta.textContent = `${clean(author?.name || 'Unbekannt')} · ${clean(period?.name || 'Unbekannt')}`;
  } catch (error) {
    console.error(error);
    playerTitle.textContent = 'Werk konnte nicht geladen werden';
    playerMeta.textContent = 'Bitte später erneut versuchen.';
  }
}

init();
