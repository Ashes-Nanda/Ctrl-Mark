// Test message to verify content script is loading
console.log('Ctrl+Mark content script loaded!');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === 'startSolving') {
        console.log('Starting to solve questions with API key:', request.apiKey ? 'Present' : 'Not found');
        startSolving(request.apiKey)
            .then(() => {
                console.log('Successfully completed solving');
                sendResponse({ status: true, message: 'Successfully solved questions' });
            })
            .catch(error => {
                console.error('Error in startSolving:', error);
                sendResponse({ status: false, message: error.message });
            });
        return true; // Required for async response
    } else if (request.action === 'reviewAnswers') {
        console.log('Starting answer review');
        reviewAnswers()
            .then(() => {
                console.log('Review completed successfully');
                sendResponse({ status: true });
            })
            .catch(error => {
                console.error('Error in reviewAnswers:', error);
                sendResponse({ status: false, message: error.message });
            });
        return true;
    }
});

let answeredQuestions = new Set();

// Store confidence scores for each question
const questionConfidenceScores = new Map();

function getMCQQuestions() {
    console.log('Scanning for MCQ questions...');
    const questions = [];
    
    // Get all question containers using multiple possible selectors
    const containers = new Set([
        ...document.querySelectorAll('div[role="listitem"]'),
        ...document.querySelectorAll('div[role="radiogroup"]'),
        ...document.querySelectorAll('div[data-params*="choice"]'),
        ...document.querySelectorAll('div[data-item-id]')
    ]);
    
    console.log('Found potential question containers:', containers.size);
    
    containers.forEach((container, index) => {
        // Get question text using multiple possible selectors
        const questionText = getQuestionText(container);
        if (!questionText) return;
        
        console.log(`Question ${index + 1} text:`, questionText);
        
        // Get all possible option containers
        const options = getQuestionOptions(container);
        console.log(`Question ${index + 1} options:`, options);
        
        if (questionText && options.length > 0) {
            questions.push({
                element: container,
                questionText,
                options,
                type: detectQuestionType(options)
            });
        }
    });

    console.log('Total valid questions found:', questions.length);
    return questions;
}

function getQuestionText(container) {
    // Try multiple selectors for question text
    const textSelectors = [
        'div[role="heading"]',
        '[data-params*="title"]',
        '.freebirdFormviewerComponentsQuestionBaseTitle',
        '.freebirdFormviewerComponentsQuestionTextTitle',
        '[data-question-id]',
        'div[class*="Title"]'
    ];

    for (const selector of textSelectors) {
        const element = container.querySelector(selector);
        if (element) {
            const text = element.textContent.trim();
            if (text) return text;
        }
    }

    // Try getting text from aria-label
    const ariaLabel = container.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    return '';
}

function getQuestionOptions(container) {
    const options = [];
    
    // Try multiple selectors for option containers
    const optionSelectors = [
        'div[role="radio"]',
        'div[role="checkbox"]',
        '.freebirdFormviewerComponentsQuestionRadioChoice',
        '.freebirdFormviewerComponentsQuestionCheckboxChoice',
        '[data-answer-value]',
        'label'
    ];
    
    for (const selector of optionSelectors) {
        const elements = container.querySelectorAll(selector);
        if (elements.length > 0) {
            elements.forEach(element => {
                const optionText = getOptionText(element);
                if (optionText) {
                    options.push({
                        text: optionText,
                        element: element,
                        type: getOptionType(element)
                    });
                }
            });
            if (options.length > 0) break;
        }
    }
    
    return options;
}

function getOptionText(element) {
    // Try multiple ways to get option text
    const textSelectors = [
        'span.docssharedWizToggleLabeledContent',
        'span.quantumWizTogglePaperradioOffRadio',
        'span[aria-label]',
        '.freebirdFormviewerComponentsQuestionRadioLabel',
        '.freebirdFormviewerComponentsQuestionCheckboxLabel',
        '[data-value]'
    ];
    
    // First try to get text from aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    
    // Then try various text selectors
    for (const selector of textSelectors) {
        const textElement = element.querySelector(selector);
        if (textElement) {
            const text = textElement.textContent.trim() || textElement.getAttribute('aria-label');
            if (text) return text;
        }
    }
    
    // Try direct text content as last resort
    const directText = element.textContent.trim();
    return directText || '';
}

function getOptionType(element) {
    if (element.querySelector('img')) return 'image';
    if (element.matches('div[role="radio"]')) return 'radio';
    if (element.matches('div[role="checkbox"]')) return 'checkbox';
    return 'text';
}

function detectQuestionType(options) {
    if (options.length === 2 && 
        options.every(opt => ['true', 'false'].includes(opt.text.toLowerCase()))) {
        return 'true_false';
    }
    if (options.some(opt => opt.type === 'image')) {
        return 'image_choice';
    }
    return 'multiple_choice';
}

async function startSolving(apiKey) {
    console.log('Starting solving process...');
    const questions = getMCQQuestions();
    console.log('Total questions found:', questions.length);
    
    if (questions.length === 0) {
        throw new Error('No MCQ questions found in this form');
    }

    answeredQuestions.clear();
    
    for (const [index, question] of questions.entries()) {
        try {
            console.log(`Processing question ${index + 1}/${questions.length}:`, question.questionText);
            console.log('Question type:', question.type);
            console.log('Options:', question.options.map(opt => opt.text));
            
            const answerData = await getAnswerFromGemini(question.questionText, question.options, apiKey);
            console.log('Received answer for question:', answerData);
            
            await selectAnswer(question, answerData);
            answeredQuestions.add(question.element);
            console.log(`Successfully processed question ${index + 1}`);
        } catch (error) {
            console.error(`Error processing question ${index + 1}:`, error);
            console.error('Question details:', {
                text: question.questionText,
                type: question.type,
                optionsCount: question.options.length
            });
        }
    }
}

