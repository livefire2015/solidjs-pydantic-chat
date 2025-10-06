// AG-UI Protocol Types for TypeScript

export interface AGUIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface AGUIEvent {
  type: string;
  data: any;
}

export interface AGUIToolCall {
  name: string;
  parameters: Record<string, any>;
  id?: string;
}

export interface AGUIState {
  conversation_id: string;
  user_preferences: Record<string, any>;
  context: string;
}

export interface AGUIRequest {
  messages: AGUIMessage[];
  state?: AGUIState;
  tools?: AGUITool[];
}

export interface AGUITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface StreamEvent {
  type: 'text' | 'tool_call' | 'state_update' | 'error' | 'done';
  data: any;
}