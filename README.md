# AI TL;DR Chrome Extension

A modern Chrome extension that uses local AI (Ollama) to automatically summarize webpage content with a beautiful, theme-aware side panel interface.

## Features

### **Modern Side Panel Interface**
- **Spacious Side Panel**: Large, comfortable reading area that opens directly when you click the extension icon
- **Theme-Aware Design**: Automatically adapts to your Chrome theme (light/dark mode)
- **Flat Design**: Clean, modern interface with minimal shadows and consistent styling
- **Progress Tracking**: Beautiful animated progress bar showing AI processing stages

### **Advanced AI Integration**
- **Multiple Model Support**: Choose from any Ollama model with automatic model discovery
- **Smart Content Extraction**: Intelligently extracts main content, filtering out navigation, ads, and clutter
- **Configurable Word Limits**: Choose from 250, 500, 750, or 1000 word summaries
- **Rich HTML Formatting**: Renders summaries with proper tables, headers, lists, and styling

### **Smart Configuration**
- **Persistent Settings**: Model selection and word limits are saved automatically
- **One-Click Model Refresh**: Automatically discovers new Ollama models
- **Real-Time Status**: Shows current model and word limit in the interface

### **Security & Privacy**
- **Local Processing**: All AI processing happens locally via Ollama
- **HTML Sanitization**: Prevents XSS attacks while maintaining rich formatting
- **No Data Collection**: Your content never leaves your computer

## Prerequisites

1. **Ollama**: Install Ollama on your system
   ```bash
   # Install Ollama (visit https://ollama.ai for installation)
   
   # Pull a recommended model (or any model you prefer)
   ollama pull llama3.1
   # or
   ollama pull qwen2.5
   # or
   ollama pull mistral
   
   # Start Ollama service (runs on localhost:11434)
   ollama serve
   ```

2. **Chrome Browser**: Chrome or Chromium-based browser (version 114+ for side panel support)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LiteObject/ai-tldr-chrome-extension.git
   cd ai-tldr-chrome-extension
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension folder

3. **Verify installation**:
   - The extension icon should appear in the Chrome toolbar
   - Make sure Ollama is running with at least one model

## Usage

### Basic Operation
1. **Navigate to any webpage** with content you want to summarize
2. **Click the extension icon** - the side panel opens automatically
3. **Configure settings** (optional):
   - Click "Settings" to choose your AI model
   - Select your preferred summary length (250-1000 words)
4. **Click "Summarize Current Page"** 
5. **Watch the progress bar** as the AI processes your content
6. **Read your formatted summary** in the comfortable side panel

### Advanced Features
- **Model Management**: Use "Refresh Models" to discover newly installed Ollama models
- **Word Count**: See exactly how many words are in your summary
- **Theme Adaptation**: The interface automatically matches your Chrome theme
- **Settings Persistence**: Your preferences are saved between sessions

## Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension using latest APIs
- **Side Panel API**: Utilizes Chrome's newest side panel feature for better UX
- **Theme Integration**: Automatically detects and adapts to Chrome themes
- **Progressive Enhancement**: Works with any Ollama-compatible model

### Content Processing Pipeline
1. **Smart Extraction**: Identifies main content areas using semantic selectors
2. **Noise Filtering**: Removes navigation, ads, comments, and other clutter  
3. **Content Optimization**: Limits content length for optimal AI processing
4. **AI Summarization**: Processes through local Ollama with customizable prompts
5. **Rich Rendering**: Sanitizes and displays HTML with full formatting

### Supported HTML Elements
- Headers (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`)
- Text formatting (`strong`, `b`, `em`, `i`, `u`)
- Lists (`ul`, `ol`, `li`)
- Tables (`table`, `thead`, `tbody`, `tr`, `th`, `td`)
- Code blocks (`code`, `pre`)
- Blockquotes (`blockquote`)
- Paragraphs and line breaks

### Security Features
- **Comprehensive HTML Sanitization**: Prevents XSS attacks
- **Safe Tag Whitelist**: Only allows safe HTML elements and attributes
- **Local Processing**: No external API calls or data transmission
- **Content Security Policy**: Strict CSP compliance

## Project Structure

```
ai-tldr-chrome-extension/
├── manifest.json          # Extension manifest (V3)
├── sidepanel.html         # Main side panel interface
├── sidepanel.js           # Side panel functionality and AI integration
├── popup.html             # Fallback popup interface
├── popup.js               # Popup functionality
├── background.js          # Service worker for extension coordination
├── icon.png               # Extension icon
└── README.md              # This file
```

## Configuration

### Changing Default Model
The extension automatically detects available models, but you can set a default in `sidepanel.js`:
```javascript
let selectedModel = 'your-preferred-model'; // Change this line
```

### Adjusting Word Limits
Modify the available word limits in the HTML:
```html
<select id="wordLimitSelector" class="word-limit-selector">
    <option value="250">Very Short (250 words)</option>
    <option value="500" selected>Short (500 words)</option>
    <!-- Add custom values here -->
</select>
```

### Theme Customization
The extension automatically adapts to Chrome themes, but you can customize colors in `sidepanel.html`:
```css
:root {
    --color-primary-brand: #your-color;
    --color-primary-brand-text: #your-text-color;
}
```

## Development

### Testing Ollama Connection
Test the connection directly:
```bash
curl http://localhost:11434/api/tags
```

### Debugging
1. **Side Panel**: Right-click in the side panel and select "Inspect"
2. **Background**: Go to `chrome://extensions/` → Details → Inspect views: background page
3. **Console Logs**: Check for detailed theme detection and processing logs

### Making Changes
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh button on your extension
4. Test the changes

## Troubleshooting

### Common Issues

**Side panel doesn't open**
- Ensure you're using Chrome 114+ 
- Reload the extension completely
- Check background script errors in extension details

**"No models found"**
- Verify Ollama is running: `ollama serve`
- Check available models: `ollama list`
- Use "Refresh Models" button in settings

**Theme colors not applying**
- Check browser console for theme detection logs
- Verify Chrome theme settings
- Dark mode detection should work automatically

**Content extraction fails**
- Try on different types of webpages
- Check if site has content restrictions
- View console logs for extraction details

**AI processing errors**
- Ensure Ollama model is fully downloaded
- Check Ollama service status
- Verify model compatibility with your system

### Performance Tips
- **Choose appropriate word limits**: Longer summaries take more processing time
- **Use efficient models**: Smaller models like `qwen2.5:7b` are faster than larger ones
- **Close unused side panels**: Multiple panels can consume resources

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Update documentation if needed
5. Submit a pull request

### Development Guidelines
- Follow existing code style and patterns
- Test with multiple Ollama models
- Ensure theme compatibility
- Verify side panel functionality
- Update README for new features

## License

This project is open source. Please check the repository for license details.

## 🙏 Acknowledgments

- **Ollama** for providing excellent local AI capabilities
- **Chrome Extensions API** for the powerful platform
- **Material Design** principles for UI inspiration
- The open source community for tools and inspiration

## 🔗 Links

- [Ollama Official Site](https://ollama.ai)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Side Panel API Documentation](https://developer.chrome.com/docs/extensions/reference/sidePanel/)

---

**Latest Update**: Enhanced with side panel interface, theme adaptation, multiple model support, and progress tracking.