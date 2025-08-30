# AI Page Summarizer Chrome Extension

A Chrome extension that uses local AI (Ollama) to automatically summarize webpage content with beautiful HTML formatting.

## Features

- **Smart Content Extraction**: Automatically extracts main content from webpages, filtering out navigation, ads, and other noise
- **Local AI Processing**: Uses Ollama with `gpt-oss:latest` model for privacy-friendly summarization
- **Rich HTML Formatting**: Renders summaries with proper tables, headers, lists, and styling
- **Security-First**: HTML sanitization prevents XSS attacks while maintaining rich formatting
- **One-Click Operation**: Simple interface with summarize and clear buttons

## Prerequisites

1. **Ollama**: Install Ollama on your system
   ```bash
   # Install Ollama (visit https://ollama.ai for installation)
   
   # Pull the required model
   ollama pull gpt-oss:latest
   
   # Start Ollama service (runs on localhost:11434)
   ollama serve
   ```

2. **Chrome Browser**: Chrome or Chromium-based browser with extension support

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LiteObject/ai-reviewer-chrome-extension.git
   cd ai-reviewer-chrome-extension
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension folder

3. **Verify installation**:
   - The extension icon should appear in the Chrome toolbar
   - Make sure Ollama is running with the `gpt-oss:latest` model

## Usage

1. **Navigate to any webpage** with content you want to summarize
2. **Click the extension icon** in the Chrome toolbar
3. **Click "Summarize"** to extract and analyze the page content
4. **View the formatted summary** with tables, headers, and rich formatting
5. **Click "Clear"** to reset the results area

## Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension using latest APIs
- **Content Extraction**: Smart algorithms to identify main content areas
- **AI Integration**: Direct API calls to local Ollama instance
- **HTML Rendering**: Secure HTML sanitization with rich formatting support

### Supported HTML Elements
- Headers (`h1`, `h2`, `h3`)
- Text formatting (`strong`, `em`, `code`)
- Lists (`ul`, `ol`, `li`)
- Tables (`table`, `tr`, `th`, `td`)
- Paragraphs and line breaks
- Blockquotes

### Security Features
- HTML sanitization prevents XSS attacks
- Only safe HTML tags and attributes are allowed
- No external network requests (except to local Ollama)

## Project Structure

```
ai-reviewer-chrome-extension/
├── manifest.json          # Extension manifest (V3)
├── popup.html             # Extension popup UI
├── popup.js               # Main functionality and AI integration
├── icon.png               # Extension iconextraction
└── README.md              # This file
```

## Configuration

### Changing AI Model
Edit `popup.js` and modify the model name:
```javascript
body: JSON.stringify({
  model: "your-preferred-model", // Change this line
  stream: false,
  temperature: 0.3,
  // ...
})
```

### Adjusting Content Length
Modify the content extraction limit in `popup.js`:
```javascript
const maxLength = 8000; // Adjust this value
```

## Development

### Testing Ollama Connection
Open `test_ollama.html` in your browser to test the Ollama API connection independently.

### Debugging
1. Right-click the extension popup and select "Inspect"
2. Check the console for error messages and logs
3. Verify Ollama is running: `curl http://localhost:11434/api/tags`

### Making Changes
1. Edit the source files
2. Reload the extension in `chrome://extensions/`
3. Test the changes

## Troubleshooting

### Common Issues

**"Extension error: Chrome scripting API not available"**
- Reload the extension completely
- Ensure manifest.json has `"scripting"` permission

**"No content found on this page"**
- Try on a different webpage with more content
- Check if the page has restrictions on content extraction

**"Error: Network error" or connection issues**
- Verify Ollama is running: `ollama serve`
- Check if the model is available: `ollama list`
- Ensure no firewall blocking localhost:11434

**Poor summary quality**
- Try a different AI model
- Adjust the temperature parameter
- Modify the system prompt for different output styles

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Please check the repository for license details.

## Acknowledgments

- **Ollama** for providing local AI capabilities
- **Chrome Extensions API** for the platform
- The open source community for inspiration and tools