import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, addMessage } from '../../features/messages/messageSlice';
import socketService from '../../services/socket';
import api from '../../services/api';
import UserProfileModal from './UserProfileModal';

export default function ChatWindow({ conversation, onToast }) {
  const dispatch = useDispatch();
  const { messages, messagesLoading } = useSelector((s) => s.messages);
  const { user } = useSelector((s) => s.auth);

  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    setFiles((prev) => {
      // avoid duplicates by name+size (simple heuristic)
      const map = new Map(prev.map((f) => [f.name + ':' + f.size, f]));
      for (const f of incoming) {
        const key = f.name + ':' + f.size;
        if (!map.has(key)) map.set(key, f);
      }
      return Array.from(map.values());
    });
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const messagesWrapperRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ================= FETCH + SOCKET ================= */
  useEffect(() => {
    if (!conversation?._id) return;

    dispatch(fetchMessages({ conversationId: conversation._id }));

    socketService.emit('join_conversation', conversation._id);

    const handleNewMessage = (data) => {
      dispatch(addMessage({ message: data.message }));
    };

    socketService.on('new_message', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.emit('leave_conversation', conversation._id);
    };
  }, [conversation?._id, dispatch]);

  /* ================= AUTO SCROLL (container only) ================= */
  useEffect(() => {
    const el = messagesWrapperRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setSending(true);
    try {
      const formData = new FormData();

      if (content.trim()) formData.append('content', content);

      files.forEach((file) => formData.append('files', file));

      await api.post(`/messages/${conversation._id}`, formData);

      setContent('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = null;

      onToast?.({ message: 'Message sent', type: 'success' });
    } catch (err) {
      onToast?.({ message: 'Failed to send message', type: 'error' });
    }
    setSending(false);
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Select a conversation
      </div>
    );
  }

  const currentUserId = user?._id || user?.id;
  const isClient = String(conversation.clientId?._id) === String(currentUserId);
  const otherUser = isClient ? conversation.freelancerId : conversation.clientId;
  const myRole = isClient ? 'Client' : 'Freelancer';
  const otherRole = isClient ? 'Freelancer' : 'Client';
  const gigTitle = conversation.gigTitle || conversation.gigId?.title || 'Project';
  
  const lastMyMessageId = (() => {
    const mine = messages.filter((m) => (String(m.senderId?._id) === String(currentUserId) || String(m.senderId?.id) === String(currentUserId)));
    return mine.length ? mine[mine.length - 1]._id : null;
  })();

  /* ================= UI ================= */
  return (
    <div className="flex h-full flex-col">

      {/* HEADER */}
      <div className="border-b border-slate-700 bg-slate-900/50 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                onClick={() => {
                  setSelectedUserId(otherUser?._id);
                  setShowProfileModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 font-medium text-slate-200 hover:text-cyan-300 transition cursor-pointer"
                title="View profile"
              >
                {otherUser?.profilePhoto ? (
                  <img
                    src={otherUser.profilePhoto}
                    alt="profile"
                    className="h-6 w-6 rounded-md object-cover border border-slate-700"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-md bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-slate-700">
                    {otherUser?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span>{otherUser?.name}</span>
                <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  {otherRole}
                </span>
              </button>
            </div>
            
            {/* Gig Title - More Prominent */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-emerald-300">📋</span>
              <span className="text-emerald-300 font-medium truncate">{gigTitle}</span>
            </div>
            
            <div className="text-[11px] text-slate-500 mt-0.5">
              You: {myRole}
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div ref={messagesWrapperRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-3 pr-2">

        {messagesLoading ? (
          <p className="text-center text-slate-400">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-400">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isMe =
              String(msg.senderId?._id) === String(currentUserId) ||
              String(msg.senderId?.id) === String(currentUserId);

            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-end gap-2 max-w-[75%]">

                  {/* OTHER USER AVATAR */}
                  {!isMe && (
                    <button
                      onClick={() => {
                        setSelectedUserId(msg.senderId?._id);
                        setShowProfileModal(true);
                      }}
                      className="h-7 w-7 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-xs text-white cursor-pointer ring-2 ring-transparent hover:ring-cyan-500 transition-all shrink-0"
                      title="View profile"
                    >
                      {msg.senderId?.profilePhoto ? (
                        <img
                          src={msg.senderId.profilePhoto}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        msg.senderId?.name?.[0]?.toUpperCase()
                      )}
                    </button>
                  )}

                  {/* MESSAGE BUBBLE */}
                  <div className={`px-3 py-2 rounded-lg text-sm ${
                    isMe ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-100'
                  }`}>

                    {msg.content && <p>{msg.content}</p>}

                    {/* ATTACHMENTS */}
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((a, i) => {
                          const isImage = a.fileType?.startsWith('image/');
                          return (
                            <div key={i}>
                              {isImage ? (
                                <img
                                  src={a.fileUrl}
                                  alt={a.fileName}
                                  className="max-h-44 rounded border border-slate-600 cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(a.fileUrl, '_blank')}
                                />
                              ) : (
                                <a
                                  href={a.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs underline hover:text-cyan-300"
                                >
                                  📎 {a.fileName}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-[10px] opacity-60 mt-1 flex items-center justify-between gap-4">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMe && msg._id === lastMyMessageId && (
                        <span className={`ml-auto ${msg.read ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {msg.read ? 'Seen' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MY AVATAR */}
                  {isMe && (
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center text-xs text-white">
                      {user?.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user?.name?.[0]?.toUpperCase()
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div />
      </div>

      {/* FILE PREVIEW */}
      {files.length > 0 && (
        <div className="mx-4 border border-slate-700 rounded p-2 text-xs bg-slate-900 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Attachments ({files.length})</span>
            <button type="button" onClick={clearFiles} className="flex items-center gap-1 rounded px-2 py-1 text-red-300 hover:text-white hover:bg-red-600/20">
              <span>✖</span>
              <span>Cut</span>
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {files.map((f, i) => (
              <div key={i} className="truncate">📎 {f.name}</div>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <form onSubmit={handleSend} className="flex gap-2 px-4 pt-2 pb-3">

        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type message..."
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-white outline-none"
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-700 px-3 rounded text-white hover:bg-slate-600"
        >
          📎
        </button>

        <button
          disabled={sending}
          className="bg-cyan-600 px-4 rounded text-white disabled:opacity-50 hover:bg-cyan-500"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
}
