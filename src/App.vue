<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { useTwitterStore } from './stores/twitter'
import CookiesImport from './components/CookiesImport.vue'

const store = useTwitterStore()
const showCookiesImport = ref(true)

const form = reactive({
  searchQuery: '',
  messageTemplate: '',
  sendDelay: 5000,
  pageLoadDelay: 10000,
  scrollInterval: 8000,
  buttonCheckDelay: 3000,
  retryDelay: 15000
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
    <div v-if="showCookiesImport" class="fade-slide-up">
      <CookiesImport
        @success="handleCookiesImported"
        @error="handleCookiesError"
      />
    </div>
    
    <template v-else>
      <header class="app-header fade-slide-down">
        <div class="twitter-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="twitter-logo">
            <g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"></path></g>
          </svg>
        </div>
        <h1>X-Spammers</h1>
      </header>
      
      <main class="app-main fade-slide-up">
        <div class="settings-panel">
          <div class="card settings-card">
            <h2>基本设置</h2>
            <div class="form-content">
              <div class="form-group">
                <label>搜索关键词</label>
                <input 
                  v-model="form.searchQuery" 
                  placeholder="输入搜索关键词"
                  class="styled-input"
                />
              </div>
              
              <div class="form-group">
                <label>发送消息</label>
                <textarea 
                  v-model="form.messageTemplate"
                  placeholder="输入要发送的消息内容"
                  rows="3"
                  class="styled-input"
                ></textarea>
              </div>

              <div class="delay-settings">
                <h3>延迟设置 (毫秒)</h3>
                <div class="delay-grid">
                  <div class="delay-item">
                    <label>发送延迟</label>
                    <input 
                      type="number" 
                      v-model="form.sendDelay"
                      min="1000"
                      max="60000"
                      step="1000"
                      class="styled-input"
                    />
                  </div>
                  
                  <div class="delay-item">
                    <label>页面加载延迟</label>
                    <input 
                      type="number" 
                      v-model="form.pageLoadDelay"
                      min="5000"
                      max="60000"
                      step="1000"
                      class="styled-input"
                    />
                  </div>

                  <div class="delay-item">
                    <label>滚动间隔</label>
                    <input 
                      type="number" 
                      v-model="form.scrollInterval"
                      min="1000"
                      max="60000"
                      step="1000"
                      class="styled-input"
                    />
                  </div>

                  <div class="delay-item">
                    <label>按钮检查延迟</label>
                    <input 
                      type="number" 
                      v-model="form.buttonCheckDelay"
                      min="1000"
                      max="60000"
                      step="1000"
                      class="styled-input"
                    />
                  </div>

                  <div class="delay-item">
                    <label>重试延迟</label>
                    <input 
                      type="number" 
                      v-model="form.retryDelay"
                      min="5000"
                      max="60000"
                      step="1000"
                      class="styled-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              :class="['action-button', store.isRunning ? 'stop' : '']"
              @click="handleStart"
            >
              <span class="button-content">
                <span class="button-text">{{ store.isRunning ? '停止任务' : '开始任务' }}</span>
                <svg class="button-icon" viewBox="0 0 24 24">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/>
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div class="status-panel">
          <div class="card status-card">
            <h2>任务状态</h2>
            <div class="status-content">
              <div class="status-info">
                <div class="status-item">
                  <span>当前状态:</span>
                  <span :class="['status-badge', store.isRunning ? 'running' : 'stopped']">
                    {{ store.isRunning ? '运行中' : '已停止' }}
                  </span>
                </div>
                <div class="status-item">
                  <span>已发送消息:</span>
                  <span class="count-badge">{{ store.sentCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card logs-card">
            <div class="card-header">
              <h2>操作日志</h2>
              <button class="clear-button" @click="clearLogs">
                <svg viewBox="0 0 24 24" class="clear-icon">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
                </svg>
                清空
              </button>
            </div>
            <div class="logs-content">
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
  color: var(--text-color);
  overflow: hidden;
  background: linear-gradient(135deg, #15202b 0%, #1a2734 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(29, 155, 240, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(29, 155, 240, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
}

.app-header {
  padding: 16px;
  height: 60px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(29, 155, 240, 0.3),
      transparent
    );
  }

  .twitter-icon {
    width: 32px;
    height: 32px;
    
    .twitter-logo {
      width: 100%;
      height: 100%;
      color: #1d9bf0;
      filter: drop-shadow(0 0 8px rgba(29, 155, 240, 0.3));
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.05);
        color: #1a8cd8;
        filter: drop-shadow(0 0 12px rgba(29, 155, 240, 0.5));
      }
    }
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #1d9bf0, #1a8cd8);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: -0.5px;
    position: relative;
    text-shadow: 0 2px 10px rgba(29, 155, 240, 0.2);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #1d9bf0, transparent);
      opacity: 0;
      transform: scaleX(0.8);
      transition: all 0.3s ease;
    }
    
    &:hover::after {
      opacity: 1;
      transform: scaleX(1);
    }
  }
}

