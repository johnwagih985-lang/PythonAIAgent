// ============================================================================
// Global Utility Functions
// ============================================================================

/**
 * Escapes HTML characters in a string to prevent XSS.
 * @param {string} text The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {'success'|'error'|'info'|'warning'} type The type of toast (for styling and icon).
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn("Toast container not found. Falling back to alert:", message);
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.classList.add('toast-message', type);

    let iconClass = '';
    switch (type) {
        case 'success': iconClass = 'fas fa-check-circle'; break;
        case 'error': iconClass = 'fas fa-times-circle'; break;
        case 'warning': iconClass = 'fas fa-exclamation-triangle'; break;
        case 'info': default: iconClass = 'fas fa-info-circle'; break;
    }

    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Remove toast after 5 seconds (animation duration + display time)
    setTimeout(() => {
        toast.remove();
    }, 5000); // 0.5s for toastIn + 4s display + 0.5s for toastOut
}

/**
 * Plays a subtle UI sound effect.
 */
const playArrivalSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        masterGain.connect(audioCtx.destination);

        const playNote = (freq, start, duration) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
            osc.connect(masterGain);
            osc.start(audioCtx.currentTime + start);
            osc.stop(audioCtx.currentTime + start + duration);
        };

        // A light ascending tone (C5 -> E5 -> G5)
        playNote(523.25, 0, 0.1);
        playNote(659.25, 0.1, 0.1);
        playNote(783.99, 0.2, 0.5);
    } catch (e) {
        console.log("Audio playback blocked or not supported:", e);
    }
};

// ============================================================================
// Agent Page Specific Logic (Unified Chat Functionality)
// ============================================================================

// Common API Keys for all agents (assuming they are the same)
const COMMON_API_KEYS = [
    "sk-ed32202ab7cf4936593a205f4d504b9156937ff9a7227f49",
    "AIzaSyCLr5JjZ6uR7Tcd-_3w0ktYPJ2reWQKPx0",
    "AIzaSyCQxwripuo8fqicdLjb4Ido4FyAOnsPwW4",
    "AIzaSyD_kpvOqP9wbe8Q4-MvjHZK8RmXY6R_hRY", // This key is from ProgAgent
    "AIzaSyDD8hgGwFepp4qQYC6JF_mUzPYCJXtp6ZY", // This key is from ProblemAgent
    "AIzaSyFf9aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyGg8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyHh8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyIi8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyJj8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyKk8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyLl8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyMm8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyNn8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyOo8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyPp8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyQq8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyRr8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSySs8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyTt8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyUu8aF7zzzzzzzzzzzzzzzzzzz",
    "AIzaSyVv8aF7zzzzzzzzzzzzzzzzzzz"
];

/**
 * Highlights Python code with syntax coloring.
 * @param {string} code The Python code string.
 * @returns {string} HTML string with highlighted code.
 */
const highlightPython = (code) => {
    if (!code) return "";
    
    // مصفوفة القواعد المدمجة (دعم علامات الاقتباس الثلاثية، التعليقات، الكلمات المحجوزة، الدوال، الأرقام والعمليات)
    const combinedRegex = /("{3}[\s\S]*?"{3}|'{3}[\s\S]*?'{3}|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#.*)|\b(def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with|global|nonlocal|lambda|None|True|False|and|or|not|in|is|break|continue|pass|raise|async|await|del|assert|yield)\b|(\b(print|input|range|len|int|str|float|list|dict|set|tuple|open|type|sum|max|min|abs|round|help|enumerate|zip|sorted|reversed|any|all)\b)|(\b\d+\b)|(\b\w+)(?=\s*\()|(\+|\-|\*|\/|\%|\=|\=\=|\!\=|\<|\>|\<\=|\>\=|\&|\||\^|\~|\!)/g;

    let lastIndex = 0;
    let html = "";
    let match;

    while ((match = combinedRegex.exec(code)) !== null) {
        // إضافة النص العادي قبل التطابق مع تحويله لـ HTML آمن
        html += escapeHtml(code.substring(lastIndex, match.index));

        const [full, string, comment, keyword, builtin, builtinName, number, func, operator] = match;

        if (string) html += `<span class="string">${escapeHtml(full)}</span>`;
        else if (comment) html += `<span class="comment">${escapeHtml(full)}</span>`;
        else if (keyword) html += `<span class="keyword">${escapeHtml(full)}</span>`;
        else if (builtin) html += `<span class="function">${escapeHtml(full)}</span>`;
        else if (number) html += `<span class="number">${escapeHtml(full)}</span>`;
        else if (func) html += `<span class="function">${escapeHtml(full)}</span>`;
        else if (operator) html += `<span class="operator">${escapeHtml(full)}</span>`;
        
        lastIndex = combinedRegex.lastIndex;
    }

    // إضافة الجزء المتبقي من النص
    html += escapeHtml(code.substring(lastIndex));
    return html;
};

const updateEditorHighlighting = (textarea) => {
    return; // تم تعطيل طبقة التلوين بناءً على طلب المستخدم
    const container = textarea.parentElement;
    let backdrop = container.querySelector('.highlight-backdrop');

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'highlight-backdrop';
        container.prepend(backdrop);
    }

    // مزامنة التمرير والنص
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
    
    let content = textarea.value;
    // إضافة مسافة في النهاية لمعالجة القفزة عند سطر جديد
    if (content[content.length - 1] === "\n") content += " ";
    
    backdrop.innerHTML = highlightPython(content);
};

/**
 * Initializes the chat functionality for an agent page.
 * @param {object} config Configuration object for the agent.
 * @param {string} config.systemPrompt The system instruction for the AI.
 * @param {string} config.chatHistoryKey The localStorage key for chat history.
 * @param {string} config.apiKeyStateKey The localStorage key for API key state.
 * @param {Array<string>} config.apiKeys The array of API keys to use.
 * @param {Function} [config.codeHighlighter=null] Optional function to highlight code.
 * @param {boolean} [config.disableTypingEffectForCode=false] If true, code is rendered instantly.
 */
