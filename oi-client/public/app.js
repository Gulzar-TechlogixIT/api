
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const titleEl = document.getElementById('response-title');

// Add URL and request-flow display elements dynamically.
const requestInfo = document.createElement('section');
requestInfo.className = 'request-info';
requestInfo.innerHTML = `
  <div class="request-row">
    <span class="request-label">Browser Request URL</span>
    <code id="request-url">No request yet</code>
  </div>
  <div class="request-row">
    <span class="request-label">Request Method</span>
    <code id="request-method">-</code>
  </div>
  <div class="request-row">
    <span class="request-label">Request Flow</span>
    <code id="request-flow">Client → Gateway → Service → PostgreSQL</code>
  </div>
`;

const responseSection = document.querySelector('.response');
responseSection.insertBefore(
  requestInfo,
  responseSection.querySelector('pre')
);

const requestUrlEl = document.getElementById('request-url');
const requestMethodEl = document.getElementById('request-method');
const requestFlowEl = document.getElementById('request-flow');

const serviceDetails = {
  attendance: {
    name: 'oi-attendence',
    flow: 'Client → Gateway → oi-attendence → PostgreSQL',
    internalUrl: 'http://oi-attendence:8080/'
  },
  core: {
    name: 'oi-core',
    flow: 'Client → Gateway → oi-core → PostgreSQL',
    internalUrl: 'http://oi-core:8080/'
  },
  track: {
    name: 'oi-track',
    flow: 'Client → Gateway → oi-track → PostgreSQL',
    internalUrl: 'http://oi-track:8080/'
  }
};

async function callApi(service, method = 'GET', payload = null) {
  const path = `/api/${service}`;
  const browserUrl = new URL(path, window.location.origin).href;
  const details = serviceDetails[service];

  titleEl.textContent = `${method} ${path}`;

  // Display request details immediately when the button is pressed.
  requestUrlEl.textContent = browserUrl;
  requestMethodEl.textContent = method;
  requestFlowEl.textContent = details
    ? details.flow
    : 'Client → Gateway → Backend Service';

  statusEl.textContent = 'Requesting…';
  output.textContent = 'Waiting for response…';

  try {
    const response = await fetch(path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(payload ? { 'Content-Type': 'application/json' } : {})
      },
      body: payload ? JSON.stringify(payload) : undefined
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    statusEl.textContent = `${response.status} ${response.statusText}`;

    output.textContent =
      typeof data === 'string'
        ? data
        : JSON.stringify(data, null, 2);

  } catch (error) {
    statusEl.textContent = 'Request failed';
    output.textContent = String(error);
  }
}

// GET buttons
document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => {
    callApi(button.dataset.service);
  });
});

// POST forms
document.querySelectorAll('form[data-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();

    const service = form.dataset.form;
    const name = new FormData(form).get('name').trim();

    if (name) {
      callApi(service, 'POST', { name }).then(() => form.reset());
    }
  });
});