.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  height: calc(100vh - 60px);
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.settings-panel, .status-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.card {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  
  &:hover {
    border-color: rgba(29, 155, 240, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 0.03);
  }
}

.settings-card, .status-card, .logs-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  position: relative;
  
  h2 {
    font-size: 18px;
    color: #1d9bf0;
    text-shadow: 0 0 20px rgba(29, 155, 240, 0.3);
    flex-shrink: 0;
    margin: 0;
  }
}

.settings-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  
  h2 {
    font-size: 18px;
    color: #1d9bf0;
    text-shadow: 0 0 20px rgba(29, 155, 240, 0.3);
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '';
      width: 20px;
      height: 20px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231d9bf0'%3E%3Cpath d='M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'/%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      flex-shrink: 0;
      filter: drop-shadow(0 0 8px rgba(29, 155, 240, 0.3));
      transition: all 0.3s ease;
    }
    
    &:hover::before {
      filter: drop-shadow(0 0 12px rgba(29, 155, 240, 0.5));
      transform: scale(1.05);
    }
  }

  .form-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    margin-right: -8px;
    
    .form-group {
      margin-bottom: 12px;
    }
    
    .delay-settings {
      margin-top: 8px;
      padding-top: 12px;
      margin-bottom: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      
      h3 {
        margin-bottom: 8px;
      }
    }
    
    .delay-grid {
      gap: 8px;
      margin-top: 6px;
    }
  }
  
  .action-button {
    margin-top: 8px;
    position: relative;
    width: 100%;
  }
}

.status-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  gap: 12px;
  isolation: isolate;
}

.status-card {
  padding: 16px;
  height: fit-content;
  
  h2 {
    font-size: 18px;
    color: #1d9bf0;
    text-shadow: 0 0 20px rgba(29, 155, 240, 0.3);
    margin: 0 0 6px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '';
      width: 20px;
      height: 20px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231d9bf0'%3E%3Cpath d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'/%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      flex-shrink: 0;
      filter: drop-shadow(0 0 8px rgba(29, 155, 240, 0.3));
      transition: all 0.3s ease;
    }
    
    &:hover::before {
      filter: drop-shadow(0 0 12px rgba(29, 155, 240, 0.5));
      transform: scale(1.05);
    }
  }

  .status-content {
    margin-top: 6px;
  }
  
  .status-info {
    margin-top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  
  .status-item {
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    
    span:first-child {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }
  }
}

.status-badge, .count-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  font-size: 13px;
}

.status-badge {
  &.running {
    background: rgba(35, 134, 54, 0.2);
    color: #3fb950;
    border: 1px solid rgba(35, 134, 54, 0.3);
  }
  
  &.stopped {
    background: rgba(139, 148, 158, 0.2);
    color: #8b949e;
    border: 1px solid rgba(139, 148, 158, 0.3);
  }
}

.count-badge {
  background: rgba(29, 155, 240, 0.2);
  color: #1d9bf0;
  border: 1px solid rgba(29, 155, 240, 0.3);
}

