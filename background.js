chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'makeApiCall') {
        fetch('https://api.studio.nebius.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.apiKey}`
            },
            body: JSON.stringify({
                model: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
                messages: request.messages,
                temperature: 0,
                max_tokens: 50,
                n: 1,
                stream: false
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error('API call error:', error);
            sendResponse({ 
                success: false, 
                error: error.message || 'Unknown error occurred'
            });
        });
        return true; // Required for async response
    }
}); 