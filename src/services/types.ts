// Official AG-UI Protocol Types

// Official AG-UI Event Types (16 standard events)
export const AG_UI_EVENT_TYPES = {
  RUN_STARTED: 'RUN_STARTED',
  RUN_FINISHED: 'RUN_FINISHED',
  RUN_ERROR: 'RUN_ERROR',
  STEP_STARTED: 'STEP_STARTED',
  STEP_FINISHED: 'STEP_FINISHED',
  TEXT_MESSAGE_START: 'TEXT_MESSAGE_START',
  TEXT_MESSAGE_CONTENT: 'TEXT_MESSAGE_CONTENT',
  TEXT_MESSAGE_END: 'TEXT_MESSAGE_END',
  TOOL_CALL_START: 'TOOL_CALL_START',
  TOOL_CALL_ARGS: 'TOOL_CALL_ARGS',
  TOOL_CALL_END: 'TOOL_CALL_END',
  STATE_SNAPSHOT: 'STATE_SNAPSHOT',
  STATE_DELTA: 'STATE_DELTA',
  MESSAGES_SNAPSHOT: 'MESSAGES_SNAPSHOT',
  RAW: 'RAW',
  CUSTOM: 'CUSTOM'
} as const;

export type EventType = typeof AG_UI_EVENT_TYPES[keyof typeof AG_UI_EVENT_TYPES];

// Official AG-UI BaseEvent interface
export interface BaseEvent {
  type: EventType;
  timestamp?: number;
  rawEvent?: any;
}

// Specific event interfaces extending BaseEvent
export interface TextMessageContentEvent extends BaseEvent {
  type: typeof AG_UI_EVENT_TYPES.TEXT_MESSAGE_CONTENT;
  content: string;
  delta?: boolean;
}

export interface ToolCallStartEvent extends BaseEvent {
  type: typeof AG_UI_EVENT_TYPES.TOOL_CALL_START;
  toolName: string;
  toolId?: string;
}

export interface RunStartedEvent extends BaseEvent {
  type: typeof AG_UI_EVENT_TYPES.RUN_STARTED;
  runId: string;
  threadId?: string;
}

export interface RunFinishedEvent extends BaseEvent {
  type: typeof AG_UI_EVENT_TYPES.RUN_FINISHED;
  runId: string;
  result?: any;
}

// Legacy types (for backward compatibility)
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