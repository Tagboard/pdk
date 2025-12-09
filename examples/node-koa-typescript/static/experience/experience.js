const query = window.location.search.substr(1).split('&').reduce((memo, query) => ({
  ...memo,
  [query.split('=')[0]]: query.split('=')?.[1] || true,
}), {});

const experienceId = query.experienceId;
if (experienceId) {
  document.querySelector('#experienceId').textContent = experienceId;
}

const fieldsEl = document.querySelector('#fields');

Object.entries(query).forEach(([key, value]) => {
  if (key === 'experienceId') {
    return;
  }

  const el = document.createElement('h4');
  el.textContent = `${key}: ${value}`;

  fieldsEl.appendChild(el);
});
