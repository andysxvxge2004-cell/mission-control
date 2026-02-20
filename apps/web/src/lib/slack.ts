const DEFAULT_TIMEOUT_MS = 5000;

export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

export interface SlackMessagePayload {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackSendResult {
  ok: boolean;
  reason?: "missing_webhook_url" | "slack_error";
  status?: number;
  body?: string;
}

function resolveWebhookUrl() {
  return process.env.SLACK_OVERDUE_WEBHOOK_URL ?? process.env.SLACK_WEBHOOK_URL ?? null;
}

export async function sendSlackMessage(payload: SlackMessagePayload, webhookUrl?: string): Promise<SlackSendResult> {
  const url = webhookUrl ?? resolveWebhookUrl();
  if (!url) {
    return { ok: false, reason: "missing_webhook_url" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, reason: "slack_error", status: response.status, body };
    }

    return { ok: true };
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, reason: "slack_error", body: error instanceof Error ? error.message : String(error) };
  }
}
