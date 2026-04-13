<template>
  <div class="agent-console">
    <!-- Top Navigation Bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <el-button link class="back-btn" @click="onBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回列表</span>
        </el-button>
        <div class="divider-v" />
        <div class="process-info">
          <span class="process-name">{{ processName || 'AI Agent Console' }}</span>
          <span v-if="processCode" class="process-code">{{ processCode }}</span>
        </div>
      </div>
      <div class="top-bar-right">
        <el-button plain @click="onSave" :loading="saving">保存配置</el-button>
      </div>
    </header>

    <!-- Dual-Pane Body -->
    <div class="dual-pane">
      <!-- ==================== LEFT PANE: Prompt IDE ==================== -->
      <section class="pane pane-left">
        <!-- Environment Controls -->
        <div class="env-controls">
          <div class="url-row">
            <span class="url-icon">&#127760;</span>
            <input
              v-model="targetUrl"
              class="url-input"
              placeholder="输入目标网站 URL，例如 https://www.gsxt.gov.cn"
              spellcheck="false"
            />
          </div>
        </div>

        <!-- Prompt IDE -->
        <div class="prompt-ide">
          <div class="section-label-row">
            <span class="section-label">任务描述</span>
            <span class="section-hint">只描述要做什么，返回格式在右侧定义</span>
          </div>
          <div class="prompt-editor-wrap">
            <textarea
              ref="promptRef"
              v-model="promptText"
              class="prompt-editor"
              placeholder="描述你需要 AI 智能体完成的任务，例如：&#10;&#10;打开目标页面，在搜索框输入公司名称，点击搜索后进入详情页，从详情页表格中抓取公司基本信息。&#10;&#10;无需在此描述返回字段，右侧已专门提供字段定义。"
              spellcheck="false"
              />
            <button class="ai-optimize-btn" @click="onAiOptimize" :disabled="!promptText.trim() || optimizing">
              <span class="spark">&#10024;</span>
              <span>{{ optimizing ? '优化中...' : 'AI 一键优化指令' }}</span>
            </button>
          </div>
        </div>

      </section>

      <!-- ==================== RIGHT PANE: Output Field Editor ==================== -->
      <section class="pane pane-right">
        <div class="field-header">
          <div class="section-label-row">
            <span class="section-label">&#128221; 返回字段格式定义</span>
            <span class="field-count">{{ fields.length }} 个字段</span>
          </div>
          <button class="add-field-btn" @click="addField">+ 添加字段</button>
        </div>

        <div class="field-body">
          <!-- Empty State -->
          <div v-if="fields.length === 0" class="field-empty">
            <div class="empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="36" height="36" rx="6" stroke="#c7d2fe" stroke-width="2"/>
                <path d="M16 18h16M16 24h10M16 30h14" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="empty-title">定义返回数据格式</div>
            <div class="empty-desc">约定机器人返回的 JSON 数据结构，确保提取结果符合预期格式</div>
          </div>

          <!-- Field Rows -->
          <div class="field-list">
            <div v-for="(field, idx) in fields" :key="idx" class="field-row">
              <div class="field-index">{{ idx + 1 }}</div>
              <div class="field-inputs">
                <div class="field-input-group">
                  <label class="field-input-label">字段名</label>
                  <input
                    v-model="field.key"
                    class="field-input"
                    placeholder="例如 companyName"
                    spellcheck="false"
                  />
                </div>
                <div class="field-input-group">
                  <label class="field-input-label">显示名</label>
                  <input
                    v-model="field.label"
                    class="field-input"
                    placeholder="例如 公司名称"
                  />
                </div>
                <div class="field-input-group">
                  <label class="field-input-label">类型</label>
                  <select v-model="field.type" class="field-select">
                    <option value="string">文本 string</option>
                    <option value="number">数字 number</option>
                    <option value="date">日期 date</option>
                    <option value="boolean">布尔 boolean</option>
                    <option value="object">对象 object</option>
                    <option value="array">数组 array</option>
                  </select>
                </div>
                <div class="field-input-group field-input-desc">
                  <label class="field-input-label">描述</label>
                  <input
                    v-model="field.desc"
                    class="field-input"
                    placeholder="字段用途说明"
                  />
                </div>
                <label class="field-required" :title="field.required ? '必填字段' : '选填字段'">
                  <input type="checkbox" v-model="field.required" />
                  <span class="required-dot" :class="{ active: field.required }" />
                  <span class="required-text">必填</span>
                </label>
              </div>
              <button class="field-delete" @click="removeField(idx)" title="删除字段">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>
          </div>

          <!-- JSON Preview -->
          <div v-if="fields.length" class="preview-section">
            <div class="preview-header">
              <span class="preview-label">JSON 预览</span>
              <button class="copy-btn" @click="copyPreview">复制</button>
            </div>
            <pre class="preview-code">{{ jsonPreview }}</pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getProcessDesign, getProcessDetail, saveProcessDesign } from '../api/process'

