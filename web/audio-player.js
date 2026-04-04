import { canAccessWork, getCurrentUser, protectedFetch } from './auth.js';

const STORAGE_TEACHER_GROUPS = 'litaudio.teacher-groups.v1';
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const audioPlayer = document.getElementById('audioPlayer');
const progressRange = document.getElementById('progressRange');
const volumeRange = document.getElementById('volumeRange');
const currentTimeLabel = document.getElementById('currentTimeLabel');
const durationLabel = document.getElementById('durationLabel');
const progressStampLayer = document.getElementById('progressStampLayer');
const accessNotice = document.getElementById('accessNotice');
const bookmarkSection = document.getElementById('bookmarkSection');
const relevantNotice = document.getElementById('relevantNotice');
const bookmarkForm = document.getElementById('bookmarkForm');
const bookmarkNote = document.getElementById('bookmarkNote');
const bookmarkList = document.getElementById('bookmarkList');
const jumpBackButton = document.getElementById('jumpBack');
const jumpForwardButton = document.getElementById('jumpForward');
let progressStamps = [];
let activeGroupColor = '#2c59d9';
let selectedStampSeconds = null;

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

function getGroupId() {
  const params = new URLSearchParams(window.location.search);
  return clean(params.get('groupId'));
}

function parseTeacherDb() {
  const raw = localStorage.getItem(STORAGE_TEACHER_GROUPS);
  return raw ? JSON.parse(raw) : {};
}

function saveTeacherDb(db) {
  localStorage.setItem(STORAGE_TEACHER_GROUPS, JSON.stringify(db));
}

function getTeacherGroupById(groupId) {
  if (!groupId) return null;
  const db = parseTeacherDb();
  for (const [teacherId, teacherData] of Object.entries(db)) {
    for (const group of teacherData?.groups || []) {
      if (group.id === groupId) return { teacherId, group };
    }
  }
  return null;
}

function getStudentGroups(studentId) {
  const db = parseTeacherDb();
  const groups = [];
  for (const teacherData of Object.values(db)) {
    for (const group of teacherData?.groups || []) {
      if (group.studentIds?.includes(studentId)) groups.push(group);
    }
  }
  return groups;
}

function formatStamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function setProgressStamps(stamps) {
  progressStamps = (Array.isArray(stamps) ? stamps : [])
    .filter((stamp) => Number.isFinite(stamp?.seconds))
    .map((stamp) => ({
      seconds: Math.max(0, Number(stamp.seconds)),
      color: clean(stamp.color) || activeGroupColor,
    }));
  renderProgressStampMarkers();
}

function setSelectedStamp(seconds) {
  selectedStampSeconds = Number.isFinite(seconds) ? Math.max(0, Number(seconds)) : null;
  renderProgressStampMarkers();
}

function renderProgressStampMarkers() {
  if (!progressStampLayer) return;
  progressStampLayer.innerHTML = '';
  const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0
    ? audioPlayer.duration
    : 0;
  if (duration <= 0 || !progressStamps.length) return;
  for (const stamp of progressStamps) {
    const ratio = Math.min(1, Math.max(0, stamp.seconds / duration));
    const marker = document.createElement('span');
    marker.className = 'progress-stamp-marker';
    marker.style.left = `${ratio * 100}%`;
    marker.style.backgroundColor = stamp.color || activeGroupColor;
    const isSelected = Number.isFinite(selectedStampSeconds) && Math.abs(stamp.seconds - selectedStampSeconds) < 0.5;
    if (isSelected) marker.classList.add('is-selected');
    marker.title = `Lesezeichen bei ${formatStamp(stamp.seconds)}`;
    progressStampLayer.append(marker);
  }
}

function updateProgressUi() {
  const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0
    ? audioPlayer.duration
    : 0;
  const currentTime = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0;

  const progress = duration > 0
    ? Math.min(1000, Math.max(0, Math.round((currentTime / duration) * 1000)))
    : 0;
  currentTimeLabel.textContent = formatStamp(currentTime);
  durationLabel.textContent = formatStamp(duration);
  progressRange.value = String(progress);
}

