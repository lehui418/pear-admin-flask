# MCP Interactive Feedback 规则
1. 在任何流程、任务、对话进行时，无论是询问、回复、或完成阶段性任务，皆必须调用 MCP mcp-feedback-enhanced。
2. 每当收到用户反馈，若反馈内容非空，必须再次调用 MCP mcp-feedback-enhanced，并根据反馈内容调整行为。
3. 仅当用户明确表示「结束」或「不再需要交互」时，才可停止调用 MCP mcp-feedback-enhanced，流程才算结束。
4. 除非收到结束指令，否则所有步骤都必须重复调用 MCP mcp-feedback-enhanced。
5. 完成任务前，必须使用 MCP mcp-feedback-enhanced 工具向用户询问反馈。
6. 除非收到结束指令，否则所有步骤都必须重复调用 MCP mcp-feedback-enhanced。
7. 完成任务前，必须使用 MCP mcp-feedback-enhanced 工具向用户询问反馈。

# 代码修改记录规则
1. **任何代码修改必须记录**：每当修改、创建或删除代码文件时，必须将修改点记录到 `修改记录.md` 文件中
2. **记录时机**：在代码修改完成后立即记录，不要等待用户提醒
3. **记录内容**：
   - 修改时间（YYYY-MM-DD 格式）
   - 修改的文件路径
   - 详细的修改内容描述
   - 修改状态（✅ 已完成 / ⏳ 进行中 / ❌ 失败）
   - 测试结果
4. **记录格式**：遵循 `修改记录.md` 中现有的格式规范
5. **自动触发**：此规则适用于所有任务，无需用户额外提醒
6. **使用 Skill**：调用 `changelog-recorder` Skill 来执行记录操作