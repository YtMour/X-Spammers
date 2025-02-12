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
  <div class="app-container">
    <div v-if="showCookiesImport">
      <CookiesImport
        @success="handleCookiesImported"
        @error="handleCookiesError"
      />
    </div>
    
    <template v-else>
      <header class="app-header">
        <h1>Twitter 自动私信工具</h1>
      </header>
      
      <main class="app-main">
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
      </main>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg-color);
  color: var(--text-color);
  overflow: hidden;
}

:root {
  --app-bg-color: #15202b;
  --card-bg-color: #192734;
  --text-color: #fff;
  --border-color: #2f3336;
  --hover-color: #1d9bf0;
  
  @media (prefers-color-scheme: light) {
    --app-bg-color: #f7f9f9;
    --card-bg-color: #fff;
    --text-color: #0f1419;
    --border-color: #cfd9de;
  }
}

.app-header {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-color);
  }
}

.app-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  height: calc(100vh - 45px); // 减去header高度
  overflow: hidden;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

h2 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-color);
  font-size: 13px;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg-color);
  color: var(--text-color);
  font-size: 13px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--hover-color);
    box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.1);
  }
}

textarea {
  resize: none;
  height: 60px;
}

.action-button {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: auto;
}

.action-button.start {
  background-color: #1d9bf0;
  
  &:hover {
    background-color: #1a8cd8;
  }
}

.action-button.stop {
  background-color: #f4212e;
  
  &:hover {
    background-color: #e0202b;
  }
}

.status-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.status-info {
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 13px;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.running {
  background-color: #00ba7c;
  color: white;
}

.status-badge.stopped {
  background-color: var(--border-color);
  color: var(--text-color);
}

.logs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; // 重要：允许内容收缩
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.clear-button {
  padding: 4px 8px;
  border: none;
  background: var(--border-color);
  color: var(--text-color);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--hover-color);
    color: white;
  }
}

.logs-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background: #1e1e1e;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  min-height: 0; // 重要：允许内容收缩
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
    
    &:hover {
      background: var(--hover-color);
    }
  }
}

.log-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  border-left: 3px solid transparent;
}

.log-time {
  color: #888;
  margin-right: 8px;
  font-size: 11px;
  white-space: nowrap;
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.log-item.info {
  background-color: rgba(29, 155, 240, 0.1);
  border-left-color: #1d9bf0;
  color: #e6e6e6;
}

.log-item.success {
  background-color: rgba(0, 186, 124, 0.1);
  border-left-color: #00ba7c;
  color: #95d475;
}

.log-item.warning {
  background-color: rgba(255, 212, 0, 0.1);
  border-left-color: #ffd400;
  color: #f3d19e;
}

.log-item.error {
  background-color: rgba(244, 33, 46, 0.1);
  border-left-color: #f4212e;
  color: #f89898;
}
</style>
