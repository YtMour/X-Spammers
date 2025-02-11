<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <n-message-provider>
      <div class="app-container">
        <n-layout>
          <n-layout-header class="header">
            <div class="header-content">
              <h1>X-Spammers 控制面板</h1>
              <n-switch v-model:value="isDark">
                <template #checked>
                  <n-icon><moon-icon /></n-icon>
                </template>
                <template #unchecked>
                  <n-icon><sun-icon /></n-icon>
                </template>
              </n-switch>
            </div>
          </n-layout-header>

          <n-layout-content class="content">
            <n-card title="配置设置" class="config-card">
              <n-form
                ref="formRef"
                :model="config"
                :rules="rules"
                label-placement="left"
                label-width="120"
                require-mark-placement="right-hanging"
              >
                <n-form-item label="搜索关键词" path="searchQuery">
                  <n-input
                    v-model:value="config.searchQuery"
                    placeholder="输入搜索关键词"
                  />
                </n-form-item>

                <n-form-item label="发送消息" path="message">
                  <n-input
                    v-model:value="config.message"
                    type="textarea"
                    :rows="4"
                    placeholder="输入要发送的消息"
                  />
                </n-form-item>

                <n-form-item label="发送频率（秒）" path="frequency">
                  <n-input-number
                    v-model:value="config.frequency"
                    :min="1"
                    :max="3600"
                  />
                </n-form-item>
              </n-form>

              <div class="action-buttons">
                <n-button
                  type="primary"
                  :disabled="isRunning"
                  @click="handleStart"
                  class="action-button"
                >
                  <template #icon>
                    <n-icon><play-icon /></n-icon>
                  </template>
                  启动任务
                </n-button>
                <n-button
                  type="error"
                  :disabled="!isRunning"
                  @click="handleStop"
                  class="action-button"
                >
                  <template #icon>
                    <n-icon><stop-icon /></n-icon>
                  </template>
                  停止任务
                </n-button>
              </div>
            </n-card>

            <n-card title="运行日志" class="log-card">
              <n-scrollbar style="max-height: 300px">
                <div class="log-content">
                  <n-timeline>
                    <n-timeline-item
                      v-for="(log, index) in logs"
                      :key="index"
                      :type="getLogType(log)"
                      :title="log"
                      :time="getLogTime(log)"
                    />
                  </n-timeline>
                </div>
              </n-scrollbar>
            </n-card>
          </n-layout-content>

          <n-layout-footer class="footer">
            <span>© 2024 X-Spammers. All rights reserved.</span>
          </n-layout-footer>
        </n-layout>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ipcRenderer } from 'electron'
import { 
  darkTheme, 
  useMessage,
  type FormInst, 
  type FormRules,
  NIcon
} from 'naive-ui'
import { 
  MoonFilled as MoonIcon, 
  SunFilled as SunIcon,
  PlayArrowRounded as PlayIcon,
  StopRounded as StopIcon
} from '@vicons/material'

interface Config {
  searchQuery: string
  message: string
  frequency: number
}

const formRef = ref<FormInst | null>(null)
const message = useMessage()
const isDark = ref(false)

const config = ref<Config>({
  searchQuery: '',
  message: '',
  frequency: 60
})

const rules: FormRules = {
  searchQuery: {
    required: true,
    message: '请输入搜索关键词',
    trigger: 'blur'
  },
  message: {
    required: true,
    message: '请输入要发送的消息',
    trigger: 'blur'
  },
  frequency: {
    type: 'number',
    required: true,
    message: '请输入发送频率',
    trigger: ['blur', 'change']
  }
}

const isRunning = ref(false)
const logs = ref<string[]>([])

const addLog = (msg: string) => {
  const time = new Date().toLocaleTimeString()
  logs.value.push(`[${time}] ${msg}`)
}

const getLogType = (log: string): 'success' | 'error' | 'info' => {
  if (log.includes('成功') || log.includes('启动')) return 'success'
  if (log.includes('失败') || log.includes('错误')) return 'error'
  return 'info'
}

const getLogTime = (log: string): string => {
  const match = log.match(/\[(.*?)\]/)
  return match ? match[1] : ''
}

const handleStart = async () => {
  try {
    await formRef.value?.validate()
    await ipcRenderer.invoke('start-task', config.value)
    isRunning.value = true
    message.success('任务已启动')
    addLog('任务已启动')
  } catch (error) {
    message.error(`启动失败: ${error}`)
    addLog(`启动失败: ${error}`)
  }
}

const handleStop = async () => {
  try {
    await ipcRenderer.invoke('stop-task')
    isRunning.value = false
    message.success('任务已停止')
    addLog('任务已停止')
  } catch (error) {
    message.error(`停止失败: ${error}`)
    addLog(`停止失败: ${error}`)
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--body-color);
}

.header {
  padding: 16px;
  background-color: var(--header-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0;
      font-size: 24px;
      color: var(--text-color);
    }
  }
}

.content {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 16px;

  .config-card,
  .log-card {
    margin-bottom: 24px;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;

    .action-button {
      min-width: 120px;
    }
  }

  .log-content {
    padding: 16px;
  }
}

.footer {
  text-align: center;
  padding: 16px;
  background-color: var(--footer-color);
  border-top: 1px solid var(--border-color);
}

:root {
  --body-color: #{$background-color-light};
  --header-color: #fff;
  --footer-color: #fff;
  --text-color: #{$text-color-base};
  --border-color: #{$border-color};
}

.dark {
  --body-color: #{$background-color-dark};
  --header-color: #242424;
  --footer-color: #242424;
  --text-color: #fff;
  --border-color: #333;
}
</style> 