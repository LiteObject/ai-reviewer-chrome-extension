document.addEventListener('DOMContentLoaded', function () {
    // Apply Chrome theme colors if available
    applyThemeColors();

    const summarizeButton = document.getElementById('btnSummarize');
    const clearButton = document.getElementById('btnClear');
    const settingsButton = document.getElementById('btnSettings');
    const refreshModelsButton = document.getElementById('btnRefreshModels');
    const copyButton = document.getElementById('btnCopy');
    const summaryContent = document.getElementById('summaryContent');
    const settingsPanel = document.getElementById('settingsPanel');
    const modelSelector = document.getElementById('modelSelector');
    const wordLimitSelector = document.getElementById('wordLimitSelector');
    const modelStatus = document.getElementById('modelStatus');
    const wordCount = document.getElementById('wordCount');
    const wordCountText = document.getElementById('wordCountText');
    const readingTime = document.getElementById('readingTime');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const keyboardHint = document.getElementById('keyboardHint');

    let selectedModel = 'gpt-oss:latest'; // Default model
    let selectedWordLimit = 500; // Default word limit

    summarizeButton.addEventListener('click', handleSummarizeClick);
    clearButton.addEventListener('click', handleClearClick);
    settingsButton.addEventListener('click', toggleSettings);
    refreshModelsButton.addEventListener('click', refreshModels);
    copyButton.addEventListener('click', handleCopyClick);
    modelSelector.addEventListener('change', handleModelSelection);
    wordLimitSelector.addEventListener('change', handleWordLimitSelection);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Show keyboard hint briefly on load
    setTimeout(() => {
        showKeyboardHint();
        setTimeout(hideKeyboardHint, 3000);
    }, 1000);

    // Initialize the extension
    init();

    async function init() {
        await loadSettings();
        await refreshModels();
    }

    // Progress bar functions
    function showProgress(percentage, text) {
        progressContainer.style.display = 'block';
        progressFill.style.width = percentage + '%';
        progressText.textContent = text;
        summaryContent.innerHTML = '';
        wordCount.style.display = 'none';
    }

    function hideProgress() {
        progressContainer.style.display = 'none';
    }

    function updateProgress(percentage, text) {
        progressFill.style.width = percentage + '%';
        progressText.textContent = text;
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
        const timestamp = new Date().toLocaleTimeString();
        modelStatus.textContent = `Current: ${selectedModel} | Target length: ${selectedWordLimit} words | Updated: ${timestamp}`;
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
                    const sizeInfo = formatBytes(model.size);
                    const modifiedDate = model.modified_at ? new Date(model.modified_at).toLocaleDateString() : '';
                    option.textContent = `${model.name} (${sizeInfo}${modifiedDate ? `, ${modifiedDate}` : ''})`;
                    if (model.name === selectedModel) {
                        option.selected = true;
                    }
                    modelSelector.appendChild(option);
                });

                updateModelStatus();
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

    function handleSummarizeClick() {
        summarizeButton.disabled = true;
        summarizeButton.textContent = 'Summarizing...';

        // Show progress: Starting
        showProgress(10, 'Extracting page content...');

        // Check if chrome.scripting is available
        if (!chrome.scripting) {
            summarizeButton.disabled = false;
            summarizeButton.textContent = 'Summarize Current Page';
            hideProgress();
            summaryContent.innerHTML = '<div style="color: #f44336;">Error: Chrome scripting API not available. Please reload the extension.</div>';
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
                summarizeButton.disabled = false;
                summarizeButton.textContent = 'Summarize Current Page';
                hideProgress();
                summaryContent.innerHTML = `<div style="color: #f44336;">Error querying tabs: ${chrome.runtime.lastError.message}</div>`;
                return;
            }

            if (!tabs || !tabs[0]) {
                summarizeButton.disabled = false;
                summarizeButton.textContent = 'Summarize Current Page';
                hideProgress();
                summaryContent.innerHTML = '<div style="color: #f44336;">Error: No active tab found.</div>';
                return;
            }

            // Update progress: Found tab
            updateProgress(25, 'Processing page content...');

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: getPageContentScript
            }).then(result => {
                if (result && result[0] && result[0].result) {
                    console.log('Extracted content length:', result[0].result.length);
                    console.log('Content preview:', result[0].result.substring(0, 200));

                    // Update progress: Content extracted
                    updateProgress(50, 'Content extracted, sending to AI...');

                    processText(result[0].result);
                } else {
                    summarizeButton.disabled = false;
                    summarizeButton.textContent = 'Summarize Current Page';
                    hideProgress();
                    summaryContent.innerHTML = '<div style="color: #f44336;">No content found on this page.</div>';
                }
            }).catch(error => {
                summarizeButton.disabled = false;
                summarizeButton.textContent = 'Summarize Current Page';
                hideProgress();
                summaryContent.innerHTML = `<div style="color: #f44336;">Script execution error: ${error.message}</div>`;
                console.error('Script execution error:', error);
            });
        });
    }

    function handleClearClick() {
        summaryContent.innerHTML = '';
        wordCount.style.display = 'none';
        copyButton.classList.remove('show');
    }

    // New functions for enhanced functionality
    function handleCopyClick() {
        const textContent = summaryContent.textContent || summaryContent.innerText;
        navigator.clipboard.writeText(textContent).then(() => {
            copyButton.textContent = 'Copied!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = 'Copy';
                copyButton.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text:', err);
            copyButton.textContent = 'Error';
            setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 2000);
        });
    }

    function handleKeyboardShortcuts(event) {
        // Ctrl+Enter to summarize
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            if (!summarizeButton.disabled) {
                handleSummarizeClick();
            }
        }
        // Ctrl+C to copy (when summary is visible)
        else if (event.ctrlKey && event.key === 'c' && summaryContent.textContent.trim()) {
            if (event.target === document.body || summaryContent.contains(event.target)) {
                event.preventDefault();
                handleCopyClick();
            }
        }
        // Escape to close settings
        else if (event.key === 'Escape') {
            if (settingsPanel.classList.contains('show')) {
                toggleSettings();
            }
        }
    }

    function showKeyboardHint() {
        keyboardHint.classList.add('show');
    }

    function hideKeyboardHint() {
        keyboardHint.classList.remove('show');
    }

    function calculateReadingTime(wordCount) {
        const wordsPerMinute = 200; // Average reading speed
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes === 1 ? '1 min read' : `${minutes} min read`;
    }

    function getPageContentScript() {
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
        // Update progress: AI processing
        updateProgress(75, `Analyzing content with ${selectedModel}...`);

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

                // Update progress: Finalizing
                updateProgress(95, 'Finalizing summary...');

                if (data.message && data.message.content) {
                    // Sanitize and render HTML directly from LLM
                    const htmlContent = data.message.content;
                    const sanitizedHTML = sanitizeHTML(htmlContent);

                    // Complete progress and hide progress bar
                    updateProgress(100, 'Complete!');
                    setTimeout(() => {
                        hideProgress();
                        summaryContent.innerHTML = sanitizedHTML;

                        // Count words and show enhanced word count with reading time
                        const wordCountNum = countWords(summaryContent.textContent || summaryContent.innerText);
                        const readingTimeText = calculateReadingTime(wordCountNum);
                        wordCountText.textContent = `${wordCountNum} words`;
                        readingTime.textContent = readingTimeText;
                        wordCount.style.display = 'flex';

                        // Show copy button
                        copyButton.classList.add('show');
                    }, 500);
                } else {
                    hideProgress();
                    summaryContent.innerHTML = '<div style="color: #f44336;">Received invalid response from AI model.</div>';
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error('Error:', error);
                hideProgress();

                if (error.name === 'AbortError') {
                    summaryContent.innerHTML = '<div style="color: #f44336;">Request timed out. The AI model may be taking too long to respond.</div>';
                } else {
                    summaryContent.innerHTML = `<div style="color: #f44336;">Error: ${error.message}. Make sure Ollama is running and the ${selectedModel} model is available.</div>`;
                }
            })
            .finally(() => {
                summarizeButton.disabled = false;
                summarizeButton.textContent = 'Summarize Current Page';
            });
    }

    function countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
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

    // Apply Chrome theme colors if available
    async function applyThemeColors() {
        try {
            console.log('Attempting to get Chrome theme...');

            // First, detect if user prefers dark mode
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log('User prefers dark mode:', prefersDark);

            if (prefersDark) {
                // Apply dark theme colors
                const root = document.documentElement;
                root.style.setProperty('--color-primary-brand', '#1f1f1f');
                root.style.setProperty('--color-primary-brand-text', '#ffffff');
                root.style.setProperty('--color-primary-brand-hover', '#333333');
                root.style.setProperty('--color-primary-brand-tonal', 'rgba(255, 255, 255, 0.1)');
                console.log('Applied dark theme colors');
                return;
            }

            if (chrome && chrome.theme && chrome.theme.getCurrent) {
                console.log('Chrome theme API available, getting current theme...');
                const theme = await chrome.theme.getCurrent();
                console.log('Chrome theme object:', theme);

                if (theme && theme.colors) {
                    console.log('Theme colors available:', theme.colors);
                    const root = document.documentElement;

                    // Map Chrome theme colors to CSS variables
                    if (theme.colors.toolbar) {
                        root.style.setProperty('--color-primary-brand', theme.colors.toolbar);
                        console.log('Set toolbar color:', theme.colors.toolbar);
                    }
                    if (theme.colors.toolbar_text) {
                        root.style.setProperty('--color-primary-brand-text', theme.colors.toolbar_text);
                        console.log('Set toolbar text color:', theme.colors.toolbar_text);
                    }
                    if (theme.colors.button_background) {
                        root.style.setProperty('--color-primary-brand-hover', theme.colors.button_background);
                        console.log('Set button background color:', theme.colors.button_background);
                    }
                    if (theme.colors.omnibox_background) {
                        root.style.setProperty('--color-primary-brand-tonal', theme.colors.omnibox_background + '33'); // Add transparency
                        console.log('Set omnibox background color:', theme.colors.omnibox_background);
                    }

                    console.log('Applied Chrome theme colors successfully');
                } else {
                    console.log('No theme colors available, using defaults');
                }
            } else {
                console.log('Chrome theme API not available');
            }
        } catch (error) {
            // Fallback to default colors if theme API fails
            console.log('Error getting theme, using defaults:', error);
        }
    }
});
