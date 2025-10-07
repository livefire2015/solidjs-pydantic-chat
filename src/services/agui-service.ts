import { createSignal } from 'solid-js';
import type { AGUIMessage, AGUIRequest, AGUIState, StreamEvent, BaseEvent } from './types';
import { AG_UI_EVENT_TYPES } from './types';

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
      // Create request for AG-UI streaming endpoint
      const request = {
        messages: [...messages(), userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      const response = await fetch('http://localhost:8000/agent/stream', {
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

            try {
              const event: BaseEvent = JSON.parse(data);
              console.log('AG-UI Event:', event);

              switch (event.type) {
                case AG_UI_EVENT_TYPES.RUN_STARTED:
                  console.log('Run started:', event);
                  break;

                case AG_UI_EVENT_TYPES.TEXT_MESSAGE_CONTENT:
                  const contentEvent = event as any;
                  assistantMessage = contentEvent.content;

                  // Update or add assistant message
                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      return [...prev.slice(0, -1), { ...lastMessage, content: assistantMessage }];
                    } else {
                      return [...prev, { role: 'assistant', content: assistantMessage, timestamp: Date.now() }];
                    }
                  });
                  break;

                case AG_UI_EVENT_TYPES.RUN_FINISHED:
                  console.log('Run finished:', event);
                  break;

                case AG_UI_EVENT_TYPES.RUN_ERROR:
                  const errorEvent = event as any;
                  setError(errorEvent.error || 'An error occurred');
                  break;

                default:
                  console.log('Unhandled AG-UI event:', event);
              }
            } catch (e) {
              console.warn('Failed to parse AG-UI event:', data, e);
            }
          }
        }
      }

    } catch (err) {
      console.error('Error in AG-UI streaming:', err);
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