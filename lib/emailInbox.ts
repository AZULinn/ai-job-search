// 本地模式 - 邮件收件箱功能不可用 (需要 Supabase)

export interface EmailRecord {
  id: string;
  user_id: string;
  from_address: string;
  subject: string;
  received_at: string;
  body_preview: string;
  parsed_company: string | null;
  parsed_position: string | null;
  parsed_action: string;
  parsed_date: string | null;
  confidence: number;
  status: "pending" | "confirmed" | "dismissed";
  synced_tracking_id: string | null;
  created_at: string;
}

export const ACTION_LABELS: Record<string, string> = {
  apply: "投递",
  interview: "面试",
  offer: "Offer",
  reject: "拒绝",
  withdraw: "撤回",
  other: "其他",
};

export async function getOrCreateInbox(): Promise<string | null> {
  return null;
}

export async function loadPendingEmailRecords(): Promise<EmailRecord[]> {
  return [];
}

export async function fetchEmailRecords(): Promise<EmailRecord[]> {
  return [];
}

export async function confirmEmailRecord(_id: string): Promise<void> {
  // 本地模式不可用
}

export async function dismissEmailRecord(_id: string): Promise<void> {
  // 本地模式不可用
}

export async function syncEmailToTracking(_id: string, _jobId: string): Promise<void> {
  // 本地模式不可用
}
