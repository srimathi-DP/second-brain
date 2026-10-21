import { useMemo, useState } from "react";

const STORAGE_KEY = "second-brain-notes";

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Notes() {
  const [notes, setNotes] = useState(loadNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  function saveNotes(updatedNotes) {
    setNotes(updatedNotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      setMessage("Add both a title and note content.");
      return;
    }

    let updatedNotes;

    if (editingId !== null) {
      updatedNotes = notes.map((note) =>
        note.id === editingId
          ? { ...note, title: cleanTitle, content: cleanContent }
          : note
      );
      setMessage("Note updated.");
    } else {
      updatedNotes = [
        {
          id: crypto.randomUUID(),
          title: cleanTitle,
          content: cleanContent,
          date: new Date().toLocaleDateString(),
        },
        ...notes,
      ];
      setMessage("Note saved.");
    }

    saveNotes(updatedNotes);
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  function editNote(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteNote(id) {
    saveNotes(notes.filter((note) => note.id !== id));
    if (editingId === id) cancelEdit();
    setMessage("Note deleted.");
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setMessage("");
  }

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, search]);

  return (
    <div className="notes-page">
      <div className="notes-background-curves" aria-hidden="true">
  <svg viewBox="0 0 1200 1600" preserveAspectRatio="none">
  <path d="M-100 150 C100 30 220 260 390 150 S650 45 790 190 S1040 300 1300 110" />
  <path d="M-100 520 C110 390 250 650 430 510 S680 390 820 540 S1060 650 1300 450" />
  <path d="M-100 900 C110 770 260 1030 440 890 S700 770 840 930 S1080 1040 1300 820" />
  <path d="M-100 1280 C120 1150 280 1410 460 1270 S720 1140 860 1300 S1090 1420 1300 1200" />
  <path d="M-100 1530 C130 1410 300 1640 500 1510 S760 1390 900 1530 S1120 1630 1300 1460" />
</svg>
</div>
      <header className="sb-page-header">
        <span>03 / PERSONAL KNOWLEDGE</span>
        <h1>
          Capture ideas.
          <br />
          <strong>Keep them close.</strong>
        </h1>
        <p>Write, edit, search, and revisit your study notes.</p>
      </header>

      <section className="sb-panel">
        <h2>{editingId ? "Edit note" : "Create a note"}</h2>

        <form className="sb-form" onSubmit={handleSubmit}>
          <label htmlFor="note-title">NOTE TITLE</label>
          <input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter a title"
            maxLength={120}
            required
          />

          <label htmlFor="note-content">NOTE CONTENT</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your notes here..."
            rows={7}
            required
          />

          <div className="sb-actions">
            <button type="submit">
              {editingId ? "UPDATE NOTE ↗" : "SAVE NOTE ↗"}
            </button>

            {editingId && (
              <button
                className="sb-secondary"
                type="button"
                onClick={cancelEdit}
              >
                CANCEL
              </button>
            )}
          </div>

          {message && <p role="status">{message}</p>}
        </form>
      </section>

      <section className="sb-panel">
        <h2>Your notes · {notes.length}</h2>

        <div className="sb-form">
          <label htmlFor="note-search">SEARCH NOTES</label>
          <input
            id="note-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles or note content"
          />
        </div>

        {filteredNotes.length === 0 ? (
          <p className="notes-empty">
            {notes.length === 0
              ? "Your saved notes will appear here."
              : "No notes match that search."}
          </p>
        ) : (
          filteredNotes.map((note) => (
            <article className="sb-note" key={note.id}>
              <small>{note.date}</small>
              <h3>{note.title}</h3>
              <p className="sb-note-content">{note.content}</p>

              <div className="sb-actions">
                <button type="button" onClick={() => editNote(note)}>
                  EDIT
                </button>
                <button
                  className="sb-secondary"
                  type="button"
                  onClick={() => deleteNote(note.id)}
                >
                  DELETE
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}