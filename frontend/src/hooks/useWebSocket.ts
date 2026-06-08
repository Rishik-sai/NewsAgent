import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { normalizeLanguageCode } from './useTranslation';

type Message = {
    role: 'user' | 'agent';
    content?: string;
    type?: 'status' | 'response' | 'error';
    data?: any;
};

export const useWebSocket = (clientId: string, initialConversationId: string | null = null, agentType: string = 'general') => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const wsRef = useRef<WebSocket | null>(null);
    const conversationIdRef = useRef<string | null>(initialConversationId);
    const retryCountRef = useRef(0);
    const maxRetries = 10;
    
    const { user } = useAuth();
    
    // Keep user's language fresh for the useCallback closure
    const languageRef = useRef(normalizeLanguageCode(user?.languages || 'en'));
    useEffect(() => {
        languageRef.current = normalizeLanguageCode(user?.languages || 'en');
    }, [user?.languages]);

    // Keep the ref in sync with state
    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    useEffect(() => {
        setConversationId(initialConversationId);
        conversationIdRef.current = initialConversationId;
        if (initialConversationId) {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            fetch(`${baseUrl}/api/chat/conversations/${initialConversationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMessages(data);
            })
            .catch(console.error);
        } else {
            setMessages([]);
        }
    }, [initialConversationId]);

    const wsBase = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/api/chat/ws';

    useEffect(() => {
        let isMounted = true;
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            // Build WebSocket URL with JWT token for authentication
            const token = localStorage.getItem('token');
            const wsUrl = token
                ? `${wsBase}/${clientId}?token=${encodeURIComponent(token)}`
                : `${wsBase}/${clientId}`;

            ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (isMounted) {
                    setStatus('connected');
                    retryCountRef.current = 0; // Reset retry count on successful connection
                }
            };
            ws.onclose = () => {
                if (isMounted) {
                    setStatus('disconnected');
                    // Exponential backoff reconnection
                    if (retryCountRef.current < maxRetries) {
                        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                        retryCountRef.current += 1;
                        reconnectTimeout = setTimeout(() => {
                            if (isMounted) {
                                setStatus('connecting');
                                connect();
                            }
                        }, delay);
                    }
                }
            };
            ws.onerror = () => {
                if (isMounted) setStatus('disconnected');
            };
            
            ws.onmessage = (event) => {
                if (!isMounted) return;
                const data = JSON.parse(event.data);
                
                if (data.type === 'conversation_created') {
                    setConversationId(data.conversation_id);
                    conversationIdRef.current = data.conversation_id;
                    window.history.replaceState({}, '', `/?c=${data.conversation_id}`);
                } else if (data.type === 'status') {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'agent' && last.type === 'status') {
                            return [...prev.slice(0, -1), { role: 'agent', type: 'status', content: data.message }];
                        }
                        return [...prev, { role: 'agent', type: 'status', content: data.message }];
                    });
                } else if (data.type === 'stream_chunk') {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'agent') {
                            if (last.type === 'response') {
                                const currentText = last.data?.message || '';
                                return [...prev.slice(0, -1), { 
                                    ...last, 
                                    type: 'response', 
                                    data: { ...last.data, message: currentText + data.content } 
                                }];
                            } else if (last.type === 'status') {
                                return [...prev.slice(0, -1), { 
                                    role: 'agent', 
                                    type: 'response', 
                                    data: { message: data.content } 
                                }];
                            }
                        }
                        return [...prev, { role: 'agent', type: 'response', data: { message: data.content } }];
                    });
                } else if (data.type === 'response') {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'agent' && (last.type === 'status' || last.type === 'response')) {
                            return [...prev.slice(0, -1), { role: 'agent', type: 'response', data: data.data }];
                        }
                        return [...prev, { role: 'agent', type: 'response', data: data.data }];
                    });
                } else if (data.type === 'error') {
                    setMessages(prev => [...prev, { role: 'agent', type: 'error', content: data.message }]);
                }
            };
        };

        connect();

        return () => {
            isMounted = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) {
                // To prevent 'WebSocket is closed before connection is established' warning in React Strict Mode
                if (ws.readyState === 1) { // OPEN
                    ws.close();
                } else {
                    // It's still connecting. Close it after it connects, or just forcefully close.
                    ws.onopen = () => ws?.close();
                    ws.close();
                }
            }
        };
    }, [wsBase, clientId]);

    const sendMessage = useCallback((content: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const language = languageRef.current;

            // Use ref to get the latest conversationId (avoids stale closure)
            const currentConvId = conversationIdRef.current;
            wsRef.current.send(JSON.stringify({ 
                query: content, 
                language, 
                conversation_id: currentConvId ? parseInt(currentConvId) : null,
                agent_type: agentType
            }));
            setMessages(prev => [...prev, { role: 'user', content }]);
        }
    }, []);

    return { messages, status, sendMessage, conversationId };
};
