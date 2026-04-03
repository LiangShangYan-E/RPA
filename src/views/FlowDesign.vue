<template>
  <div class="flow-design-view">
    <div class="designer-shell">
      <div class="designer-top">
        <div class="designer-top-left">
          <el-button link type="primary" class="back-btn" @click="onBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="designer-title">
            <div class="designer-title-main">{{ processName || '流程设计' }}</div>
            <div v-if="processCode" class="designer-title-sub">{{ processCode }}</div>
          </div>
        </div>
        <div class="designer-top-right">
          <el-button @click="resetViewport">重置画布</el-button>
          <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
        </div>
      </div>

      <div class="designer-body">
        <div class="panel panel-left">
          <div class="panel-title">组件库</div>
          <div class="palette">
            <div
              v-for="item in palette"
              :key="item.type"
              class="palette-item"
              :style="{ borderColor: item.borderColor, backgroundColor: item.bgColor }"
              draggable="true"
              @dragstart="onPaletteDragStart($event, item)"
            >
              <div class="palette-item-title">{{ item.label }}</div>
              <div class="palette-item-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <div class="canvas-wrap">
          <div class="canvas-toolbar">
            <div class="toolbar-left">
              <el-button-group>
                <el-button :icon="Minus" @click="zoomOut" />
                <el-button :icon="Plus" @click="zoomIn" />
                <el-button :icon="RefreshLeft" @click="resetViewport" />
              </el-button-group>
              <div class="zoom-text">{{ Math.round(scale * 100) }}%</div>
            </div>
            <div class="toolbar-right">
              <el-tag v-if="pendingFromNodeId" type="warning" effect="light">点击目标节点的输入圆点完成连线</el-tag>
            </div>
          </div>

          <div
            ref="canvasRef"
            class="canvas"
            @dragover.prevent
            @drop="onCanvasDrop"
            @mousedown="onCanvasMouseDown"
            @wheel.prevent="onCanvasWheel"
          >
            <div class="grid" />
            <div class="viewport" :style="viewportStyle">
              <svg
                class="edges"
                :width="WORLD_WIDTH"
                :height="WORLD_HEIGHT"
                :viewBox="`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`"
                @mousedown="onCanvasMouseDown"
              >
                <g v-for="edge in edges" :key="edge.id">
                  <path
                    class="edge-path"
                    :class="{ selected: edge.id === selectedEdgeId }"
                    :d="edgePath(edge)"
                    @mousedown.stop
                    @click.stop="selectEdge(edge.id)"
                  />
                  <g
                    v-if="edge.id === selectedEdgeId"
                    class="edge-delete"
                    @mousedown.stop
                    @click.stop="removeEdge(edge.id)"
                  >
                    <circle :cx="edgeMidpoint(edge).x" :cy="edgeMidpoint(edge).y" r="10" />
                    <text :x="edgeMidpoint(edge).x" :y="edgeMidpoint(edge).y + 4" text-anchor="middle">×</text>
                  </g>
                </g>
                <path
                  v-if="pendingEdgePath"
                  class="edge-path pending"
                  :d="pendingEdgePath"
                />
              </svg>

              <div
                v-for="node in nodes"
                :key="node.id"
                class="node"
                :class="{ selected: node.id === selectedNodeId }"
                :style="nodeStyle(node)"
                @mousedown.stop="onNodeMouseDown($event, node)"
                @click.stop="selectNode(node.id)"
              >
                <div class="node-header">
                  <div class="node-title">{{ node.name }}</div>
                  <el-button link type="danger" :icon="Delete" class="node-delete" @click.stop="removeNode(node.id)" />
                </div>
                <div class="node-meta">
                  <span class="node-type">{{ nodeTypeLabel(node.type) }}</span>
                  <span class="node-dot">·</span>
                  <span class="node-lang">{{ node.language.toUpperCase() }}</span>
                </div>
                <div class="port port-in" @click.stop="onPortClick(node.id, 'in')" />
                <div class="port port-out" @click.stop="onPortClick(node.id, 'out')" />
              </div>
            </div>
          </div>
        </div>

        <div class="panel panel-right">
          <div class="panel-title">属性</div>
          <div v-if="selectedNode" class="props">
            <el-form label-width="70px">
              <el-form-item label="名称">
                <el-input v-model="selectedNode.name" placeholder="请输入节点名称" />
              </el-form-item>
              <el-form-item label="类型">
                <el-input :model-value="nodeTypeLabel(selectedNode.type)" disabled />
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="selectedNode.language" style="width: 100%">
                  <el-option label="Java" value="java" />
                  <el-option label="Python" value="python" />
                  <el-option label="JavaScript" value="javascript" />
                </el-select>
              </el-form-item>
            </el-form>

            <div class="io-panel">
              <div class="io-row">
                <div class="io-label">输入</div>
                <div class="io-value">
                  <el-tag v-if="incomingNames.length === 0" effect="plain" type="info">未连接</el-tag>
                  <el-tag v-for="name in incomingNames" :key="name" effect="light">{{ name }}</el-tag>
                </div>
              </div>
              <div class="io-row">
                <div class="io-label">输出</div>
                <div class="io-value">
                  <el-tag v-if="outgoingNames.length === 0" effect="plain" type="info">未连接</el-tag>
                  <el-tag v-for="name in outgoingNames" :key="name" effect="light" type="success">{{ name }}</el-tag>
                </div>
              </div>
            </div>

            <div class="code-title">代码</div>
            <el-input v-model="selectedNode.code" type="textarea" :rows="16" class="code-input" placeholder="在这里粘贴/编写代码" />
          </div>
          <div v-else class="props-empty">
            选择一个节点后，在这里编辑代码与属性
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Delete, Minus, Plus, RefreshLeft } from '@element-plus/icons-vue'
import { getProcessDesign, getProcessDetail, saveProcessDesign } from '../api/process'

