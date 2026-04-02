import {
  canAccessWork,
  clearSession,
  getCurrentUser,
  initSecurityDb,
  listUsers,
  login,
} from './auth.js';

const STORAGE_TEACHER_GROUPS = 'litaudio.teacher-groups.v1';

const state = {
  works: [],
  authorsById: new Map(),
  periodsById: new Map(),
  currentUser: null,
  students: [],
  teacherGroups: [],
  activeTeacherGroupId: '',
};

const workList = document.getElementById('workList');
const resultSummary = document.getElementById('resultSummary');
const searchInput = document.getElementById('searchInput');
const periodSelect = document.getElementById('periodSelect');
const authorSelect = document.getElementById('authorSelect');
const template = document.getElementById('workCardTemplate');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const authMessage = document.getElementById('authMessage');
const authStatus = document.getElementById('authStatus');
const logoutButton = document.getElementById('logoutButton');
const adminLink = document.getElementById('adminLink');
const teacherPanel = document.getElementById('teacherPanel');
const teacherGroupSelect = document.getElementById('teacherGroupSelect');
const newGroupName = document.getElementById('newGroupName');
const newGroupColor = document.getElementById('newGroupColor');
const createGroupButton = document.getElementById('createGroupButton');
const deleteGroupButton = document.getElementById('deleteGroupButton');
const studentSelect = document.getElementById('studentSelect');
const addStudentButton = document.getElementById('addStudentButton');
const groupStudentList = document.getElementById('groupStudentList');

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

  return work.title.toLowerCase().includes(search) || work.authorName.toLowerCase().includes(search);
}

function updateAuthView() {
  const user = state.currentUser;
  if (!user) {
    authStatus.textContent = 'Nicht angemeldet';
    authForm.hidden = false;
    logoutButton.hidden = true;
    adminLink.hidden = true;
    teacherPanel.hidden = true;
    return;
  }

  authStatus.textContent = `Angemeldet als ${user.name} (${user.role_id})`;
  authForm.hidden = true;
  logoutButton.hidden = false;
  adminLink.hidden = user.role_id !== 'role_admin';
  teacherPanel.hidden = user.role_id !== 'role_teacher';
}

function parseTeacherDb() {
  const raw = localStorage.getItem(STORAGE_TEACHER_GROUPS);
  return raw ? JSON.parse(raw) : {};
}

function saveTeacherDb(db) {
  localStorage.setItem(STORAGE_TEACHER_GROUPS, JSON.stringify(db));
}

function getTeacherActiveGroup() {
  return state.teacherGroups.find((group) => group.id === state.activeTeacherGroupId) || null;
}

function loadTeacherGroups() {
  const teacherId = state.currentUser?.id;
  if (!teacherId || state.currentUser?.role_id !== 'role_teacher') {
    state.teacherGroups = [];
    state.activeTeacherGroupId = '';
    return;
  }

  const db = parseTeacherDb();
  state.teacherGroups = db[teacherId]?.groups || [];
  state.activeTeacherGroupId = db[teacherId]?.activeGroupId || state.teacherGroups[0]?.id || '';
}

function persistTeacherGroups() {
  const teacherId = state.currentUser?.id;
  if (!teacherId || state.currentUser?.role_id !== 'role_teacher') return;

  const db = parseTeacherDb();
  db[teacherId] = {
    groups: state.teacherGroups,
    activeGroupId: state.activeTeacherGroupId,
  };
  saveTeacherDb(db);
}

