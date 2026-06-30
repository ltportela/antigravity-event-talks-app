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

    // New Utility Buttons & Theme Toggle Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const searchInput = document.getElementById('search-input');
    const toastContainer = document.getElementById('toast-container');

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
                filterAndRenderNotes();
                
                // Update header info
                const now = new Date();
                updateTimestamp.textContent = `Last synced: ${now.toLocaleTimeString()}`;
                showToast('Release notes synced successfully!', 'success');
            } else {
                showError(data.error || 'Failed to fetch release notes from server.');
                showToast('Failed to fetch release notes.', 'error');
            }
        } catch (error) {
            showError('Network error. Is the Flask backend running?');
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }

    // Toast notification helper
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icon based on type
        const iconHtml = type === 'success' 
            ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; vertical-align: middle;"><path d="M20 6 9 17l-5-5"/></svg>`
            : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
            
        toast.innerHTML = `${iconHtml}<span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        // Force layout reflow to trigger transition
        toast.offsetHeight;
        toast.classList.add('show');
        
        // Auto remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // Filter notes based on search query and render
    function filterAndRenderNotes() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (!query) {
            renderNotes(currentNotes);
            noteCount.textContent = `${currentNotes.length} updates`;
            return;
        }
        
        const filtered = currentNotes.filter(note => {
            return note.title.toLowerCase().includes(query) || 
                   note.plain_text.toLowerCase().includes(query);
        });
        
        renderNotes(filtered);
        noteCount.textContent = `${filtered.length} found of ${currentNotes.length}`;
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
                    <div class="note-actions">
                        <button class="btn btn-secondary small copy-btn" data-id="${note.id}">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            <span>Copy</span>
                        </button>
                        <button class="btn btn-twitter small share-btn" data-id="${note.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="x-icon">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span>Tweet</span>
                        </button>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
            `;

            // Attach event listener to individual Copy button
            const copyBtn = card.querySelector('.copy-btn');
            copyBtn.addEventListener('click', async () => {
                const textToCopy = `${note.title}\n\n${note.plain_text}\n\n${note.link}`;
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    showToast('Copied to clipboard!', 'success');
                    
                    const originalText = copyBtn.querySelector('span').textContent;
                    copyBtn.querySelector('span').textContent = 'Copied!';
                    copyBtn.classList.add('btn-success-temp');
                    setTimeout(() => {
                        copyBtn.querySelector('span').textContent = originalText;
                        copyBtn.classList.remove('btn-success-temp');
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showToast('Failed to copy to clipboard.', 'error');
                }
            });

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

    // Theme Toggle Logic
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcons(currentTheme);

    function updateThemeIcons(theme) {
        if (theme === 'light') {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcons(theme);
    });

    // Search input event listener
    searchInput.addEventListener('input', filterAndRenderNotes);

    // Export to CSV Functionality
    exportCsvBtn.addEventListener('click', () => {
        if (currentNotes.length === 0) {
            showToast('No release notes available to export.', 'error');
            return;
        }

        const csvRows = [];
        // Add Header
        csvRows.push(['ID', 'Title', 'Date', 'Link', 'Plain Text Content']);

        // Helper to escape values for CSV
        function escapeCsvValue(val) {
            if (val === null || val === undefined) return '';
            let formatted = val.toString().replace(/"/g, '""');
            if (formatted.includes(',') || formatted.includes('\n') || formatted.includes('"')) {
                formatted = `"${formatted}"`;
            }
            return formatted;
        }

        currentNotes.forEach(note => {
            csvRows.push([
                escapeCsvValue(note.id),
                escapeCsvValue(note.title),
                escapeCsvValue(note.updated),
                escapeCsvValue(note.link),
                escapeCsvValue(note.plain_text)
            ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'bigquery-release-notes.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV exported successfully!', 'success');
    });

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