function initializeChatAgent(config) {
    const SYSTEM_PROMPT = config.systemPrompt;
    const chatHistoryKey = config.chatHistoryKey;
    const apiKeyStateKey = config.apiKeyStateKey;
    const API_KEYS = config.apiKeys;
    const codeHighlighter = config.codeHighlighter || null;
    const disableTypingEffectForCode = config.disableTypingEffectForCode || false;

    const typing_form = document.querySelector('.typing_form');
    const chat_list = document.querySelector('.chat_list');

    let chatHistory = JSON.parse(localStorage.getItem(chatHistoryKey)) || [];
    let keyState = JSON.parse(localStorage.getItem(apiKeyStateKey)) || {
        currentIndex: 0,
        usageCount: 0,
        maxUsagePerKey: 10
    };

    let userMessage = ""; // Declare userMessage in a scope accessible by handleOutGoingChat and generateAPIResponse

    const API_BASE_URL = 'https://soal.help/api/v1/chat/completions';

    const getCurrentAPIKey = () => 'sk-ed32202ab7cf4936593a205f4d504b9156937ff9a7227f49';
    const getAPI_URL = () => API_BASE_URL;

    const rotateKey = () => {
        keyState.usageCount++;
        if (keyState.usageCount >= keyState.maxUsagePerKey) {
            keyState.currentIndex = (keyState.currentIndex + 1) % API_KEYS.length;
            keyState.usageCount = 0;
        }
        localStorage.setItem(apiKeyStateKey, JSON.stringify(keyState));
        console.log(`Using key index: ${keyState.currentIndex}, usage: ${keyState.usageCount}/${keyState.maxUsagePerKey}`);
    };

    const showTypingEffect = (text, textElement) => {
        const words = text.split(' ');
        let currentWordIndex = 0;
        const typingInterval = setInterval(() => {
            textElement.innerHTML += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
            if (currentWordIndex === words.length) {
                clearInterval(typingInterval);
            }
            window.scrollTo(0, chat_list.scrollHeight);
        }, 75);
    };

    const saveChatHistory = () => {
        localStorage.setItem(chatHistoryKey, JSON.stringify(chatHistory));
    };

    let selectedMessages = new Set();

    const toggleMessageSelection = (index, checkbox) => {
        if (checkbox.checked) {
            selectedMessages.add(index);
        } else {
            selectedMessages.delete(index);
        }
        updateDeleteButtonVisibility();
    };

    const deleteSelectedMessages = () => {
        if (selectedMessages.size === 0) return;
        const indicesToDelete = Array.from(selectedMessages).sort((a, b) => b - a);
        indicesToDelete.forEach(index => {
            chatHistory.splice(index, 1);
        });
        renderChatHistory(); // Re-render to update indices and display
        selectedMessages.clear();
        saveChatHistory();
        updateDeleteButtonVisibility();
    };

    const updateDeleteButtonVisibility = () => {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        if (deleteBtn) {
            if (selectedMessages.size > 0) {
                deleteBtn.classList.add('visible');
                deleteBtn.textContent = `حذف الرسائل المحددة (${selectedMessages.size})`;
            } else {
                deleteBtn.classList.remove('visible');
            }
        }
    };

    const renderChatHistory = () => {
        chat_list.innerHTML = ''; // Clear existing messages before re-rendering
        chatHistory.forEach((msg, index) => {
            const date = new Date(msg.timestamp);
            const timeStr = date.toLocaleString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            let messageTextContent = msg.text;
            if (!msg.isOutgoing && codeHighlighter) {
                messageTextContent = codeHighlighter(msg.text);
            }

            const html = msg.isOutgoing ? `
                <div class="message_content">
                    <img src="Images/user.png" alt="">
                    <p class="text">${messageTextContent}</p>
                </div>
            ` : `
                <div class="message_content">
                    <img src="Images/robot1.png" alt="">
                    <p class="text">${messageTextContent}</p>
                    <div class="message_time">${timeStr}</div>
                </div>
            `;

            const div = document.createElement('div');
            div.classList.add('message', msg.isOutgoing ? 'outgoing' : 'incoming');
            div.innerHTML = html +
                `<input type="checkbox" class="delete_checkbox" data-index="${index}" onClick="toggleMessageSelection(${index}, this)">` +
                '<span onClick="copyMessage(this)" class="material-symbols-outlined">content_copy</span>';
            chat_list.appendChild(div);
        });
        window.scrollTo(0, chat_list.scrollHeight);
    };

    const generateAPIResponse = async (div) => {
        const textElement = div.querySelector('.text');
        const checkbox = div.querySelector('.delete_checkbox');

        try {
            const response = await fetch(getAPI_URL(), {
                method: 'POST',
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${getCurrentAPIKey()}`
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-6",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            let apiResponse = data?.choices[0]?.message?.content;

            // Clean up markdown for code agent
            if (codeHighlighter) {
                apiResponse = apiResponse.replace(/```python|```/g, '').trim();
            }
            apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markdown

            chatHistory.push({
                text: apiResponse,
                isOutgoing: false,
                timestamp: Date.now()
            });
            const botMessageIndex = chatHistory.length - 1;

            if (checkbox) {
                checkbox.setAttribute('data-index', botMessageIndex);
                checkbox.onclick = () => toggleMessageSelection(botMessageIndex, checkbox);
            }

            saveChatHistory();

            if (codeHighlighter && disableTypingEffectForCode) {
                textElement.innerHTML = codeHighlighter(apiResponse);
                window.scrollTo(0, chat_list.scrollHeight);
            } else {
                showTypingEffect(apiResponse, textElement);
            }
            console.log(apiResponse);

            rotateKey();

        } catch (error) {
            console.error("API Response Error:", error);
            textElement.innerHTML = `<span style="color: var(--warning);">حدث خطأ: ${error.message}. يرجى المحاولة مرة أخرى.</span>`;
            rotateKey(); // Rotate key even on error
        } finally {
            div.classList.remove('loading');
        }
    };

    const copyMessage = (copy_btn) => {
        const messageText = copy_btn.parentElement.querySelector('.text').innerText;
        navigator.clipboard.writeText(messageText).then(() => {
            copy_btn.classList.add('copied');
            copy_btn.innerText = "check";

            let tooltip = copy_btn.parentElement.querySelector('.copy-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('span');
                tooltip.className = 'copy-tooltip';
                tooltip.innerText = 'تم النسخ!';
                copy_btn.parentElement.appendChild(tooltip);
            }
            
            setTimeout(() => tooltip.classList.add('show'), 10);
            
            setTimeout(() => {
                copy_btn.innerText = "content_copy";
                copy_btn.classList.remove('copied');
                tooltip.classList.remove('show');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const showLoading = () => {
        const tempIndex = chatHistory.length; // Placeholder index
        const html = `
            <div class="message_content">
                <img src="Images/robot1.png" alt="">
                <p class="text"></p>
                <div class="loading_indicator">
                    <div class="loading_bar"></div>
                    <div class="loading_bar"></div>
                    <div class="loading_bar"></div>
                </div>
            </div>
            <input type="checkbox" class="delete_checkbox" data-index="${tempIndex}" onClick="toggleMessageSelection(${tempIndex}, this)">
            <span onClick="copyMessage(this)" class="material-symbols-outlined">
                content_copy
            </span>
        `;
        const div = document.createElement('div');
        div.classList.add('message', 'incoming', 'loading');
        div.innerHTML = html;

        chat_list.appendChild(div);
        window.scrollTo(0, chat_list.scrollHeight);

        generateAPIResponse(div);
    };

    const handleOutGoingChat = () => {
        const typingInput = document.querySelector('.typing_input');
        userMessage = typingInput.value.trim();

        if (!userMessage) return;

        chatHistory.push({
            text: userMessage,
            isOutgoing: true,
            timestamp: Date.now()
        });
        saveChatHistory();

        const messageIndex = chatHistory.length - 1;

        const html = `
            <div class="message_content">
                <img src="Images/user.png" alt="">
                <p class="text">${userMessage}</p>
            </div>
            <input type="checkbox" class="delete_checkbox" data-index="${messageIndex}" onClick="toggleMessageSelection(${messageIndex}, this)">
        `;

        const div = document.createElement('div');
        div.classList.add('message', 'outgoing');
        div.innerHTML = html;

        chat_list.appendChild(div);
        typing_form.reset();
        window.scrollTo(0, chat_list.scrollHeight);
        setTimeout(showLoading, 500);
    };

    // Attach event listeners
    typing_form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleOutGoingChat();
    });

    // Make toggleMessageSelection and deleteSelectedMessages globally accessible for inline onClick
    window.toggleMessageSelection = toggleMessageSelection;
    window.deleteSelectedMessages = deleteSelectedMessages;
    window.copyMessage = copyMessage;

    // Initial render
    renderChatHistory();
}


// ============================================================================
// Content Page Specific Logic (from content.html script block)
// ============================================================================

let currentTab = 'lessons';
let pyodideInstance = null;
let isPyodideLoading = false;
let pendingCodeContent = null;
let interruptBuffer = null;
window.currentOutputId = ''; // Global variable to hold the ID of the current output element

if (typeof SharedArrayBuffer !== "undefined") {
    interruptBuffer = new Int32Array(new SharedArrayBuffer(4));
}

async function getPyodide() {
    if (pyodideInstance) return pyodideInstance;
    if (isPyodideLoading) {
        while (isPyodideLoading) await new Promise(resolve => setTimeout(resolve, 100));
        return pyodideInstance;
    }
    isPyodideLoading = true;
    try {
        const py = await loadPyodide();
        if (interruptBuffer) {
            py.setInterruptBuffer(interruptBuffer);
        }
        await py.runPythonAsync(`
import sys
import builtins

from js import window

def custom_input(prompt=""):
    if prompt:
        sys.stdout.write(prompt) # Write the prompt to the output stream
    return window.prompt(prompt) # Use browser's synchronous prompt

builtins.input = custom_input

class OutputCapture:
    def __init__(self):
        pass # No longer buffering, output directly
    def write(self, text):
        window.appendToOutput(text, window.currentOutputId) # Stream output live
    def flush(self):
        pass # No-op for direct streaming

_capture = OutputCapture()
sys.stdout = _capture
sys.stderr = _capture
        `);
        pyodideInstance = py;
    } catch (e) {
        console.error("Pyodide failed to load", e);
    } finally {
        isPyodideLoading = false;
    }
    return pyodideInstance;
}

function runModalCodeContent() {
    runPythonCodeLanding('modal');
}

function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            showContent(currentTab);
        });
    });
}

function showContent(tab) {
    document.querySelectorAll('.lesson-content').forEach(content => {
        content.classList.remove('active');
    });

    const contentId = tab === 'lessons' ? 'lesson-variables' :
                      tab === 'examples' ? 'examples-content' : 'tasks-content';
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.add('active');
    }
}

function showLesson(lesson, setActive = false) {
    document.querySelectorAll('.lesson-content').forEach(content => {
        content.classList.remove('active');
    });
    const lessonId = lesson === 'variable-types' ? 'lesson-variable-types' : (lesson === 'operators' ? 'lesson-operators' : (lesson === 'data-types' ? 'lesson-data-types' : (lesson === 'functions' ? 'lesson-functions' : (lesson === 'conditions' ? 'lesson-conditions' : (lesson === 'loops' ? 'lesson-loops' : 'lesson-' + lesson)))));
    const lessonElement = document.getElementById(lessonId);
    if (lessonElement) {
        document.querySelectorAll('.lesson-content').forEach(c => c.classList.remove('active'));
        lessonElement.classList.add('active');
    }

    if (lesson === 'data-types') {
        switchDataTypeTab('numbers');
    }

    document.querySelectorAll('.lesson-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.lesson-item[data-lesson="${lesson}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function switchDataTypeTab(tabName) {
    document.querySelectorAll('.data-type-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-' + tabName).classList.add('active');

    document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--text-secondary)';
    });

    const activeBtn = document.querySelector(`.tabs-header .tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = 'rgba(0,217,255,0.15)';
        activeBtn.style.borderColor = 'var(--accent)';
        activeBtn.style.color = 'var(--accent)';
    }
}

async function openInterpreterContent() {
    const modal = document.getElementById('interpreter-modal');
    if (!modal) return;
    modal.classList.add('active');

    const modalElement = modal.querySelector('.modal');
    if (window.innerWidth < 768 && !modalElement.classList.contains('fullscreen')) {
        toggleFullscreen('interpreter-modal');
    }

    const output = document.getElementById('output-content-modal');
    if (!pyodideInstance && !isPyodideLoading) {
        if (output) output.innerHTML = '<div style="color: #f59e0b;">⏳ جارٍ تحميل بيئة Python...</div>';
        await getPyodide();
    }

    if (pyodideInstance) {
        if (output && output.innerText.includes('⏳')) {
            output.innerHTML = '<div style="color: #64748b;">اضغط "تشغيل" لرؤية النتيجة</div>';
        }
        if (pendingCodeContent) {
            runModalCodeContent();
            pendingCodeContent = null;
        }
    } else if (output) {
        output.innerHTML = '<div style="color: #ef4444;">❌ فشل تحميل بيئة بايثون. يرجى التحقق من اتصالك بالإنترنت.</div>';
    }

    // Load and apply saved font size
    const savedFontSize = localStorage.getItem('interpreterFontSize') || '14px'; // Default to 14px
    const fontSizeSelect = document.getElementById('font-size-select-modal');
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
    }
    changeInterpreterFontSize(savedFontSize, 'modal'); // Apply the size
}

function closeInterpreterContent() {
    const modal = document.getElementById('interpreter-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function runCodeContent(btn) {
    const codeBlock = btn.closest('.code-block');
    const codeLines = codeBlock.querySelectorAll('.line-content');
    let code = '';
    codeLines.forEach(line => {
        code += line.textContent + '\n';
    });

    const codeInput = document.getElementById('code-input-modal');
    if (codeInput) {
        codeInput.value = code;
        updateEditorHighlighting(codeInput);
    }

    openInterpreterContent();
}

function copyCodeContent(btn) {
    const codeBlock = btn.closest('.code-block');
    const codeLines = codeBlock.querySelectorAll('.line-content');
    let code = '';
    codeLines.forEach(line => {
        code += line.textContent + '\n';
    });

    navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
        setTimeout(() => btn.innerHTML = originalText, 3000);
    });
}

// Helper for quiz functions
function processQuizSubmission(quizFormId, totalQuestions, resultDivId) {
    let score = 0;
    let results = [];

    for (let i = 1; i <= totalQuestions; i++) {
        const selected = document.querySelector(`#${quizFormId} input[name="q${i}"]:checked`);

        if (selected) {
            if (selected.value === 'correct') {
                score++;
                results.push(`س${i}: ✓ صحيح`);
            } else {
                results.push(`س${i}: ✗ خطأ`);
            }
        } else {
            results.push(`س${i}: ⚠ لم يتم الإجابة`);
        }
    }

    const percentage = (score / totalQuestions) * 100;
    let gradeColor = '#ef4444';
    let gradeText = 'تحتاج مراجعة';

    if (percentage >= 80) {
        gradeColor = '#10b981';
        gradeText = 'ممتاز!';
    } else if (percentage >= 60) {
        gradeColor = '#f59e0b';
        gradeText = 'جيد';
    } else if (percentage >= 40) {
        gradeColor = '#f97316';
        gradeText = 'مقبول';
    }

    const resultDiv = document.getElementById(resultDivId);
    resultDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 20px; border-radius: 15px; border: 2px solid ${gradeColor};">
            <h3 style="color: ${gradeColor}; font-size: 1.5rem; margin-bottom: 15px;">${gradeText}</h3>
            <div style="font-size: 2.5rem; font-weight: bold; color: ${gradeColor}; margin-bottom: 10px;">${score} / ${totalQuestions}</div>
            <p style="color: #94a3b8; font-size: 1rem; margin-bottom: 15px;">الدرجة: ${percentage}%</p>
            <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: right; font-size: 0.85rem; color: #cbd5e1;">
                ${results.join('<br>')}
            </div>
        </div>
    `;
}

// Quiz functions (exposed globally for inline HTML event handlers)
function submitQuizVariables() { processQuizSubmission('quiz-form-variables', 5, 'quiz-result-variables'); }
function submitQuizVariableTypes() { processQuizSubmission('quiz-form-variable-types', 7, 'quiz-result-variable-types'); }
function submitQuizOperators() { processQuizSubmission('quiz-form-operators', 8, 'quiz-result-operators'); }
function submitQuizNumbers() { processQuizSubmission('quiz-form-numbers', 5, 'quiz-result-numbers'); }
function submitQuizStrings() { processQuizSubmission('quiz-form-strings', 5, 'quiz-result-strings'); }
function submitQuizLists() { processQuizSubmission('quiz-form-lists', 5, 'quiz-result-lists'); }
function submitQuizTuples() { processQuizSubmission('quiz-form-tuples', 5, 'quiz-result-tuples'); }
function submitQuizSets() { processQuizSubmission('quiz-form-sets', 5, 'quiz-result-sets'); }
function submitQuizDicts() { processQuizSubmission('quiz-form-dicts', 5, 'quiz-result-dicts'); }
function submitQuizFunctions() { processQuizSubmission('quiz-form-functions', 5, 'quiz-result-functions'); }
function submitQuizConditions() { processQuizSubmission('quiz-form-conditions', 5, 'quiz-result-conditions'); }
function submitQuizLoops() { processQuizSubmission('quiz-form-loops', 5, 'quiz-result-loops'); }

// ============================================================================
// Landing Page Specific Logic (from landing-script.js)
// ============================================================================

let pendingCodeLanding = null;

// Problem Solver Functions
function openProblemSolver() {
    document.getElementById('problem-solver-modal').classList.add('active');
}

function closeProblemSolver() {
    document.getElementById('problem-solver-modal').classList.remove('active');
}

function handleProblemKeyPress(event) {
    if (event.key === 'Enter') {
        sendToProblemSolver();
    }
}

function sendToProblemSolver() {
    const input = document.getElementById('problem-input');
    const message = input.value.trim();
    if (!message) return;

    addMessageToChat('problem-solver-chat', message, 'user');
    input.value = '';

    setTimeout(() => {
        const response = analyzeProblem(message);
        addMessageToChat('problem-solver-chat', response, 'bot');
    }, 500);
}

function analyzeProblem(problem) {
    const responses = [
        `<strong>تحليل المشكلة:</strong><br><br>
        <p>سأقوم بتحليل مشكلتك "${problem}" خطوة بخطوة:</p>
        <ol>
            <li><strong>فهم المدخلات:</strong> تحديد القيم المتاحة</li>
            <li><strong>فهم المخرجات:</strong> تحديد النتيجة المتوقعة</li>
            <li><strong>تحديد العمليات:</strong> تحديد الخطوات الحسابية أو المنطقية المطلوبة</li>
            <li><strong>كتابة الخوارزمية:</strong> وضع خطة الحل</li>
        </ol>
        <p>هل تريد أن أكتب لك الكود مباشرة؟</p>`,

        `<strong>مرحباً!</strong><br><br>
        <p>لمشكلة "${problem}" سأقترح عليك هذا الحل:</p>
        <ol>
            <li>فهم المشكلة بشكل كامل</li>
            <li>تقسيم المشكلة إلى أجزاء أصغر</li>
            <li>كتابة دالة لكل جزء</li>
            <li>تجميع الأجزاء معاً</li>
        </ol>
        <p>هل تحتاج مساعدة في كتابة الكود؟</p>`,

        `<strong>إليك تحليل تفصيلي:</strong><br><br>
        <p>لمعالجة "${problem}" اتبع الخطوات التالية:</p>
        <ul>
            <li>📥 <strong>المدخلات:</strong> حدد البيانات المتاحة</li>
            <li>⚙️ <strong>المعالجة:</strong> طبق العمليات المطلوبة</li>
            <li>📤 <strong>المخرجات:</strong> اعرض النتيجة</li>
        </ul>
        <p>هل تريد أن أساعدك في كتابة كود بايثون؟</p>`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

// Code Agent Functions
function openCodeAgent() {
    document.getElementById('code-agent-modal').classList.add('active');
}

function closeCodeAgent() {
    document.getElementById('code-agent-modal').classList.remove('active');
}

function handleCodeRequestKeyPress(event) {
    if (event.key === 'Enter') {
        sendToCodeAgent();
    }
}

function sendToCodeAgent() {
    const input = document.getElementById('code-request-input');
    const message = input.value.trim();
    if (!message) return;

    addMessageToChat('code-agent-chat', message, 'user');
    input.value = '';

    setTimeout(() => {
        const codeResponse = generateCode(message);
        addMessageToChat('code-agent-chat', codeResponse, 'bot');
    }, 800);
}

function generateCode(request) {
    let code = '';
    let explanation = '';

    const lowerRequest = request.toLowerCase();

    if (lowerRequest.includes('جمع') || lowerRequest.includes('sum')) {
        code = `def sum_numbers(a, b):
    """دالة لجمع عددين"""
    return a + b

# مثال على الاستخدام
result = sum_numbers(5, 3)
print(f"النتيجة: {result}")`;
        explanation = '📝 <strong>الكود المطلوب:</strong><br><br>هذه دالة لجمع عددين:<br><pre><code>' + code + '</code></pre><br><p>يمكنك نسخ هذا الكود وتشغيله في مترجم بايثون.</p>';
    }
    else if (lowerRequest.includes('قائمة') || lowerRequest.includes('array') || lowerRequest.includes('list')) {
        code = `# إنشاء قائمة
my_list = [1, 2, 3, 4, 5]

# إضافة عنصر
my_list.append(6)

# طباعة القائمة
print(my_list)

# الوصول لعنصر
print(my_list[0])`;
        explanation = '📝 <strong>كود إدارة القوائم:</strong><br><br><pre><code>' + code + '</code></pre><br><p>شرح:</p><ul><li>إنشاء قائمة</li><li>إضافة عنصر</li><li>طباعة</li><li>الوصول لعنصر</li></ul>';
    }
    else if (lowerRequest.includes('حلقة') || lowerRequest.includes('loop') || lowerRequest.includes('for')) {
        code = `# حلقة for
for i in range(5):
    print(f"الرقم: {i}")

# حلقة while
count = 0
while count < 5:
    print(f"العد: {count}")
    count += 1`;
        explanation = '📝 <strong>كود الحلقات:</strong><br><br><pre><code>' + code + '</code></pre><br><p>شرح:</p><ul><li>حلقة for للتكرار محدد</li><li>حلقة while للتكرار غير المحدد</li></ul>';
    }
    else if (lowerRequest.includes('دالة') || lowerRequest.includes('function')) {
        code = `def greet(name):
    """دالة للترحيب"""
    return f"مرحباً {name}!"

# استخدام الدالة
message = greet("أحمد")
print(message)`;
        explanation = '📝 <strong>كود دالة:</strong><br><br><pre><code>' + code + '</code></pre><br><p>شرح:</p><ul><li>def لتعريف الدالة</li><li>المعاملات داخل الأقواس</li><li>return لإرجاع القيمة</li></ul>';
    }
    else {
        code = `# مثال عام
print("مرحباً بك في بايثون!")

# متغير
x = 10
y = 20

# عملية
result = x + y
print(f"الجمع: {result}")`;
        explanation = '📝 <strong>كود بايثون عام:</strong><br><br><pre><code>' + code + '</code></pre><br><p>هل تريد كوداً أكثر تحديداً؟ أخبرني بماذا تحتاج!</p>';
    }

    return explanation;
}

// AI Assistant Functions
function openAIAssistant() {
    document.getElementById('ai-assistant-modal').classList.add('active');
}

function closeAIAssistant() {
    document.getElementById('ai-assistant-modal').classList.remove('active');
}

function handleAssistantKeyPress(event) {
    if (event.key === 'Enter') {
        sendToAssistant();
    }
}

function sendToAssistant() {
    const input = document.getElementById('assistant-input');
    const message = input.value.trim();
    if (!message) return;

    addMessageToChat('ai-assistant-chat', message, 'user');
    input.value = '';

    setTimeout(() => {
        const response = generateAssistantResponse(message);
        addMessageToChat('ai-assistant-chat', response, 'bot');
    }, 600);
}

function generateAssistantResponse(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('بايثون') || lowerQuestion.includes('python')) {
        return `<strong>بايثون</strong> هي لغة برمجة عالية المستوى، تتميز بـ:<br><br>
        <ul>
            <li>✅ سهولة التعلم والقراءة</li>
            <li>✅ مكتبات قوية ومتنوعة</li>
            <li>✅ متعددة الاستخدامات (ويب، بيانات، ذكاء اصطناعي)</li>
            <li>✅ مجتمع كبير ونشط</li>
        </ul>
        <p>هل تريد معرفة المزيد عن موضوع محدد في بايثون؟</p>`;
    }
    else if (lowerQuestion.includes('متغير') || lowerQuestion.includes('variable')) {
        return `<strong>المتغيرات</strong> في بايثون هي حاويات لتخزين البيانات:<br><br>
        <pre><code># أمثلة على المتغيرات
name = "أحمد"      # نص
age = 25           # رقم
height = 1.75      # عشري
is_student = True  # منطقي</code></pre>
        <p>لا تحتاج لتحديد نوع المتغير، بايثون تتعرف عليه تلقائياً!</p>`;
    }
    else if (lowerQuestion.includes('مرحب') || lowerQuestion.includes('اهلاً')) {
        return `<strong>أهلاً بك!</strong> 🤖<br><br>
        <p>يسعدني مساعدتك. يمكنك سؤالي عن:</p>
        <ul>
            <li>مفاهيم برمجية</li>
            <li>حل المشاكل</li>
            <li>كتابة أكواد</li>
            <li>أي شيء آخر!</li>
        </ul>`;
    }
    else {
        return `<strong>شكراً لسؤالك!</strong><br><br>
        <p>"${question}"</p>
        <p>سأكون سعيداً بمساعدتك في هذا الموضوع. يمكنك:</p>
        <ul>
            <li>طلب كود بايثون محدد</li>
            <li>طرح سؤال برمجي</li>
            <li>طلب شرح مفصل</li>
        </ul>
        <p>ما الذي تريد معرفته بالضبط؟</p>`;
    }
}

// Python Interpreter Functions
function openPythonInterpreterLanding() {
    const modalContainer = document.getElementById('interpreter-modal-landing');
    modalContainer.classList.add('active');

    const modalElement = modalContainer.querySelector('.modal');
    if (window.innerWidth < 768 && !modalElement.classList.contains('fullscreen')) {
        toggleFullscreen('interpreter-modal-landing');
    }

    initPyodideLanding();
}

function closePythonInterpreterLanding() {
    document.getElementById('interpreter-modal-landing').classList.remove('active');
}

async function initPyodideLanding() {
    if (pyodideInstance) return pyodideInstance;
    
    const outputId = 'output-content-landing';
    appendOutput('loading', 'جاري تحميل مترجم بايثون...', outputId);
    const py = await getPyodide();
    
    if (py) {
        appendOutput('success', '✅ تم تحميل مترجم بايثون بنجاح!', outputId);
        if (pendingCodeLanding) {
            runPythonCodeLanding('landing');
            pendingCodeLanding = null;
        }
    } else {
        appendOutput('error', '❌ خطأ في تحميل المترجم. يرجى المحاولة مرة أخرى.', outputId);
    }

    // Load and apply saved font size for landing interpreter
    const savedFontSize = localStorage.getItem('interpreterFontSize') || '14px'; // Default to 14px
    const fontSizeSelect = document.getElementById('font-size-select-landing'); // Assuming this ID for landing page
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
    }
    changeInterpreterFontSize(savedFontSize, 'landing'); // Apply the size
}

async function runPythonCodeLanding(suffix) {
    const inputId = 'code-input-' + suffix;
    const outputId = 'output-content-' + suffix;
    const outputContainerId = 'interpreter-output-' + suffix;
    const modalId = suffix === 'landing' ? 'interpreter-modal-landing' : 'interpreter-modal';
    const modal = document.getElementById(modalId);
    const stopBtn = modal.querySelector('.stop-btn');
    const runBtn = modal.querySelector('.run-btn');

    window.currentOutputId = outputId; // Set the current output ID for live streaming
    const outputElement = document.getElementById(outputId);
    // مسح المخرجات السابقة فور الضغط على زر التشغيل
    if (outputElement) outputElement.innerHTML = '';

    const code = document.getElementById(inputId).value;
    if (!code.trim()) {
        appendOutput('warning', 'الرجاء إدخال كود أولاً', outputId);
        return;
    }

    const outputContainer = document.getElementById(outputContainerId);
    const collapseBtn = modal.querySelector('.collapse-output-btn');

    if (outputContainer && outputContainer.classList.contains('collapsed')) {
        outputContainer.classList.remove('collapsed');
        if (collapseBtn) collapseBtn.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء النتائج';
    }
    
    // إظهار رسالة تحميل إذا لم يكن المترجم جاهزاً بعد
    if (!pyodideInstance && !isPyodideLoading) {
        appendOutput('loading', '⏳ جاري تهيئة بيئة بايثون... يرجى الانتظار ثوانٍ قليلة.', outputId);
    }

    const py = await getPyodide();
    if (!py) {
        appendOutput('error', '❌ فشل تحميل المترجم. يرجى التحقق من اتصال الإنترنت.', outputId);
        return;
    }

    const startTime = performance.now();

    outputElement.innerHTML += `<span style="color: #f59e0b;">⏳ جارٍ التنفيذ...</span>\n`;
    outputElement.scrollTop = outputElement.scrollHeight;
    if (runBtn) runBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';

    try {
        // No need to clear _capture as it's streaming directly now
        if (interruptBuffer) interruptBuffer[0] = 0;
        await py.runPythonAsync(code);
        const endTime = performance.now();
        const elapsed = (endTime - startTime).toFixed(1);
        appendOutput('info', `⏱️ تم التنفيذ في ${elapsed} مللي ثانية`, outputId);

    } catch (err) {
        const endTime = performance.now();
        const elapsed = (endTime - startTime).toFixed(1);
        appendOutput('error', '❌ خطأ: ' + err.message, outputId);
        appendOutput('info', `⏱️ فشل التنفيذ في ${elapsed} مللي ثانية`, outputId);
    } finally {
        if (runBtn) runBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';
    }
}

/**
 * Appends text directly to the output element without additional formatting.
 * Used for live streaming of stdout/stderr.
 */
function appendToOutput(text, outputId) {
    const output = document.getElementById(outputId);
    if (!output) return;
    output.appendChild(document.createTextNode(text));
    output.scrollTop = output.scrollHeight;
}
window.appendToOutput = appendToOutput; // Expose globally for Pyodide

function clearOutputLanding(suffix) {
    const outputElement = document.getElementById('output-content-' + suffix);
    outputElement.innerHTML = '<pre># مترجم بايثون - ابدأ الكتابة أدناه\n\n</pre>';
    const codeInput = document.getElementById('code-input-' + suffix);
    if (codeInput) {
        codeInput.value = '';
        updateEditorHighlighting(codeInput);
        updateLineNumbers(codeInput, 'line-numbers-' + suffix);
    }
}

function handleInterpreterKeyDownLanding(event, suffix) {
    if (event.key === 'Enter' && event.ctrlKey) {
        runPythonCodeLanding(suffix);
        event.preventDefault();
    }
}

function updateLineNumbersLanding(textarea, lineNumbersId) {
    const lines = textarea.value.split('\n').length;
    const lineNumbers = document.getElementById(lineNumbersId);
    lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
}

// Utility Functions (Landing Page - Chat-like modals)
function addMessageToChat(chatId, message, sender) {
    const chatMessages = document.querySelector(`#${chatId} .chat-messages`);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Modify appendOutput to accept outputElementId directly
function appendOutput(type, message, outputElementId) {
    const output = document.getElementById(outputElementId);
    if (!output) {
        console.error(`Output element with ID ${outputElementId} not found.`);
        return;
    }
    let color = '';

    // إذا كان النوع 'raw'، قم بإضافة المحتوى مباشرة دون تغليفه بـ span
    if (type === 'raw') {
        output.innerHTML += message + '\n';
        output.scrollTop = output.scrollHeight;
        return;
    }

    // الأنواع الأخرى يتم تغليفها بـ span مع اللون المناسب
    switch(type) {
        case 'error': color = '#ff6b6b'; break;
        case 'success': color = '#00ff88'; break;
        case 'warning': color = '#ffd93d'; break;
        case 'loading': color = '#00aaff'; break;
        case 'info': color = '#64748b'; break;
        default: color = '#e0e0e0';
    }

    output.innerHTML += `<span style="color: ${color}">${message}</span>\n`;
    output.scrollTop = output.scrollHeight;
}

/**
 * Changes the font size of the interpreter's code input and output areas.
 * @param {string} size The CSS font-size value (e.g., '12px', '16px').
 * @param {string} suffix The suffix for the element IDs (e.g., 'modal', 'landing').
 */
function changeInterpreterFontSize(size, suffix) {
    const codeInput = document.getElementById('code-input-' + suffix);
    const outputContent = document.getElementById('output-content-' + suffix);
    const highlightBackdrop = document.getElementById('highlight-' + suffix);

    if (codeInput) codeInput.style.fontSize = size;
    if (outputContent) outputContent.style.fontSize = size;
    if (highlightBackdrop) highlightBackdrop.style.fontSize = size;

    // Save preference to localStorage
    localStorage.setItem('interpreterFontSize', size);
}

/**
 * Resets the interpreter to its default state: clears code, clears output, and resets font size.
 * @param {string} suffix The suffix for the element IDs (e.g., 'modal', 'landing').
 */
function resetInterpreter(suffix) {
    const codeInput = document.getElementById('code-input-' + suffix);
    const outputContent = document.getElementById('output-content-' + suffix);
    const fontSizeSelect = document.getElementById('font-size-select-' + suffix);

    if (codeInput) {
        codeInput.value = '';
        updateEditorHighlighting(codeInput);
        updateLineNumbers(codeInput, 'line-numbers-' + suffix);
    }
    if (outputContent) outputContent.innerHTML = '# مخرجات التنفيذ ستظهر هنا...';
    
    localStorage.removeItem('interpreterFontSize'); // Remove saved preference
    changeInterpreterFontSize('14px', suffix); // Apply default size
    if (fontSizeSelect) fontSizeSelect.value = '14px'; // Update select element
}

// ============================================================================
// Custom Input Modal Logic (Required for input() support)
// ============================================================================
let resolveCustomInputPromise;

function showCustomInputModal(promptText) {
    const modal = document.getElementById('custom-input-modal');
    if (!modal) return Promise.resolve("");
    
    const promptEl = document.getElementById('custom-input-prompt');
    if (promptEl) promptEl.textContent = promptText;
    
    const inputField = document.getElementById('custom-input-field');
    if (inputField) {
        inputField.value = '';
        modal.classList.add('active');
        inputField.focus();
    }

    return new Promise((resolve) => {
        resolveCustomInputPromise = resolve;
    });
}

function submitCustomInput() {
    const val = document.getElementById('custom-input-field')?.value || "";
    if (resolveCustomInputPromise) { resolveCustomInputPromise(val); resolveCustomInputPromise = null; }
    document.getElementById('custom-input-modal')?.classList.remove('active');
}

function cancelCustomInput() {
    if (resolveCustomInputPromise) { resolveCustomInputPromise(""); resolveCustomInputPromise = null; }
    document.getElementById('custom-input-modal')?.classList.remove('active');
}

// ============================================================================
// User Management Functions
// ============================================================================

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '15422653';
let users = JSON.parse(localStorage.getItem('pythonPlatformUsers')) || [];

function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;
    const storage = remember ? localStorage : sessionStorage;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        storage.setItem('pythonPlatformLoggedIn', 'true');
        const adminUser = {
            username: 'admin',
            isAdmin: true,
            agents: {
                problem: true,
                code: true,
                assistant: true
            }
        };
        storage.setItem('pythonPlatformCurrentUser', JSON.stringify(adminUser));
        showToast('تم تسجيل الدخول بنجاح كمدير!', 'success');
        hideLoginModal();
    } else {
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            storage.setItem('pythonPlatformLoggedIn', 'true');
            storage.setItem('pythonPlatformCurrentUser', JSON.stringify(user));
            showToast(`مرحباً ${user.username}! تم تسجيل الدخول بنجاح.`, 'success');
            hideLoginModal();
        } else {
            showToast('اسم المستخدم أو كلمة المرور غير صحيحة!', 'error');
        }
    }
}

function hideLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
    document.getElementById('login-modal').style.display = 'none';
    showUserWelcome();
}

function showUserWelcome() {
    const currentUser = JSON.parse(localStorage.getItem('pythonPlatformCurrentUser')) || 
                        JSON.parse(sessionStorage.getItem('pythonPlatformCurrentUser'));

    if (currentUser) {
        document.getElementById('logged-username').textContent = currentUser.username;
        document.getElementById('user-welcome').style.display = 'inline-flex';

        // التحكم في ظهور زر الإدارة للمدير فقط
        const adminBtn = document.querySelector('.admin-btn');
        if (adminBtn) {
            adminBtn.style.display = currentUser.isAdmin ? 'inline-flex' : 'none';
        }

        if (currentUser.isAdmin) {
            showAllAgents();
        } else {
            updateAgentVisibility(currentUser);
        }
    } else if (localStorage.getItem('pythonPlatformLoggedIn') === 'true' || sessionStorage.getItem('pythonPlatformLoggedIn') === 'true') {
        document.getElementById('logged-username').textContent = 'مدير النظام';
        document.getElementById('user-welcome').style.display = 'inline-flex';
        showAllAgents();
    }
}

function updateAgentVisibility(user) {
    if (!user.agents) {
        showAllAgents();
        return;
    }

    const problemCard = document.querySelector('.ai-problem-card'); // Use class as ID is not present in index.html for this card
    if (problemCard) {
        problemCard.style.display = user.agents.problem ? 'block' : 'none';
    }

    const codeCard = document.getElementById('agent-code-card');
    if (codeCard) {
        codeCard.style.display = user.agents.code ? 'block' : 'none';
    }

    const assistantCard = document.getElementById('agent-assistant-card');
    if (assistantCard) {
        assistantCard.style.display = user.agents.assistant ? 'block' : 'none';
    }
}

