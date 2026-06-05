import { useEffect, useMemo, useRef, useState } from 'react';
import { apiJson, toArray } from '../../../api/client';
import { getUserId, getUserName } from '../../../utils/user';

const avatarStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  backgroundColor: '#dbeafe',
  color: '#0a3663',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  flexShrink: 0,
};

const getThreadId = (thread) => (
  thread?.uuid ||
  thread?.threadId ||
  thread?.id ||
  thread?.recipientId ||
  thread?.participantId ||
  thread?.userId ||
  ''
);

const getThreadIds = (thread) => [
  thread?.uuid,
  thread?.threadId,
  thread?.id,
  thread?.recipientId,
  thread?.participantId,
  thread?.userId,
  thread?.recipient?.uuid,
  thread?.recipient?.id,
  thread?.participant?.uuid,
  thread?.participant?.id,
].filter(Boolean).map((id) => String(id));

const doesThreadMatchId = (thread, threadId) => {
  if (!thread || threadId == null) return false;
  const normalizedId = String(threadId);
  return getThreadIds(thread).includes(normalizedId);
};

const getThreadRecipientId = (thread, currentUserId) => {
  if (!thread) return '';

  if (thread?.user1Id && thread?.user2Id) {
    const user1Id = String(thread.user1Id);
    const user2Id = String(thread.user2Id);
    const currentId = String(currentUserId || '');

    if (currentId && user1Id === currentId && user2Id) return user2Id;
    if (currentId && user2Id === currentId && user1Id) return user1Id;

    return user2Id || user1Id || '';
  }

  return (
    thread?.recipientId ||
    thread?.participantId ||
    thread?.userId ||
    thread?.recipient?.uuid ||
    thread?.recipient?.id ||
    thread?.participant?.uuid ||
    thread?.participant?.id ||
    ''
  );
};

const getPersonName = (person) => {
  const fullName = `${person?.firstName || ''} ${person?.lastName || ''}`.trim();
  return fullName || person?.username || person?.name || '';
};

const getThreadName = (thread) => (
  thread?.name ||
  thread?.recipientName ||
  thread?.participantName ||
  getPersonName(thread?.recipient) ||
  getPersonName(thread?.participant) ||
  getPersonName(thread?.user) ||
  'Rozmowa'
);

const getInitialsFromName = (name) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (initials || 'R').toLocaleUpperCase('pl-PL');
};

const getMessageContent = (message) => (
  message?.content ||
  message?.text ||
  message?.message ||
  ''
);

const getMessageDate = (message) => (
  message?.createdDate ||
  message?.createdAt ||
  message?.sentAt ||
  message?.time ||
  ''
);

const getMessageSenderId = (message) => (
  message?.senderId ||
  message?.sender?.uuid ||
  message?.sender?.id ||
  message?.fromId ||
  message?.authorId ||
  message?.sender?.userId ||
  ''
);

