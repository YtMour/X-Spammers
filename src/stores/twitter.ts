import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TwitterService, TwitterConfig } from '../services/twitter'

export interface TwitterSettings {
  searchQuery: string
  messageTemplate: string
  sendDelay: number
}

export const useTwitterStore = defineStore('twitter', () => {
  const isRunning = ref(false)
  const sentCount = ref(0)
  const logs = ref<Array<{time: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([])
  const settings = ref<TwitterSettings>({
    searchQuery: '',
    messageTemplate: '',
    sendDelay: 5000
  })

  let twitterService: TwitterService | null = null

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString()
    logs.value.unshift({ time, message, type })
  }

  const clearLogs = () => {
    logs.value = []
  }

  const updateSettings = (newSettings: TwitterSettings) => {
    settings.value = { ...newSettings }
    if (twitterService) {
      twitterService.updateConfig(newSettings)
    }
  }

  const startTask = async () => {
    if (isRunning.value) return
    
    try {
      twitterService = new TwitterService(
        settings.value,
        addLog,
        (count) => sentCount.value = count
      )

      await twitterService.init()
      isRunning.value = true
      sentCount.value = 0
      addLog('开始执行任务', 'info')
      
      await twitterService.start()
    } catch (error: any) {
      addLog(`任务执行出错: ${error.message}`, 'error')
      await stopTask()
    }
  }

  const stopTask = async () => {
    if (!isRunning.value) return
    
    if (twitterService) {
      await twitterService.stop()
      twitterService = null
    }
    
    isRunning.value = false
    addLog('任务已停止', 'info')
  }

  return {
    isRunning,
    sentCount,
    logs,
    settings,
    addLog,
    clearLogs,
    updateSettings,
    startTask,
    stopTask
  }
}) 