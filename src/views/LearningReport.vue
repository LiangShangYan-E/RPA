<template>
  <div class="learning-report-container">
    <div class="page-header">
      <h2>学习周报</h2>
      <p class="subtitle">记录本周学习成果与下周计划</p>
    </div>
    
    <el-card shadow="never" class="form-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="report-form">
        <!-- 项目列表选择 -->
        <el-form-item label="项目列表" prop="projectList" required>
          <el-checkbox-group v-model="form.projectList" class="project-checkbox-group">
            <el-checkbox label="RPA运营管理系统" />
            <el-checkbox label="数据工厂" />
          </el-checkbox-group>
        </el-form-item>
        
        <!-- 项目任务完成情况 -->
        <el-form-item label="项目任务完成情况" prop="projectTaskCompletion" required>
          <el-input
            v-model="form.projectTaskCompletion"
            type="textarea"
            :rows="4"
            placeholder="完成了XXXX页面开发，完成了XXXX接口开发，完成了XXXX文档编写"
            resize="vertical"
          />
        </el-form-item>
        
        <!-- 学习任务完成情况 -->
        <el-form-item label="学习任务完成情况" prop="taskCompletion" required>
          <el-input
            v-model="form.taskCompletion"
            type="textarea"
            :rows="4"
            placeholder="学习了xxxx技能，完成了xxx学习任务"
            resize="vertical"
          />
        </el-form-item>
        
        <!-- 遇到的问题与解决思路 -->
        <el-form-item label="遇到的问题与解决思路" prop="problemsAndSolutions" required>
          <el-input
            v-model="form.problemsAndSolutions"
            type="textarea"
            :rows="4"
            placeholder="碰到了xxxx问题，参考了xxx文档，使用了xxx方法，解决了xxx问题"
            resize="vertical"
          />
        </el-form-item>
        
        <!-- 收获 -->
        <el-form-item label="收获" prop="gains" required>
          <el-input
            v-model="form.gains"
            type="textarea"
            :rows="4"
            placeholder="了解了xxx的使用，解决了xxx问题"
            resize="vertical"
          />
        </el-form-item>
        
        <!-- 下周计划 -->
        <el-form-item label="下周计划" prop="nextWeekPlan" required>
          <el-input
            v-model="form.nextWeekPlan"
            type="textarea"
            :rows="4"
            placeholder="计划学习xxxx，计划完成xxx任务"
            resize="vertical"
          />
        </el-form-item>
        
        <div class="form-footer">
          <el-button type="primary" @click="submitForm(formRef)">提交</el-button>
          <el-button @click="resetForm(formRef)">退出</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUser } from '../services/auth'

const formRef = ref(null)

// 获取当前用户信息
const currentUser = getUser()

// 表单数据 - 根据任务表格预填内容
const form = reactive({
  projectList: ['RPA运营管理系统'],
  projectTaskCompletion: `完成了任务管理模块的前端页面开发，包括：
1. 任务列表页面：实现了新增/编辑弹窗功能，支持关联流程和机器人下拉选择，以及删除确认功能
2. 执行管理页面：完成了执行记录展示、详情展示页面开发，支持按状态、id、执行时间等多条件筛选
3. 任务启动功能的前端对接：实现了执行列表页面的任务启动接口调用

后端接口开发：
1. 任务增删改查接口开发，支持分页列表查询
2. 多条件筛选接口（支持状态、关键字、流程、机器人、执行时间筛选）
3. 启动执行接口开发（调用机器人线程池）
4. 执行记录展示接口开发`,
  taskCompletion: `1. 学习了 Vue 3 + Element Plus 表单开发技巧，包括复杂表单验证和联动逻辑
2. 学习了前后端接口对接规范，掌握了 RESTful API 设计规范
3. 学习了任务调度相关知识，理解了线程池管理和异步任务执行机制
4. 完成了任务管理和执行记录模块的联调测试`,
  problemsAndSolutions: `1. **问题**：任务新增弹窗需要关联流程和机器人下拉数据，数据量较大时加载慢
   **解决**：参考了 Element Plus 文档，使用了远程搜索功能，实现了按需加载和分页查询

2. **问题**：执行记录列表需要支持多条件组合筛选，前端传参复杂
   **解决**：使用了 Vue 3 的响应式对象统一管理筛选条件，后端使用 MyBatis Plus 的 QueryWrapper 动态构建查询条件

3. **问题**：任务启动接口需要调用机器人线程池，需要考虑并发控制
   **解决**：参考了并发编程相关文档，使用了线程池管理器来统一管理机器人执行线程，避免了资源竞争问题`,
  gains: `1. 深入了解了 Vue 3 组合式 API 的使用，提升了组件开发效率
2. 掌握了复杂表单的开发模式，包括动态表单验证和联动逻辑
3. 理解了任务调度系统的设计原理，解决了多任务并发执行的问题
4. 提升了前后端协作能力，熟悉了接口联调的最佳实践`,
  nextWeekPlan: `1. **数据管理模块开发**：
   - 数据采集页面开发：实现数据源配置、采集任务创建和执行
   - 数据解析页面开发：实现数据格式解析和转换功能
   - 数据处理页面开发：实现数据清洗、过滤和转换功能
   - 数据查询页面开发：实现多维度数据查询和导出功能

2. **学习任务**：
   - 学习数据处理相关技术（如数据清洗、ETL 流程）
   - 学习数据库优化和查询性能调优
   - 学习数据可视化相关技术`,
  userId: currentUser?.id || '',
  username: currentUser?.username || '',
  submitTime: ''
})

