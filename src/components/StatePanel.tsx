import { Component, Show, For, createSignal } from 'solid-js';
import type { AgentState, AgentProposal } from '../services/types';

interface StatePanelProps {
  agentState: AgentState | null;
  isVisible: boolean;
  onToggle: () => void;
}

const StatePanel: Component<StatePanelProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'thoughts' | 'progress' | 'proposals' | 'memory'>('thoughts');

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getProgressColor = (progress: number) => {
    if (progress < 0.3) return 'bg-red-500';
    if (progress < 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div class={`fixed right-0 top-0 h-full bg-white border-l shadow-lg transition-transform duration-300 z-50 ${
      props.isVisible ? 'translate-x-0' : 'translate-x-full'
    }`} style="width: 400px;">

      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-900">Agent State</h3>
        <button
          onClick={props.onToggle}
          class="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <Show
        when={props.agentState}
        fallback={
          <div class="flex items-center justify-center h-64 text-gray-500">
            <div class="text-center">
              <div class="text-2xl mb-2">🤖</div>
              <p>No agent state available</p>
              <p class="text-sm mt-1">Start a conversation to see agent thoughts</p>
            </div>
          </div>
        }
      >
        {(state) => (
          <>
            {/* Current Task */}
            <Show when={state().current_task}>
              <div class="p-4 bg-blue-50 border-b">
                <div class="flex items-center space-x-2 mb-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span class="text-sm font-medium text-blue-900">Current Task</span>
                </div>
                <p class="text-sm text-blue-800 font-medium">{state().current_task}</p>
                <Show when={state().current_step}>
                  <p class="text-xs text-blue-600 mt-1">{state().current_step}</p>
                </Show>

                {/* Progress Bar */}
                <div class="mt-3">
                  <div class="flex justify-between text-xs text-blue-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(state().progress * 100)}%</span>
                  </div>
                  <div class="w-full bg-blue-200 rounded-full h-2">
                    <div
                      class={`h-2 rounded-full transition-all duration-300 ${getProgressColor(state().progress)}`}
                      style={`width: ${state().progress * 100}%`}
                    ></div>
                  </div>
                </div>
              </div>
            </Show>

            {/* Tab Navigation */}
            <div class="flex border-b">
              <button
                onClick={() => setActiveTab('thoughts')}
                class={`flex-1 py-2 px-4 text-sm font-medium ${
                  activeTab() === 'thoughts'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Thoughts ({state().agent_thoughts.length})
              </button>
              <button
                onClick={() => setActiveTab('proposals')}
                class={`flex-1 py-2 px-4 text-sm font-medium ${
                  activeTab() === 'proposals'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Proposals ({state().proposals.length})
              </button>
              <button
                onClick={() => setActiveTab('memory')}
                class={`flex-1 py-2 px-4 text-sm font-medium ${
                  activeTab() === 'memory'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Memory
              </button>
            </div>

            {/* Tab Content */}
            <div class="flex-1 overflow-y-auto">
              <Show when={activeTab() === 'thoughts'}>
                <div class="p-4 space-y-3">
                  <For each={state().agent_thoughts}>
                    {(thought) => (
                      <div class="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-300">
                        <p class="text-sm text-gray-800">{thought}</p>
                      </div>
                    )}
                  </For>
                  <Show when={state().agent_thoughts.length === 0}>
                    <p class="text-gray-500 text-sm text-center py-8">No thoughts recorded yet</p>
                  </Show>
                </div>
              </Show>

              <Show when={activeTab() === 'proposals'}>
                <div class="p-4 space-y-3">
                  <For each={state().proposals}>
                    {(proposal) => (
                      <div class="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-medium text-sm text-yellow-900">{proposal.action}</h4>
                          <span class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            {Math.round(proposal.confidence * 100)}% confident
                          </span>
                        </div>
                        <p class="text-sm text-yellow-800 mb-2">{proposal.description}</p>
                        <details class="text-xs text-yellow-700">
                          <summary class="cursor-pointer font-medium">Reasoning</summary>
                          <p class="mt-1 pl-2">{proposal.reasoning}</p>
                        </details>
                        <Show when={proposal.requires_approval}>
                          <div class="flex space-x-2 mt-3">
                            <button class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                              Approve
                            </button>
                            <button class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                              Reject
                            </button>
                            <button class="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                              Modify
                            </button>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                  <Show when={state().proposals.length === 0}>
                    <p class="text-gray-500 text-sm text-center py-8">No proposals pending</p>
                  </Show>
                </div>
              </Show>

              <Show when={activeTab() === 'memory'}>
                <div class="p-4 space-y-4">
                  {/* Working Memory */}
                  <div class="bg-gray-50 rounded-lg p-3">
                    <h4 class="font-medium text-sm text-gray-900 mb-2">Working Memory</h4>
                    <Show
                      when={Object.keys(state().working_memory).length > 0}
                      fallback={<p class="text-xs text-gray-500">No working memory data</p>}
                    >
                      <For each={Object.entries(state().working_memory)}>
                        {([key, value]) => (
                          <div class="text-xs mb-1">
                            <span class="font-medium text-gray-700">{key}:</span>
                            <span class="text-gray-600 ml-1">{JSON.stringify(value)}</span>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>

                  {/* Reasoning Chain */}
                  <div class="bg-gray-50 rounded-lg p-3">
                    <h4 class="font-medium text-sm text-gray-900 mb-2">Reasoning Chain</h4>
                    <Show
                      when={state().reasoning_chain.length > 0}
                      fallback={<p class="text-xs text-gray-500">No reasoning chain</p>}
                    >
                      <For each={state().reasoning_chain}>
                        {(step, index) => (
                          <div class="text-xs mb-1 flex">
                            <span class="text-gray-400 mr-2">{index() + 1}.</span>
                            <span class="text-gray-700">{step}</span>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>

                  {/* Next Actions */}
                  <div class="bg-gray-50 rounded-lg p-3">
                    <h4 class="font-medium text-sm text-gray-900 mb-2">Next Actions</h4>
                    <Show
                      when={state().next_actions.length > 0}
                      fallback={<p class="text-xs text-gray-500">No planned actions</p>}
                    >
                      <For each={state().next_actions}>
                        {(action) => (
                          <div class="text-xs mb-1 flex items-center">
                            <div class="w-1 h-1 bg-blue-400 rounded-full mr-2"></div>
                            <span class="text-gray-700">{action}</span>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>

            {/* Footer */}
            <div class="p-3 border-t bg-gray-50 text-xs text-gray-500">
              Version: {state().version} | Updated: {formatTime(state().last_updated)}
            </div>
          </>
        )}
      </Show>
    </div>
  );
};

export default StatePanel;