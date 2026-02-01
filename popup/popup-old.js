document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get([
    'filterText', 
    'caseSensitive', 
    'wholeWord',
    'presets',
    'whitelist'
  ], function(data) {
    document.getElementById('filterText').value = data.filterText || '';
    document.getElementById('caseSensitive').checked = data.caseSensitive || false;
    document.getElementById('wholeWord').checked = data.wholeWord || false;
    document.getElementById('whitelist').value = data.whitelist || '';
    
    // Load presets
    if (data.presets) {
      Object.keys(data.presets).forEach(preset => {
        const checkbox = document.querySelector(`.preset[data-preset="${preset}"]`);
        if (checkbox) {
          checkbox.checked = data.presets[preset];
        }
      });
    }
  });
  
  // Save filters
  document.getElementById('saveFilters').addEventListener('click', function() {
    const filterText = document.getElementById('filterText').value;
    const caseSensitive = document.getElementById('caseSensitive').checked;
    const wholeWord = document.getElementById('wholeWord').checked;
    
    chrome.storage.sync.set({
      filterText: filterText,
      caseSensitive: caseSensitive,
      wholeWord: wholeWord
    }, function() {
      showStatus('Filters saved successfully!', 'success');
    });
  });
  
  // Apply filters immediately
  document.getElementById('applyNow').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "applyFilters"});
      showStatus('Filters applied to current page!', 'success');
    });
  });
  
  // Save presets
  document.getElementById('savePresets').addEventListener('click', function() {
    const presets = {
      'anti-casino': document.querySelector('.preset[data-preset="anti-casino"]').checked,
      'anti-porn': document.querySelector('.preset[data-preset="anti-porn"]').checked,
      'anti-drugs': document.querySelector('.preset[data-preset="anti-drugs"]').checked
    };
    
    chrome.storage.sync.set({presets: presets}, function() {
      showStatus('Presets saved successfully!', 'success');
    });
  });
  
  // Save whitelist
  document.getElementById('saveWhitelist').addEventListener('click', function() {
    const whitelist = document.getElementById('whitelist').value;
    chrome.storage.sync.set({whitelist: whitelist}, function() {
      showStatus('Whitelist saved successfully!', 'success');
    });
  });
  
  // Load preset text when checked
  document.querySelectorAll('.preset').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        loadPreset(this.dataset.preset);
      }
    });
  });
  
  document.getElementById('donate').addEventListener('click', () => {
	window.open('https://www.buymeacoffee.com/aristarh.ucolov', '_blank');
});

  function loadPreset(presetName) {
    let presetText = '';
    
    switch(presetName) {
      case 'anti-casino':
        presetText = 'casino\nbetting\ngambling\npoker\nslot\nroulette\n';
        break;
      case 'anti-porn':
        presetText = 'porn\npornography\nsex\nxxx\nadult\nnude\blowjob\masturbation\suckdick\dick\pussy\sperma\n';
        break;
      case 'anti-drugs':
        presetText = 'drugs\ncocaine\nheroin\nmarijuana\nweed\nlsd\nmeth\n';
        break;
    }
    
    const currentText = document.getElementById('filterText').value;
    document.getElementById('filterText').value = currentText + (currentText ? '\n' : '') + presetText;
  }
  
  function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status ' + type;
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  }
});