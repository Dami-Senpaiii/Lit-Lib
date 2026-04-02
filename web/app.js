const state = {
  works: [],
  authorsById: new Map(),
  periodsById: new Map(),
};

const workList = document.getElementById('workList');
const resultSummary = document.getElementById('resultSummary');
const searchInput = document.getElementById('searchInput');
const periodSelect = document.getElementById('periodSelect');
const authorSelect = document.getElementById('authorSelect');
const template = document.getElementById('workCardTemplate');

const clean = (value) => String(value ?? '').trim();

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Fehler beim Laden: ${path}`);
  }
  return response.json();
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'de'));
}

function hydrateLookups(authors, periods) {
  state.authorsById = new Map(authors.map((author) => [author.id, author]));
  state.periodsById = new Map(periods.map((period) => [period.id, period]));

  uniqueSorted(authors.map((author) => clean(author.name))).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    authorSelect.append(option);
  });

  uniqueSorted(periods.map((period) => clean(period.name))).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    periodSelect.append(option);
  });
}

function enrichWork(work) {
  const author = state.authorsById.get(work.author_id);
  const period = state.periodsById.get(work.period_id);

  return {
    ...work,
    title: clean(work.title),
    authorName: clean(author?.name || 'Unbekannt'),
    periodName: clean(period?.name || 'Unbekannt'),
    synopsis: clean(work.synopsis || 'Keine Kurzbeschreibung vorhanden.'),
  };
}

function matchesFilters(work) {
  const search = clean(searchInput.value).toLowerCase();
  const selectedAuthor = clean(authorSelect.value);
  const selectedPeriod = clean(periodSelect.value);

  if (selectedAuthor && work.authorName !== selectedAuthor) return false;
  if (selectedPeriod && work.periodName !== selectedPeriod) return false;


  if (!search) return true;

  return (
    work.title.toLowerCase().includes(search) ||
    work.authorName.toLowerCase().includes(search)
  );
}

function renderList() {
  const filtered = state.works.filter(matchesFilters);

  resultSummary.textContent = `${filtered.length} von ${state.works.length} Werken angezeigt`;
  workList.innerHTML = '';

  if (filtered.length === 0) {
    const noResult = document.createElement('li');
    noResult.className = 'work-card';
    noResult.textContent = 'Keine Ergebnisse. Bitte Filter/Suche anpassen.';
    workList.append(noResult);
    return;
  }

  for (const work of filtered) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.work-title').textContent = work.title;
    node.querySelector('.meta').textContent = `${work.authorName} · ${work.periodName}`;
    node.querySelector('.synopsis').textContent = work.synopsis;

    const details = node.querySelector('.details');
    const fields = [
      ['Status', clean(work.status || 'unbekannt')],
    ];

    for (const [key, value] of fields) {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      details.append(dt, dd);
    }

    workList.append(node);
  }
}

async function init() {
  try {
    const [works, authors, periods] = await Promise.all([
      loadJson(new URL('../mock/works.json', import.meta.url)),
      loadJson(new URL('../mock/authors.json', import.meta.url)),
      loadJson(new URL('../mock/literary_periods.json', import.meta.url)),
    ]);

    hydrateLookups(authors, periods);
    state.works = works.map(enrichWork);

    [searchInput, authorSelect, periodSelect].forEach((element) => {
      element.addEventListener('input', renderList);
      element.addEventListener('change', renderList);
    });

    renderList();
  } catch (error) {
    console.error(error);
    resultSummary.textContent = 'Bibliothek konnte nicht geladen werden.';
  }
}

init();
