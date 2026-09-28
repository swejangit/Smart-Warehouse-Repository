# Smart Warehouse — Developer Guide

This README explains how team members should work with the Smart Warehouse
repository.

This repository follows a branch-based development workflow.

---

## 1. Repository Structure

The repository uses the following branches:

main
production

feature/employee-1
feature/employee-2
feature/employee-3
feature/employee-4
feature/employee-5
feature/employee-6
feature/employee-7
feature/employee-8

### Branch Responsibilities

| Branch | Assigned Developer |
|---|---|
| `feature/employee-1` | Employee 1 |
| `feature/employee-2` | Employee 2 |
| `feature/employee-3` | Employee 3 |
| `feature/employee-4` | Employee 4 |
| `feature/employee-5` | Employee 5 |
| `feature/employee-6` | Employee 6 |
| `feature/employee-7` | Employee 7 |
| `feature/employee-8` | Employee 8 |

Each employee should work primarily on their assigned feature branch.

---

# 2. Branch Workflow

The project follows this workflow:

    Employee Feature Branch
              |
              | Pull Request
              v
           main
              |
              | Pull Request
              v
         production

### Important

Employees should NOT directly push to:

- `main`
- `production`

Both branches are protected.

Employees should push their work to their assigned feature branch and
create a Pull Request when their work is ready.

---

# 3. First-Time Setup

Clone the repository:

```bash
git clone https://github.com/swejangit/Smart-Warehouse-Repository.git
````

Enter the project:

```bash
cd Smart-Warehouse-Repository
```

Check the available branches:

```bash
git branch -a
```

Switch to your assigned branch.

Example for Employee 5:

```bash
git switch feature/employee-5
```

For Employee 1:

```bash
git switch feature/employee-1
```

---

# 4. Before Starting Work

Always check your current branch:

```bash
git branch
```

The branch with `*` is your current branch.

Example:

```
* feature/employee-5
  main
```

Make sure you are working on your assigned feature branch.

Also get the latest changes:

```bash
git pull
```

---

# 5. Daily Development Workflow

The normal development cycle is:

```
Write Code
    ↓
Test Code
    ↓
git status
    ↓
git add
    ↓
git commit
    ↓
git push
```

### Check changes

```bash
git status
```

### Stage changes

```bash
git add .
```

### Commit changes

Use a meaningful commit message:

```bash
git commit -m "Add customer search API"
```

### Push your branch

Example:

```bash
git push origin feature/employee-5
```

If your branch is already connected to the remote:

```bash
git push
```

---

# 6. Commits

Commits should represent meaningful units of work.

---

# 7. Pull Requests

When your assigned task is ready for integration:

```
feature/employee-X
        |
        | Pull Request
        v
       main
```

Create a Pull Request on GitHub.

For example:

```
base:    main
compare: feature/employee-5
```

The Pull Request should contain:

* What was implemented
* Important changes
* APIs added/modified
* Testing performed
* Any known issues
* Any dependencies on another employee's work

Do not merge your feature directly into `main`.

---

# 8. Main Branch

`main` is the integration branch.

It contains the combined work of the team after Pull Requests are reviewed
and merged.

Example:

```
feature/employee-1 ──┐
feature/employee-2 ──┤
feature/employee-3 ──┤
feature/employee-4 ──┤
feature/employee-5 ──┼──> main
feature/employee-6 ──┤
feature/employee-7 ──┤
feature/employee-8 ──┘
```

Do not use `main` as your normal development branch.

---

# 9. Production Branch

`production` represents the release/deployment version.

The intended workflow is:

```
feature branches
       ↓
      main
       ↓
   Testing / Integration
       ↓
production
```

The Lead/Repository Owner handles promotion from `main` to `production`.

Employees should not directly push to `production`.

---

# 10. Important Django Rules

### Migrations

Migration files are part of the project code and MUST be committed.

Example:

```
apps/sales/migrations/0004_alter_salesorder_status.py
```

Do NOT add migration files to `.gitignore`.

After changing models:

```bash
python manage.py makemigrations
python manage.py migrate
```

Then commit the generated migration file.

---

# 11. Environment Variables

Never commit secrets or local environment files.

Do NOT push:

```
.env
```

The `.env` file should remain local.

The repository already ignores `.env` through `.gitignore`.

Never commit:

* Database passwords
* API keys
* Secret keys
* Access tokens
* Personal credentials

---

# 12. Files That Should Not Be Committed

Do not commit local development files such as:

```
venv/
.venv/
__pycache__/
*.pyc
.env
db.sqlite3
.idea/
```

These are already covered by `.gitignore`.

---

# 13. Avoid Unnecessary Conflicts

Before starting work:

```bash
git pull
```

Work primarily inside your assigned module.

Avoid making unrelated changes to other employees' files.

For example:

If you are working on:

```
apps/sales/
```

do not unnecessarily modify:

```
apps/inventory/
apps/products/
apps/customers/
```

unless the task requires it.

---

# 14. Useful Git Commands

### Check status

```bash
git status
```

### See branches

```bash
git branch
```

### See all remote branches

```bash
git branch -a
```

### Switch branch

```bash
git switch feature/employee-5
```

### Create a branch

```bash
git switch -c feature/my-feature
```

### Stage changes

```bash
git add .
```

### Commit

```bash
git commit -m "Your message"
```

### Push

```bash
git push
```

### Pull latest changes

```bash
git pull
```

### View commit history

```bash
git log --oneline
```

### See uncommitted changes

```bash
git diff
```

### See configured remote

```bash
git remote -v
```

---

# 15. Recommended Daily Workflow

Use this simple workflow:

```bash
git switch feature/employee-X
git pull

# Work on your code

git status
git add .
git commit -m "Describe your change"
git push
```

Repeat this as you complete meaningful pieces of work.

When your task is complete:

```
Push branch
    ↓
Create Pull Request
    ↓
feature/employee-X → main
    ↓
Review
    ↓
Approval
    ↓
Merge
```

---

# 16. Before Creating a Pull Request

Check:

* [ ] Code works locally
* [ ] Tests pass
* [ ] No `.env` or secrets are committed
* [ ] No unnecessary files are included
* [ ] Migrations are included when required
* [ ] Changes are limited to the task
* [ ] Commit messages are meaningful
* [ ] Branch is pushed to GitHub
* [ ] Pull Request targets `main`

---
# 17. Quick Workflow

```
1. Clone repository
       ↓
2. Switch to assigned branch
       ↓
3. Pull latest changes
       ↓
4. Write code
       ↓
5. Test
       ↓
6. git add .
       ↓
7. git commit -m "message"
       ↓
8. git push
       ↓
9. Create Pull Request
       ↓
10. Review
       ↓
11. Approval
       ↓
12. Merge into main
       ↓
13. Main is later promoted to production
```

---

## Remember

Your feature branch is where you develop.

`main` is where integrated team code lives.

`production` is the release/deployment branch.

**Feature Branch → Pull Request → main → Pull Request → production**

````