const route = useRoute()
const router = useRouter()
const processId = computed(() => String(route.params.id || ''))

const processName = ref('')
const processCode = ref('')
const saving = ref(false)

// Left pane state
const targetUrl = ref('')
const promptText = ref('')
const promptRef = ref(null)

// Right pane state — field editor
const fields = ref([])

const defaultField = () => ({ key: '', label: '', type: 'string', required: false, desc: '' })

const addField = () => { fields.value.push(defaultField()) }

const removeField = (idx) => { fields.value.splice(idx, 1) }

const jsonPreview = computed(() => {
  if (!fields.value.length) return ''
  const obj = {}
  const typeExample = { string: '文本', number: 0, date: '2026-01-01', boolean: true, object: {}, array: [] }
  fields.value.forEach((f) => {
    if (f.key) obj[f.key] = typeExample[f.type] ?? ''
  })
  return JSON.stringify([obj], null, 2)
})

const copyPreview = () => {
  navigator.clipboard.writeText(jsonPreview.value).then(() => ElMessage.success('已复制')).catch(() => {})
}

// Load design data
const storageKey = computed(() => `agentConsole:${processId.value}`)

const loadDesign = () => {
  const raw = localStorage.getItem(storageKey.value)
  if (!raw) return
  try {
    const d = JSON.parse(raw)
    targetUrl.value = d.targetUrl || ''
    promptText.value = d.promptText || ''
    fields.value = Array.isArray(d.fields) ? d.fields : []
  } catch {}
}

const loadRemoteDesign = async () => {
  if (!processId.value || processId.value === 'undefined') return
  try {
    const res = await getProcessDesign(processId.value)
    if (res?.data?.code === 200) {
      const steps = res?.data?.data?.steps || []
      if (Array.isArray(steps) && steps.length > 0) {
        const combined = steps
          .map((s) => s?.pythonCode || s?.javaCode || s?.stepName || '')
          .filter(Boolean)
          .join('\n')
        if (combined) promptText.value = combined
      }
    }
  } catch {}
}

