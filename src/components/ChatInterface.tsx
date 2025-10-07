import { Component, Show } from 'solid-js';
import { createAGUIService } from '../services/agui-service';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatInterface: Component = () => {
  const chatService = createAGUIService();

  return (
    <div class="flex flex-col h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b px-6 py-4">
        <div class="flex justify-between items-center">
          <div class="text-xl font-semibold text-gray-900">
            <div class="flex items-center space-x-2">
              <span class="text-blue-600">SolidJS + TailwindCSS</span>
              <span class="text-gray-400">↔</span>
              <span class="text-green-600 font-bold">AG-UI Protocol</span>
              <span class="text-gray-400">↔</span>
              <span class="text-purple-600">PydanticAI</span>
            </div>
            <div class="text-xs text-gray-500 mt-1 font-normal">
              Real-time AI chat via Server-Sent Events
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              onClick={chatService.clearMessages}
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Clear Chat
            </button>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Connected</span>
            </div>
          </div>
        </div>
      </header>

      <Show when={chatService.error()}>
        <div class="bg-red-50 border-l-4 border-red-400 p-4">
          <div class="flex">
            <div class="ml-3">
              <p class="text-sm text-red-700">
                Error: {chatService.error()}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <main class="flex-1 flex flex-col min-h-0">
        <Show
          when={chatService.messages().length > 0}
          fallback={
            <div class="flex-1 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <div class="text-4xl mb-4">💬</div>
                <h2 class="text-lg font-medium mb-2">Welcome to AG-UI Chat</h2>
                <p class="text-sm">
                  Start a conversation with the PydanticAI-powered assistant.
                </p>
                <p class="text-xs mt-2 text-gray-400">
                  Try asking about calculations, searching knowledge, or general questions.
                </p>
              </div>
            </div>
          }
        >
          <MessageList
            messages={chatService.messages()}
            isLoading={chatService.isLoading()}
          />
        </Show>

        <MessageInput
          onSendMessage={chatService.sendMessageWithAGUI}
          disabled={chatService.isLoading()}
        />
      </main>
    </div>
  );
};

export default ChatInterface;