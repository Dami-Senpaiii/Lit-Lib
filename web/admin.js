import {
  createUser,
  getCurrentUser,
  hasPermission,
  listRoles,
  listUsers,
  updateUserRole,
} from './auth.js';

const accessState = document.getElementById('accessState');
const userTableBody = document.getElementById('userTableBody');
const createUserForm = document.getElementById('createUserForm');
const newUserRole = document.getElementById('newUserRole');
const adminMessage = document.getElementById('adminMessage');

const clean = (value) => String(value ?? '').trim();

function createRoleSelect(roles, user) {
  const select = document.createElement('select');

  roles.forEach((role) => {
    const option = document.createElement('option');
    option.value = role.id;
    option.textContent = role.name;
    option.selected = role.id === user.role_id;
    select.append(option);
  });

  select.addEventListener('change', async () => {
    await updateUserRole(user.id, select.value);
    adminMessage.textContent = `Rolle für ${user.name} aktualisiert.`;
  });

  return select;
}

async function renderAdmin() {
  const canAccessAdmin = await hasPermission('admin.access');
  if (!canAccessAdmin) {
    accessState.textContent = 'Kein Zugriff: Du benötigst Admin-Rechte.';
    createUserForm.hidden = true;
    return;
  }

  const [users, roles] = await Promise.all([listUsers(), listRoles()]);

  accessState.textContent = `Admin-Zugriff aktiv. ${users.length} Benutzer im System.`;
  userTableBody.innerHTML = '';

  roles.forEach((role) => {
    const option = document.createElement('option');
    option.value = role.id;
    option.textContent = role.name;
    newUserRole.append(option);
  });

  users.forEach((user) => {
    const tr = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;

    const mailCell = document.createElement('td');
    mailCell.textContent = user.email;

    const roleCell = document.createElement('td');
    roleCell.append(createRoleSelect(roles, user));

    tr.append(nameCell, mailCell, roleCell);
    userTableBody.append(tr);
  });

  createUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(createUserForm);
    await createUser({
      name: clean(formData.get('name')),
      email: clean(formData.get('email')),
      password: clean(formData.get('password')),
      roleId: clean(formData.get('roleId')),
    });

    createUserForm.reset();
    adminMessage.textContent = 'Benutzer wurde angelegt.';
    await renderAdmin();
  });
}

async function init() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    accessState.textContent = 'Bitte zuerst anmelden.';
    createUserForm.hidden = true;
    return;
  }

  await renderAdmin();
}

init();
