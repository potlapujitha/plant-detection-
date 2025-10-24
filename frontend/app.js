const BACKEND = 'http://localhost:4000'; // change if needed

document.getElementById('login-btn').addEventListener('click', async () => {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = 'Logging in...';
  try {
    const r = await fetch(`${BACKEND}/api/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username: u, password: p })
    });
    const j = await r.json();
    if (!j.ok) {
      msg.textContent = j.message || 'Login failed';
    } else {
      sessionStorage.setItem('token', j.token);
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('scanner-screen').classList.remove('hidden');
    }
  } catch (e) {
    msg.textContent = 'Network error';
  }
});

document.getElementById('scan-btn').addEventListener('click', async () => {
  const fileInput = document.getElementById('image-input');
  const error = document.getElementById('error');
  error.textContent = '';
  if (!fileInput.files || fileInput.files.length === 0) {
    error.textContent = 'Please select an image';
    return;
  }
  const file = fileInput.files[0];
  const form = new FormData();
  form.append('image', file);
  document.getElementById('result').classList.add('hidden');

  try {
    const res = await fetch(`${BACKEND}/api/scan`, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.ok) {
      error.textContent = data.message || 'Scan failed';
      return;
    }
    document.getElementById('json-output').textContent = JSON.stringify(data, null, 2);
    document.getElementById('result').classList.remove('hidden');
  } catch (e) {
    error.textContent = 'Network or server error';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('token');
  document.getElementById('scanner-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
});
