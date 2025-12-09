const query = window.location.search.substr(1).split('&').reduce((memo, query) => ({
  ...memo,
  [query.split('=')[0]]: decodeURIComponent(query.split('=')?.[1]) || true,
}), {});

const experienceId = query.experience_id;
if (experienceId) {
  document.querySelector('#experienceId').textContent = experienceId;
}

const fieldsEl = document.querySelector('#fields');

Object.entries(query).forEach(([key, value]) => {
  if (key === 'experience_id') {
    return;
  }

  if (key === 'theme') {
    switch (value) {
      case 'dark': {
        document.body.style.background = '#000000';
        document.body.style.color = '#ffffff';
        break;
      }

      case 'light': {
        document.body.style.background = '#ffffff';
        document.body.style.color = '#000000';
        break;
      }

      default: break; // Salmon, the obvious choice for default
    }
  }

  const el = document.createElement('h4');
  el.textContent = `${key}: ${value}`;
  fieldsEl.appendChild(el);
});
