import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function isInZellij(): boolean {
	return !!(process.env.ZELLIJ || process.env.ZELLIJ_SESSION_NAME || process.env.ZELLIJ_PANE_ID);
}

async function runCommand(command: string, args: string[]): Promise<string | undefined> {
	try {
		const { stdout } = await execFileAsync(command, args, {
			encoding: "utf8",
			timeout: 1_500,
		});
		return stdout;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			console.error(`Command failed (${command}): ${(error as Error).message}`);
		}
		return undefined;
	}
}

function hasPiCommand(line: string): boolean {
	const match = line.match(/command="([^"]+)"/);
	if (!match) return false;
	const cmd = match[1].trim().split(/\s+/)[0] ?? "";
	return cmd === "pi" || cmd.endsWith("/pi");
}

async function isForegroundTerminal(): Promise<boolean> {
	const script =
		"tell application \"System Events\" to return {name of first application process whose frontmost is true, bundle identifier of first application process whose frontmost is true}";
	const result = await runCommand("osascript", ["-e", script]);
	if (!result) {
		return false;
	}

	const [name, bundleId] = result.split(",").map((value) => value.trim());
	const lower = `${name} ${bundleId}`.toLowerCase();

	if (!lower) return false;
	if (lower.includes("terminal") || lower.includes("iterm") || lower.includes("ghostty") || lower.includes("wezterm") || lower.includes("kitty") || lower.includes("alacritty") || lower.includes("vscode") || lower.includes("code")) {
		return true;
	}

	return false;
}

async function isPiPaneFocusedInZellij(): Promise<boolean | null> {
	const layout = await runCommand("zellij", ["action", "dump-layout"]);
	if (!layout) {
		return null;
	}

	let foundPiPane = false;
	let focused = false;

	for (const line of layout.split("\n")) {
		if (!hasPiCommand(line)) {
			continue;
		}

		foundPiPane = true;
		if (line.includes("focus=true")) {
			focused = true;
		}
	}

	if (!foundPiPane) {
		return null;
	}

	return focused;
}

function notifyOSC777(title: string, body: string): void {
	const escapedTitle = title.replace(/[;\u0007\\]/g, " ");
	const escapedBody = body.replace(/[;\u0007\\]/g, " ");
	process.stdout.write(`\x1b]777;notify;${escapedTitle};${escapedBody}\x07`);
}

function notifyWithTerminalNotifier(title: string, subtitle: string, message: string, ctx?: ExtensionContext): void {
	execFile(
		"terminal-notifier",
		[
			"-title",
			title,
			"-subtitle",
			subtitle,
			"-message",
			message,
		],
		(error) => {
			if (!error) return;

			const err = `terminal-notifier failed (${error.code ?? "unknown"}): ${error.message}`;
			console.error(err);
			ctx?.ui?.notify(error.code === "ENOENT" ? "terminal-notifier not found in PATH" : err, "error");

			// Best-effort fallback if notifier isn't available
			notifyOSC777(title, `${subtitle}: ${message}`);
		},
	);
}

async function shouldNotify(): Promise<boolean> {
	if (process.platform !== "darwin") {
		// No reliable focus API on other OSes yet
		return true;
	}

	// If the terminal app itself isn't frontmost, we are definitely "in the background".
	if (!(await isForegroundTerminal())) {
		return true;
	}

	// In zellij, only notify when this pane isn't focused.
	if (isInZellij()) {
		const focused = await isPiPaneFocusedInZellij();
		if (focused === null) {
			return true;
		}
		return !focused;
	}

	return false;
}

async function notifyOnDone(ctx?: ExtensionContext): Promise<void> {
	const title = "Pi";
	const subtitle = "Agent finished";
	const message = "LLM is done. Waiting for your next input.";

	if (!(await shouldNotify())) {
		return;
	}

	if (process.platform === "darwin") {
		notifyWithTerminalNotifier(title, subtitle, message, ctx);
		return;
	}

	notifyOSC777(title, `${subtitle}: ${message}`);
}

export default function (pi: ExtensionAPI) {
	pi.on("agent_end", async (_event, ctx) => {
		await notifyOnDone(ctx);
	});
}
