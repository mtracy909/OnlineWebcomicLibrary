const API_URL = 'http://localhost:3000/api/notes';

// Grab DOM elements
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const saveBtn = document.getElementById('saveBtn');
const notesContainer = document.getElementById('notesContainer');

// 1. READ FUNCTION - Get notes from backend and render them
async function fetchNotes() {
    try {
        const response = await fetch(API_URL);
        const notes = await response.json();
        
        notesContainer.innerHTML = ''; // Clear container out before reloading
        
        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content || ''}</p>
                <small>${new Date(note.created_at).toLocaleString()}</small>
            `;
            notesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

// 2. WRITE FUNCTION - Send a new note to the backend
saveBtn.addEventListener('click', async () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title) return alert('Please enter a title!');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (response.ok) {
            // Clear inputs
            noteTitle.value = '';
            noteContent.value = '';
            // Refresh list to show the new note
            fetchNotes();
        }
    } catch (error) {
        console.error('Error saving note:', error);
    }
});

// Load existing notes immediately when the page opens
fetchNotes();