function renderTeacherMenu() {
  if (state.currentUser?.role_id !== 'role_teacher') return;

  teacherGroupSelect.innerHTML = '<option value="">Keine Gruppe</option>';
  for (const group of state.teacherGroups) {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = `${group.name} (${group.color})`;
    teacherGroupSelect.append(option);
  }
  teacherGroupSelect.value = state.activeTeacherGroupId;

  studentSelect.innerHTML = '<option value="">Schüler wählen</option>';
  for (const student of state.students) {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = student.name;
    studentSelect.append(option);
  }

  const activeGroup = getTeacherActiveGroup();
  groupStudentList.innerHTML = '';
  if (!activeGroup) return;

  for (const studentId of activeGroup.studentIds) {
    const student = state.students.find((item) => item.id === studentId);
    if (!student) continue;

    const li = document.createElement('li');
    li.className = 'group-student-item';
    li.textContent = student.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Entfernen';
    removeBtn.addEventListener('click', () => {
      activeGroup.studentIds = activeGroup.studentIds.filter((id) => id !== studentId);
      persistTeacherGroups();
      renderTeacherMenu();
    });

    li.append(removeBtn);
    groupStudentList.append(li);
  }
}

async function renderList() {
  const filtered = state.works.filter(matchesFilters);
  const activeGroup = getTeacherActiveGroup();

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
    if (activeGroup?.relevantWorkIds.includes(work.id)) {
      const badge = document.createElement('span');
      badge.className = 'relevant-badge';
      badge.textContent = 'Relevant';
      badge.style.backgroundColor = activeGroup.color;
      node.querySelector('.work-title').append(' ', badge);
      node.style.borderColor = activeGroup.color;
    }
    node.querySelector('.meta').textContent = `${work.authorName} · ${work.periodName}`;
    node.querySelector('.synopsis').textContent = work.synopsis;

    const canOpen = await canAccessWork(work);

    const details = node.querySelector('.details');
    const fields = [['Status', clean(work.status || 'unbekannt')], ['Zugriff', canOpen ? 'erlaubt' : 'gesperrt']];

    for (const [key, value] of fields) {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      details.append(dt, dd);
    }

    if (activeGroup) {
      const actions = document.createElement('div');
      actions.className = 'teacher-card-actions';
      actions.addEventListener('click', (event) => event.stopPropagation());

      const toggleRelevantBtn = document.createElement('button');
      toggleRelevantBtn.type = 'button';
      const isRelevant = activeGroup.relevantWorkIds.includes(work.id);
      toggleRelevantBtn.textContent = isRelevant ? 'Relevant entfernen' : 'Als Relevant markieren';
      toggleRelevantBtn.addEventListener('click', () => {
        activeGroup.relevantWorkIds = isRelevant
          ? activeGroup.relevantWorkIds.filter((id) => id !== work.id)
          : [...activeGroup.relevantWorkIds, work.id];
        persistTeacherGroups();
        renderList();
      });

      const addBookmarkBtn = document.createElement('button');
      addBookmarkBtn.type = 'button';
      addBookmarkBtn.textContent = 'Lesezeichen setzen';
      addBookmarkBtn.addEventListener('click', () => {
        const note = clean(window.prompt('Tooltip-Text für das Lesezeichen', `Hinweis zu ${work.title}`));
        const now = new Date();
        activeGroup.bookmarks.push({
          id: crypto.randomUUID(),
          workId: work.id,
          note: note || `Lesezeichen für ${work.title}`,
          createdAt: now.toISOString(),
        });
        persistTeacherGroups();
        renderList();
      });

      actions.append(toggleRelevantBtn, addBookmarkBtn);
      node.append(actions);

      const bookmarkWrap = document.createElement('div');
      bookmarkWrap.className = 'bookmark-wrap';
      const workBookmarks = activeGroup.bookmarks.filter((bookmark) => bookmark.workId === work.id);

      for (const bookmark of workBookmarks) {
        const chip = document.createElement('span');
        chip.className = 'bookmark-chip';
        chip.style.borderColor = activeGroup.color;
        chip.style.color = activeGroup.color;
        const stamp = new Date(bookmark.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        chip.textContent = `🔖 ${stamp}`;
        chip.title = bookmark.note;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', 'Lesezeichen entfernen');
        removeBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          activeGroup.bookmarks = activeGroup.bookmarks.filter((item) => item.id !== bookmark.id);
          persistTeacherGroups();
          renderList();
        });

        chip.append(removeBtn);
        bookmarkWrap.append(chip);
      }
      node.append(bookmarkWrap);
    }

    if (!canOpen) {
      node.classList.add('blocked-card');
      node.setAttribute('aria-disabled', 'true');
      node.querySelector('.synopsis').textContent = 'Für dieses Werk fehlen dir Rechte oder eine aktive Anmeldung.';
      workList.append(node);
      continue;
    }

    const playerUrl = new URL('./audio-player.html', import.meta.url);
    playerUrl.searchParams.set('workId', work.id);

    node.classList.add('clickable-card');
    node.tabIndex = 0;
    node.setAttribute('role', 'link');
    node.setAttribute('aria-label', `${work.title} öffnen`);

    const openWork = () => {
      window.location.assign(playerUrl.toString());
    };

    node.addEventListener('click', openWork);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openWork();
      }
    });

    workList.append(node);
  }
}