function showAllAgents() {
    const problemCard = document.querySelector('.ai-problem-card');
    const codeCard = document.getElementById('agent-code-card');
    const assistantCard = document.getElementById('agent-assistant-card');

    if (problemCard) problemCard.style.display = 'block';
    if (codeCard) codeCard.style.display = 'block';
    if (assistantCard) assistantCard.style.display = 'block';
}

function doLogout() {
    localStorage.removeItem('pythonPlatformLoggedIn');
    localStorage.removeItem('pythonPlatformCurrentUser');
    sessionStorage.removeItem('pythonPlatformLoggedIn');
    sessionStorage.removeItem('pythonPlatformCurrentUser');
    location.reload();
}

function openUserManagement() {
    document.getElementById('user-management-modal').classList.add('active');
    document.getElementById('admin-login-section').style.display = 'block';
    document.getElementById('user-management-section').style.display = 'none';
}

function closeUserManagement() {
    document.getElementById('user-management-modal').classList.remove('active');
}

function verifyAdmin() {
    const password = document.getElementById('admin-password').value;

    if (password === ADMIN_PASSWORD) {
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('user-management-section').style.display = 'block';
        displayUsers();
        showToast('تم التحقق من المدير بنجاح!', 'success');
    } else {
        showToast('كلمة المرور غير صحيحة!', 'error');
    }
}

function addUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const agentProblem = document.getElementById('agent-problem').checked;
    const agentCode = document.getElementById('agent-code').checked;
    const agentAssistant = document.getElementById('agent-assistant').checked;

    if (!username || !password) {
        showToast('الرجاء إدخال اسم المستخدم وكلمة المرور!', 'error');
        return;
    }

    if (users.find(u => u.username === username)) {
        showToast('اسم المستخدم موجود مسبقاً!', 'error');
        return;
    }

    const newUser = {
        id: Date.now(),
        username: username,
        password: password,
        agents: {
            problem: agentProblem,
            code: agentCode,
            assistant: agentAssistant
        },
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('pythonPlatformUsers', JSON.stringify(users));

    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';

    displayUsers();
    showToast('تم إضافة المستخدم بنجاح!', 'success');
}

function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('pythonPlatformUsers', JSON.stringify(users));
        displayUsers();
        showToast('تم حذف المستخدم بنجاح!', 'success');
    }
}

function editUser(userId) {
    users = JSON.parse(localStorage.getItem('pythonPlatformUsers')) || [];

    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-password').value = '';

    document.getElementById('edit-agent-problem').checked = user.agents && user.agents.problem;
    document.getElementById('edit-agent-code').checked = user.agents && user.agents.code;
    document.getElementById('edit-agent-assistant').checked = user.agents && user.agents.assistant;

    document.getElementById('edit-user-modal').style.display = 'block';
    document.getElementById('edit-user-modal').classList.add('active');
}

