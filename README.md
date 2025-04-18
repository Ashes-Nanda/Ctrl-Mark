# Ctrl+Mark - AI-Powered Google Forms Assistant

A Chrome extension that helps users solve multiple-choice questions in Google Forms using AI technology.

## Features

- Automatically analyzes and answers multiple-choice questions
- Provides confidence scores for each answer
- Review mode to highlight AI-selected answers
- Easy-to-use interface with API key management
- Visual confidence indicators for answer reliability

## Installation

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

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

1. Open a Google Form with multiple-choice questions
2. Click the Ctrl+Mark extension icon
3. Enter your Nebius API key (if not already configured)
4. Click "Start Solving" to begin analyzing questions
5. Use "Review Answers" to see confidence scores and review selections

## Development

- `npm run build`: Build the extension
- `npm run watch`: Watch for changes and rebuild automatically

## Technologies Used

- Chrome Extension APIs
- Nebius AI API
- Webpack
- JavaScript

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 