async function setupAuth() {
  const users = await listUsers();
  state.students = users.filter((item) => item.role_id === 'role_student');
  state.currentUser = await getCurrentUser();
  loadTeacherGroups();
  updateAuthView();
  renderTeacherMenu();

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authMessage.textContent = '';

    try {
      await login(emailInput.value, passwordInput.value);
      state.currentUser = await getCurrentUser();
      loadTeacherGroups();
      updateAuthView();
      renderTeacherMenu();
      await renderList();
      authMessage.textContent = 'Login erfolgreich.';
      authForm.reset();
    } catch (error) {
      authMessage.textContent = error.message;
    }
  });

  logoutButton.addEventListener('click', async () => {
    clearSession();
    state.currentUser = null;
    loadTeacherGroups();
    updateAuthView();
    renderTeacherMenu();
    await renderList();
    authMessage.textContent = 'Du wurdest abgemeldet.';
  });
}

function setupTeacherEvents() {
  teacherGroupSelect.addEventListener('change', () => {
    state.activeTeacherGroupId = teacherGroupSelect.value;
    persistTeacherGroups();
    renderTeacherMenu();
    renderList();
  });

  createGroupButton.addEventListener('click', () => {
    const name = clean(newGroupName.value);
    if (!name) return;
    const group = {
      id: `group_${crypto.randomUUID().slice(0, 8)}`,
      name,
      color: newGroupColor.value || '#2c59d9',
      studentIds: [],
      relevantWorkIds: [],
      bookmarks: [],
    };
    state.teacherGroups.push(group);
    state.activeTeacherGroupId = group.id;
    newGroupName.value = '';
    persistTeacherGroups();
    renderTeacherMenu();
    renderList();
  });

  deleteGroupButton.addEventListener('click', () => {
    if (!state.activeTeacherGroupId) return;
    state.teacherGroups = state.teacherGroups.filter((group) => group.id !== state.activeTeacherGroupId);
    state.activeTeacherGroupId = state.teacherGroups[0]?.id || '';
    persistTeacherGroups();
    renderTeacherMenu();
    renderList();
  });

  addStudentButton.addEventListener('click', () => {
    const activeGroup = getTeacherActiveGroup();
    const studentId = studentSelect.value;
    if (!activeGroup || !studentId || activeGroup.studentIds.includes(studentId)) return;
    activeGroup.studentIds.push(studentId);
    persistTeacherGroups();
    renderTeacherMenu();
  });
}

async function init() {
  try {
    await initSecurityDb();
    await setupAuth();
    setupTeacherEvents();

    const [works, authors, periods] = await Promise.all([
      loadJson(new URL('../mock/works.json', import.meta.url)),
      loadJson(new URL('../mock/authors.json', import.meta.url)),
      loadJson(new URL('../mock/literary_periods.json', import.meta.url)),
    ]);

    hydrateLookups(authors, periods);
    state.works = works.map(enrichWork);

    [searchInput, authorSelect, periodSelect].forEach((element) => {
      element.addEventListener('input', () => {
        renderList();
      });
      element.addEventListener('change', () => {
        renderList();
      });
    });

    await renderList();
  } catch (error) {
    console.error(error);
    resultSummary.textContent = 'Bibliothek konnte nicht geladen werden.';
  }
}

init();