async function getAnswerFromGemini(question, options, apiKey) {
    try {
        const messages = [{
            role: "user",
            content: `Given the following multiple choice question and options, analyze and provide the most likely correct answer. Respond in the following format:
Answer: [option number]
Confidence: [percentage between 0-100]

Question: ${question}

Options:
${options.map((opt, idx) => `${idx + 1}. ${opt.text}`).join('\n')}`
        }];

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'makeApiCall',
                apiKey: apiKey,
                messages: messages
            }, response => {
                if (response.success) {
                    const data = response.data;
                    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                        console.error('Invalid API response:', data);
                        reject(new Error('Invalid response format from API'));
                        return;
                    }

                    const content = data.choices[0].message.content.trim();
                    const answerMatch = content.match(/Answer:\s*(\d+)/i);
                    const confidenceMatch = content.match(/Confidence:\s*(\d+)/i);

                    if (!answerMatch || !confidenceMatch) {
                        console.error('Invalid response format:', content);
                        reject(new Error('Invalid response format from AI'));
                        return;
                    }

                    const answerNumber = parseInt(answerMatch[1]);
                    const confidence = parseInt(confidenceMatch[1]);

                    if (isNaN(answerNumber) || answerNumber < 1 || answerNumber > options.length) {
                        console.error('Invalid answer number:', answerMatch[1]);
                        reject(new Error(`Invalid answer number: ${answerMatch[1]}`));
                        return;
                    }

                    if (isNaN(confidence) || confidence < 0 || confidence > 100) {
                        console.error('Invalid confidence score:', confidenceMatch[1]);
                        reject(new Error(`Invalid confidence score: ${confidenceMatch[1]}`));
                        return;
                    }

                    resolve({
                        answerIndex: answerNumber - 1,
                        confidence: confidence
                    });
                } else {
                    reject(new Error(response.error || 'API call failed'));
                }
            });
        });
    } catch (error) {
        console.error('Error getting answer from AI:', error);
        throw error;
    }
}

async function selectAnswer(question, answerData) {
    try {
        // Get the option element at the specified index
        const option = question.options[answerData.answerIndex];
        if (!option || !option.element) {
            console.error('Invalid option:', option);
            return;
        }

        // Store the confidence score
        questionConfidenceScores.set(question.element, answerData.confidence);

        try {
            // Try direct click
            option.element.click();
            console.log('Selected answer:', option.text, 'with confidence:', answerData.confidence + '%');
            
            // Add confidence indicator
            addConfidenceIndicator(option.element, answerData.confidence);
        } catch (e) {
            console.log('Direct click failed, trying alternative methods...');
            
            try {
                // Try finding and clicking the input element
                const input = option.element.querySelector('input') || 
                             option.element.querySelector('[role="radio"]') ||
                             option.element.querySelector('[role="checkbox"]');
                
                if (input) {
                    input.click();
                    console.log('Selected answer via input element');
                    addConfidenceIndicator(option.element, answerData.confidence);
                    return;
                }

                // Try synthetic event
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                option.element.dispatchEvent(clickEvent);
                console.log('Selected answer via synthetic event');
                addConfidenceIndicator(option.element, answerData.confidence);
            } catch (err) {
                console.error('All click attempts failed:', err);
            }
        }
    } catch (error) {
        console.error('Error selecting answer:', error);
    }
}

function addConfidenceIndicator(element, confidence) {
    // Remove any existing confidence indicators
    element.querySelectorAll('.confidence-indicator').forEach(el => el.remove());

    // Create confidence indicator element
    const indicator = document.createElement('div');
    indicator.className = 'confidence-indicator';
    
    // Set color based on confidence level
    let color;
    if (confidence >= 90) {
        color = '#2e7d32'; // Dark green for high confidence
    } else if (confidence >= 70) {
        color = '#1b5e20'; // Green for good confidence
    } else if (confidence >= 50) {
        color = '#f57c00'; // Orange for medium confidence
    } else {
        color = '#c62828'; // Red for low confidence
    }

    // Add the indicator to the element
    indicator.textContent = `${confidence}%`;
    indicator.style.cssText = `
        color: ${color};
        font-size: 12px;
        font-weight: bold;
        margin-left: 8px;
        display: inline-block;
    `;
    
    // Find the best place to insert the indicator
    const textContainer = element.querySelector('.docssharedWizToggleLabeledContent') || 
                         element.querySelector('.freebirdFormviewerComponentsQuestionRadioLabel') ||
                         element;
    textContainer.appendChild(indicator);
}

function reviewAnswers() {
    document.querySelectorAll('.ai-answer-highlight').forEach(el => {
        el.classList.remove('ai-answer-highlight');
    });

    answeredQuestions.forEach(questionElement => {
        const selectedOption = questionElement.querySelector('[aria-checked="true"], [data-value="true"], input:checked');
        if (selectedOption) {
            selectedOption.classList.add('ai-answer-highlight');
            
            // Add confidence indicator if it doesn't exist
            const confidence = questionConfidenceScores.get(questionElement);
            if (confidence && !selectedOption.querySelector('.confidence-indicator')) {
                addConfidenceIndicator(selectedOption, confidence);
            }
        }
    });

    if (!document.getElementById('ai-answer-styles')) {
        const style = document.createElement('style');
        style.id = 'ai-answer-styles';
        style.textContent = `
            .ai-answer-highlight {
                outline: 2px solid #1a73e8 !important;
                outline-offset: 2px;
                border-radius: 4px;
                transition: outline 0.3s ease;
            }
            .confidence-indicator {
                opacity: 0.9;
                transition: opacity 0.2s ease;
            }
            .confidence-indicator:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    return Promise.resolve();
} 