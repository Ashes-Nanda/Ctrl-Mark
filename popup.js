document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('api-key');
    const saveKeyButton = document.getElementById('save-key');
    const startSolvingButton = document.getElementById('start-solving');
    const reviewAnswersButton = document.getElementById('review-answers');
    const statusDiv = document.getElementById('status');
    const progressDiv = document.getElementById('progress');

    // Set default API key for Nebius AI
    const defaultApiKey = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlV6SXJWd1h0dnprLVRvdzlLZWstc0M1akptWXBvX1VaVkxUZlpnMDRlOFUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJnaXRodWJ8MTQwMTA2MzA1Iiwic2NvcGUiOiJvcGVuaWQgb2ZmbGluZV9hY2Nlc3MiLCJpc3MiOiJhcGlfa2V5X2lzc3VlciIsImF1ZCI6WyJodHRwczovL25lYml1cy1pbmZlcmVuY2UuZXUuYXV0aDAuY29tL2FwaS92Mi8iXSwiZXhwIjoxOTAyNjgyMjkzLCJ1dWlkIjoiYzljZWI4NmItZTBlMy00NmEyLTlmOWQtMjdjOWI5NjZkOWJmIiwibmFtZSI6InRleHQtdGV4dCIsImV4cGlyZXNfYXQiOiIyMDMwLTA0LTE3VDE4OjUxOjMzKzAwMDAifQ.Uwxx8s0bA7jMiO0zt7AQGRB5aIFZzErVt_wmVkqynwg";
    
    // Load saved API key or use default
    chrome.storage.local.get(['nebiusApiKey'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading API key:', chrome.runtime.lastError);
            showStatus('Error loading API key', 'error');
            return;
        }
        console.log('Loaded API key:', result.nebiusApiKey ? 'Present' : 'Not found');
        apiKeyInput.value = result.nebiusApiKey || defaultApiKey;
        validateApiKey(apiKeyInput.value);
    });

    // Save API key
    saveKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }

        chrome.storage.local.set({ nebiusApiKey: apiKey }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving API key:', chrome.runtime.lastError);
                showStatus('Error saving API key', 'error');
                return;
            }
            console.log('API key saved');
            validateApiKey(apiKey);
        });
    });

    // Start solving
    startSolvingButton.addEventListener('click', function() {
        console.log('Start solving clicked');
        chrome.storage.local.get(['nebiusApiKey'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error getting API key:', chrome.runtime.lastError);
                showStatus('Error getting API key', 'error');
                return;
            }

            const apiKey = result.nebiusApiKey || defaultApiKey;
            console.log('Using API key:', apiKey ? 'Present' : 'Not found');
            
            // Get the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (chrome.runtime.lastError) {
                    console.error('Error getting active tab:', chrome.runtime.lastError);
                    showStatus('Error getting active tab', 'error');
                    return;
                }

                if (!tabs || !tabs[0]) {
                    console.error('No active tab found');
                    showStatus('Error: No active tab found', 'error');
                    return;
                }

                console.log('Current tab:', tabs[0].url);
                if (tabs[0].url.includes('docs.google.com/forms')) {
                    startSolvingButton.disabled = true;
                    reviewAnswersButton.disabled = true;
                    showProgress();
                    
                    console.log('Sending message to content script');
                    try {
                        chrome.tabs.sendMessage(tabs[0].id, { 
                            action: 'startSolving',
                            apiKey: apiKey
                        }, function(response) {
                            if (chrome.runtime.lastError) {
                                console.error('Runtime error:', chrome.runtime.lastError);
                                showStatus('Error: ' + (chrome.runtime.lastError.message || 'Could not communicate with the form'), 'error');
                                startSolvingButton.disabled = false;
                                hideProgress();
                                return;
                            }

                            console.log('Received response:', response);
                            
                            if (response && response.status) {
                                showStatus(response.message || 'Successfully solved questions', 'success');
                                reviewAnswersButton.disabled = false;
                            } else {
                                const errorMessage = response && response.message 
                                    ? response.message 
                                    : 'Error: Could not start solving';
                                showStatus(errorMessage, 'error');
                            }
                            startSolvingButton.disabled = false;
                            hideProgress();
                        });
                    } catch (error) {
                        console.error('Error sending message:', error);
                        showStatus('Error: Could not communicate with the form', 'error');
                        startSolvingButton.disabled = false;
                        hideProgress();
                    }
                } else {
                    showStatus('Please open a Google Form first', 'error');
                }
            });
        });
    });

    // Review answers
    reviewAnswersButton.addEventListener('click', function() {
        console.log('Review answers clicked');
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (chrome.runtime.lastError) {
                console.error('Error getting active tab:', chrome.runtime.lastError);
                showStatus('Error getting active tab', 'error');
                return;
            }

            if (!tabs || !tabs[0]) {
                console.error('No active tab found');
                showStatus('Error: No active tab found', 'error');
                return;
            }

            if (tabs[0].url.includes('docs.google.com/forms')) {
                try {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'reviewAnswers'
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error('Runtime error:', chrome.runtime.lastError);
                            showStatus('Error: Could not review answers', 'error');
                            return;
                        }

                        console.log('Review response:', response);
                        if (response && response.status) {
                            showStatus('Answers highlighted for review', 'success');
                        } else {
                            showStatus('Error: Could not review answers', 'error');
                        }
                    });
                } catch (error) {
                    console.error('Error sending review message:', error);
                    showStatus('Error: Could not communicate with the form', 'error');
                }
            }
        });
    });

    function showStatus(message, type = 'info') {
        console.log('Status:', type, message);
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 3000);
    }

    function showProgress() {
        progressDiv.style.display = 'block';
        progressDiv.innerHTML = '<div class="progress-bar"></div>';
        const progressBar = progressDiv.querySelector('.progress-bar');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
            } else {
                width += 5;
                progressBar.style.width = width + '%';
            }
        }, 100);
    }

    function hideProgress() {
        progressDiv.style.display = 'none';
        progressDiv.innerHTML = '';
    }

    function validateApiKey(apiKey) {
        console.log('Validating API key');
        fetch('https://api.studio.nebius.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
                messages: [{
                    role: "user",
                    content: "Test"
                }],
                temperature: 0,
                max_tokens: 5
            })
        })
        .then(response => {
            console.log('Validation response:', response.status);
            if (response.ok) {
                showStatus('API key validated successfully!', 'success');
            } else {
                throw new Error('Invalid API key');
            }
        })
        .catch(error => {
            console.error('API validation error:', error);
            showStatus('Error validating API key. Please check and try again.', 'error');
        });
    }
}); 