const getMessageSenderName = (message, currentUserId, currentUserName, activePartnerName) => {
  const sender = message?.sender || message?.from || message?.author || {};
  const senderName = `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim();

  if (senderName) return senderName;
  if (sender?.name) return sender.name;
  if (sender?.username) return sender.username;
  if (sender?.fullName) return sender.fullName;
  if (sender?.displayName) return sender.displayName;

  const senderId = getMessageSenderId(message);
  const normalizedCurrentId = String(currentUserId || '');
  const normalizedSenderId = String(senderId || '');

  if (normalizedSenderId && normalizedSenderId === normalizedCurrentId) {
    return currentUserName || 'Ty';
  }

  if (activePartnerName && normalizedSenderId && normalizedSenderId !== normalizedCurrentId) {
    return activePartnerName;
  }

  return message?.senderName || message?.fromName || message?.authorName || '';
};

const formatMessageTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return isToday
    ? date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pl-PL');
};

const parseUserFromEndpoint = (data) => {
  const users = toArray(data, ['users', 'user']);
  if (users.length > 0) return users[0];
  if (data?.user) return data.user;
  return data;
};

const getThreadLastMessage = (thread) => (
  thread?.lastMsg ||
  thread?.lastMessage ||
  thread?.lastMessageContent ||
  getMessageContent(thread?.lastMessageObject) ||
  ''
);

const getThreadUnreadCount = (thread) => Number(thread?.unreadCount || thread?.unread || 0);

const isOwnMessage = (message, currentUserId) => {
  if (typeof message?.isMine === 'boolean') return message.isMine;
  if (typeof message?.mine === 'boolean') return message.mine;

  const senderId = message?.senderId || message?.sender?.uuid || message?.sender?.id;

  return Boolean(currentUserId && senderId && String(senderId) === String(currentUserId));
};

export default function Wiadomosci({ user }) {
  const currentUserId = getUserId(user);
  const [currentUserName, setCurrentUserName] = useState(getUserName(user));
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('');
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [threadPartnerNames, setThreadPartnerNames] = useState({});
  const messagesEndRef = useRef(null);
  const previousThreadIdRef = useRef('');
  const previousMessagesLengthRef = useRef(0);
  const previousLastMessageIdRef = useRef('');

  const activeThread = useMemo(
    () => activeThreadId ? threads.find((thread) => doesThreadMatchId(thread, activeThreadId)) : null,
    [activeThreadId, threads]
  );

  const activeConversationName = useMemo(
    () => activeThreadId ? threadPartnerNames[activeThreadId] || getThreadName(activeThread) : '',
    [activeThreadId, threadPartnerNames, activeThread]
  );

  const filteredThreads = useMemo(
    () => threads.filter((thread) =>
      getThreadName(thread).toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [searchTerm, threads]
  );

  const fetchThreads = async () => {
    setIsLoadingThreads(true);
    setError('');

    try {
      const data = await apiJson('/api/messaging/threads');
      const nextThreads = toArray(data, ['threads']);

      setThreads(nextThreads);

      if (nextThreads.length > 0) {
        const hasActiveThread = activeThreadId && nextThreads.some((thread) => doesThreadMatchId(thread, activeThreadId));
        if (!activeThreadId || !hasActiveThread) {
          setActiveThreadId(getThreadId(nextThreads[0]));
        }
      } else {
        setActiveThreadId('');
        setMessages([]);
      }
    } catch (fetchError) {
      console.error('Błąd pobierania wątków wiadomości:', fetchError);
      setError('Nie udało się pobrać wiadomości z backendu.');
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const fetchThreadMessages = async (threadId) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    try {
      const data = await apiJson(`/api/messaging/thread/${threadId}`);
      setMessages(toArray(data, ['messages']));
    } catch (fetchError) {
      console.error('Błąd pobierania wiadomości wątku:', fetchError);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await apiJson('/api/user');
        const userData = parseUserFromEndpoint(data);
        if (userData) setCurrentUserName(getUserName(userData));
      } catch (fetchError) {
        console.error('Błąd pobierania danych użytkownika:', fetchError);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!threads.length || !currentUserId) return;

    const threadsToFetch = threads.filter((thread) => {
      const threadId = getThreadId(thread);
      if (!threadId) return false;
      if (threadPartnerNames[threadId]) return false;
      return getThreadName(thread) === 'Rozmowa';
    });

    if (threadsToFetch.length === 0) return;

    let cancelled = false;

    const fetchNames = async () => {
      const fetchedNames = {};

      await Promise.all(threadsToFetch.map(async (thread) => {
        const threadId = getThreadId(thread);
        const partnerId = getThreadRecipientId(thread, currentUserId);
        if (!threadId || !partnerId) return;

        try {
          const data = await apiJson(`/api/user/${partnerId}`);
          const partnerData = parseUserFromEndpoint(data);
          if (!cancelled && partnerData) {
            fetchedNames[threadId] = getUserName(partnerData);
          }
        } catch (fetchError) {
          console.error('Błąd pobierania danych partnera czatu:', fetchError);
        }
      }));

      if (!cancelled && Object.keys(fetchedNames).length > 0) {
        setThreadPartnerNames((prev) => ({ ...prev, ...fetchedNames }));
      }
    };

    fetchNames();

    return () => {
      cancelled = true;
    };
  }, [threads, currentUserId, threadPartnerNames]);

  useEffect(() => {
    fetchThreads();

    const threadsInterval = setInterval(() => {
      fetchThreads();
    }, 10000);

    return () => clearInterval(threadsInterval);
  }, [currentUserId, activeThreadId]);

  useEffect(() => {
    fetchThreadMessages(activeThreadId);

    if (!activeThreadId) return undefined;

    const messagesInterval = setInterval(() => {
      fetchThreadMessages(activeThreadId);
    }, 10000);

    return () => clearInterval(messagesInterval);
  }, [activeThreadId]);

  useEffect(() => {
    if (!messagesEndRef.current) return;

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastMessageId =
      lastMessage?.uuid ||
      lastMessage?.id ||
      lastMessage?.messageId ||
      lastMessage?.createdDate ||
      lastMessage?.sentAt ||
      lastMessage?.updatedAt ||
      '';

    const shouldScroll =
      Boolean(activeThreadId) &&
      (
        previousThreadIdRef.current !== activeThreadId ||
        messages.length > previousMessagesLengthRef.current ||
        (messages.length > 0 && lastMessageId && lastMessageId !== previousLastMessageIdRef.current)
      );

    if (shouldScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    previousThreadIdRef.current = activeThreadId;
    previousMessagesLengthRef.current = messages.length;
    previousLastMessageIdRef.current = lastMessageId;
  }, [messages, activeThreadId]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const content = newMessage.trim();
    if (!content || !activeThread) return;

    const recipientId = getThreadRecipientId(activeThread, currentUserId);

    if (!recipientId) {
      alert('Nie można wysłać wiadomości bez odbiorcy z backendu.');
      return;
    }

    try {
      await apiJson('/api/messaging/send', {
        method: 'POST',
        json: {
          recipientId,
          content,
        },
      });

      setNewMessage('');
      await fetchThreadMessages(activeThreadId);
      await fetchThreads();
    } catch (sendError) {
      console.error('Błąd wysyłania wiadomości:', sendError);
      alert('Nie udało się wysłać wiadomości.');
    }
  };

  return (
    <div className="subpage-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="subpage-header">
        <div>
          <h1 style={{ fontWeight: 'bold' }}>Wiadomości</h1>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="search-wrapper" style={{ marginBottom: '20px', width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Szukaj..."
              className="search-input"
              style={{ width: '100%' }}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="contacts-list">
            {isLoadingThreads && threads.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#718096' }}>Ładowanie rozmów...</p>
            ) : filteredThreads.length > 0 ? (
              filteredThreads.map((thread, index) => {
                const threadId = getThreadId(thread);
                const isSelected = activeThreadId && doesThreadMatchId(thread, activeThreadId);
                const threadName = threadPartnerNames[threadId] || getThreadName(thread);
                const unreadCount = getThreadUnreadCount(thread);

                return (
                  <div
                    key={threadId || `thread-${index}`}
                    className={`contact-item ${isSelected ? 'active-contact' : ''}`}
                    onClick={() => threadId && setActiveThreadId(threadId)}
                  >
                    <div style={avatarStyle}>{getInitialsFromName(threadName)}</div>
                    <div className="contact-info">
                      <div className="contact-header">
                        <h4>{threadName}</h4>
                        <span className="contact-time">{formatMessageTime(thread.lastMessageDate || thread.updatedAt || thread.createdAt)}</span>
                      </div>
                      <div className="contact-footer">
                        {getThreadLastMessage(thread) ? (
                          <p className="contact-last-msg">{getThreadLastMessage(thread)}</p>
                        ) : null}
                        {unreadCount > 0 && (
                          <span className="unread-badge">{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#718096' }}>
                {error || 'Brak rozmów do wyświetlenia.'}
              </p>
            )}
          </div>
        </div>

        <div className="chat-window">
          {activeThread ? (
            <>
              <div className="chat-window-header">
                <div style={{ ...avatarStyle, width: '35px', height: '35px' }}>
                  {getInitialsFromName(activeConversationName || getThreadName(activeThread))}
                </div>
                <h4>{activeConversationName || getThreadName(activeThread) || 'Rozmowa'}</h4>
              </div>

              <div className="chat-messages-area">
                {isLoadingMessages && messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#718096' }}>Ładowanie wiadomości...</p>
                ) : messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={message.uuid || message.id || index}
                      className={`message-wrapper ${isOwnMessage(message, currentUserId) ? 'mine' : 'theirs'}`}
                    >
                      <div className="message-sender">
                        {getMessageSenderName(message, currentUserId, currentUserName, activeConversationName)}
                      </div>
                      <div className="message-bubble">
                        {getMessageContent(message)}
                      </div>
                      <span className="message-time">{formatMessageTime(getMessageDate(message))}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ height: '100%' }} />
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Napisz wiadomość..."
                  className="chat-input"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                />
                <button type="submit" style={{ display: 'none' }}></button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#a0aec0' }}>
              Wybierz rozmowę, aby rozpocząć
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
