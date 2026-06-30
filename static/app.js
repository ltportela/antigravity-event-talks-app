document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const notesContainer = document.getElementById('notes-container');
    const updateTimestamp = document.getElementById('update-timestamp');
    const noteCount = document.getElementById('note-count');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');

    // Share Modal Elements
    const shareModal = document.getElementById('share-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const charCounterContainer = document.querySelector('.char-counter');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelShareBtn = document.getElementById('cancel-share-btn');
    const confirmShareBtn = document.getElementById('confirm-share-btn');

    let currentNotes = [];

    // Fetch and render release notes
    async function fetchReleaseNotes() {
        // Show loading state
        setLoading(true);
        errorState.classList.add('hidden');

        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();

            if (data.success) {
                currentNotes = data.notes;
                renderNotes(data.notes);
                
                // Update header info
                const now = new Date();
                updateTimestamp.textContent = `Last synced: ${now.toLocaleTimeString()}`;
                noteCount.textContent = `${data.notes.length} updates`;
            } else {
                showError(data.error || 'Failed to fetch release notes from server.');
            }
        } catch (error) {
            showError('Network error. Is the Flask backend running?');
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }

    // Toggle loading states / spinner
    function setLoading(isLoading) {
        if (isLoading) {
            refreshIcon.classList.add('spinning');
            refreshBtn.disabled = true;
            
            // Keep existing cards if we have them, otherwise show full spinner container
            if (notesContainer.querySelectorAll('.note-card').length === 0) {
                loadingState.classList.remove('hidden');
            }
        } else {
            refreshIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
            loadingState.classList.add('hidden');
        }
    }

    // Show error state
    function showError(msg) {
        errorMessage.textContent = msg;
        errorState.classList.remove('hidden');
        
        // Remove old notes if any
        const cards = notesContainer.querySelectorAll('.note-card');
        cards.forEach(card => card.remove());
    }

    // Render release notes as premium cards
    function renderNotes(notes) {
        // Clear old note cards
        const cards = notesContainer.querySelectorAll('.note-card');
        cards.forEach(card => card.remove());

        if (notes.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'loading-state';
            emptyMsg.innerHTML = '<p>No release notes found.</p>';
            notesContainer.appendChild(emptyMsg);
            return;
        }

        notes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card';
            
            // Format updated/published date
            let formattedDate = note.updated;
            try {
                const dateObj = new Date(note.updated);
                if (!isNaN(dateObj)) {
                    formattedDate = dateObj.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            } catch (e) {
                console.error(e);
            }

            card.innerHTML = `
                <div class="note-header">
                    <div class="note-meta">
                        <h2 class="note-title">${escapeHTML(note.title)}</h2>
                        <span class="note-date">${escapeHTML(formattedDate)}</span>
                    </div>
                    <button class="btn btn-twitter small share-btn" data-id="${note.id}">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="x-icon">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Tweet</span>
                    </button>
                </div>
                <div class="note-content">${note.content}</div>
            `;

            // Attach event listener to individual Tweet button
            const shareBtn = card.querySelector('.share-btn');
            shareBtn.addEventListener('click', () => openShareModal(note));

            notesContainer.appendChild(card);
        });
    }

    // Modal Operations
    function openShareModal(note) {
        // Construct pre-filled tweet draft
        // Google BigQuery update tweet format
        let tweetText = `BigQuery Update: ${note.title}\n\n`;
        
        // Add a snippet of details
        let detailsSnippet = note.plain_text;
        if (detailsSnippet.length > 150) {
            detailsSnippet = detailsSnippet.substring(0, 147) + '...';
        }
        
        tweetText += `"${detailsSnippet}"\n\n`;
        
        if (note.link) {
            tweetText += `${note.link}`;
        }
        
        tweetTextarea.value = tweetText;
        updateCharCount();
        
        shareModal.classList.remove('hidden');
    }

    function closeShareModal() {
        shareModal.classList.add('hidden');
    }

    function updateCharCount() {
        const length = tweetTextarea.value.length;
        charCount.textContent = length;
        
        if (length > 280) {
            charCounterContainer.classList.add('warning');
            confirmShareBtn.disabled = true;
        } else {
            charCounterContainer.classList.remove('warning');
            confirmShareBtn.disabled = false;
        }
    }

    // Escape raw HTML strings for security
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);

    closeModalBtn.addEventListener('click', closeShareModal);
    cancelShareBtn.addEventListener('click', closeShareModal);
    
    tweetTextarea.addEventListener('input', updateCharCount);

    confirmShareBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterShareUrl, '_blank', 'noopener,noreferrer');
        closeShareModal();
    });

    // Close modal on background click
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            closeShareModal();
        }
    });

    // Initial Load
    fetchReleaseNotes();
});
