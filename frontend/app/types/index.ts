export interface User {
    id: number;
    email: string;
    name?: string;
  }
  
  export interface Client {
    id: number;
    name: string;
    emailProvider?: string;
    domain?: string;
     status?: string;
     mailboxes?: number;
  }
  
  export interface Mailbox {
    id: number;
    email: string;
    provider: string;
    status: 'active' | 'expired' | 'refresh';
    client?: Client;
  }
  
  export interface EmailEvent {
    id: number;
    mailbox?: Mailbox;
    subject?: string;
    direction: 'inbound' | 'outbound';
    status: string;
    provider?: string;
    timestamp: string;
    attachments?: Array<{ name?: string; filename?: string }>;
  }