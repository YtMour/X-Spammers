<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'CookiesImport'
})

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'error', message: string): void
}>()

const cookiesText = ref('')

const handleImport = async () => {
  if (!cookiesText.value) {
    emit('error', '请输入 Cookies')
    return
  }

  try {
    // 验证 JSON 格式
    JSON.parse(cookiesText.value)
    
    // 保存 cookies
    await window.electronAPI.saveCookies(cookiesText.value)
    emit('success')
  } catch (error) {
    emit('error', '无效的 Cookies 格式')
  }
}
</script>

<template>
  <div class="cookies-import">
    <h2>导入 Cookies</h2>
    <div class="form-group">
      <label>Twitter Cookies</label>
      <textarea
        v-model="cookiesText"
        placeholder="请粘贴 Twitter Cookies JSON 数据"
        rows="10"
      ></textarea>
    </div>
    <button class="import-button" @click="handleImport">导入</button>
  </div>
</template>

<style scoped>
.cookies-import {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.import-button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.import-button:hover {
  background-color: #66b1ff;
}
</style> 