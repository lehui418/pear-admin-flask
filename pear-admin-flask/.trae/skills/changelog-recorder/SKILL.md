---
name: "changelog-recorder"
description: "Automatically records code modifications to 修改记录.md with timestamp, content, and status. Invoke when any code changes are made, files are edited, or user asks to record modifications."
---

# Changelog Recorder (修改记录器)

This skill automatically records all code modifications to the `修改记录.md` file.

## When to Invoke

**CRITICAL: You MUST invoke this skill when:**
- Any code files are modified (edited, created, deleted)
- User asks to "记录修改" or "添加到修改记录"
- A feature implementation is completed
- Bug fixes are applied
- Any system changes are made

**DO NOT:**
- Skip recording modifications
- Wait for user to explicitly ask
- Assume the user will manually update the log

## Recording Process

### Step 1: Gather Information
When code changes are made, collect:
1. **Current date** (YYYY-MM-DD format)
2. **Modified files** (list all changed files with paths)
3. **Modification description** (what was changed and why)
4. **Test results** (if available)

### Step 2: Read Existing Log
Read the current `修改记录.md` file to:
- Find the next modification number
- Understand the existing format
- Locate where to insert the new entry

### Step 3: Create Entry
Add a new entry in this format:

```markdown
### {number}. {title}
- **修改时间**: {YYYY-MM-DD}
- **修改文件**: 
  - `{file_path_1}`
  - `{file_path_2}`
  - ...
- **修改内容**: 
  - {detailed description of changes}
  - {bullet points for multiple changes}
- **修改状态**: ✅ 已完成 / ⏳ 进行中 / ❌ 失败
- **测试结果**: {test results or "待测试"}

---
```

### Step 4: Insert Entry
Insert the new entry:
- After the last completed modification entry
- Before the "## 待办事项" section
- Maintain chronological order (newest first or last, follow existing pattern)

### Step 5: Update Numbering
Ensure modification numbers are sequential and correct.

## Entry Template

```markdown
### {number}. {brief_title}
- **修改时间**: {date}
- **修改文件**: 
  - `path/to/file1.py`
  - `path/to/file2.py`
- **修改内容**: 
  - {main change description}
  - {sub-change 1}
  - {sub-change 2}
- **修改状态**: ✅ 已完成
- **测试结果**: {description}

---
```

## Example Entries

### Example 1: Simple Bug Fix
```markdown
### 7. 修复用户登录验证问题
- **修改时间**: 2026-03-04
- **修改文件**: 
  - `applications/view/system/login.py`
- **修改内容**: 
  - 修复了密码验证逻辑中的空指针异常
  - 添加了用户状态检查（是否被禁用）
- **修改状态**: ✅ 已完成
- **测试结果**: 正常用户可登录，禁用用户无法登录

---
```

### Example 2: Feature Implementation
```markdown
### 8. 新增数据导出功能
- **修改时间**: 2026-03-04
- **修改文件**: 
  - `applications/view/system/report.py`
  - `templates/system/report/export.html` (新增)
  - `static/js/export.js` (新增)
- **修改内容**: 
  - 实现Excel格式数据导出
  - 支持自定义导出字段选择
  - 添加导出进度提示
  - 前端添加导出按钮和字段选择弹窗
- **修改状态**: ✅ 已完成
- **测试结果**: 可正常导出Excel，字段选择功能正常

---
```

## Status Icons

Use these status markers:
- ✅ 已完成 - Modification completed and tested
- ⏳ 进行中 - Modification in progress
- ❌ 失败 - Modification failed or rolled back

## Important Notes

1. **Always record** - Every code change should be recorded
2. **Be specific** - List exact file paths and detailed changes
3. **Include test results** - Even if it's "待测试" (pending test)
4. **Maintain format** - Follow the existing document structure
5. **Sequential numbering** - Ensure modification numbers are correct
6. **Chinese language** - Use Chinese for the modification log content

## Workflow Integration

After ANY file modification:
1. Check if `修改记录.md` exists
2. If not, create it with proper header
3. Read current content
4. Add new entry
5. Save the file
6. Confirm to user that record has been added
