import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchConversations, getOrCreateConversation } from '../features/messages/messageSlice';
import ConversationList from '../components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';

const Messages = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [activeConversation, setActiveConversation] = useState(null);
  const { conversations, loading } = useSelector((state) => state.messages);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Handle bidId from notification - create/open conversation
  useEffect(() => {
    const handleBidId = async () => {
      if (location.state?.bidId && !isCreatingConversation) {
        setIsCreatingConversation(true);
        try {
          const result = await dispatch(getOrCreateConversation(location.state.bidId));
          if (result.type === 'messages/getOrCreateConversation/fulfilled') {
            setActiveConversation(result.payload);
          }
        } catch (err) {
          console.error('Failed to create conversation:', err);
        } finally {
          setIsCreatingConversation(false);
          // Clear the state
          window.history.replaceState({}, document.title);
        }
      }
    };
    
    handleBidId();
  }, [location.state, dispatch, isCreatingConversation]);

  // Auto-select conversation from navigation state or latest conversation
  useEffect(() => {
    // If navigated with specific conversationId, select that conversation
    if (location.state?.conversationId && conversations.length > 0) {
      const targetConversation = conversations.find(
        c => c._id === location.state.conversationId
      );
      if (targetConversation) {
        setActiveConversation(targetConversation);
        // Clear the state to prevent re-selection on re-renders
        window.history.replaceState({}, document.title);
        return;
      }
    }
    
    // Otherwise, auto-select the latest conversation
    if (!activeConversation && conversations && conversations.length > 0 && !isCreatingConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation, location.state, isCreatingConversation]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-linear-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            Messages
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Communicate with clients and freelancers about your projects
          </p>
        </div>
        {conversations && conversations.length > 0 && (
          <div className="text-sm text-slate-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="h-[calc(100vh-200px)] rounded-xl border border-slate-700 bg-slate-900 flex overflow-hidden">
      
        {/* LEFT SIDEBAR */}
        <div className="w-80 border-r border-slate-700 bg-slate-950 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100">
              Conversations
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading || isCreatingConversation ? (
              <div className="p-4 text-sm text-slate-400">
                {isCreatingConversation ? 'Opening conversation...' : 'Loading conversations...'}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  No conversations yet
                </p>
                <p className="text-xs text-slate-500">
                  When you hire a freelancer or get hired for a gig, you'll see conversations here
                </p>
              </div>
            ) : (
              <ConversationList
                onSelectConversation={setActiveConversation}
                activeConversation={activeConversation}
              />
            )}
          </div>
        </div>

        {/* RIGHT CHAT WINDOW */}
        <div className="flex-1 flex flex-col bg-slate-900">
          <ChatWindow conversation={activeConversation} />
        </div>
      </div>
    </div>
  );
};

export default Messages;
