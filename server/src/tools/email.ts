import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { config } from "../config.js";
import type { ToolExecutionResult } from "./types.js";

const MAX_RESULTS_CAP = 15;
const SNIPPET_LENGTH = 600;

export async function searchEmail(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  if (!config.emailConfigured || !config.emailAddress || !config.emailAppPassword) {
    return {
      contentForModel:
        "Error: email search isn't configured on the server. Add EMAIL_ADDRESS and EMAIL_APP_PASSWORD to .env to enable it.",
    };
  }

  const query = String(args.query ?? "").trim();
  if (!query) {
    return { contentForModel: "Error: no search query was provided." };
  }
  const maxResults = Math.min(MAX_RESULTS_CAP, Math.max(1, Number(args.max_results) || 5));

  const client = new ImapFlow({
    host: config.emailImapHost,
    port: config.emailImapPort,
    secure: true,
    auth: { user: config.emailAddress, pass: config.emailAppPassword },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const matches = await client.search({ text: query }, { uid: true });
      if (!matches || matches.length === 0) {
        return { contentForModel: `No emails matched "${query}".` };
      }

      const recentUids = matches.slice(-maxResults).reverse();
      const results: string[] = [];

      for await (const message of client.fetch(recentUids, { envelope: true, source: true }, { uid: true })) {
        const from = message.envelope?.from?.[0];
        const fromLabel = from ? `${from.name ? from.name + " " : ""}<${from.address}>` : "unknown sender";
        const subject = message.envelope?.subject || "(no subject)";
        const date = message.envelope?.date ? new Date(message.envelope.date).toLocaleString() : "unknown date";

        let snippet = "";
        if (message.source) {
          try {
            const parsed = await simpleParser(message.source);
            const bodyText = (parsed.text || "").replace(/\s+/g, " ").trim();
            snippet = bodyText.slice(0, SNIPPET_LENGTH);
          } catch {
            snippet = "(could not parse message body)";
          }
        }

        results.push(`From: ${fromLabel}\nDate: ${date}\nSubject: ${subject}\n${snippet}`);
      }

      return {
        contentForModel: `Found ${results.length} email(s) matching "${query}":\n\n${results.join("\n\n---\n\n")}`,
      };
    } finally {
      lock.release();
    }
  } catch (err) {
    return {
      contentForModel: `Error: could not search email (${err instanceof Error ? err.message : "unknown error"}).`,
    };
  } finally {
    try {
      await client.logout();
    } catch {
      // connection may already be closed
    }
  }
}
