document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/webcomics'; 
    const comicForm = document.getElementById('comicForm');
    const comicGrid = document.getElementById('comicGrid');

    // 1. READ - Load all entries on startup
    fetchWebcomics();

    // 2. CREATE - Handle form submission
    comicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const webcomicData = {
            title: document.getElementById('title').value,
            platform: document.getElementById('platform').value,
            cover_image_url: document.getElementById('cover_image_url').value || null,
            chapters_available: parseInt(document.getElementById('chapters_available').value) || 0,
            chapters_read: parseInt(document.getElementById('chapters_read').value) || 0
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webcomicData)
            });

            if (response.ok) {
                comicForm.reset();
                fetchWebcomics();
            } else {
                const errData = await response.json();
                alert(`Error: ${errData.error}`);
            }
        } catch (error) {
            console.error('Failed to save webcomic:', error);
        }
    });

    // Function to render cards to the UI
    async function fetchWebcomics() {
        try {
            const response = await fetch(API_URL);
            const comics = await response.json();

            comicGrid.innerHTML = '';

            comics.forEach(comic => {
                const imgUrl = comic.cover_image_url || 'https://placehold.co/400x600/1e293b/94a3b8?text=No+Cover';
                
                let progressPercent = 0;
                if (comic.chapters_available > 0) {
                    progressPercent = Math.min(
                        Math.round((comic.chapters_read / comic.chapters_available) * 100), 
                        100
                    );
                }

                const card = document.createElement('div');
                card.className = 'comic-card';
                
                // Store database info in the HTML tags for easy retrieval later
                card.setAttribute('data-id', comic.id);
                card.setAttribute('data-read', comic.chapters_read);
                card.setAttribute('data-available', comic.chapters_available);

                card.innerHTML = `
                    <img src="${imgUrl}" alt="${comic.title} Cover" class="comic-cover">
                    <div class="comic-info">
                        <h3 class="comic-title">${comic.title}</h3>
                        <span class="comic-platform">${comic.platform}</span>
                        
                        <div class="progress-container">
                            <div class="progress-text">
                                <span>Progress</span>
                                <span>${comic.chapters_read} / ${comic.chapters_available} Chs (${progressPercent}%)</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>

                        <div class="card-actions">
                            <button class="btn-action btn-progress action-log">+1 Chapter</button>
                            <button class="btn-action btn-delete action-del">Delete</button>
                        </div>
                    </div>
                `;
                comicGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Failed to load webcomics grid:', error);
        }
    }

    // 3. UPDATE & DELETE - Event listener attached to the grid container
    comicGrid.addEventListener('click', async (e) => {
        // Find the specific card element clicked
        const card = e.target.closest('.comic-card');
        if (!card) return;

        const id = card.getAttribute('data-id');
        let chaptersRead = parseInt(card.getAttribute('data-read'));
        const chaptersAvailable = parseInt(card.getAttribute('data-available'));

        // Handle DELETE click
        if (e.target.classList.contains('action-del')) {
            if (confirm('Are you sure you want to remove this webcomic?')) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        fetchWebcomics(); // Refresh grid layout
                    }
                } catch (error) {
                    console.error('Failed to delete webcomic:', error);
                }
            }
        }

        // Handle UPDATE (+1 Chapter) click
        if (e.target.classList.contains('action-log')) {
            // Guard clause: Don't advance past total available chapters if set
            if (chaptersAvailable > 0 && chaptersRead >= chaptersAvailable) {
                alert('You are already completely caught up!');
                return;
            }

            chaptersRead += 1;

            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chapters_read: chaptersRead,
                        chapters_available: chaptersAvailable
                    })
                });

                if (response.ok) {
                    fetchWebcomics(); // Refresh UI to update bars
                }
            } catch (error) {
                console.error('Failed to update progress:', error);
            }
        }
    });
});