function closeEditUserModal() {
    document.getElementById('edit-user-modal').style.display = 'none';
    document.getElementById('edit-user-modal').classList.remove('active');
}

function scrollUsers(direction) {
    const container = document.getElementById('users-scroll-container');
    if (!container) return;

    const scrollAmount = 150;
    if (direction === 'up') {
        container.scrollTop -= scrollAmount;
    } else if (direction === 'down') {
        container.scrollTop += scrollAmount;
    }
}

function saveEditedUser() {
    const userId = parseInt(document.getElementById('edit-user-id').value);
    const newPassword = document.getElementById('edit-password').value;
    const agentProblem = document.getElementById('edit-agent-problem').checked;
    const agentCode = document.getElementById('edit-agent-code').checked;
    const agentAssistant = document.getElementById('edit-agent-assistant').checked;

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        showToast('المستخدم غير موجود!', 'error');
        return;
    }

    users[userIndex].agents = {
        problem: agentProblem,
        code: agentCode,
        assistant: agentAssistant
    };

    if (newPassword && newPassword.trim() !== '') {
        users[userIndex].password = newPassword;
    }

    localStorage.setItem('pythonPlatformUsers', JSON.stringify(users));

    closeEditUserModal();
    displayUsers();
    showToast('تم تحديث بيانات المستخدم بنجاح!', 'success');
}

function searchUsers() {
    const searchTerm = document.getElementById('user-search-input').value.toLowerCase();
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
}

