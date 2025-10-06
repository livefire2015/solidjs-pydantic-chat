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
      const request: AGUIRequest = {
        messages: [...messages(), userMessage],
        state: {
          conversation_id: 'default',
          user_preferences: {},
          context: ''
        },
        tools: [
          {
            name: 'highlight_text',
            description: 'Highlight text in the UI',
            parameters: {
              text: 'string',
              color: 'string'
            }
          }
        ]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const event: StreamEvent = JSON.parse(data);

              switch (event.type) {
                case 'text':
                  assistantMessage += event.data;
                  // Update the last message if it's from assistant, or add new one
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'assistant') {
                      return [...prev.slice(0, -1), { ...last, content: assistantMessage }];
                    } else {
                      return [...prev, { role: 'assistant', content: assistantMessage, timestamp: Date.now() }];
                    }
                  });
                  break;

                case 'tool_call':
                  console.log('Tool call:', event.data);
                  break;

                case 'state_update':
                  console.log('State update:', event.data);
                  break;

                case 'error':
                  setError(event.data.message || 'An error occurred');
                  break;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      // Ensure we have an assistant message
      if (assistantMessage) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return prev; // Already added
          } else {
            return [...prev, { role: 'assistant', content: assistantMessage, timestamp: Date.now() }];
          }
        });
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