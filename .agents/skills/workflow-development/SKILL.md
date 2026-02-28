---
name: workflow-development
description: Run the complete Development workflow with 2 sequential steps. Use when you need to execute this structured process from start to finish.
metadata:
    short-description: Complete Development workflow (2 steps)
---

# Development Workflow

Complete Development workflow with 2 steps. Follow each step in order.

## How to Use This Workflow

This workflow guides you through a structured process. Execute each step in order.

**To run the complete workflow**, follow the steps below. Each step has detailed instructions in its own rule.

## Workflow Steps

### Step 99: Next Todo

If you didn't do it already, read .agentspack/prd.md, .agentspack/technical_requirements.md and .agentspack/todos.md to understand the project and ...

**Invoke**: $workflow-development-next-todo

---

### Step 99: Start Session

First read the .agentspack/PRD.md, .agentspack/TECHNICAL_REQUIREMENTS.md and .agentspack/todos.md files to orient yourself on the project and what ...

**Invoke**: $workflow-development-start-session

---

## Execution Instructions

1. Start with Step 1 and complete it fully before moving to the next step
2. Each step may require user input or produce artifacts
3. Steps build on previous outputs, so order matters
4. If a step references a file that doesn't exist, complete the prerequisite step first
