import { useState, useEffect, useRef, useCallback } from 'react';

export default function Wiadomosci() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const messagesEndRef = useRef(null);

  // 1. AUTOMATYCZNE POBIERANIE MIESZKAŃCÓW OD RAZU NA STARCIE
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const meRes = await fetch('https://ketyo.online/api/user/me');
        let meData = null;
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.success && data.user) {
            meData = data.user;
            setCurrentUser(meData);
          }
        }

        const usersRes = await fetch('https://ketyo.online/api/user');
        if (usersRes.ok) {
          const data = await usersRes.json();
          const userList = Array.isArray(data) ? data : (data.users || []);
          
          if (meData) {
            const myId = meData.userId || meData.uuid || meData.id;
            setUsers(userList.filter(u => (u.userId || u.uuid || u.id) !== myId));
          } else {
            setUsers(userList);
          }
        }
      } catch (error) {
        console.error('Błąd pobierania danych użytkowników:', error);
      }
    };

    fetchInitialData();
  }, []);

  // 2. ODŚWIEŻANIE WIADOMOŚCI (SILENT POLLING CO 3 SEKUNDY)
  const pollMessages = useCallback(async () => {
    if (!selectedUser) return;
    
    const targetUserId = selectedUser.userId || selectedUser.uuid || selectedUser.id;
    let threadIdToFetch = targetUserId; 

    try {
      const threadsRes = await fetch('https://ketyo.online/api/messaging/threads');
      if (threadsRes.ok) {
        const threadsData = await threadsRes.json();
        const allThreads = Array.isArray(threadsData) ? threadsData : (threadsData.threads || []);
        
        for (const t of allThreads) {
          if (JSON.stringify(t).includes(targetUserId)) {
            threadIdToFetch = t.threadId || t.uuid || t.id || targetUserId;
            break;
          }
        }
      }

      const msgRes = await fetch(`https://ketyo.online/api/messaging/thread/${threadIdToFetch}`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        const msgList = Array.isArray(data) ? data : (data.messages || data.data || []);
        setMessages(prev => JSON.stringify(prev) !== JSON.stringify(msgList) ? msgList : prev);
      } else if (msgRes.status === 404) {
        setMessages([]);
      }
    } catch (error) {
      // Cichy błąd połączenia
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      setMessages([]); 
      pollMessages();  
      
      const intervalId = setInterval(pollMessages, 3000);
      return () => clearInterval(intervalId);
    } else {
      setMessages([]);
    }
  }, [selectedUser, pollMessages, refreshTrigger]);

  // 3. WYSYŁANIE WIADOMOŚCI
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const targetUserId = selectedUser.userId || selectedUser.uuid || selectedUser.id;
    const payload = { recipientId: targetUserId, content: newMessage };
    
    const messageBackup = newMessage;
    setNewMessage(''); 

    try {
      const response = await fetch('https://ketyo.online/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 201) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        const errorText = await response.text();
        alert(`Błąd wysyłania: ${errorText}`);
        setNewMessage(messageBackup); 
      }
    } catch (error) {
      alert('Błąd połączenia z siecią.');
      setNewMessage(messageBackup);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getInitials = (firstName, lastName) => {
    return `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`.toUpperCase() || 'U';
  };

  const isMessageFromMe = (msg) => {
    const myId = currentUser?.userId || currentUser?.uuid || currentUser?.id;
    if (!myId) return false;
    
    if (msg.senderId === myId || msg.authorId === myId) return true;
    if (msg.sender && (msg.sender.userId === myId || msg.sender.id === myId || msg.sender.uuid === myId)) return true;
    
    return false;
  };

  return (
    // ZMIANA: Zewnętrzny wrapper zajmuje równe 100% wysokości strony. 
    // Dodajemy boxSizing: border-box i wewnętrzny padding, dzięki czemu nigdy nie przekroczy ekranu.
    <div style={{ height: '100%', padding: '30px', boxSizing: 'border-box' }}>
      
      {/* GŁÓWNA RAMA CHATU */}
      <div style={{ 
        display: 'flex', 
        height: '100%', 
        backgroundColor: '#ffffff', 
        borderRadius: '15px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
      }}>
        
        {/* =============== LEWY PANEL: STAŁA LISTA MIESZKAŃCÓW =============== */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '25px 20px', borderBottom: '1px solid #edf2f7', flexShrink: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c', margin: '0 0 15px 0' }}>Mieszkańcy</h2>
            <input 
              type="text" 
              placeholder="Wyszukaj po imieniu i nazwisku..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e0',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'white' }}>
            {users
              .filter(u => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                return fullName.includes(userSearchTerm.toLowerCase());
              })
              .map((u, i) => {
              const uId = u.userId || u.uuid || u.id;
              const isSelected = selectedUser && (selectedUser.userId || selectedUser.uuid || selectedUser.id) === uId;
              
              return (
                <div 
                  key={uId || `user-chat-${i}`}
                  onClick={() => setSelectedUser(u)}
                  style={{ 
                    padding: '15px 20px', 
                    cursor: 'pointer',
                    borderBottom: '1px solid #edf2f7',
                    fontSize: '14px',
                    color: '#2d3748',
                    backgroundColor: isSelected ? '#ebf8ff' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f7fafc'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  <strong>{u.firstName} {u.lastName}</strong> {u.homeNumber ? `(lok. ${u.homeNumber})` : ''}
                </div>
              );
            })}
            {users.filter(u => `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 && (
              <div style={{ padding: '15px 20px', color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>
                Nie znaleziono użytkownika
              </div>
            )}
          </div>
        </div>

        {/* =============== PRAWY PANEL: OKNO CZATU =============== */}
        <div style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
          
          {!selectedUser ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a0aec0', fontSize: '16px' }}>
              Wybierz mieszkańca z listy, aby rozpocząć rozmowę
            </div>
          ) : (
            <>
              {/* NAGŁÓWEK CZATU */}
              <div style={{ padding: '20px 30px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                 <div style={{ 
                    width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e2e8f0', 
                    color: '#2b6cb0', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    fontWeight: 'bold', fontSize: '15px', marginRight: '15px'
                  }}>
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d3748' }}>{selectedUser.firstName} {selectedUser.lastName}</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Wątek prywatny</div>
                  </div>
              </div>

              {/* LISTA WIADOMOŚCI (Jedyne miejsce, gdzie pojawia się scroll!) */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: '13px', marginTop: '20px' }}>Brak wcześniejszych wiadomości. Napisz jako pierwszy!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = isMessageFromMe(msg);

                    return (
                      <div key={msg.messageId || msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ 
                          maxWidth: '70%', 
                          padding: '12px 18px', 
                          borderRadius: '20px', 
                          fontSize: '14px',
                          lineHeight: '1.4',
                          backgroundColor: isMine ? '#3182ce' : '#edf2f7',
                          color: isMine ? '#ffffff' : '#2d3748',
                          borderBottomRightRadius: isMine ? '4px' : '20px',
                          borderBottomLeftRadius: !isMine ? '4px' : '20px',
                          wordBreak: 'break-word'
                        }}>
                          {msg.content || msg.text}
                        </div>
                        <div style={{ fontSize: '10px', color: '#a0aec0', marginTop: '5px', margin: isMine ? '0 10px 0 0' : '0 0 0 10px' }}>
                          {msg.sentAt || msg.createdDate ? new Date(msg.sentAt || msg.createdDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute:'2-digit' }) : ''}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* POLE WPISYWANIA WIADOMOŚCI */}
              <form onSubmit={handleSendMessage} style={{ padding: '20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px', flexShrink: 0 }}>
                <input 
                  type="text" 
                  placeholder="Wpisz wiadomość..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: '14px 20px', 
                    borderRadius: '999px', 
                    border: '1px solid #e2e8f0', 
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button 
                  type="submit" 
                  style={{ 
                    backgroundColor: '#3182ce', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '999px', 
                    padding: '0 25px', 
                    fontWeight: 'bold', 
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    opacity: newMessage.trim() ? 1 : 0.5,
                    transition: 'opacity 0.2s'
                  }}
                  disabled={!newMessage.trim()}
                >
                  Wyślij
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}