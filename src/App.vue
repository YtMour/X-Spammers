<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { useTwitterStore } from './stores/twitter'
import CookiesImport from './components/CookiesImport.vue'

const store = useTwitterStore()
const showCookiesImport = ref(true)

const form = reactive({
  searchQuery: '',
  messageTemplate: '',
  sendDelay: 5000
})

// 监听表单变化，更新 store
watch(form, (newValue) => {
  store.updateSettings(newValue)
}, { deep: true })

const handleStart = () => {
  if (!form.searchQuery || !form.messageTemplate) {
    store.addLog('请填写搜索关键词和发送消息', 'warning')
    return
  }

  if (store.isRunning) {
    store.stopTask()
  } else {
    store.startTask()
  }
}

const clearLogs = () => {
  store.clearLogs()
}

const handleCookiesImported = () => {
  showCookiesImport.value = false
  store.addLog('Cookies 导入成功', 'success')
}

const handleCookiesError = (message: string) => {
  store.addLog(message, 'error')
}
</script>

<template>
  <div class="container">
    <header>
      <h1>Twitter 自动私信工具</h1>
    </header>
    
    <main>
      <div v-if="showCookiesImport">
        <div class="card">
          <CookiesImport
            @success="handleCookiesImported"
            @error="handleCookiesError"
          />
        </div>
      </div>
      
      <template v-else>
        <div class="settings-panel">
          <div class="card">
            <h2>任务设置</h2>
            <div class="form-group">
              <label>搜索关键词</label>
              <input v-model="form.searchQuery" placeholder="输入搜索关键词" />
            </div>
            
            <div class="form-group">
              <label>发送消息</label>
              <textarea 
                v-model="form.messageTemplate"
                placeholder="输入要发送的消息内容"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>发送延迟(ms)</label>
              <input 
                type="number" 
                v-model="form.sendDelay"
                min="1000"
                max="60000"
                step="1000"
              />
            </div>

            <button 
              :class="['action-button', store.isRunning ? 'stop' : 'start']"
              @click="handleStart"
            >
              {{ store.isRunning ? '停止任务' : '开始任务' }}
            </button>
          </div>
        </div>

        <div class="status-panel">
          <div class="card">
            <h2>任务状态</h2>
            <div class="status-info">
              <div class="status-item">
                <span>当前状态:</span>
                <span :class="['status-badge', store.isRunning ? 'running' : 'stopped']">
                  {{ store.isRunning ? '运行中' : '已停止' }}
                </span>
              </div>
              <div class="status-item">
                <span>已发送消息:</span>
                <span>{{ store.sentCount }}</span>
              </div>
            </div>
          </div>

          <div class="card logs-card">
            <div class="card-header">
              <h2>操作日志</h2>
              <button class="clear-button" @click="clearLogs">清空</button>
            </div>
            <div class="logs-container">
              <div 
                v-for="(log, index) in store.logs" 
                :key="index" 
                :class="['log-item', log.type]"
              >
                <span class="log-time">{{ log.time }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: #2c3e50;
  font-size: 24px;
}

main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  resize: vertical;
}

.action-button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-button.start {
  background-color: #409eff;
}

.action-button.start:hover {
  background-color: #66b1ff;
}

.action-button.stop {
  background-color: #f56c6c;
}

.action-button.stop:hover {
  background-color: #f78989;
}

.status-info {
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status-badge.running {
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-badge.stopped {
  background-color: #f4f4f5;
  color: #909399;
}

.logs-container {
  height: 400px;
  overflow-y: auto;
  padding: 10px;
  background: #1e1e1e;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.log-item {
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  border-left: 4px solid transparent;
}

.log-time {
  color: #888;
  margin-right: 10px;
  font-size: 12px;
  white-space: nowrap;
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.log-item.info {
  background-color: #1a1a1a;
  border-left-color: #409eff;
  color: #e6e6e6;
}

.log-item.success {
  background-color: #1a1a1a;
  border-left-color: #67c23a;
  color: #95d475;
}

.log-item.warning {
  background-color: #1a1a1a;
  border-left-color: #e6a23c;
  color: #f3d19e;
}

.log-item.error {
  background-color: #1a1a1a;
  border-left-color: #f56c6c;
  color: #f89898;
}

.logs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 10px;
}

.clear-button {
  padding: 4px 12px;
  border: none;
  background: #2c2c2c;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-button:hover {
  background: #363636;
  color: #fff;
}
</style>