function displayUsers(usersToDisplay = users) {
    const container = document.getElementById('users-container');

    if (!container) return; // Ensure the container exists

    if (usersToDisplay.length === 0) {
        container.innerHTML = '<p class="no-users">لا يوجد مستخدمون مسجلون</p>';
        return;
    }

    let html = '';
    usersToDisplay.forEach((user) => {
        const agentsList = [];
        if (user.agents.problem) agentsList.push('وكيل حل المشكلات');
        if (user.agents.code) agentsList.push('الوكيل البرمجي');
        if (user.agents.assistant) agentsList.push('مساعد الذكاء الاصطناعي');

        html += `
            <div class="user-card">
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <p class="user-agents">
                        <i class="fas fa-robot"></i>
                        ${agentsList.join(' | ')}
                    </p>
                    <p class="user-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn-delete" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function exportUsersToExcel() {
    if (users.length === 0) {
        showToast('لا يوجد مستخدمون لتصديرهم!', 'info');
        return;
    }

    // تجهيز البيانات بتنسيق يقبله محرك التصدير
    const data = users.map(user => ({
        "المعرف": user.id,
        "اسم المستخدم": user.username,
        "كلمة المرور": user.password,
        "حل المشكلات": user.agents.problem ? "نعم" : "لا",
        "الوكيل البرمجي": user.agents.code ? "نعم" : "لا",
        "المساعد الذكي": user.agents.assistant ? "نعم" : "لا",
        "تاريخ التسجيل": new Date(user.createdAt).toLocaleDateString('ar-SA')
    }));

    // إنشاء ورقة العمل وكتاب العمل باستخدام مكتبة XLSX
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المستخدمون");

    // تصدير الملف كـ XLSX حقيقي
    XLSX.writeFile(workbook, `الطلاب_المسجلين_${new Date().toLocaleDateString()}.xlsx`);
    
    showToast('تم تصدير المستخدمين إلى ملف Excel (.xlsx) بنجاح!', 'success');
}

function triggerImport() {
    document.getElementById('import-file').click();
}

function importUsersFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n');
        
        if (lines.length < 2) {
            showToast('الملف فارغ أو غير صالح!', 'error');
            return;
        }

        let importedCount = 0;
        let skipCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // تقطيع السطر مع إزالة علامات الاقتباس
            const parts = line.split(',').map(s => s.replace(/"/g, '').trim());
            if (parts.length < 6) continue;

            const username = parts[1];
            const password = parts[2];
            const problem = parts[3] === "نعم";
            const code = parts[4] === "نعم";
            const assistant = parts[5] === "نعم";

            // تخطي المستخدم إذا كان موجوداً مسبقاً
            if (users.find(u => u.username === username)) {
                skipCount++;
                continue;
            }

            users.push({
                id: Date.now() + i,
                username: username,
                password: password,
                agents: { problem, code, assistant },
                createdAt: new Date().toISOString()
            });
            importedCount++;
        }

        if (importedCount > 0) {
            localStorage.setItem('pythonPlatformUsers', JSON.stringify(users));
            displayUsers();
            showToast(`تم استيراد ${importedCount} مستخدم بنجاح!${skipCount > 0 ? ` (تم تخطي ${skipCount} مستخدم موجودين مسبقاً)` : ''}`, 'success');
        } else {
            showToast('لم يتم العثور على مستخدمين جدد لاستيرادهم.', 'info');
        }
        event.target.value = ''; // إعادة تعيين الحقل للسماح باستيراد نفس الملف مرة أخرى
    };
    reader.readAsText(file);
}

function stopCode() {
    if (interruptBuffer) {
        interruptBuffer[0] = 2; // SIGINT (KeyboardInterrupt)
    } else {
        console.warn("Interrupts are not supported in this browser environment.");
        showToast("لا يمكن إيقاف الكود في بيئة المتصفح هذه (تتطلب SharedArrayBuffer).", 'warning');
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-password');
    const toggleIcon = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function toggleOutput(outputId, btn) {
    const outputElement = document.getElementById(outputId);
    if (!outputElement) return;
    
    const isCollapsed = outputElement.classList.toggle('collapsed');
    
    if (isCollapsed) {
        btn.innerHTML = '<i class="fas fa-eye"></i> إظهار النتائج';
    } else {
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء النتائج';
    }
}

function toggleFullscreen(modalId) {
    const modalContainer = document.getElementById(modalId);
    const modal = modalContainer.querySelector('.modal');
    const btn = modal.querySelector('.fullscreen-btn');
    const isFullscreen = modal.classList.toggle('fullscreen');
    
    if (isFullscreen) {
        btn.innerHTML = '<i class="fas fa-compress"></i> تصغير';
    } else {
        btn.innerHTML = '<i class="fas fa-expand"></i> تكبير';
    }
}

// ============================================================================
// Global Event Listeners (for all pages)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('pythonPlatformLoggedIn') === 'true' || 
                       sessionStorage.getItem('pythonPlatformLoggedIn') === 'true';
    const isLandingPage = !!document.querySelector('.landing-container');
    const currentUser = JSON.parse(localStorage.getItem('pythonPlatformCurrentUser')) || 
                        JSON.parse(sessionStorage.getItem('pythonPlatformCurrentUser'));

    // التحقق من صلاحية الوصول: إعادة التوجيه للرئيسية إذا لم يتم تسجيل الدخول
    if (!isLoggedIn && !isLandingPage) {
        window.location.href = 'index.html';
        return;
    }

    // Add Tab key support for indentation in all code editors
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        if (textarea.id && textarea.id.includes('code')) {
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 4;
                    this.dispatchEvent(new Event('input'));
                } else if (e.key === 'Enter') {
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    const value = this.value;
                    
                    // الحصول على محتوى السطر الحالي قبل الضغط على Enter
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const currentLine = value.substring(lineStart, start);
                    
                    // استخراج المسافات البادئة (Indentation) من السطر الحالي
                    const indentMatch = currentLine.match(/^\s*/);
                    const indent = indentMatch ? indentMatch[0] : "";
                    
                    // إضافة إزاحة إضافية إذا كان السطر ينتهي بـ :
                    let extraIndent = "";
                    if (currentLine.trim().endsWith(':')) {
                        extraIndent = "    ";
                    }
                    
                    if (indent.length > 0 || extraIndent.length > 0) {
                        e.preventDefault();
                        this.value = value.substring(0, start) + "\n" + indent + extraIndent + value.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + indent.length + extraIndent.length;
                        this.dispatchEvent(new Event('input'));
                    }
                } else if (['(', '[', '{', "'", '"'].includes(e.key)) {
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    const value = this.value;

                    let closing = '';
                    if (e.key === '(') closing = ')';
                    else if (e.key === '[') closing = ']';
                    else if (e.key === '{') closing = '}';
                    else closing = e.key;

                    // 1. القفز فوق علامة الإغلاق إذا كانت موجودة بالفعل (مثل كتابة القوس المغلق يدوياً)
                    if (start === end && end < value.length && value[end] === closing) {
                        e.preventDefault();
                        this.selectionStart = this.selectionEnd = start + 1;
                        return;
                    }

                    // 2. منطق خاص لعلامات الاقتباس الثلاثية (''' أو """)
                    if ((e.key === "'" || e.key === '"') && start === end && start >= 2) {
                        const lastTwo = value.substring(start - 2, start);
                        if (lastTwo === e.key + e.key) {
                            e.preventDefault();
                            // عند كتابة العلامة الثالثة، نقوم بإضافة 3 علامات إغلاق إضافية
                            this.value = value.substring(0, start) + e.key + e.key + e.key + e.key + value.substring(end);
                            this.selectionStart = this.selectionEnd = start + 1;
                            this.dispatchEvent(new Event('input'));
                            return;
                        }
                    }

                    e.preventDefault();
                    // 3. الإدراج الطبيعي للزوج (فتح وإغلاق)
                    this.value = value.substring(0, start) + e.key + closing + value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                    this.dispatchEvent(new Event('input')); // Trigger input event for highlighting
                }
                // إضافة ميزة حذف زوج الأقواس وعلامات الاقتباس عند الضغط على Backspace
                else if (e.key === 'Backspace') {
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    const value = this.value;

                    // تنفيذ الحذف التلقائي فقط إذا لم يكن هناك تحديد نصي والمؤشر ليس في بداية السطر
                    if (start === end && start > 0) {
                        let shouldDeletePair = false;
                        let charsToRemove = 0; // عدد الأحرف التي سيتم إزالتها (الزوج كاملاً)

                        const charBefore = value[start - 1];
                        const charAfter = value[start];

                        // التحقق من الأزواج الفردية (أقواس وعلامات اقتباس)
                        if (
                            (charBefore === '(' && charAfter === ')') ||
                            (charBefore === '[' && charAfter === ']') ||
                            (charBefore === '{' && charAfter === '}') ||
                            (charBefore === "'" && charAfter === "'") ||
                            (charBefore === '"' && charAfter === '"')
                        ) {
                            shouldDeletePair = true;
                            charsToRemove = 2;
                        }
                        // التحقق من علامات الاقتباس الثلاثية
                        else if (start >= 3 && start + 3 <= value.length) {
                            const tripleQuoteBefore = value.substring(start - 3, start);
                            const tripleQuoteAfter = value.substring(start, start + 3);
                            if ((tripleQuoteBefore === "'''" && tripleQuoteAfter === "'''") || (tripleQuoteBefore === '"""' && tripleQuoteAfter === '"""')) {
                                shouldDeletePair = true;
                                charsToRemove = 6;
                            }
                        }

                        if (shouldDeletePair) {
                            e.preventDefault(); // منع السلوك الافتراضي لـ Backspace (حذف حرف واحد)
                            this.value = value.substring(0, start - (charsToRemove / 2)) + value.substring(start + (charsToRemove / 2));
                            this.selectionStart = this.selectionEnd = start - (charsToRemove / 2); // إعادة وضع المؤشر
                            this.dispatchEvent(new Event('input')); // لتحديث التظليل
                        }
                    }
                }
            });

            // إضافة مزامنة التلوين
            textarea.addEventListener('input', () => updateEditorHighlighting(textarea));
            textarea.addEventListener('scroll', () => updateEditorHighlighting(textarea));
            // التلوين الأولي عند الفتح
            setTimeout(() => updateEditorHighlighting(textarea), 100);
        }
    });

    // Check if the current page is an agent page
    if (document.body.classList.contains('agent-page')) {
        let agentConfig = {};
        const username = currentUser ? currentUser.username : 'guest'; // Fallback to 'guest' if no user found
        if (document.body.classList.contains('prog-agent')) {
            agentConfig = {
                systemPrompt: `اكتب كود البرمجة بلغة البايثون.
لغة البرمجة المستخدمة Python.
لا تعطي شرح لخطوات حل للمشكلة
لا تشرح كود البرمجة`,
                chatHistoryKey: `chatHistory_prog_${username}`,
                apiKeyStateKey: `apiKeyState_prog_${username}`,
                apiKeys: COMMON_API_KEYS,
                codeHighlighter: highlightPython,
                disableTypingEffectForCode: true // Disable typing effect for pre-highlighted code
            };
        } else if (document.title.includes('Problem')) { // ProblemAgent.html
            agentConfig = {
                systemPrompt: `ارشدني خطوة بخطوة لحل المشكلة دون اعطائي الحل النهائي.
لغة البرمجة المستخدمة Python.
لا تكتب كود برمجة`,
                chatHistoryKey: `chatHistory_problem_${username}`,
                apiKeyStateKey: `apiKeyState_problem_${username}`,
                apiKeys: COMMON_API_KEYS,
                codeHighlighter: null
            };
        } else { // AIAgent.html
            agentConfig = {
                systemPrompt: ``, // General AI agent has no specific system prompt
                chatHistoryKey: `chatHistory_ai_${username}`,
                apiKeyStateKey: `apiKeyState_ai_${username}`,
                apiKeys: COMMON_API_KEYS,
                codeHighlighter: null
            };
        }
        initializeChatAgent(agentConfig);
        setTimeout(playArrivalSound, 300); // Play sound for agent pages
        showUserWelcome(); // إظهار اسم المستخدم إذا كان العنصر موجوداً
    } else if (document.querySelector('.landing-container')) { // index.html
        // Initialize landing page specific scripts
        users = JSON.parse(localStorage.getItem('pythonPlatformUsers')) || []; // Ensure users is loaded
        if (isLoggedIn) {
            hideLoginModal();
        }
        // Close modals when clicking outside (for landing page modals)
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
            }
        });

        // إضافة ميزة تسجيل الدخول بالضغط على مفتاح Enter
        const loginUsernameInput = document.getElementById('login-username');
        const loginPasswordInput = document.getElementById('login-password');
        const adminPasswordInput = document.getElementById('admin-password');

        if (loginUsernameInput && loginPasswordInput) {
            const handleLoginEnter = (e) => {
                if (e.key === 'Enter') doLogin();
                if (e.key === 'Enter' && e.target === loginUsernameInput) {
                    e.preventDefault(); // منع السلوك الافتراضي لـ Enter (مثل إرسال النموذج)
                    loginPasswordInput.focus(); // نقل التركيز إلى حقل كلمة المرور
                }
            };
            loginUsernameInput.addEventListener('keydown', handleLoginEnter);
            loginPasswordInput.addEventListener('keydown', handleLoginEnter);
        }

        if (adminPasswordInput) {
            adminPasswordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') verifyAdmin();
            });
        }
    } else if (document.querySelector('.app-container')) { // content.html
        showUserWelcome();
        initNavigation();
        // Sidebar lesson clicks
        document.querySelectorAll('.lesson-item').forEach(item => {
            item.addEventListener('click', function() {
                const lesson = this.dataset.lesson;
                if (lesson) {
                    showLesson(lesson, true);
                }
            });
        });
        // Interpreter modal close on outside click
        document.getElementById('interpreter-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeInterpreterContent();
            }
        });
        // Set initial active tab for data types if on that lesson
        if (document.getElementById('lesson-data-types') && document.getElementById('lesson-data-types').classList.contains('active')) {
            switchDataTypeTab('numbers');
        }

        // Close interpreter modals on Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const interpreterModalContent = document.getElementById('interpreter-modal');
                const interpreterModalLanding = document.getElementById('interpreter-modal-landing');
                if (interpreterModalContent && interpreterModalContent.classList.contains('active')) {
                    closeInterpreterContent();
                } else if (interpreterModalLanding && interpreterModalLanding.classList.contains('active')) {
                    closePythonInterpreterLanding();
                }
            }
        });
    }
});

// Expose global functions for inline HTML event handlers
window.playArrivalSound = playArrivalSound; // For potential future use, though currently called via DOMContentLoaded
window.openProblemSolver = openProblemSolver;
window.closeProblemSolver = closeProblemSolver;
window.handleProblemKeyPress = handleProblemKeyPress;
window.sendToProblemSolver = sendToProblemSolver;
window.openCodeAgent = openCodeAgent;
window.closeCodeAgent = closeCodeAgent;
window.handleCodeRequestKeyPress = handleCodeRequestKeyPress;
window.sendToCodeAgent = sendToCodeAgent;
window.openAIAssistant = openAIAssistant;
window.closeAIAssistant = closeAIAssistant;
window.handleAssistantKeyPress = handleAssistantKeyPress;
window.sendToAssistant = sendToAssistant;
window.openPythonInterpreter = openPythonInterpreterLanding; // Map old name to new landing specific
window.closePythonInterpreter = closePythonInterpreterLanding;
window.runPythonCode = runPythonCodeLanding;
window.clearOutput = clearOutputLanding;
window.togglePasswordVisibility = togglePasswordVisibility;
window.stopCode = stopCode;
window.toggleOutput = toggleOutput;
window.toggleFullscreen = toggleFullscreen;
window.handleInterpreterKeyDown = handleInterpreterKeyDownLanding;

// Expose custom input modal functions
window.showCustomInputModal = showCustomInputModal;
window.submitCustomInput = submitCustomInput;
window.cancelCustomInput = cancelCustomInput;
window.updateLineNumbers = updateLineNumbersLanding;
window.changeInterpreterFontSize = changeInterpreterFontSize; // Expose the new function
window.resetInterpreter = resetInterpreter; // Expose the new reset function
window.updateEditorHighlighting = updateEditorHighlighting;

// Content page specific functions exposed for inline HTML
window.showLesson = showLesson;
if (document.querySelector('.landing-container')) {
    window.openInterpreter = openPythonInterpreterLanding;
    window.closeInterpreter = closePythonInterpreterLanding;
} else {
    window.openInterpreter = openInterpreterContent;
    window.closeInterpreter = closeInterpreterContent;
}
window.runModalCode = runModalCodeContent;
window.runCode = runCodeContent;
window.copyCode = copyCodeContent; // Fix: Expose copyCodeContent as copyCode

// Fallback: some environments may call copyCode before window.copyCode assignment.
// Provide a global function name expected by inline HTML.
function copyCode(btn) {
    return window.copyCode(btn);
}
window.switchDataTypeTab = switchDataTypeTab;

// Quiz functions exposed
window.submitQuizVariables = submitQuizVariables;
window.submitQuizVariableTypes = submitQuizVariableTypes;
window.submitQuizOperators = submitQuizOperators;
window.submitQuizNumbers = submitQuizNumbers;
window.submitQuizStrings = submitQuizStrings;
window.submitQuizLists = submitQuizLists;
window.submitQuizTuples = submitQuizTuples;
window.submitQuizSets = submitQuizSets;
window.submitQuizDicts = submitQuizDicts;
window.submitQuizFunctions = submitQuizFunctions;
window.submitQuizConditions = submitQuizConditions;
window.submitQuizLoops = submitQuizLoops;

// User Management functions exposed
window.doLogin = doLogin;
window.doLogout = doLogout;
window.openUserManagement = openUserManagement;
window.closeUserManagement = closeUserManagement;
window.verifyAdmin = verifyAdmin;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.editUser = editUser;
window.closeEditUserModal = closeEditUserModal;
window.exportUsersToExcel = exportUsersToExcel;
window.triggerImport = triggerImport;
window.importUsersFromExcel = importUsersFromExcel;
window.showToast = showToast;
window.searchUsers = searchUsers;
window.scrollUsers = scrollUsers;
window.saveEditedUser = saveEditedUser;
window.displayUsers = displayUsers; // Needed for initial display in user management modal