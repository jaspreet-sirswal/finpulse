// Options page — API key management
// Sync theme with main app
chrome.storage.local.get('theme', function(result) {
  if (result.theme === 'dark') {
    document.body.classList.add('dark');
  }
});

var apiKeyInput = document.getElementById('api-key-input');
var saveBtn = document.getElementById('save-btn');
var statusEl = document.getElementById('status');
var currentKeyEl = document.getElementById('current-key');
var keyDisplay = document.getElementById('key-display');
var removeBtn = document.getElementById('remove-btn');

// Load existing key on page open
chrome.storage.local.get('gnews_api_key', function(result) {
  if (result.gnews_api_key) {
    showCurrentKey(result.gnews_api_key);
  }
});

saveBtn.addEventListener('click', function() {
  var key = apiKeyInput.value.trim();
  if (!key) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  if (key.length < 20) {
    showStatus('That key looks too short. Check your GNews dashboard.', 'error');
    return;
  }

  // Validate the key with a test request
  saveBtn.disabled = true;
  saveBtn.textContent = 'Validating...';

  fetch('https://gnews.io/api/v4/search?q=finance&max=1&apikey=' + key)
    .then(function(res) {
      if (res.ok) {
        // Key works — save and open new tab
        chrome.storage.local.set({ gnews_api_key: key }, function() {
          showStatus('API key saved! Redirecting...', 'success');
          showCurrentKey(key);
          apiKeyInput.value = '';
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save';
          // Open a new tab to show news after short delay
          setTimeout(function() {
            chrome.tabs.create({ url: 'chrome://newtab' });
          }, 800);
        });
      } else if (res.status === 403) {
        showStatus('Invalid API key. Double-check it on gnews.io/dashboard.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      } else {
        showStatus('GNews returned an error (' + res.status + '). Try again.', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    })
    .catch(function() {
      showStatus('Could not reach GNews. Check your internet connection.', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    });
});

// Enter key triggers save
apiKeyInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') saveBtn.click();
});

removeBtn.addEventListener('click', function() {
  chrome.storage.local.remove('gnews_api_key', function() {
    currentKeyEl.style.display = 'none';
    showStatus('API key removed.', 'success');
  });
});

function showCurrentKey(key) {
  var masked = key.substring(0, 6) + '...' + key.substring(key.length - 4);
  keyDisplay.textContent = masked;
  currentKeyEl.style.display = 'block';
}

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
  setTimeout(function() { statusEl.textContent = ''; statusEl.className = 'status'; }, 5000);
}
