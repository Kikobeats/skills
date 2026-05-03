---
name: create-local-skill
description: Creates a project-local skill that works in both Cursor and Claude Code. Use when the user says "create skill", "add skill", "new skill", or wants to add a reusable instruction set to the current project.
---

# Create Local Skill

Create a project-local skill that works in both Claude Code and Cursor. The canonical location is `.agents/skills/`, with a symlink from `.claude/commands` so Claude Code picks it up.

## Workflow

### Step 1: Determine Skill Name

Ask the user what the skill should do if not already clear. Derive a kebab-case name from the task (e.g., `sync-providers`, `deploy-staging`).

### Step 2: Create the Skill Directory

```bash
mkdir -p .agents/skills/<skill-name>
```

### Step 3: Write the SKILL.md

Create `.agents/skills/<skill-name>/SKILL.md` following the `create-skill` skill guidelines. Read its references as needed for structure, best practices, and examples.

### Step 4: Set Up the Symlink

If `.claude/commands` does not exist or is not already a symlink to `.agents/skills`:

```bash
mkdir -p .claude
ln -s ../.agents/skills .claude/commands
```

If `.claude/commands` already exists as a regular directory with other content, warn the user and ask how to proceed rather than overwriting.

### Step 5: Verify

```bash
ls -la .claude/commands/              # should show symlink → ../.agents/skills
ls .claude/commands/<skill-name>/     # should list SKILL.md
```

### Step 6: Git

Check `.gitignore` — ensure neither `.agents/` nor `.claude/` is ignored. Both should be committed so the skill is shared with collaborators.

## Notes

- The symlink uses a relative path (`../.agents/skills`) so it works regardless of where the repo is cloned.
- Additional resources (scripts, references, assets) go inside the skill subdirectory — they are accessible from both tools via the symlink.
