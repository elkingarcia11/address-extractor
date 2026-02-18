(function () {
  var startBtn = document.getElementById('startExtraction');
  var stopBtn = document.getElementById('stopExtraction');
  var output = document.getElementById('output');
  var statusEl = document.getElementById('status');
  var debugLogEl = document.getElementById('debugLog');
  var isActive = false;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function debug(msg, data) {
    var line = new Date().toLocaleTimeString() + ' ' + msg + (data ? ' ' + JSON.stringify(data) : '');
    if (debugLogEl) {
      debugLogEl.appendChild(document.createTextNode(line + '\n'));
      debugLogEl.scrollTop = debugLogEl.scrollHeight;
    }
    console.log('[Text Extractor]', msg, data || '');
  }

  document.getElementById('clearDebug').addEventListener('click', function () {
    if (debugLogEl) debugLogEl.textContent = '';
  });

  function setExtracting(active) {
    isActive = active;
    startBtn.disabled = active;
    stopBtn.disabled = !active;
    setStatus(active ? 'Click any element on the page to capture its text.' : '');
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === 'debug') {
      debug(msg.message || 'debug', msg.data);
      return;
    }
    if (msg.type === 'extracted' && typeof msg.text === 'string') {
      debug('Received extracted text', { length: msg.text.length, preview: msg.text.slice(0, 40) + (msg.text.length > 40 ? '…' : '') });
      var line = msg.text.trim().replace(/\s+/g, ' ');
      if (output.value) output.value += '\n' + line;
      else output.value = line;
      setStatus('Added. Keep clicking or press Stop extraction.');
    }
  });

  startBtn.addEventListener('click', function () {
    if (isActive) return;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        setStatus('No tab selected.');
        debug('Start failed: no tab');
        return;
      }
      var tabId = tabs[0].id;
      debug('Injecting click listener', { tabId: tabId, url: tabs[0].url, allFrames: true });
      chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        func: startClickExtract,
      }).then(function (results) {
        debug('Injection result', { frameCount: results ? results.length : 0, results: results });
        setExtracting(true);
      }).catch(function (err) {
        var errMsg = err && err.message ? err.message : 'Could not start on this page.';
        setStatus(errMsg);
        debug('Injection error', { error: errMsg });
      });
    });
  });

  stopBtn.addEventListener('click', function () {
    if (!isActive) return;
    setExtracting(false);
    debug('Stop extraction – removing listeners from all frames');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id, allFrames: true },
          func: stopClickExtract,
        }).catch(function () {});
      }
    });
  });
})();

function startClickExtract() {
  function sendDebug(msg, data) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'debug', message: msg, data: data });
      }
    } catch (e) {}
  }
  if (window.__textExtractClick) {
    sendDebug('Listener already attached (this frame)', { href: window.location.href });
    return;
  }
  function getText(el) {
    if (!el) return '';
    var t = el.innerText || el.textContent || '';
    return t.trim().replace(/\s+/g, ' ');
  }
  function onClick(e) {
    try {
      var text = getText(e.target);
      var tag = e.target ? e.target.tagName : '';
      sendDebug('Click', { tag: tag, textLength: text ? text.length : 0, preview: text ? text.slice(0, 30) + (text.length > 30 ? '…' : '') : '' });
      if (text && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'extracted', text: text });
      }
    } catch (err) {
      sendDebug('Click error', { error: String(err.message || err) });
    }
  }
  function captureFocused() {
    var el = document.activeElement;
    if (!el || el === document.body) return;
    var t = el.innerText || el.textContent || '';
    var text = t.trim().replace(/\s+/g, ' ');
    if (!text) return;
    sendDebug('Arrow/focus', { tag: el.tagName, textLength: text.length, preview: text.slice(0, 30) + (text.length > 30 ? '…' : '') });
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'extracted', text: text });
      }
    } catch (e) {}
  }
  function onKeydown(e) {
    var key = e.key;
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Tab') {
      setTimeout(captureFocused, 50);
    }
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeydown, true);
  window.__textExtractClick = onClick;
  window.__textExtractKeydown = onKeydown;
  sendDebug('Click listener attached', { href: window.location.href, frame: window.parent !== window });
}

function stopClickExtract() {
  if (window.__textExtractClick) {
    document.removeEventListener('click', window.__textExtractClick, true);
    window.__textExtractClick = null;
  }
  if (window.__textExtractKeydown) {
    document.removeEventListener('keydown', window.__textExtractKeydown, true);
    window.__textExtractKeydown = null;
  }
}