// Save
const onSave = async () => {
  saving.value = true
  try {
    const config = {
      targetUrl: targetUrl.value,
      promptText: promptText.value,
      fields: fields.value
    }
    localStorage.setItem(storageKey.value, JSON.stringify(config))

    if (processId.value && processId.value !== 'undefined') {
      const steps = [{
        stepOrder: 1,
        stepName: 'AI Agent 指令',
        stepType: 'AI Agent Prompt',
        javaCode: targetUrl.value,
        pythonCode: promptText.value
      }]
      await saveProcessDesign(processId.value, { steps })
    }
    ElMessage.success('配置已保存')
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// AI optimize — DeepSeek API
const optimizing = ref(false)

const onAiOptimize = async () => {
  if (!promptText.value.trim() || optimizing.value) return
  optimizing.value = true
  try {
    const fieldDesc = fields.value.length
      ? '\n\n预期返回字段：\n' + fields.value.map((f) => `- ${f.key}（${f.label}，类型：${f.type}${f.required ? '，必填' : ''}${f.desc ? '，' + f.desc : ''}）`).join('\n')
      : ''

    const deepseekBase = import.meta.env.DEV
      ? '/deepseek'
      : 'https://api.deepseek.com'
    const res = await fetch(`${deepseekBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: false,
        messages: [
          {
            role: 'system',
            content: '你是一个 RPA 智能体指令优化专家。用户会给你一段自然语言描述的 RPA 任务，以及预期的返回字段格式。请你将任务描述优化为结构清晰、步骤明确、适合 AI Agent 执行的指令。\n\n优化要求：\n1. 明确任务目标\n2. 拆分为具体的操作步骤（导航、交互、提取）\n3. 包含异常处理要求（验证码、弹窗、空数据等）\n4. 在末尾附加返回字段要求（基于用户提供的字段定义）\n\n只输出优化后的指令文本，不要输出任何解释。'
          },
          {
            role: 'user',
            content: `请优化以下 RPA 任务：\n\n目标网站：${targetUrl.value || '（未指定）'}\n\n任务描述：\n${promptText.value}${fieldDesc}`
          }
        ]
      })
    })

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (content) {
      promptText.value = content
      ElMessage.success('指令已优化')
    } else {
      ElMessage.error('AI 未返回有效内容')
    }
  } catch (e) {
    console.error('DeepSeek API 调用失败:', e)
    ElMessage.error('AI 优化失败，请检查网络连接')
  } finally {
    optimizing.value = false
  }
}

const onBack = () => router.back()

onMounted(async () => {  if (processId.value && processId.value !== 'undefined') {
    try {
      const detailRes = await getProcessDetail(processId.value)
      if (detailRes?.data?.code === 200) {
        processName.value = detailRes.data.data?.processName || ''
        processCode.value = detailRes.data.data?.processCode || ''
      }
    } catch {}
    await loadRemoteDesign()
  }
  loadDesign()
})
</script>

<style scoped>
/* ==================== BASE ==================== */
.agent-console {
  margin: -20px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

/* ==================== TOP BAR ==================== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #eef0f4;
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6366f1;
  padding: 0;
}

.divider-v {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

.process-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.process-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.process-code {
  font-size: 12px;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ==================== DUAL PANE ==================== */
.dual-pane {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 20px;
  min-height: 0;
  box-sizing: border-box;
}

/* ==================== SHARED PANE ==================== */
.pane {
  flex: 1;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.pane-left {
  padding: 24px 28px;
  gap: 18px;
  overflow-y: auto;
}

.pane-right {
  padding: 24px 0;
}

/* ==================== LEFT PANE ==================== */

/* Shared section label */
.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.3px;
}

.section-hint {
  font-size: 12px;
  color: #94a3b8;
}

/* --- Environment Controls --- */
.env-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.url-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 14px;
  height: 46px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.url-row:focus-within {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.url-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.url-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.url-input::placeholder {
  color: #94a3b8;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

/* --- Prompt IDE --- */
.prompt-ide {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.prompt-editor-wrap {
  position: relative;
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.prompt-editor {
  width: 100%;
  flex: 1;
  min-height: 200px;
  resize: none;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  padding-bottom: 56px;
  background: #fafbfc;
  background-image:
    radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 24px 24px;
  font-size: 15px;
  line-height: 1.75;
  color: #1e293b;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

.prompt-editor:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  background-color: #fff;
  background-image: none;
}

.prompt-editor::placeholder {
  color: #94a3b8;
}

.ai-optimize-btn {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.ai-optimize-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.ai-optimize-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spark {
  font-size: 14px;
}

/* ==================== RIGHT PANE: Field Editor ==================== */
.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
}

.field-count {
  font-size: 11px;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.add-field-btn {
  font-size: 13px;
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 600;
}

.add-field-btn:hover {
  background: #e0e7ff;
  border-color: #818cf8;
}

/* --- Field Body --- */
.field-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 28px;
}

.field-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  text-align: center;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.empty-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  max-width: 280px;
}

/* --- Field List --- */
.field-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  transition: border-color 0.15s;
}

.field-row:hover {
  border-color: #c7d2fe;
}

.field-index {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #eef2ff;
  color: #6366f1;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.field-inputs {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}

.field-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.field-input-desc {
  min-width: 160px;
  flex: 1;
}

.field-input-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.field-input,
.field-select {
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  color: #1e293b;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus,
.field-select:focus {
  border-color: #818cf8;
}

.field-input::placeholder {
  color: #c7d2fe;
}

.field-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
  min-width: 140px;
}

/* --- Required Toggle --- */
.field-required {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  padding-top: 18px;
}

.field-required input {
  display: none;
}

.required-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid #d1d5db;
  transition: all 0.15s;
  position: relative;
}

.required-dot.active {
  background: #6366f1;
  border-color: #6366f1;
}

.required-dot.active::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.required-text {
  font-size: 12px;
  color: #64748b;
}

/* --- Delete Button --- */
.field-delete {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 18px;
  transition: all 0.15s;
}

.field-delete:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* --- JSON Preview --- */
.preview-section {
  margin-top: 20px;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #eef0f4;
}

.preview-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.copy-btn {
  font-size: 12px;
  color: #94a3b8;
  background: transparent;
  border: 1px solid #e2e8f0;
  padding: 3px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn:hover {
  color: #6366f1;
  border-color: #c7d2fe;
}

.preview-code {
  margin: 0;
  padding: 14px;
  font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #334155;
  overflow-x: auto;
  white-space: pre;
}

/* ==================== SCROLLBAR ==================== */
.pane-left::-webkit-scrollbar,
.field-body::-webkit-scrollbar {
  width: 6px;
}

.pane-left::-webkit-scrollbar-track,
.field-body::-webkit-scrollbar-track {
  background: transparent;
}

.pane-left::-webkit-scrollbar-thumb,
.field-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.pane-left::-webkit-scrollbar-thumb:hover,
.field-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
