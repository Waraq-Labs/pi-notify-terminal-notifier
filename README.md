# pi-notify-terminal-notifier

A Pi extension that notifies you when the agent is waiting for input.

## Notes

- Requires **macOS**.
- Requires `terminal-notifier` in `PATH`:
  - install with `brew install terminal-notifier`
- Works best in **zellij** by only notifying when the app/pane is in the background.

## Local test

```bash
pi -e /absolute/path/to/pi-notify-terminal-notifier
# or
pi install /absolute/path/to/pi-notify-terminal-notifier
```

## Publish / install

- GitHub install path:
  - `pi install git:github.com/<you>/<repo>@v0.x`
- Or publish to npm and users can install with:
  - `pi install npm:@waraq-labs/pi-notify-terminal-notifier`
