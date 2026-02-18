(function () {
  var headerLogo = document.getElementById('headerLogo');
  if (headerLogo && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    headerLogo.src = chrome.runtime.getURL('icons/text-extractor-logo.svg');
  }
  var startBtn = document.getElementById('startExtraction');
  var stopBtn = document.getElementById('stopExtraction');
  var output = document.getElementById('output');
  var statusEl = document.getElementById('status');
  var isActive = false;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function getLines() {
    var v = output.value ? output.value.trim() : '';
    return v ? v.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
  }

  function defaultFilename(ext) {
    var d = new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return 'text-extractor-' + y + '-' + m + '-' + day + '.' + ext;
  }

  function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportTxt() {
    var lines = getLines();
    var text = lines.join('\n');
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, defaultFilename('txt'));
    setStatus('Exported as TXT.');
  }

  function exportCsv() {
    var lines = getLines();
    function escapeCsv(s) {
      if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    var csv = '\uFEFFText\n' + lines.map(escapeCsv).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, defaultFilename('csv'));
    setStatus('Exported as CSV.');
  }

  function exportXlsx() {
    var lines = getLines();
    if (lines.length === 0) {
      setStatus('No data to export.');
      return;
    }
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Text</th></tr></thead><tbody>';
    for (var i = 0; i < lines.length; i++) {
      var cell = String(lines[i]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      html += '<tr><td>' + cell + '</td></tr>';
    }
    html += '</tbody></table></body></html>';
    var blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    downloadBlob(blob, defaultFilename('xls'));
    setStatus('Exported as XLS (Excel-compatible).');
  }

  document.getElementById('exportTxt').addEventListener('click', exportTxt);
  document.getElementById('exportCsv').addEventListener('click', exportCsv);
  document.getElementById('exportXlsx').addEventListener('click', exportXlsx);

  function setExtracting(active) {
    isActive = active;
    startBtn.disabled = active;
    stopBtn.disabled = !active;
    setStatus(active ? 'Click any element on the page to capture its text.' : '');
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === 'extracted' && typeof msg.text === 'string') {
      var line = msg.text.trim().replace(/\s+/g, ' ');
      if (output.value) output.value += '\n' + line;
      else output.value = line;
      setStatus('Added. Keep clicking or press Stop extraction.');
    }
  });

  startBtn.addEventListener('click', function () {
    if (isActive) return;
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      if (!tabs.length) {
        setStatus('No tabs in this window.');
        return;
      }
      var done = 0;
      var errors = 0;
      tabs.forEach(function (tab) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: startClickExtract,
        }).then(function (results) {
          done++;
          if (done === tabs.length) {
            setExtracting(true);
            setStatus('Capturing in all tabs. Click any element in any tab.');
          }
        }).catch(function () {
          done++;
          errors++;
          if (done === tabs.length) {
            setExtracting(true);
            setStatus('Capturing in ' + (tabs.length - errors) + ' tab(s). Click any element.');
          }
        });
      });
    });
  });

  stopBtn.addEventListener('click', function () {
    if (!isActive) return;
    setExtracting(false);
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: stopClickExtract,
        }).catch(function () {});
      });
    });
  });
})();

function startClickExtract() {
  if (window.__textExtractClick) return;
  function getText(el) {
    if (!el) return '';
    var t = el.innerText || el.textContent || '';
    return t.trim().replace(/\s+/g, ' ');
  }
  function onClick(e) {
    try {
      var text = getText(e.target);
      if (text && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'extracted', text: text });
      }
    } catch (err) {}
  }
  function captureFocused() {
    var el = document.activeElement;
    if (!el || el === document.body) return;
    var t = el.innerText || el.textContent || '';
    var text = t.trim().replace(/\s+/g, ' ');
    if (!text) return;
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
