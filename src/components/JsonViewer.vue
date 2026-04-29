<template>
  <div class="json-viewer" :class="[`json-level-${level}`, { 'json-viewer--root': isRoot }]">
    <template v-if="isObjectNode || isArrayNode">
      <div class="json-branch">
        <button type="button" class="json-branch__toggle" @click="expanded = !expanded">
          <span class="json-branch__arrow" :class="{ 'is-expanded': expanded }">▶</span>
          <span v-if="hasLabel" class="json-branch__label">{{ label }}</span>
          <span class="json-branch__type">{{ nodeTypeLabel }}</span>
          <span class="json-branch__meta">{{ nodeMetaLabel }}</span>
        </button>

        <div v-show="expanded" class="json-branch__children">
          <template v-if="isObjectNode">
            <JsonViewer
              v-for="(value, key) in data"
              :key="String(key)"
              :data="value"
              :label="String(key)"
              :level="level + 1"
            />
          </template>

          <template v-else>
            <JsonViewer
              v-for="(item, index) in data"
              :key="`${label || 'item'}-${index}`"
              :data="item"
              :label="`[${index}]`"
              :level="level + 1"
            />
          </template>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="json-leaf">
        <div class="json-leaf__key" :class="{ 'is-empty': !hasLabel }">
          <span v-if="hasLabel">{{ label }}</span>
          <span v-else class="json-leaf__key-placeholder">值</span>
        </div>
        <div class="json-leaf__value-wrap">
          <span class="json-leaf__type">{{ primitiveType }}</span>
          <span class="json-leaf__value" :class="`is-${primitiveType}`">{{ primitiveDisplayValue }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'JsonViewer'
})

const props = defineProps({
  data: {
    type: null,
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 0
  }
})

const isRoot = computed(() => props.level === 0)
const hasLabel = computed(() => Boolean(props.label))
const isArrayNode = computed(() => Array.isArray(props.data))
const isObjectNode = computed(() => props.data !== null && typeof props.data === 'object' && !Array.isArray(props.data))
const expanded = ref(props.level <= 1)

watch(() => props.data, () => {
  expanded.value = props.level <= 1
})

const nodeTypeLabel = computed(() => (isArrayNode.value ? 'Array' : 'Object'))
const nodeMetaLabel = computed(() => {
  if (isArrayNode.value) return `${props.data.length} 项`
  return `${Object.keys(props.data || {}).length} 个字段`
})

const primitiveType = computed(() => {
  if (props.data === null) return 'null'
  if (typeof props.data === 'string') return 'string'
  if (typeof props.data === 'number') return 'number'
  if (typeof props.data === 'boolean') return 'boolean'
  if (typeof props.data === 'undefined') return 'undefined'
  return 'value'
})

const primitiveDisplayValue = computed(() => {
  if (props.data === null) return 'null'
  if (typeof props.data === 'boolean') return props.data ? 'true' : 'false'
  if (typeof props.data === 'undefined') return 'undefined'
  return String(props.data)
})
</script>

<style scoped>
.json-viewer {
  width: 100%;
}

.json-viewer--root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.json-branch,
.json-leaf {
  border: 1px solid #e9eef5;
  border-radius: 14px;
  background: #fff;
}

.json-branch__toggle {
  width: 100%;
  border: none;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
}

.json-branch__arrow {
  color: #64748b;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.json-branch__arrow.is-expanded {
  transform: rotate(90deg);
}

.json-branch__label,
.json-leaf__key {
  color: #0f172a;
  font-weight: 600;
  word-break: break-word;
}

.json-branch__type,
.json-leaf__type {
  color: #2563eb;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
}

.json-branch__meta {
  margin-left: auto;
  color: #64748b;
  font-size: 12px;
}

.json-branch__children {
  padding: 0 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.json-level-1,
.json-level-2,
.json-level-3,
.json-level-4,
.json-level-5,
.json-level-6 {
  margin-left: 14px;
}

.json-leaf {
  display: grid;
  grid-template-columns: minmax(120px, 180px) 1fr;
  align-items: start;
}

.json-leaf__key {
  padding: 14px 16px;
  border-right: 1px solid #eef2f7;
  background: #fbfcfe;
}

.json-leaf__key.is-empty {
  color: #94a3b8;
}

.json-leaf__key-placeholder {
  font-weight: 500;
}

.json-leaf__value-wrap {
  padding: 14px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.json-leaf__value {
  color: #0f172a;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.json-leaf__value.is-string {
  color: #0f766e;
}

.json-leaf__value.is-number {
  color: #7c3aed;
}

.json-leaf__value.is-boolean {
  color: #ea580c;
}

.json-leaf__value.is-null,
.json-leaf__value.is-undefined {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .json-leaf {
    grid-template-columns: 1fr;
  }

  .json-leaf__key {
    border-right: none;
    border-bottom: 1px solid #eef2f7;
  }

  .json-level-1,
  .json-level-2,
  .json-level-3,
  .json-level-4,
  .json-level-5,
  .json-level-6 {
    margin-left: 8px;
  }
}
</style>