// 表单验证规则
const rules = reactive({
  projectList: [
    { required: true, message: '请至少选择一个项目', trigger: 'change', type: 'array' }
  ],
  projectTaskCompletion: [
    { required: true, message: '请输入项目任务完成情况', trigger: 'blur' },
    { min: 5, message: '请输入至少5个字符', trigger: 'blur' }
  ],
  taskCompletion: [
    { required: true, message: '请输入学习任务完成情况', trigger: 'blur' },
    { min: 5, message: '请输入至少5个字符', trigger: 'blur' }
  ],
  problemsAndSolutions: [
    { required: true, message: '请输入遇到的问题与解决思路', trigger: 'blur' },
    { min: 5, message: '请输入至少5个字符', trigger: 'blur' }
  ],
  gains: [
    { required: true, message: '请输入收获', trigger: 'blur' },
    { min: 5, message: '请输入至少5个字符', trigger: 'blur' }
  ],
  nextWeekPlan: [
    { required: true, message: '请输入下周计划', trigger: 'blur' },
    { min: 5, message: '请输入至少5个字符', trigger: 'blur' }
  ]
})

// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        // 设置提交时间
        form.submitTime = new Date().toISOString()
        
        // 这里可以调用API提交数据
        // await submitLearningReport(form)
        
        console.log('提交的数据:', form)
        ElMessage.success('学习周报提交成功')
        
        // 提交后可以选择是否重置表单
        // formEl.resetFields()
      } catch (error) {
        ElMessage.error('提交失败，请重试')
        console.error('提交错误:', error)
      }
    }
  })
}

// 重置表单
const resetForm = (formEl) => {
  if (formEl) {
    formEl.resetFields()
    ElMessage.info('已退出编辑')
  }
}

onMounted(() => {
  // 可以在这里加载已有的周报数据
  console.log('学习周报页面已加载')
})
</script>

<style scoped>
.learning-report-container {
  padding: 32px;
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.form-card {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px;
}

.report-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.report-form :deep(.el-form-item) {
  margin-bottom: 0;
  flex-shrink: 0;
}

.report-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 15px;
  padding-bottom: 8px;
}

.report-form :deep(.el-form-item__label::before) {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

/* 项目复选框组样式 */
.project-checkbox-group {
  display: flex;
  gap: 16px;
}

.project-checkbox-group :deep(.el-checkbox) {
  margin-right: 0;
}

.project-checkbox-group :deep(.el-checkbox__label) {
  font-size: 14px;
  font-weight: 500;
}

.project-checkbox-group :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

/* 文本域样式 */
.report-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s;
}

.report-form :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.report-form :deep(.el-textarea__inner::placeholder) {
  color: #9ca3af;
}

/* 底部按钮 */
.form-footer {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-footer .el-button {
  min-width: 100px;
  border-radius: 8px;
  font-weight: 500;
}

.form-footer .el-button--primary {
  background: #3b82f6;
  border-color: #3b82f6;
}

.form-footer .el-button--primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}
</style>