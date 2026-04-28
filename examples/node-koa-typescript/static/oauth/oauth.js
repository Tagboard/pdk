const query = new URLSearchParams(window.location.search);
const redirectUri = query.get('redirectUri');
const state = query.get('state');

let jwt;

const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const oauthForm = document.querySelector('#oauthForm');

const errorMessage = document.querySelector('#errorMessage');
const setError = (msg = '') => { errorMessage.textContent = msg; }

// Default to showing login form.
loginForm.style.display = '';

// If no redirectUri provided, immediately show error and hide forms
if (!redirectUri) {
  loginForm.style.display = 'none';
  setError('redirectUri query param must be provided.');
}

const registerLink = document.querySelector('#registerLink');
registerLink.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerForm.style.display = '';
});

const loginLink = document.querySelector('#loginLink');
loginLink.addEventListener('click', () => {
  loginForm.style.display = '';
  registerForm.style.display = 'none';
});

const loginSubmitButton = document.querySelector('#loginButton');
loginSubmitButton.addEventListener('click', async () => {
  const username = document.querySelector('#loginForm > input[name="username"]').value;
  const password = document.querySelector('#loginForm > input[name="password"]').value;

  const resp = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    })
  });

  if (resp.status !== 200) {
    setError(await resp.text());
    return;
  }

  setError();
  const results = await resp.json();
  jwt = results.jwt;

  // Switch to oauth form
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  oauthForm.style.display = '';
});

const registerSubmitButton = document.querySelector('#registerButton');
registerSubmitButton.addEventListener('click', async () => {
  const username = document.querySelector('#registerForm > input[name="username"]').value;
  const password = document.querySelector('#registerForm > input[name="password"]').value;

  const resp = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    })
  });

  if (resp.status !== 200) {
    setError(await resp.text());
    return;
  }

  setError();
  const results = await resp.json();
  jwt = results.jwt;

  // Switch to oauth form
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  oauthForm.style.display = '';
});

document.querySelectorAll('.oauth-connect-button').forEach((el) => {
  el.addEventListener('click', async () => {
    const resp = await fetch('/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret', // So secretive
      }),
    })

    if (resp.status !== 200) {
      setError(await resp.text());
      return;
    }

    const { accessToken, refreshToken, expiresIn } = await resp.json();

    const querystring = new URLSearchParams({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires: expiresIn.toString(), // Token expiration time in seconds
      state, // Support for a little extra verification, but the Tagboard API should know who we are
    }).toString();

    window.location.href = `${redirectUri}?${querystring}`;
  });
});
