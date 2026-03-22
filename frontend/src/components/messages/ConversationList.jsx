import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentConversation } from '../../features/messages/messageSlice';
import socketService from '../../services/socket';
import UserProfileModal from './UserProfileModal';

const ConversationList = ({ onSelectConversation, activeConversation }) => {
  const dispatch = useDispatch();
  const { conversations, loading } = useSelector((state) => state.messages);
  const { user } = useSelector((state) => state.auth);

  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const handler = (ids) => setOnlineUserIds(ids || []);
    socketService.on('online_users', handler);
    return () => socketService.off('online_users');
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-400">
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-400">
        No conversations yet
      </div>
    );
  }

  // Deduplicate by other user's id, keep latest conversation and sum unread
  const currentUserId = user?._id || user?.id;
  const grouped = new Map();
  for (const conv of conversations) {
    const isClientSide = String(conv.clientId._id) === String(currentUserId);
    const other = isClientSide ? conv.freelancerId : conv.clientId;
    const otherId = String(other?._id);
    const unread = isClientSide ? (conv.clientUnreadCount || 0) : (conv.freelancerUnreadCount || 0);
    const existing = grouped.get(otherId);
    if (!existing) {
      grouped.set(otherId, {
        otherUser: other,
        latest: conv,
        unreadTotal: unread
      });
    } else {
      // Sum unread across conversations with same user
      existing.unreadTotal += unread;
      // Choose latest by lastMessageAt or createdAt
      const a = existing.latest.lastMessageAt || existing.latest.createdAt;
      const b = conv.lastMessageAt || conv.createdAt;
      if (new Date(b) > new Date(a)) {
        existing.latest = conv;
      }
    }
  }

  const deduped = Array.from(grouped.values())
    .sort((x, y) => new Date(y.latest.lastMessageAt || y.latest.createdAt) - new Date(x.latest.lastMessageAt || x.latest.createdAt));

  return (
    <>
    <div className="flex flex-col divide-y divide-slate-800">
      {deduped.map(({ otherUser, latest, unreadTotal }) => {
        const isActive = activeConversation?._id === latest._id;
        const isOnline = onlineUserIds.includes(String(otherUser?._id));
        const gigTitle = latest.gigTitle || latest.gigId?.title || 'Project';
        
        return (
          <div
            key={latest._id}
            onClick={() => {
              dispatch(setCurrentConversation(latest));
              onSelectConversation(latest);
            }}
            className={`cursor-pointer px-4 py-3 transition ${
              isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUserId(otherUser?._id);
                      setShowProfileModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 font-medium text-slate-200 hover:text-cyan-300 transition"
                    title="View profile"
                  >
                    {otherUser?.profilePhoto ? (
                      <img
                        src={otherUser.profilePhoto}
                        alt={otherUser?.name}
                        className="h-6 w-6 rounded-md object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-md bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-slate-700">
                        {otherUser?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{otherUser?.name}</span>
                  </button>
                  {unreadTotal > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                      {unreadTotal}
                    </span>
                  )}
                </div>
                
                {/* Show gig title */}
                <div className="text-[11px] text-emerald-300 font-medium mb-1 truncate">
                  📋 {gigTitle}
                </div>

                <p className="text-xs text-slate-400 truncate">
                  {latest.lastMessage || 'No messages yet'}
                </p>
              </div>
              
              <span className="text-[10px] text-slate-500 shrink-0">
                {latest.lastMessageAt
                  ? new Date(latest.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
    
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
    </>
  );
};

export default ConversationList;
