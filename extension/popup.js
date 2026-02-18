(function () {
  const extractBtn = document.getElementById('extract');
  const output = document.getElementById('output');
  const statusEl = document.getElementById('status');

  function setStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  extractBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        setStatus('No active tab.', 'error');
        return;
      }
      setStatus('Extracting…');
      output.value = '';

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id, allFrames: true },
        func: extractDireccionCells,
      }).then((results) => {
        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message || 'Could not run on this page.', 'error');
          return;
        }
        var data = null;
        for (var i = 0; results && i < results.length; i++) {
          var r = results[i].result;
          if (r && Array.isArray(r.values)) {
            data = r;
            break;
          }
        }
        if (!data || !Array.isArray(data.values)) {
          setStatus(data && data.error ? data.error : 'No Dirección column found on this page.', 'error');
          return;
        }
        output.value = data.values.join('\n');
        var n = data.values.length;
        setStatus(n === 0 ? 'No cells found.' : n + ' address' + (n === 1 ? '' : 'es') + ' extracted.', 'success');
      }).catch((err) => {
        setStatus(err?.message || 'Extraction failed.', 'error');
      });
    });
  });
})();

function extractDireccionCells() {
  var doc = document;
  var columnId = findDireccionColumnId(doc);
  var values = [];
  if (columnId) {
    var cells = doc.querySelectorAll('td[data-columnid="' + columnId + '"]');
    cells.forEach(function (td) {
      var inner = td.querySelector('.x-grid-cell-inner');
      values.push(inner ? inner.textContent.trim().replace(/\s+/g, ' ') : '');
    });
  }
  if (values.length === 0 && !columnId) {
    var tableResult = findDireccionColumnInTable(doc);
    if (tableResult) values = tableResult;
  }
  if (values.length === 0 && !columnId) {
    return { error: 'No "Dirección" column header found.' };
  }
  return { values: values };
}

function findDireccionColumnInTable(doc) {
  var ths = doc.querySelectorAll('th');
  var colIndex = -1;
  for (var i = 0; i < ths.length; i++) {
    if (headerMatchesDireccion(ths[i].textContent)) {
      var row = ths[i].closest('tr');
      if (row) {
        var idx = 0;
        for (var j = 0; j < row.children.length; j++) {
          if (row.children[j].tagName === 'TH' || row.children[j].tagName === 'TD') {
            if (row.children[j] === ths[i]) { colIndex = idx; break; }
            idx++;
          }
        }
      }
      break;
    }
  }
  if (colIndex < 0) return null;
  var rows = doc.querySelectorAll('table tbody tr, table tr');
  var out = [];
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var cellIndex = 0;
    for (var c = 0; c < row.children.length; c++) {
      var cell = row.children[c];
      if (cell.tagName !== 'TD' && cell.tagName !== 'TH') continue;
      if (cell.tagName === 'TH') continue;
      if (cellIndex === colIndex) {
        var inner = cell.querySelector('.x-grid-cell-inner');
        var text = inner ? inner.textContent : cell.textContent;
        out.push(text.trim().replace(/\s+/g, ' '));
        found = true;
        break;
      }
      cellIndex++;
    }
  }
  return out.length ? out : null;
}

function normalizeHeaderText(s) {
  return (s || '').trim().replace(/\s+/g, ' ');
}

function headerMatchesDireccion(text) {
  const n = normalizeHeaderText(text);
  if (n === 'Dirección') return true;
  if (n === 'Direccion') return true;
  if (n.toLowerCase() === 'dirección') return true;
  if (n.toLowerCase() === 'direccion') return true;
  return false;
}

function queryAllIncludingShadow(root, selector) {
  var list = [];
  try {
    root.querySelectorAll(selector).forEach(function (el) { list.push(el); });
  } catch (e) {}
  var all = root.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var sr = all[i].shadowRoot;
    if (sr) {
      try {
        sr.querySelectorAll(selector).forEach(function (el) { list.push(el); });
      } catch (e2) {}
    }
  }
  return list;
}

function findDireccionColumnId(doc) {
  var columnId = null;
  // Strategy 1: match exact structure — .x-column-header with inner .x-column-header-text "Dirección"
  var columnHeaders = doc.querySelectorAll('.x-column-header');
  if (columnHeaders.length === 0) {
    columnHeaders = queryAllIncludingShadow(doc, '.x-column-header');
  }
  for (var i = 0; i < columnHeaders.length; i++) {
    var headerDiv = columnHeaders[i];
    var textEl = headerDiv.querySelector('.x-column-header-text');
    if (textEl && headerMatchesDireccion(textEl.textContent)) {
      columnId = headerDiv.id || headerDiv.getAttribute('componentid');
      if (columnId) break;
    }
  }
  if (columnId) return columnId;
  // Strategy 2: find .x-column-header-text with "Dirección", then get gridcolumn id from ancestor
  var headers = doc.querySelectorAll('.x-column-header-text, [class*="column-header-text"]');
  if (headers.length === 0) {
    headers = queryAllIncludingShadow(doc, '.x-column-header-text, [class*="column-header-text"]');
  }
  for (var i = 0; i < headers.length; i++) {
    var el = headers[i];
    if (headerMatchesDireccion(el.textContent)) {
      var header = el.closest('[id^="gridcolumn-"]') || el.closest('[componentid^="gridcolumn-"]') || el.closest('.x-column-header');
      if (header) {
        columnId = header.id || header.getAttribute('componentid');
        break;
      }
    }
  }
  if (columnId) return columnId;
  var byId = doc.querySelectorAll('[id^="gridcolumn-"], [componentid^="gridcolumn-"]');
  if (byId.length === 0) {
    byId = queryAllIncludingShadow(doc, '[id^="gridcolumn-"], [componentid^="gridcolumn-"]');
  }
  for (var j = 0; j < byId.length; j++) {
    var h = byId[j];
    var label = h.textContent || '';
    if (headerMatchesDireccion(label)) {
      columnId = h.id || h.getAttribute('componentid');
      break;
    }
  }
  if (columnId) return columnId;
  var allEls = doc.querySelectorAll('*');
  for (var k = 0; k < allEls.length; k++) {
    var el = allEls[k];
    if (el.children.length !== 0) continue;
    var t = (el.textContent || '').trim();
    if (!headerMatchesDireccion(t)) continue;
    var parent = el.closest('[id^="gridcolumn-"]') || el.closest('[componentid^="gridcolumn-"]');
    if (parent) {
      columnId = parent.id || parent.getAttribute('componentid');
      break;
    }
  }
  return columnId;
}