const WORLD_WIDTH = 4000
const WORLD_HEIGHT = 2600
const NODE_WIDTH = 240
const NODE_HEIGHT = 92

const route = useRoute()
const router = useRouter()
const processId = computed(() => String(route.params.id || ''))

const processName = ref('')
const processCode = ref('')

const canvasRef = ref(null)
const nodes = ref([])
const edges = ref([])
const selectedNodeId = ref('')
const selectedEdgeId = ref('')
const saving = ref(false)

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const pendingFromNodeId = ref('')
const pendingPointer = ref({ x: 0, y: 0 })

const palette = [
  { type: 'collect', label: '采集', desc: '数据采集/抓取', bgColor: '#eef4ff', borderColor: '#9db7ff', defaultLang: 'python' },
  { type: 'process', label: '处理', desc: '清洗/转换/规则', bgColor: '#f2fbf6', borderColor: '#86d19d', defaultLang: 'java' },
  { type: 'compute', label: '加工', desc: '加工/汇总/计算', bgColor: '#fff7ed', borderColor: '#f4b26a', defaultLang: 'java' },
  { type: 'output', label: '输出', desc: '写库/落表/推送', bgColor: '#f6f7fb', borderColor: '#c9cedb', defaultLang: 'javascript' }
]

const viewportStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`
}))

const selectedNode = computed(() => nodes.value.find((n) => n.id === selectedNodeId.value) || null)

const incomingNames = computed(() => {
  const id = selectedNodeId.value
  if (!id) return []
  const fromIds = edges.value.filter((e) => e.to.nodeId === id).map((e) => e.from.nodeId)
  return fromIds.map((nid) => nodes.value.find((n) => n.id === nid)?.name).filter(Boolean)
})

const outgoingNames = computed(() => {
  const id = selectedNodeId.value
  if (!id) return []
  const toIds = edges.value.filter((e) => e.from.nodeId === id).map((e) => e.to.nodeId)
  return toIds.map((nid) => nodes.value.find((n) => n.id === nid)?.name).filter(Boolean)
})

const nodeTypeLabel = (type) => {
  const hit = palette.find((p) => p.type === type)
  return hit?.label || type
}

const nodeStyle = (node) => ({
  left: `${node.x}px`,
  top: `${node.y}px`,
  width: `${NODE_WIDTH}px`,
  height: `${NODE_HEIGHT}px`
})

const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const storageKey = computed(() => `flowDesign:${processId.value}`)

const loadDesign = () => {
  const raw = localStorage.getItem(storageKey.value)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    nodes.value = Array.isArray(parsed.nodes) ? parsed.nodes : []
    edges.value = Array.isArray(parsed.edges) ? parsed.edges : []
    const vp = parsed.viewport || {}
    scale.value = typeof vp.scale === 'number' ? vp.scale : 1
    offsetX.value = typeof vp.offsetX === 'number' ? vp.offsetX : offsetX.value
    offsetY.value = typeof vp.offsetY === 'number' ? vp.offsetY : offsetY.value
  } catch {}
}

const inferNodeType = (name) => {
  const n = String(name || '')
  if (n.includes('采集')) return 'collect'
  if (n.includes('解析') || n.includes('处理')) return 'process'
  if (n.includes('加工') || n.includes('计算')) return 'compute'
  if (n.includes('落库') || n.includes('写库') || n.includes('输出')) return 'output'
  return 'process'
}

const inferStepType = (language) => {
  if (language === 'java') return 'Java 爬虫代码'
  if (language === 'python') return 'Python 爬虫代码'
  if (language === 'javascript') return 'JavaScript 脚本'
  return 'Python 爬虫代码'
}

const applyRemoteDesign = (steps) => {
  if (!Array.isArray(steps) || steps.length === 0) return false
  const sorted = [...steps].sort((a, b) => Number(a?.stepOrder || 0) - Number(b?.stepOrder || 0))
  const startX = 520
  const startY = 140
  const gapY = 160
  const nextNodes = sorted.map((s, idx) => {
    const stepName = s?.stepName || `步骤${idx + 1}`
    const javaCode = s?.javaCode || ''
    const pythonCode = s?.pythonCode || ''
    const language = pythonCode ? 'python' : javaCode ? 'java' : 'python'
    const code = language === 'java' ? javaCode : language === 'python' ? pythonCode : ''
    return {
      id: `step_${String(s?.stepOrder ?? idx + 1)}`,
      type: inferNodeType(stepName),
      name: stepName,
      language,
      code,
      x: startX,
      y: startY + idx * gapY
    }
  })
  const nextEdges = []
  for (let i = 0; i < nextNodes.length - 1; i += 1) {
    const fromId = nextNodes[i].id
    const toId = nextNodes[i + 1].id
    nextEdges.push({
      id: `edge_${fromId}_${toId}`,
      from: { nodeId: fromId, port: 'out' },
      to: { nodeId: toId, port: 'in' }
    })
  }
  nodes.value = nextNodes
  edges.value = nextEdges
  selectedNodeId.value = ''
  ensureInitialViewport()
  return true
}

const loadRemoteDesign = async () => {
  if (!processId.value || processId.value === 'undefined') return false
  const res = await getProcessDesign(processId.value)
  if (res?.data?.code !== 200) return false
  return applyRemoteDesign(res?.data?.data?.steps || [])
}

const onSave = async () => {
  if (!processId.value || processId.value === 'undefined') {
    ElMessage.error('缺少流程ID，无法保存')
    return
  }
  saving.value = true
  try {
    const ordered = [...nodes.value].sort((a, b) => (a?.y ?? 0) - (b?.y ?? 0) || (a?.x ?? 0) - (b?.x ?? 0))
    const steps = ordered.map((n, idx) => {
      const language = n?.language || 'python'
      const code = n?.code || ''
      return {
        stepOrder: idx + 1,
        stepName: n?.name || `步骤${idx + 1}`,
        stepType: inferStepType(language),
        javaCode: language === 'java' ? code : '',
        pythonCode: language === 'python' ? code : ''
      }
    })
    const resp = await saveProcessDesign(processId.value, { steps })
    if (resp?.data?.code !== 200) {
      throw new Error(resp?.data?.message || '保存失败')
    }
    localStorage.setItem(
      storageKey.value,
      JSON.stringify({
        nodes: nodes.value,
        edges: edges.value,
        viewport: { scale: scale.value, offsetX: offsetX.value, offsetY: offsetY.value }
      })
    )
    ElMessage.success('保存成功')
  } catch (e) {
    console.error('保存流程设计失败:', e)
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const selectNode = (id) => {
  selectedNodeId.value = id
  selectedEdgeId.value = ''
}

const selectEdge = (id) => {
  selectedEdgeId.value = id
  selectedNodeId.value = ''
  if (pendingFromNodeId.value) pendingFromNodeId.value = ''
}

const removeEdge = (id) => {
  edges.value = edges.value.filter((e) => e.id !== id)
  if (selectedEdgeId.value === id) selectedEdgeId.value = ''
}

const removeNode = (id) => {
  nodes.value = nodes.value.filter((n) => n.id !== id)
  edges.value = edges.value.filter((e) => e.from.nodeId !== id && e.to.nodeId !== id)
  if (selectedNodeId.value === id) selectedNodeId.value = ''
  if (selectedEdgeId.value && !edges.value.some((e) => e.id === selectedEdgeId.value)) selectedEdgeId.value = ''
  if (pendingFromNodeId.value === id) pendingFromNodeId.value = ''
}

const ensureInitialViewport = () => {
  scale.value = 1
  offsetX.value = 120
  offsetY.value = 80
}

const resetViewport = () => {
  ensureInitialViewport()
}

const zoomTo = (next, anchor) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const nextScale = Math.min(2.5, Math.max(0.25, next))
  const sx = anchor?.x ?? rect.width / 2
  const sy = anchor?.y ?? rect.height / 2
  const wx = (sx - offsetX.value) / scale.value
  const wy = (sy - offsetY.value) / scale.value
  offsetX.value = sx - wx * nextScale
  offsetY.value = sy - wy * nextScale
  scale.value = nextScale
}

const zoomIn = () => zoomTo(scale.value * 1.15)
const zoomOut = () => zoomTo(scale.value / 1.15)

const onCanvasWheel = (e) => {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const factor = e.deltaY > 0 ? 1 / 1.08 : 1.08
  zoomTo(scale.value * factor, { x: sx, y: sy })
}

const onPaletteDragStart = (e, item) => {
  e.dataTransfer?.setData('application/rpa-node', JSON.stringify({ type: item.type }))
  e.dataTransfer?.setData('text/plain', item.type)
}

const addNode = (type, x, y) => {
  const p = palette.find((it) => it.type === type)
  const baseName = p?.label || '节点'
  const sameCount = nodes.value.filter((n) => n.type === type).length
  const node = {
    id: uid(),
    type,
    name: `${baseName}${sameCount + 1}`,
    language: p?.defaultLang || 'java',
    code: '',
    x: Math.max(0, Math.min(WORLD_WIDTH - NODE_WIDTH, x)),
    y: Math.max(0, Math.min(WORLD_HEIGHT - NODE_HEIGHT, y))
  }
  nodes.value.push(node)
  selectedNodeId.value = node.id
}

const onCanvasDrop = (e) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const raw = e.dataTransfer?.getData('application/rpa-node') || ''
  const type = (() => {
    try {
      return JSON.parse(raw)?.type || e.dataTransfer?.getData('text/plain') || ''
    } catch {
      return e.dataTransfer?.getData('text/plain') || ''
    }
  })()
  if (!type) return
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const x = (sx - offsetX.value) / scale.value - NODE_WIDTH / 2
  const y = (sy - offsetY.value) / scale.value - NODE_HEIGHT / 2
  addNode(type, x, y)
}

const edgePath = (edge) => {
  const from = nodes.value.find((n) => n.id === edge.from.nodeId)
  const to = nodes.value.find((n) => n.id === edge.to.nodeId)
  if (!from || !to) return ''
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2
  const x2 = to.x
  const y2 = to.y + NODE_HEIGHT / 2
  const c1x = x1 + 70
  const c2x = x2 - 70
  return `M ${x1} ${y1} C ${c1x} ${y1} ${c2x} ${y2} ${x2} ${y2}`
}

const edgeMidpoint = (edge) => {
  const from = nodes.value.find((n) => n.id === edge.from.nodeId)
  const to = nodes.value.find((n) => n.id === edge.to.nodeId)
  if (!from || !to) return { x: 0, y: 0 }
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2
  const x2 = to.x
  const y2 = to.y + NODE_HEIGHT / 2
  const c1x = x1 + 70
  const c2x = x2 - 70
  const t = 0.5
  const mt = 1 - t
  const x = mt * mt * mt * x1 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x2
  const y = mt * mt * mt * y1 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y2
  return { x, y }
}

const pendingEdgePath = computed(() => {
  if (!pendingFromNodeId.value) return ''
  const from = nodes.value.find((n) => n.id === pendingFromNodeId.value)
  if (!from) return ''
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2
  const x2 = pendingPointer.value.x
  const y2 = pendingPointer.value.y
  const c1x = x1 + 70
  const c2x = x2 - 70
  return `M ${x1} ${y1} C ${c1x} ${y1} ${c2x} ${y2} ${x2} ${y2}`
})

const onPortClick = (nodeId, side) => {
  if (side === 'out') {
    pendingFromNodeId.value = nodeId
    return
  }
  if (!pendingFromNodeId.value) return
  if (pendingFromNodeId.value === nodeId) {
    pendingFromNodeId.value = ''
    return
  }
  const existed = edges.value.some((e) => e.from.nodeId === pendingFromNodeId.value && e.to.nodeId === nodeId)
  if (!existed) {
    edges.value.push({
      id: uid(),
      from: { nodeId: pendingFromNodeId.value, port: 'out' },
      to: { nodeId, port: 'in' }
    })
  }
  pendingFromNodeId.value = ''
}

const onBack = () => {
  router.back()
}

const canvasMode = ref({ kind: 'idle' })

const getWorldPoint = (clientX, clientY) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  const sx = clientX - rect.left
  const sy = clientY - rect.top
  return { x: (sx - offsetX.value) / scale.value, y: (sy - offsetY.value) / scale.value }
}

const onCanvasMouseDown = (e) => {
  if (e.button !== 0) return
  if (!canvasRef.value) return
  if (pendingFromNodeId.value) pendingFromNodeId.value = ''
  selectedNodeId.value = ''
  selectedEdgeId.value = ''
  canvasMode.value = { kind: 'pan', startX: e.clientX, startY: e.clientY, baseX: offsetX.value, baseY: offsetY.value }
}

const onNodeMouseDown = (e, node) => {
  if (e.button !== 0) return
  selectNode(node.id)
  const wp = getWorldPoint(e.clientX, e.clientY)
  canvasMode.value = { kind: 'move-node', nodeId: node.id, startWX: wp.x, startWY: wp.y, baseX: node.x, baseY: node.y }
}

const onMouseMove = (e) => {
  if (pendingFromNodeId.value) {
    const wp = getWorldPoint(e.clientX, e.clientY)
    pendingPointer.value = { x: wp.x, y: wp.y }
  }
  const mode = canvasMode.value
  if (mode.kind === 'pan') {
    offsetX.value = mode.baseX + (e.clientX - mode.startX)
    offsetY.value = mode.baseY + (e.clientY - mode.startY)
    return
  }
  if (mode.kind === 'move-node') {
    const wp = getWorldPoint(e.clientX, e.clientY)
    const dx = wp.x - mode.startWX
    const dy = wp.y - mode.startWY
    const node = nodes.value.find((n) => n.id === mode.nodeId)
    if (!node) return
    node.x = Math.max(0, Math.min(WORLD_WIDTH - NODE_WIDTH, mode.baseX + dx))
    node.y = Math.max(0, Math.min(WORLD_HEIGHT - NODE_HEIGHT, mode.baseY + dy))
  }
}

const onMouseUp = () => {
  canvasMode.value = { kind: 'idle' }
}

const onKeyDown = (e) => {
  if (e.key === 'Escape') {
    selectedNodeId.value = ''
    selectedEdgeId.value = ''
    if (pendingFromNodeId.value) pendingFromNodeId.value = ''
    return
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId.value) {
    removeEdge(selectedEdgeId.value)
  }
}

onMounted(async () => {
  ensureInitialViewport()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
  try {
    if (!processId.value || processId.value === 'undefined') {
      ElMessage.error('缺少流程ID，无法进入设计')
      router.replace('/flow/list')
      return
    }
    const [detailRes, designOk] = await Promise.all([
      getProcessDetail(processId.value),
      loadRemoteDesign().catch(() => false)
    ])
    if (detailRes?.data?.code === 200) {
      processName.value = detailRes.data.data?.processName || ''
      processCode.value = detailRes.data.data?.processCode || ''
    }
    if (!designOk) {
      loadDesign()
    }
  } catch (e) {
    console.error('加载流程设计失败:', e)
    ElMessage.error('加载流程设计失败')
    loadDesign()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.flow-design-view {
  margin: -20px;
  height: calc(100vh - 60px);
  background: #f0f2f5;
}

.designer-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.designer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid #e6e8ef;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
}

.designer-top-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  padding-left: 0;
}

.designer-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.designer-title-main {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.designer-title-sub {
  font-size: 12px;
  color: #6b7280;
}

.designer-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.designer-body {
  margin-top: 14px;
  flex: 1;
  display: flex;
  gap: 14px;
  min-height: 0;
}

.panel {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e6e8ef;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-left {
  width: 210px;
  padding: 12px;
  box-sizing: border-box;
}

.panel-right {
  width: 320px;
  padding: 12px;
  box-sizing: border-box;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}

.palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  padding-right: 4px;
}

.palette-item {
  border: 1px solid;
  border-radius: 10px;
  padding: 12px;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.15s, transform 0.15s;
}

.palette-item:active {
  cursor: grabbing;
}

.palette-item:hover {
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.10);
  transform: translateY(-1px);
}

.palette-item-title {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 4px;
}

.palette-item-desc {
  font-size: 12px;
  color: #6b7280;
}

.canvas-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.canvas-toolbar {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e6e8ef;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 44px;
}

.canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e6e8ef;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
}

.grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.viewport {
  position: absolute;
  left: 0;
  top: 0;
  width: 4000px;
  height: 2600px;
  transform-origin: 0 0;
}

.edges {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: auto;
}

.edge-path {
  fill: none;
  stroke: #2563eb;
  stroke-width: 2.2;
  opacity: 0.7;
  pointer-events: stroke;
  cursor: pointer;
}

.edge-path.selected {
  stroke: #dc2626;
  stroke-width: 3.2;
  opacity: 0.9;
}

.edge-path.pending {
  stroke-dasharray: 6 6;
  opacity: 0.55;
  pointer-events: none;
  cursor: default;
}

.edge-delete circle {
  fill: #ffffff;
  stroke: #dc2626;
  stroke-width: 2;
}

.edge-delete text {
  fill: #dc2626;
  font-size: 14px;
  font-weight: 800;
  user-select: none;
}

.node {
  position: absolute;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  padding: 10px 10px 10px 12px;
  box-sizing: border-box;
  cursor: grab;
  user-select: none;
}

.node:active {
  cursor: grabbing;
}

.node.selected {
  border-color: #2563eb;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.node-title {
  font-weight: 800;
  font-size: 14px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-delete {
  padding: 0;
  min-height: unset;
}

.node-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-dot {
  opacity: 0.6;
}

.port {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  transform: translateY(-50%);
  background: #fff;
  border: 2px solid #2563eb;
}

.port-in {
  left: -7px;
}

.port-out {
  right: -7px;
}

.props {
  overflow: auto;
  padding-right: 4px;
}

.props-empty {
  color: #6b7280;
  font-size: 13px;
  padding: 18px 4px;
}

.code-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 10px 0 8px;
}

.code-input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
}

.io-panel {
  margin-top: 10px;
  border: 1px solid #eef0f6;
  border-radius: 10px;
  padding: 10px;
}

.io-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.io-row + .io-row {
  margin-top: 10px;
}

.io-label {
  width: 40px;
  font-size: 12px;
  color: #6b7280;
  padding-top: 5px;
  flex: none;
}

.io-value {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
