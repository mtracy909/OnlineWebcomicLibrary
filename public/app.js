document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/webcomics'; 
    const comicForm = document.getElementById('comicForm');
    const comicGrid = document.getElementById('comicGrid');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const scrapeUrlInput = document.getElementById('scrapeUrlInput');
    let editingId = null;
    const submitBtn = comicForm.querySelector('button[type="submit"]');
    let allComics = [];

    // READ - Load all entries on startup
    fetchWebcomics();

    // CREATE - Handle form submission
    comicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const webcomicData = {
            title: document.getElementById('title').value,
            platform: document.getElementById('platform').value,
            cover_image_url: document.getElementById('cover_image_url').value || null,
            chapters_available: parseInt(document.getElementById('chapters_available').value) || 0,
            chapters_read: parseInt(document.getElementById('chapters_read').value) || 0
        };

        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${API_URL}/${editingId}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webcomicData)
            });

            if (response.ok) {
                comicForm.reset();
                editingId = null;
                submitBtn.textContent = 'Add Webcomic to Library'; // Reset button text
                fetchWebcomics();
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    });

    // Load comic data
    async function fetchWebcomics() {
        try {
            const response = await fetch(API_URL);
            allComics = await response.json(); // Store all comics
            renderComics(allComics); // Initial render
        } catch (error) {
            console.error('Failed to load webcomics:', error);
        }
    }

    // Render comics in the grid
    function renderComics(comics) {
        comicGrid.innerHTML = ''; // Clear existing
        
        comics.forEach(comic => {
            const imgUrl = comic.cover_image_url || 'https://placehold.co/400x600/1e293b/94a3b8?text=No+Cover';
            let progressPercent = comic.chapters_available > 0 
                ? Math.min(Math.round((comic.chapters_read / comic.chapters_available) * 100), 100) 
                : 0;

            const card = document.createElement('div');
            card.className = 'comic-card';
            // Store attributes for Edit/Update
            card.setAttribute('data-id', comic.id);
            card.setAttribute('data-read', comic.chapters_read);
            card.setAttribute('data-available', comic.chapters_available);
            card.setAttribute('data-title', comic.title);
            card.setAttribute('data-platform', comic.platform);
            card.setAttribute('data-cover', comic.cover_image_url || '');

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
                        <button class="btn-action btn-progress action-log">+1</button>
                        <button class="btn-action btn-edit action-edit">Edit</button>
                        <button class="btn-action btn-delete action-del">Delete</button>
                    </div>
                </div>
            `;
            comicGrid.appendChild(card);
        });
    }

    // UPDATE, EDIT, DELETE - Event listener attached to the grid container
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
                        title: card.getAttribute('data-title'),
                        platform: card.getAttribute('data-platform'),
                        cover_image_url: card.getAttribute('data-cover'),
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
        if (e.target.classList.contains('action-edit')) {
            editingId = id;
            submitBtn.textContent = 'Update Webcomic'; // Change button text
                
            // Fill the form with current values
            document.getElementById('title').value = card.querySelector('.comic-title').innerText;
            document.getElementById('platform').value = card.querySelector('.comic-platform').innerText;
            document.getElementById('chapters_available').value = card.getAttribute('data-available');
            document.getElementById('chapters_read').value = card.getAttribute('data-read');
            document.getElementById('cover_image_url').value = card.getAttribute('data-cover');                
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Handle SCRAPE click to autofill fields
    scrapeBtn.addEventListener('click', async () => {
        const url = scrapeUrlInput.value;
        if (!url) return alert('Please enter a URL first!');

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById('title').value = data.title || '';
                document.getElementById('cover_image_url').value = data.cover_image_url || '';
            } else {
                alert('Could not scrape this site: ' + data.error);
            }
        } catch (err) {
            console.error('Error fetching scrape data:', err);
        }
    });

    // Handle FILTER change
    document.getElementById('platformFilter').addEventListener('change', (e) => {
        const filterValue = e.target.value;
        
        if (filterValue === 'All') {
            renderComics(allComics);
        } else {
            const filtered = allComics.filter(c => c.platform === filterValue);
            renderComics(filtered);
        }
    });
});