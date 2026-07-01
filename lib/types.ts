export interface Case {
  id: string;
  org_id: string;
  title: string;
  client_name: string | null;
  jurisdiction: string | null;
  court: string | null;
  case_number: string | null;
  parties: { name: string; role?: string }[];
  status: "open" | "active" | "closed";
  visibility: "org" | "private";
  description: string | null;
  opened_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  org_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size: number | null;
  status: "uploaded" | "processing" | "ready" | "failed";
  error: string | null;
  page_count: number | null;
  summary: string | null;
  key_facts: {
    parties?: string[];
    key_dates?: { date: string; event: string }[];
    obligations?: string[];
    amounts?: string[];
  };
  created_at: string;
}

export interface Note {
  id: string;
  case_id: string;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  case_id: string;
  org_id: string;
  doc_type: string;
  title: string;
  content: string;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deadline {
  id: string;
  case_id: string;
  title: string;
  type: "hearing" | "filing" | "reminder";
  due_at: string;
  done: boolean;
}

export interface StrategyItem {
  id: string;
  text: string;
}

export interface Strategy {
  id: string;
  case_id: string;
  objectives: StrategyItem[];
  arguments: StrategyItem[];
  risks: StrategyItem[];
  timeline: StrategyItem[];
}

export interface ChatThread {
  id: string;
  case_id: string;
  title: string;
  created_by: string | null;
  share_token: string | null;
  share_min_role: "member" | "admin" | "owner" | null;
  created_at: string;
}

export interface Citation {
  label: number;
  documentId: string;
  documentName: string;
  page: number | null;
}

export interface AuditLog {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  case_id: string | null;
  summary: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
}
