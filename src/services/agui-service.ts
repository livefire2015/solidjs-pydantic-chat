import { createSignal } from 'solid-js';
import type { AGUIMessage, AGUIRequest, AGUIState, StreamEvent } from './types';

export interface ChatService {
  messages: () => AGUIMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: () => boolean;
  error: () => string | null;
  clearMessages: () => void;
}

export function createAGUIService(): ChatService {
  const [messages, setMessages] = createSignal<AGUIMessage[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const endpoint = 'http://localhost:8000/agent';

  const sendMessage = async (content: string) => {
    if (isLoading()) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: AGUIMessage = {
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Simple request format matching backend ChatRequest
      const request = {
        messages: [...messages(), userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle simple JSON response
      const data = await response.json();

      if (data.message) {
        const assistantMessage: AGUIMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No message in response');
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearMessages
  };
}