function renderBookmarkList(bookmarks, { editable = false, color = '#2c59d9', onRemove } = {}) {
  bookmarkList.innerHTML = '';
  if (!bookmarks.length) {
    const li = document.createElement('li');
    li.className = 'bookmark-list-empty';
    li.textContent = 'Noch keine Lesezeichen für dieses Werk vorhanden.';
    bookmarkList.append(li);
    return;
  }

  const sorted = [...bookmarks].sort((a, b) => (a.seconds ?? 0) - (b.seconds ?? 0));
  for (const bookmark of sorted) {
    const li = document.createElement('li');
    li.className = 'bookmark-list-item';

    const text = document.createElement('span');
    text.style.color = bookmark.color || color;
    const time = Number.isFinite(bookmark.seconds) ? formatStamp(bookmark.seconds) : '--:--';
    text.textContent = `🔖 ${time} · ${clean(bookmark.note || 'Notiz')}`;
    li.append(text);

    if (editable) {
      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.textContent = 'Anhören';
      jumpBtn.addEventListener('click', () => {
        if (Number.isFinite(bookmark.seconds)) {
          audioPlayer.currentTime = bookmark.seconds;
          audioPlayer.play();
        }
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'Entfernen';
      removeBtn.addEventListener('click', () => onRemove?.(bookmark.id));
      li.append(jumpBtn, removeBtn);
    } else {
      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.textContent = 'Anhören';
      jumpBtn.addEventListener('click', () => {
        if (Number.isFinite(bookmark.seconds)) {
          audioPlayer.currentTime = bookmark.seconds;
          audioPlayer.play();
        }
      });
      li.append(jumpBtn);
    }
    bookmarkList.append(li);
  }
}

async function init() {
  const workId = getWorkId();
  const groupId = getGroupId();
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
    playToggle.addEventListener('click', async () => {
      if (audioPlayer.paused) {
        await audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    });
    progressRange.addEventListener('input', () => {
      const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0
        ? audioPlayer.duration
        : 0;
      if (duration > 0) {
        audioPlayer.currentTime = (Number(progressRange.value) / 1000) * duration;
      }
      updateProgressUi();
    });
    volumeRange.addEventListener('input', () => {
      audioPlayer.volume = Number(volumeRange.value);
    });
    audioPlayer.addEventListener('timeupdate', updateProgressUi);
    audioPlayer.addEventListener('loadedmetadata', () => {
      updateProgressUi();
      renderProgressStampMarkers();
    });
    audioPlayer.addEventListener('play', () => {
      playToggle.textContent = '⏸️ Pause';
      playToggle.setAttribute('aria-label', 'Wiedergabe pausieren');
    });
    audioPlayer.addEventListener('pause', () => {
      playToggle.textContent = '▶️ Abspielen';
      playToggle.setAttribute('aria-label', 'Wiedergabe starten');
    });
    audioPlayer.addEventListener('ended', () => {
      playToggle.textContent = '▶️ Abspielen';
      playToggle.setAttribute('aria-label', 'Wiedergabe starten');
    });
    jumpBackButton?.addEventListener('click', () => {
      audioPlayer.currentTime = Math.max(0, Number(audioPlayer.currentTime || 0) - 10);
      updateProgressUi();
    });
    jumpForwardButton?.addEventListener('click', () => {
      const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
      const target = Number(audioPlayer.currentTime || 0) + 10;
      audioPlayer.currentTime = duration > 0 ? Math.min(duration, target) : target;
      updateProgressUi();
    });

    if (currentUser.role_id === 'role_teacher') {
      const teacherGroup = getTeacherGroupById(groupId);
      const group = teacherGroup?.group;
      if (!group) {
        relevantNotice.textContent = 'Bitte ein Werk aus der Bibliothek mit aktiver Gruppe öffnen.';
      } else {
        activeGroupColor = clean(group.color) || '#2c59d9';
        bookmarkForm.hidden = false;
        relevantNotice.textContent = group.relevantWorkIds.includes(workId)
          ? `Dieses Werk ist für Gruppe "${group.name}" als relevant markiert.`
          : `Dieses Werk ist für Gruppe "${group.name}" aktuell nicht als relevant markiert.`;

        const renderForTeacher = () => {
          const bookmarks = group.bookmarks.filter((bookmark) => bookmark.workId === workId);
          setProgressStamps(bookmarks.map((bookmark) => ({
            seconds: bookmark.seconds,
            color: group.color,
          })));
          renderBookmarkList(bookmarks, {
            editable: true,
            color: group.color,
            onRemove: (bookmarkId) => {
              group.bookmarks = group.bookmarks.filter((item) => item.id !== bookmarkId);
              const db = parseTeacherDb();
              db[teacherGroup.teacherId].groups = db[teacherGroup.teacherId].groups
                .map((item) => (item.id === group.id ? group : item));
              saveTeacherDb(db);
              renderForTeacher();
            },
          });
        };

        bookmarkForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const seconds = Number(audioPlayer.currentTime || 0);
          const note = clean(bookmarkNote.value) || `Hinweis bei ${formatStamp(seconds)}`;
          group.bookmarks.push({
            id: crypto.randomUUID(),
            workId,
            note,
            seconds,
            createdAt: new Date().toISOString(),
          });
          setSelectedStamp(seconds);
          const db = parseTeacherDb();
          db[teacherGroup.teacherId].groups = db[teacherGroup.teacherId].groups
            .map((item) => (item.id === group.id ? group : item));
          saveTeacherDb(db);
          bookmarkForm.reset();
          renderForTeacher();
        });
        renderForTeacher();
      }
    } else if (currentUser.role_id === 'role_student') {
      const groups = getStudentGroups(currentUser.id);
      activeGroupColor = clean(groups[0]?.color) || '#2c59d9';
      const isRelevant = groups.some((group) => group.relevantWorkIds?.includes(workId));
      relevantNotice.textContent = isRelevant
        ? 'Dieses Werk wurde von deiner Lehrkraft als relevant markiert.'
        : 'Für dieses Werk liegt keine Relevanzmarkierung deiner Gruppe vor.';
      const bookmarks = groups.flatMap((group) => (group.bookmarks || [])
        .filter((bookmark) => bookmark.workId === workId)
        .map((bookmark) => ({ ...bookmark, color: group.color })));
      setProgressStamps(bookmarks.map((bookmark) => ({
        seconds: bookmark.seconds,
        color: bookmark.color,
      })));
      renderBookmarkList(bookmarks, { editable: false, color: groups[0]?.color || '#2c59d9' });
    } else {
      bookmarkSection.hidden = true;
      setProgressStamps([]);
    }

    accessNotice.textContent = `Audio geladen für ${currentUser.name}. Dateizugriff wurde über Rollenrechte geprüft.`;
    updateProgressUi();
  } catch (error) {
    console.error(error);
    playerTitle.textContent = 'Werk konnte nicht geladen werden';
    playerMeta.textContent = 'Bitte später erneut versuchen.';
    accessNotice.textContent = error.message;
  }
}

init();
