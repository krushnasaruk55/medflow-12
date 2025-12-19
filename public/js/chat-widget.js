document.addEventListener('DOMContentLoaded', () => {
    // Only show chat if logged in
    const username = sessionStorage.getItem('username');
    const role = sessionStorage.getItem('role');

    if (!username || !role) {
        return;
    }

    // Inject CSS if not present
    if (!document.querySelector('link[href="css/chat.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/chat.css';
        document.head.appendChild(link);
    }

    // Inject HTML
    const chatHTML = `
        <div class="chat-fab" id="chatFab" title="Internal Chat">💬</div>
        
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <h3>MedFlow Chat</h3>
                <button id="closeChat" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--text-secondary);">×</button>
            </div>
            <div class="chat-body" id="chatBody">
                <!-- Messages go here -->
                <div style="text-align:center; color:#94a3b8; font-size:0.85rem; margin-top:20px;">
                    Welcome to the internal team chat.
                </div>
            </div>
            <div class="chat-footer">
                <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
                <button class="btn btn-sm btn-primary" id="sendBtn">➤</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // Elements
    const fab = document.getElementById('chatFab');
    const window = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChat');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const body = document.getElementById('chatBody');

    // Toggle
    fab.addEventListener('click', () => {
        window.classList.toggle('open');
        fab.style.display = 'none';
        scrollToBottom();
    });

    closeBtn.addEventListener('click', () => {
        window.classList.remove('open');
        setTimeout(() => fab.style.display = 'flex', 300); // Wait for transition
    });

    // Socket Logic
    // Ensure socket exists (global from other scripts)
    // If not, we might need to specific init, but usually pages have it.
    if (typeof socket === 'undefined') {
        console.warn('Socket.io not found for chat widget');
        return;
    }

    // Listeners
    socket.on('chat-history', (history) => {
        body.innerHTML = '';
        history.forEach(appendMessage);
        scrollToBottom();
    });

    socket.on('chat-message', (msg) => {
        appendMessage(msg);
        scrollToBottom();

        // Notification dot or sound if closed could be added here
        if (!window.classList.contains('open')) {
            fab.innerHTML = '🔴'; // Simple indicator
            setTimeout(() => fab.innerHTML = '💬', 3000);
        }
    });

    // Sending
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        socket.emit('send-chat-message', {
            sender: username,
            role: role,
            text: text
        });

        input.value = '';
        input.focus();
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function appendMessage(msg) {
        const isMe = msg.sender === username;
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = `chat-msg ${isMe ? 'msg-out' : 'msg-in'}`;
        div.innerHTML = `
            <div class="msg-meta">${msg.sender} (${msg.role})</div>
            ${escapeHtml(msg.text)}
            <div class="msg-time">${time}</div>
        `;
        body.appendChild(div);
    }

    function scrollToBottom() {
        body.scrollTop = body.scrollHeight;
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }
});
