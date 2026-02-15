# pi-notify-terminal-notifier

`pi-notify-terminal-notifier` is a Pi extension that sends native macOS desktop notifications when the agent is waiting for your input.

It is especially useful when running Pi inside multiplexers like Zellij, where notification escape sequences are not always forwarded.

## Why this exists

Many existing terminal notification tools rely on OSC 777 (or OSC 9). In Zellij, those OSC sequences are not passed through to the underlying terminal, so desktop notifications never fire.

- Zellij discussion: https://github.com/zellij-org/zellij/issues/3954

This extension avoids OSC-based notifications and invokes `terminal-notifier` directly, so notifications still work in that setup.

## Requirements

- **macOS**
- `terminal-notifier` available in `PATH`
  - Install with: `brew install terminal-notifier`

## Install

### From npm

```bash
pi install npm:@waraq-labs/pi-notify-terminal-notifier
```

### From GitHub

```bash
pi install git:github.com/<you>/<repo>@v0.x
```

## Local development / test

```bash
pi -e /absolute/path/to/pi-notify-terminal-notifier
# or
pi install /absolute/path/to/pi-notify-terminal-notifier
```

## Maintenance

This project is actively maintained.
