# Claude Code Hooks Configuration

This document explains the hooks configured for the Meal Mate project to help keep documentation synchronized.

## Configured Hooks

### 1. PostToolUse Hook (After File Modifications)

**Trigger**: Runs after using `Write` or `Edit` tools

**Purpose**: Automatically checks if documentation needs updating when code changes

**How it works**:
- When you modify any file using Write or Edit
- An AI prompt analyzes the changes
- Suggests which documentation files need updating
- Non-blocking - doesn't prevent the edit

**Configuration**:
```json
{
  "matcher": "Write|Edit",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "Analyze if CLAUDE.md or .claude/rules/*.md needs updating",
      "statusMessage": "Checking if documentation needs updating..."
    }
  ]
}
```

### 2. UserPromptSubmit Hook (On Each User Message)

**Trigger**: Runs every time you submit a prompt

**Purpose**: Gentle reminder to update documentation

**How it works**:
- Displays a reminder message before each response
- Encourages proactive documentation maintenance

**Configuration**:
```json
{
  "type": "command",
  "command": "echo '📚 Remember: Update CLAUDE.md or .claude/rules/* if you make significant changes'"
}
```

## Hook Types Available

### 1. Command Hooks
Run shell commands and capture output:
```json
{
  "type": "command",
  "command": "git status",
  "timeout": 10,
  "statusMessage": "Checking git status..."
}
```

### 2. Prompt Hooks
Use AI to analyze hook data:
```json
{
  "type": "prompt",
  "prompt": "Analyze $ARGUMENTS and suggest improvements",
  "model": "claude-sonnet-4-5-20250929",
  "timeout": 30
}
```

### 3. Agent Hooks
Run autonomous agents for verification:
```json
{
  "type": "agent",
  "prompt": "Verify that unit tests ran and passed",
  "model": "haiku",
  "timeout": 60
}
```

## Available Hook Events

| Event | When It Runs |
|-------|-------------|
| `PreToolUse` | Before any tool execution |
| `PostToolUse` | After successful tool execution |
| `PostToolUseFailure` | After tool execution fails |
| `UserPromptSubmit` | When user submits a message |
| `SessionStart` | When Claude Code session starts |
| `SessionEnd` | When session ends |
| `SubagentStart` | When a subagent starts |
| `SubagentStop` | When a subagent completes |
| `Notification` | On notifications |
| `Stop` | When user stops execution |
| `PreCompact` | Before conversation compaction |
| `PermissionRequest` | When permission is requested |

## Useful Hook Examples for Documentation

### Update Documentation After Model Changes
```json
{
  "PostToolUse": [
    {
      "matcher": "Edit",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "If $ARGUMENTS shows changes to backend/src/models/*.ts, check if .claude/rules/database.md needs updating with the new schema definition."
        }
      ]
    }
  ]
}
```

### Auto-Update Last Modified Date
```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "sed -i 's/\\*Last Updated: .*/\\*Last Updated: $(date +%Y-%m-%d)*/' CLAUDE.md"
        }
      ]
    }
  ]
}
```

### Verify Documentation Stays in Sync
```json
{
  "SessionEnd": [
    {
      "hooks": [
        {
          "type": "agent",
          "prompt": "Review files modified in this session and verify CLAUDE.md and .claude/rules/*.md are still accurate. Suggest specific updates if needed."
        }
      ]
    }
  ]
}
```

## Best Practices

### ✅ Do:
- Use `PostToolUse` hooks to check documentation sync
- Keep hooks lightweight and fast
- Use matchers to target specific tools
- Provide helpful status messages
- Use `once: true` for one-time setup hooks

### ❌ Don't:
- Make hooks blocking unless necessary
- Run expensive operations on every prompt
- Duplicate functionality between hooks
- Forget to set reasonable timeouts

## Customizing Hooks

### Project-Specific (.claude/settings.json)
Team-wide hooks that everyone on the project uses:
```json
{
  "hooks": {
    "PostToolUse": [...]
  }
}
```

### Personal (.claude/settings.local.json)
Your personal hooks that don't affect others:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'My personal reminder'"
          }
        ]
      }
    ]
  }
}
```

### User-Level (~/.claude/settings.json)
Hooks that apply to all your projects:
```json
{
  "hooks": {
    "SessionStart": [...]
  }
}
```

## Disabling Hooks

### Temporarily Disable All Hooks:
```json
{
  "disableAllHooks": true
}
```

### Remove a Specific Hook:
Just delete the hook configuration from the array.

## Accessing Hook Data

Hooks receive context via the `$ARGUMENTS` placeholder:

### PostToolUse Example:
```json
{
  "tool_name": "Edit",
  "file_path": "/path/to/file.ts",
  "old_string": "...",
  "new_string": "...",
  "status": "success"
}
```

### UserPromptSubmit Example:
```json
{
  "prompt": "The user's message",
  "timestamp": "2026-01-11T10:00:00Z"
}
```

## Monitoring Hooks

### View Hook Output:
Hook output appears in Claude Code's response or in status messages.

### Debug Hooks:
Use `statusMessage` to show what's happening:
```json
{
  "type": "command",
  "command": "echo 'Debug: Running hook'",
  "statusMessage": "🔍 Debugging hook execution..."
}
```

## Further Reading

- [Official Claude Code Hooks Documentation](https://docs.claude.ai/docs/hooks)
- [Hook Examples Repository](https://github.com/anthropics/claude-code-examples/hooks)
- Project settings: [.claude/settings.json](.claude/settings.json)

## Current Configuration Summary

**Active Hooks**:
1. ✅ PostToolUse (Write/Edit) - Documentation sync checker
2. ✅ UserPromptSubmit - Documentation reminder

**Hook Files**:
- Project: `.claude/settings.json`
- Personal: `.claude/settings.local.json`
- User: `~/.claude/settings.json`

---

**Remember**: Hooks are powerful but should be used judiciously. Keep them fast, helpful, and non-intrusive.
