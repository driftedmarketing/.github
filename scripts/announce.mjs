// Writes one line announcing a push or pull request, in Drifted's voice.
// Uses Claude when ANTHROPIC_API_KEY is set; otherwise picks from the house list.
// Never throws: a failed model call falls back so the announcement always goes out.
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "node:fs";

const ev = JSON.parse(process.env.EVENT_JSON ?? "{}");
const repo = process.env.REPO ?? "a repo";
const actor = process.env.ACTOR ?? "someone";
const kind = process.env.KIND ?? "push"; // push | pr
const ref = (process.env.REF ?? "").replace("refs/heads/", "");
const title = process.env.TITLE ?? "";
const url = process.env.URL ?? "";
const commits = (ev.commits ?? []).map((c) => c.message.split("\n")[0]).slice(0, 8);

const house = [
  "Something moved. Umer has not said yes yet.",
  "New work on the branch. Main is untouched and will stay that way until it is read.",
  "A push landed. It is not live. It is not approved. It is waiting.",
  "Work went up. The gate is closed. That is the point of the gate.",
  "Branch updated. Nobody's client has been affected, which is the correct amount.",
  "There is new work to read. It cannot ship itself.",
];

function fallback() {
  return house[Math.floor(Math.random() * house.length)];
}

async function funnyLine() {
  if (!process.env.ANTHROPIC_API_KEY) return fallback();
  try {
    const client = new Anthropic();
    const facts = [
      `Repo: ${repo}`, `Who: ${actor}`, `What: ${kind === "pr" ? "opened a pull request" : "pushed to a branch"}`,
      ref ? `Branch: ${ref}` : "", title ? `Title: ${title}` : "",
      commits.length ? `Commits:\n- ${commits.join("\n- ")}` : "",
    ].filter(Boolean).join("\n");
    const res = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 200,
      output_config: { effort: "low" },
      system: [
        "You write the one-line announcement that goes to a four-person marketing agency, Drifted Marketing, every time someone's AI agent pushes work to GitHub.",
        "Dry, deadpan, genuinely funny. British understatement, no slapstick. The joke should come from the actual commit messages when they give you something.",
        "Hard rules: no emoji, no exclamation marks, no 'excited', no 'thrilled', no 'leverage', no 'journey', no 'unlock', no 'elevate', no 'seamless'. Never invent a number or a result.",
        "Nothing here is live or approved until Umer reads it. Do not imply otherwise.",
        "Output exactly one sentence, under 30 words, nothing else.",
      ].join(" "),
      messages: [{ role: "user", content: facts }],
    });
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return text.length > 0 && text.length < 240 ? text : fallback();
  } catch {
    return fallback();
  }
}

const line = await funnyLine();
const what = kind === "pr" ? `opened a pull request: ${title}` : `pushed ${commits.length || "new"} commit${commits.length === 1 ? "" : "s"} to ${ref}`;
const subject = `${repo}: ${actor} ${kind === "pr" ? "opened a pull request" : `pushed to ${ref}`}`;
const body = [
  line, "",
  `${actor} ${what} in ${repo}.`,
  commits.length ? commits.map((c) => `  - ${c}`).join("\n") : "",
  "",
  `Read it: ${url}`,
  "",
  "Not live. Not approved. Main only moves when Umer says so.",
].filter((l) => l !== undefined).join("\n");

writeFileSync(process.env.OUT ?? "announce.txt", `${subject}\n\n${body}\n`);
console.log(subject); console.log(body);
