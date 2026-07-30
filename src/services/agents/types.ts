/**
 * Types communs aux agents
 */

export type AgentRole = 'data' | 'research' | 'portfolio-risk' | 'critic' | 'orchestrator';

export interface AgentMessage {
  role: AgentRole;
  content: string;
  data?: any;
  timestamp: number;
}

export interface AgentContext {
  uid: string;
  query: string;
  ticker?: string;
  previousMessages: AgentMessage[];
  portfolioPositions: any[];
  portfolioConfig: any;
}

export interface AgentResult {
  agent: AgentRole;
  success: boolean;
  data: any;
  modelUsed?: string;
  isGrounded?: boolean;
  searchEntryPointHtml?: string;
  error?: string;
  timestamp: number;
}
