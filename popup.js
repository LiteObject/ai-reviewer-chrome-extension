document.addEventListener('DOMContentLoaded', function () {
  const readButton = document.getElementById('btnRead');
  const clearButton = document.getElementById('btnClear');
  const settingsButton = document.getElementById('btnSettings');
  const refreshModelsButton = document.getElementById('btnRefreshModels');
  const textbox = document.getElementById('txtResult');
  const settingsPanel = document.getElementById('settingsPanel');
  const modelSelector = document.getElementById('modelSelector');
  const wordLimitSelector = document.getElementById('wordLimitSelector');
  const modelStatus = document.getElementById('modelStatus');

  let selectedModel = 'gpt-oss:latest'; // Default model
  let selectedWordLimit = 500; // Default word limit

  readButton.addEventListener('click', handleReadButtonClick);
  clearButton.addEventListener('click', handleClearButtonClick);
  settingsButton.addEventListener('click', toggleSettings);
  refreshModelsButton.addEventListener('click', refreshModels);
  modelSelector.addEventListener('change', handleModelSelection);
  wordLimitSelector.addEventListener('change', handleWordLimitSelection);

  // Initialize the extension
  init();

  async function init() {
    await loadSettings();
    await refreshModels();
  }

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['selectedModel', 'selectedWordLimit']);
      if (result.selectedModel) {
        selectedModel = result.selectedModel;
      }
      if (result.selectedWordLimit) {
        selectedWordLimit = result.selectedWordLimit;
        wordLimitSelector.value = selectedWordLimit;
      }
      updateModelStatus();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveSelectedModel(model) {
    try {
      await chrome.storage.sync.set({ selectedModel: model });
      selectedModel = model;
      updateModelStatus();
    } catch (error) {
      console.error('Error saving selected model:', error);
      modelStatus.textContent = 'Error saving model selection';
    }
  }

  async function saveSelectedWordLimit(wordLimit) {
    try {
      await chrome.storage.sync.set({ selectedWordLimit: wordLimit });
      selectedWordLimit = wordLimit;
      updateModelStatus();
    } catch (error) {
      console.error('Error saving word limit:', error);
      modelStatus.textContent = 'Error saving word limit';
    }
  }

  function updateModelStatus() {
    modelStatus.textContent = `Model: ${selectedModel} | Length: ${selectedWordLimit} words`;
  }

  function handleWordLimitSelection() {
    const selected = parseInt(wordLimitSelector.value);
    if (selected) {
      saveSelectedWordLimit(selected);
    }
  }

  function toggleSettings() {
    settingsPanel.classList.toggle('show');
  }

  async function refreshModels() {
    refreshModelsButton.disabled = true;
    refreshModelsButton.textContent = 'Loading...';
    modelSelector.innerHTML = '<option value="">Loading models...</option>';

    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.models && Array.isArray(data.models)) {
        modelSelector.innerHTML = '';

        if (data.models.length === 0) {
          modelSelector.innerHTML = '<option value="">No models found</option>';
          modelStatus.textContent = 'No models available. Please install a model with: ollama pull <model-name>';
          return;
        }

        data.models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = `${model.name} (${formatBytes(model.size)})`;
          if (model.name === selectedModel) {
            option.selected = true;
          }
          modelSelector.appendChild(option);
        });

        modelStatus.textContent = `Found ${data.models.length} model(s). Current: ${selectedModel}`;
      } else {
        throw new Error('Invalid response format from Ollama');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      modelSelector.innerHTML = '<option value="">Error loading models</option>';
      modelStatus.textContent = `Error: ${error.message}. Make sure Ollama is running.`;
    } finally {
      refreshModelsButton.disabled = false;
      refreshModelsButton.textContent = 'Refresh Models';
    }
  }

  function handleModelSelection() {
    const selected = modelSelector.value;
    if (selected) {
      saveSelectedModel(selected);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Simple HTML sanitizer for security
  function sanitizeHTML(html) {
    // Allow only safe HTML tags and attributes
    const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote',
      'code', 'pre', 'span', 'div'];

    const allowedAttributes = ['class'];

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Recursively clean the HTML
    function cleanElement(element) {
      // Remove script tags and event handlers
      if (element.tagName && !allowedTags.includes(element.tagName.toLowerCase())) {
        element.remove();
        return;
      }

      // Remove dangerous attributes
      if (element.attributes) {
        Array.from(element.attributes).forEach(attr => {
          if (!allowedAttributes.includes(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          }
        });
      }

      // Recursively clean children
      Array.from(element.children).forEach(child => cleanElement(child));
    }

    Array.from(tempDiv.children).forEach(child => cleanElement(child));
    return tempDiv.innerHTML;
  }

  function handleReadButtonClick() {
    readButton.disabled = true;
    textbox.textContent = 'Extracting page content...';

    // Check if chrome.scripting is available
    if (!chrome.scripting) {
      readButton.disabled = false;
      textbox.textContent = 'Error: Chrome scripting API not available. Please reload the extension.';
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (chrome.runtime.lastError) {
        readButton.disabled = false;
        textbox.textContent = `Error querying tabs: ${chrome.runtime.lastError.message}`;
        return;
      }

      if (!tabs || !tabs[0]) {
        readButton.disabled = false;
        textbox.textContent = 'Error: No active tab found.';
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: getPageContentScript
      }).then(result => {
        if (result && result[0] && result[0].result) {
          console.log('Extracted content length:', result[0].result.length);
          console.log('Content preview:', result[0].result.substring(0, 200));
          processText(result[0].result);
        } else {
          readButton.disabled = false;
          textbox.textContent = 'No content found on this page. Result: ' + JSON.stringify(result);
        }
      }).catch(error => {
        readButton.disabled = false;
        textbox.textContent = `Script execution error: ${error.message}`;
        console.error('Script execution error:', error);
      });
    });
  }

  function handleClearButtonClick() {
    textbox.textContent = '';
  }

  async function handleOpenSidePanel() {
    try {
      console.log('Opening side panel...');

      // Try to open side panel directly
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        await chrome.sidePanel.open({ windowId: tabs[0].windowId });
        console.log('Side panel opened successfully');
        // Close the popup after successfully opening side panel
        window.close();
      } else {
        throw new Error('No active tab found');
      }
    } catch (error) {
      console.error('Error in handleOpenSidePanel:', error);

      // Try alternative approach with setOptions
      try {
        await chrome.sidePanel.setOptions({
          path: 'sidepanel.html',
          enabled: true
        });
        console.log('Side panel enabled. Look for side panel in browser UI.');
        alert('Side panel enabled! Look for the side panel icon in your browser or try right-clicking in the browser to find the side panel option.');
      } catch (setError) {
        console.error('Error setting side panel options:', setError);
        alert(`Could not open side panel. Error: ${error.message}`);
      }
    }
  } function getPageContentScript() {
    try {
      // Extract main content from the page, avoiding navigation, ads, and other noise
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        '#content',
        '.main-content'
      ];

      let content = '';

      // Try to find main content area first
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.innerText || element.textContent;
          console.log('Found content with selector:', selector, 'Length:', content.length);
          break;
        }
      }

      // If no main content found, extract from body but filter out common noise
      if (!content) {
        const bodyClone = document.body.cloneNode(true);

        // Remove navigation, ads, and other noise elements
        const noiseSelectors = [
          'nav', 'header', 'footer', 'aside',
          '.nav', '.navigation', '.menu',
          '.ad', '.ads', '.advertisement',
          '.sidebar', '.widget',
          '.comments', '.comment',
          'script', 'style', 'noscript'
        ];

        noiseSelectors.forEach(selector => {
          const elements = bodyClone.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });

        content = bodyClone.innerText || bodyClone.textContent;
        console.log('Extracted from body after cleanup, length:', content.length);
      }

      // Clean up the content
      content = content.replace(/\s+/g, ' ').trim();

      // Limit content length to avoid overwhelming the AI model
      const maxLength = 8000; // Adjust based on your model's context window
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
        console.log('Content truncated to:', maxLength);
      }

      const result = content || 'No readable content found on this page.';
      console.log('Final content length:', result.length);
      return result;
    } catch (error) {
      console.error('Error in getPageContentScript:', error);
      return `Error extracting content: ${error.message}`;
    }
  }

  function processText(input) {
    textbox.textContent = 'Analyzing content with AI...';
    const ollamaEndpoint = 'http://localhost:11434/api/chat';

    console.log('Processing text of length:', input.length);
    console.log('Using model:', selectedModel);
    console.log('Word limit:', selectedWordLimit);
    console.log('Sending to Ollama...');

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    fetch(ollamaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: selectedModel,
        stream: false,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that creates clear, well-structured summaries using clean HTML formatting. Generate properly formatted HTML with: <h2>, <h3> for headers, <strong> for bold, <em> for italics, <ul><li> for lists, and <table><tr><th><td> for tables. Use semantic HTML structure and ensure all tags are properly closed. Do not include any CSS, scripts, or dangerous elements - only safe content HTML. IMPORTANT: Keep the summary to approximately ${selectedWordLimit} words or less.`
          },
          {
            role: "user",
            content: `Please create a concise, well-formatted HTML summary of the following content in approximately ${selectedWordLimit} words or less. Use proper HTML tags for headers, tables, lists, and emphasis:\n\n${input}`
          }
        ]
      })
    })
      .then(response => {
        clearTimeout(timeoutId);
        console.log('Ollama response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Ollama response data:', data);
        if (data.message && data.message.content) {
          // Sanitize and render HTML directly from LLM
          const htmlContent = data.message.content;
          const sanitizedHTML = sanitizeHTML(htmlContent);
          textbox.innerHTML = sanitizedHTML;
        } else {
          textbox.textContent = 'Received invalid response from AI model.';
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('Error:', error);
        if (error.name === 'AbortError') {
          textbox.textContent = 'Request timed out. The AI model may be taking too long to respond.';
        } else {
          textbox.textContent = `Error: ${error.message}. Make sure Ollama is running and the ${selectedModel} model is available.`;
        }
      })
      .finally(() => {
        readButton.disabled = false;
      });
  }
});
