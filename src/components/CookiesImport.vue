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
    <div class="import-container">
      <div class="import-card">
        <div class="card-header">
          <div class="twitter-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="twitter-logo">
              <g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"></path></g>
            </svg>
          </div>
          <h2>导入 Cookies</h2>
          <p class="subtitle">请从浏览器导出 Twitter Cookies</p>
        </div>

        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">打开 Twitter 并登录您的账号</div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">使用 Cookie Editor 导出 Cookies</div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">将导出的 JSON 粘贴到下方</div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="textarea-container">
            <textarea
              v-model="cookiesText"
              placeholder="在此粘贴 Cookies JSON 数据..."
              rows="8"
              :class="{ 'has-content': cookiesText.length > 0 }"
            ></textarea>
            <div class="textarea-backdrop">
              <div class="backdrop-content">
                <svg viewBox="0 0 24 24" class="paste-icon">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                </svg>
                <span>粘贴 JSON 数据</span>
              </div>
            </div>
          </div>
        </div>

        <div class="actions">
          <button 
            class="import-button" 
            @click="handleImport"
            :disabled="!cookiesText"
          >
            <span class="button-content">
              <span class="button-text">导入 Cookies</span>
              <svg class="button-icon" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/>
              </svg>
            </span>
            <div class="button-background"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cookies-import {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #15202b 0%, #1a2734 100%);
  padding: 20px;
}

.import-container {
  width: 100%;
  max-width: 580px;
  perspective: 1000px;
}

.import-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  transform-origin: center;
  animation: cardAppear 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-color-scheme: dark) {
    background: #192734;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }
}

@keyframes cardAppear {
  0% {
    opacity: 0;
    transform: translateY(40px) rotateX(-10deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
}

.twitter-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  
  .twitter-logo {
    width: 100%;
    height: 100%;
    color: #1d9bf0;
  }
}

h2 {
  margin: 0;
  color: #1d9bf0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  
  @media (prefers-color-scheme: dark) {
    color: #1d9bf0;
  }
}

.subtitle {
  margin: 8px 0 0;
  color: #536471;
  font-size: 16px;
  
  @media (prefers-color-scheme: dark) {
    color: #8899a6;
  }
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  padding: 0 10px;
}

.step {
  text-align: center;
  animation: stepAppear 0.4s ease-out backwards;

  @for $i from 1 through 3 {
    &:nth-child(#{$i}) {
      animation-delay: #{0.2 * $i}s;
    }
  }
}

@keyframes stepAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-number {
  width: 32px;
  height: 32px;
  margin: 0 auto 12px;
  background: #1d9bf0;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.step-text {
  font-size: 14px;
  color: #536471;
  line-height: 1.4;
  
  @media (prefers-color-scheme: dark) {
    color: #8899a6;
  }
}

.form-group {
  margin-bottom: 30px;
}

.textarea-container {
  position: relative;
  border-radius: 12px;
  background: #f7f9f9;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  
  @media (prefers-color-scheme: dark) {
    background: #273340;
  }
  
  &:hover {
    background: #eff3f4;
    
    @media (prefers-color-scheme: dark) {
      background: #2c3c4c;
    }
  }
}

textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #0f1419;
  background: transparent;
  resize: none;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(29, 155, 240, 0.3) transparent;
  height: auto;
  min-height: 120px;
  max-height: 200px;
  
  @media (prefers-color-scheme: dark) {
    color: #fff;
  }
  
  &:focus {
    outline: none;
    border-color: #1d9bf0;
    background: transparent;
    box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.1);
  }
  
  &::placeholder {
    color: #536471;
    
    @media (prefers-color-scheme: dark) {
      color: #8899a6;
    }
  }
  
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(29, 155, 240, 0.3);
    border-radius: 4px;
    
    &:hover {
      background-color: rgba(29, 155, 240, 0.5);
    }
  }
  
  &.has-content + .textarea-backdrop {
    opacity: 0;
  }
}

.textarea-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.backdrop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #536471;
  
  @media (prefers-color-scheme: dark) {
    color: #8899a6;
  }
  
  .paste-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
    opacity: 0.5;
  }
  
  span {
    font-size: 14px;
  }
}

.actions {
  display: flex;
  justify-content: center;
}

.import-button {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    .button-content {
      transform: none;
    }
    
    .button-background {
      background: #cfd9de;
      
      @media (prefers-color-scheme: dark) {
        background: #3d5466;
      }
    }
  }
}

.button-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 15px 32px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.3s ease;
  
  .button-text {
    margin-right: 8px;
  }
  
  .button-icon {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }
}

.button-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1d9bf0;
  border-radius: 30px;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
}

.import-button:not(:disabled) {
  &:hover {
    .button-content {
      transform: translateY(-2px);
    }
    
    .button-icon {
      transform: translateX(4px);
    }
    
    .button-background {
      transform: scale(1.02);
      background: #1a8cd8;
      
      &::before {
        transform: translateX(100%);
      }
    }
  }
  
  &:active {
    .button-content {
      transform: translateY(0);
    }
    
    .button-background {
      transform: scale(0.98);
    }
  }
}
</style> 