.logs-card {
  margin-top: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  isolation: isolate;
  position: relative;
  z-index: 0;
  
  .logs-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin-top: 0;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    isolation: isolate;
    z-index: 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    position: relative;
    z-index: 2;
    
    h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &::before {
        content: '';
        width: 20px;
        height: 20px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231d9bf0'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 3h-3.5V7h3.5V6zm0 3h-3.5v1h3.5V9zm-10 4h10v1H7v-1zm0 3h10v1H7v-1zm-2-9h1v1H5V7zm0 3h1v1H5v-1z'/%3E%3C/svg%3E");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        flex-shrink: 0;
        filter: drop-shadow(0 0 8px rgba(29, 155, 240, 0.3));
        transition: all 0.3s ease;
      }
      
      &:hover::before {
        filter: drop-shadow(0 0 12px rgba(29, 155, 240, 0.5));
        transform: scale(1.05);
      }
    }
  }
  
  .logs-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px;
    transition: all 0.3s ease;
    position: relative;
    isolation: isolate;
    z-index: 1;
    clip-path: inset(0 0 0 0 round 12px);
    
    .log-item {
      position: relative;
      z-index: 1;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
      overflow: hidden;
      animation: fadeSlideLeft 0.3s ease forwards;
      isolation: isolate;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        transition: all 0.3s ease;
      }
      
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.02);
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: -1;
      }
      
      &:hover {
        transform: translateX(4px);
        border-color: rgba(255, 255, 255, 0.1);
        
        &::after {
          opacity: 1;
        }
      }
      
      &.success {
        border-left: none;
        background: rgba(35, 134, 54, 0.05);
        border-color: rgba(35, 134, 54, 0.2);
        
        &::before {
          background: #3fb950;
          box-shadow: 0 0 10px rgba(63, 185, 80, 0.4);
        }
        
        &:hover {
          background: rgba(35, 134, 54, 0.1);
        }
        
        .log-time {
          color: rgba(63, 185, 80, 0.8);
        }
      }
      
      &.error {
        border-left: none;
        background: rgba(248, 81, 73, 0.05);
        border-color: rgba(248, 81, 73, 0.2);
        
        &::before {
          background: #f85149;
          box-shadow: 0 0 10px rgba(248, 81, 73, 0.4);
        }
        
        &:hover {
          background: rgba(248, 81, 73, 0.1);
        }
        
        .log-time {
          color: rgba(248, 81, 73, 0.8);
        }
      }
      
      &.warning {
        border-left: none;
        background: rgba(210, 153, 34, 0.05);
        border-color: rgba(210, 153, 34, 0.2);
        
        &::before {
          background: #d29922;
          box-shadow: 0 0 10px rgba(210, 153, 34, 0.4);
        }
        
        &:hover {
          background: rgba(210, 153, 34, 0.1);
        }
        
        .log-time {
          color: rgba(210, 153, 34, 0.8);
        }
      }
      
      &.info {
        border-left: none;
        background: rgba(29, 155, 240, 0.05);
        border-color: rgba(29, 155, 240, 0.2);
        
        &::before {
          background: #1d9bf0;
          box-shadow: 0 0 10px rgba(29, 155, 240, 0.4);
        }
        
        &:hover {
          background: rgba(29, 155, 240, 0.1);
        }
        
        .log-time {
          color: rgba(29, 155, 240, 0.8);
        }
      }
      
      .log-time {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        margin-right: 10px;
        font-family: monospace;
      }
      
      .log-message {
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        line-height: 1.5;
      }
    }
  }
}

.action-button {
  margin-top: 20px;
  flex-shrink: 0;
  height: 44px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #1d9bf0, #1a8cd8);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;
  
  .button-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
  }
  
  .button-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  
  .button-text {
    font-weight: 600;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3);
    
    &::before {
      transform: translateX(100%);
    }
    
    .button-icon {
      transform: translateX(2px);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.stop {
    background: linear-gradient(135deg, #f85149, #dc2626);
    
    &:hover {
      box-shadow: 0 4px 12px rgba(248, 81, 73, 0.3);
    }
    
    .button-icon {
      transform: rotate(180deg);
    }
    
    &:hover .button-icon {
      transform: rotate(180deg) translateX(-2px);
    }
  }
}

.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid rgba(29, 155, 240, 0.3);
  background: rgba(29, 155, 240, 0.1);
  color: #1d9bf0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 72px;
  justify-content: center;
  
  .clear-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
  
  &:hover {
    background: #1d9bf0;
    color: white;
    border-color: #1d9bf0;
  }
}

.form-group {
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-color);
  }
}

.styled-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  box-sizing: border-box;
  max-width: 100%;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:hover {
    border-color: rgba(29, 155, 240, 0.3);
    background: rgba(0, 0, 0, 0.25);
  }
  
  &:focus {
    outline: none;
    border-color: #1d9bf0;
    box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.15);
    background: rgba(0, 0, 0, 0.3);
  }
}

textarea.styled-input {
  min-height: 100px;
  max-height: 150px;
  resize: vertical;
}

.delay-settings {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
  margin-bottom: 20px;
  
  h3 {
    margin-bottom: 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
  }
}

.delay-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.delay-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  label {
    font-size: 12px;
    white-space: nowrap;
    color: rgba(255, 255, 255, 0.6);
  }
  
  input {
    padding: 6px 10px;
    font-size: 13px;
    height: 32px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}

.twitter-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.twitter-logo {
  width: 100%;
  height: 100%;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-slide-up {
  animation: fadeSlideUp 0.5s ease forwards;
}

.fade-slide-down {
  animation: fadeSlideDown 0.5s ease forwards;
}

@keyframes fadeSlideLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
