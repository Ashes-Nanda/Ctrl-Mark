# Ctrl+Mark - AI-Powered Google Forms Assistant

A Chrome extension that helps users solve multiple-choice questions in Google Forms using AI technology.

## Quick Start Guide (For Users)

### Method 1: Direct Installation (Coming Soon)
- The extension will be available on the Chrome Web Store
- Simply click "Add to Chrome" when available

### Method 2: Manual Installation
1. Download this repository:
   - Click the green "Code" button above
   - Select "Download ZIP"
   - Extract the ZIP file to a folder on your computer

2. Install in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle switch in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from the extracted files

3. Get Your API Key:
   - Sign up at [Nebius AI](https://nebius.ai)
   - Create a new API key in your dashboard
   - Copy the API key

4. Configure the Extension:
   - Click the Ctrl+Mark extension icon in Chrome
   - Paste your API key and click "Save API Key"

## Using the Extension

1. Open any Google Form with multiple-choice questions

2. Click the Ctrl+Mark extension icon in your Chrome toolbar

3. Three main functions:
   - **Save API Key**: Store your Nebius AI API key
   - **Start Solving**: Begin analyzing and answering questions
   - **Review Answers**: Check the AI's confidence in each answer

4. Understanding Confidence Indicators:
   - 🟢 Dark Green (90-100%): Very high confidence
   - 🟩 Green (70-89%): Good confidence
   - 🟧 Orange (50-69%): Medium confidence
   - 🟥 Red (<50%): Low confidence

## Features

- Automatically analyzes and answers multiple-choice questions
- Provides confidence scores for each answer
- Review mode to highlight AI-selected answers
- Easy-to-use interface with API key management
- Visual confidence indicators for answer reliability
- Works with various Google Forms formats

## Troubleshooting

Common issues and solutions:

1. **Extension not working?**
   - Make sure you're on a Google Forms page
   - Check if your API key is valid
   - Try refreshing the page

2. **No confidence scores showing?**
   - Click "Review Answers" to see confidence indicators
   - Make sure the questions were solved by the extension

3. **API Key Issues?**
   - Verify your Nebius AI account is active
   - Check if you've reached your API quota
   - Try re-saving your API key

## For Developers

If you want to modify or build the extension:

1. Clone this repository:
```bash
git clone [your-repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. For development:
```bash
npm run watch  # Auto-rebuilds on changes
```

## Privacy & Security

- Your API key is stored locally in your browser
- No personal data is collected or stored
- All processing happens through the Nebius AI API
- The extension only activates on Google Forms pages

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Provide details about your problem:
   - Chrome version
   - Error messages (if any)
   - Steps to reproduce the issue

## License

This project is licensed under the MIT License - see the LICENSE file for details. 