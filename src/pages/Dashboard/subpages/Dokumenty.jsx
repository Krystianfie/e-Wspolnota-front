import { useState, useEffect } from 'react';
import { apiFetch, apiJson, apiUrl, toArray } from '../../../api/client';
import { isAdminUser } from '../../../utils/user';

export default function Dokumenty({ user }) {
  const isAdmin = isAdminUser(user);
  const [documentsData, setDocumentsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Zaktualizowany stan domyślny pod Enum z backendu
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('REGULATION'); 
  const [selectedFile, setSelectedFile] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Wszystkie');

  // Słownik mapujący twarde Enumy z bazy na przyjazne etykiety
  const typeLabels = {
    REGULATION: 'Regulamin',
    RESOLUTION: 'Uchwała',
    FINANCIAL: 'Finansowe',
    TECHNICAL: 'Techniczne'
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await apiJson('/api/documents');
      setDocumentsData(toArray(data, ['documents']));
    } catch (error) {
      console.error('Błąd połączenia z API:', error);
      setDocumentsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !newTitle || !newType) {
      alert('Uzupełnij tytuł, kategorię oraz wybierz plik z dysku!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);          
    formData.append('title', newTitle);              
    formData.append('description', newDescription);  
    formData.append('type', newType);                

    try {
      const response = await apiFetch('/api/documents/add', {
        method: 'POST',
        body: formData, 
      });

      if (response.ok || response.status === 201) {
        alert('Dokument został pomyślnie przesłany na serwer!');
        await fetchDocuments(); 
        
        setNewTitle('');
        setNewDescription('');
        setNewType('REGULATION');
        setSelectedFile(null);
        setIsAddModalOpen(false);
      } else {
        alert('Wystąpił błąd serwera podczas wgrywania pliku.');
      }
    } catch (error) {
      console.error('Błąd wysyłania dokumentu:', error);
      alert('Brak połączenia z API.');
    }
  };

  const handleDeleteDocument = async (uuid) => {
    const potwierdzenie = window.confirm('Czy na pewno chcesz bezpowrotnie usunąć ten dokument?');
    if (!potwierdzenie) return;

    try {
      const response = await apiFetch(`/api/documents/delete/${uuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Dokument został usunięty.');
        await fetchDocuments(); 
      } else if (response.status === 401 || response.status === 403) {
        alert('Brak uprawnień do wykonania tej operacji.');
      } else {
        alert('Nie udało się usunąć dokumentu.');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania dokumentu:', error);
    }
  };

  const filtry = ['Wszystkie', 'REGULATION', 'RESOLUTION', 'FINANCIAL', 'TECHNICAL'];

  const safeDataToFilter = Array.isArray(documentsData) ? documentsData : [];
  const filteredDocuments = safeDataToFilter.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeFilter === 'Wszystkie' || doc.type === activeFilter;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="subpage-container">
      <div className="subpage-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ fontWeight: 'bold' }}>Dokumenty</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e2e8f0', padding: '8px 15px', borderRadius: '10px', fontSize: '13px' }}>
            <span style={{ fontWeight: 'bold' }}>Widok: {isAdmin ? 'administrator' : 'użytkownik'}</span>
          </div>

          {isAdmin && (
            <button className="add-btn-blue" onClick={() => setIsAddModalOpen(true)}>
              + Dodaj dokument
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <div className="tabs-row" style={{ margin: 0, border: 'none' }}>
          {filtry.map(f => {
            const displayLabel = f === 'Wszystkie' ? 'Wszystkie' : typeLabels[f];
            
            return (
              <button 
                key={f} 
                className={`tab-pill ${activeFilter === f ? 'tab-blue' : 'tab-white'}`}
                onClick={() => setActiveFilter(f)}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>

        <div className="search-wrapper" style={{ maxWidth: '300px', width: '100%' }}>
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Szukaj dokumentu..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <hr className="divider-line" />

      {isLoading ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Ładowanie bazy dokumentów...</p>
      ) : (
        <div className="tickets-table-container">
          <div className="table-header-row shadow-header">
            <div style={{ width: '25%' }}>Nazwa pliku</div>
            <div style={{ width: '35%' }}>Opis</div>
            <div style={{ width: '15%' }}>Kategoria</div>
            <div style={{ width: '15%' }}>Data dodania</div>
            <div style={{ width: '10%', textAlign: 'center' }}>Akcje</div>
          </div>
          
          <div className="table-body">
            {filteredDocuments.map((doc, index) => {
              const currentUuid = doc.uuid || doc.documentId || doc.id;
              
              return (
                <div key={currentUuid || `doc-${index}`}>
                  <div className="table-row" style={{ alignItems: 'center', padding: '15px 10px' }}>
                    <div style={{ width: '25%', fontWeight: 'bold', color: '#2d3748' }}>
                      📄 {doc.title}
                    </div>
                    <div style={{ width: '35%', color: '#718096', fontSize: '13px', paddingRight: '10px' }}>
                      {doc.description || '---'}
                    </div>
                    <div style={{ width: '15%' }}>
                      <span className="badge-pill badge-grey">{typeLabels[doc.type] || doc.type || 'Inne'}</span>
                    </div>
                    <div style={{ width: '15%', color: '#a0aec0', fontSize: '13px' }}>
                      {doc.uploadDate || doc.createdDate ? new Date(doc.uploadDate || doc.createdDate).toLocaleDateString('pl-PL') : '---'}
                    </div>
                    
                    <div style={{ width: '10%', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
                      <a 
                        href={apiUrl(`/api/documents/${currentUuid}`)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="register-btn"
                        style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', textAlign: 'center' }}
                        title="Pobierz dokument"
                      >
                        Pobierz
                      </a>
                      
                      {isAdmin && (
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#e53e3e' }}
                          title="Usuń dokument z bazy"
                          onClick={() => handleDeleteDocument(currentUuid)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <hr className="divider-line" />
                </div>
              );
            })}
            {filteredDocuments.length === 0 && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Brak dokumentów spełniających kryteria.</p>
            )}
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-box" style={{ width: '380px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-label" style={{ marginTop: 0 }}>Tytuł dokumentu *</h3>
            <input 
              type="text" 
              className="modal-input" 
              placeholder="np. Regulamin porządku domowego"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <h3 className="modal-label">Opis / Uwagi</h3>
            <textarea 
              className="modal-textarea" 
              placeholder="np. Obowiązuje od dnia 01.01.2026 r."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            ></textarea>

            <h3 className="modal-label">Kategoria dokumentu *</h3>
            <select 
              className="modal-input"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{ width: '100%', height: '40px', background: 'white' }}
            >
              <option value="REGULATION">Regulamin</option>
              <option value="RESOLUTION">Uchwała</option>
              <option value="FINANCIAL">Finansowe</option>
              <option value="TECHNICAL">Techniczne</option>
            </select>

            <h3 className="modal-label" style={{ marginTop: '20px' }}>Wybierz plik z dysku *</h3>
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ fontSize: '13px', color: '#4a5568', width: '100%', padding: '5px 0' }}
            />

            <div className="modal-buttons" style={{ marginTop: '35px' }}>
              <button className="modal-btn-save" onClick={handleUploadDocument}>Wgraj plik</button>
              <button className="modal-btn-cancel" onClick={() => setIsAddModalOpen(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
