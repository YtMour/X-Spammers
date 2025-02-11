import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
// 移除 Element Plus 相关引入，因为我们使用 Naive UI
// import 'element-plus/dist/index.css'
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Naive UI 组件
import {
  NButton,
  NCard,
  NConfigProvider,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  NMessageProvider,
  NScrollbar,
  NSwitch,
  NTimeline,
  NTimelineItem,
  NIcon
} from 'naive-ui'

const app = createApp(App)

// 注册 Naive UI 组件
app.component('n-button', NButton)
app.component('n-card', NCard)
app.component('n-config-provider', NConfigProvider)
app.component('n-form', NForm)
app.component('n-form-item', NFormItem)
app.component('n-input', NInput)
app.component('n-input-number', NInputNumber)
app.component('n-layout', NLayout)
app.component('n-layout-content', NLayoutContent)
app.component('n-layout-footer', NLayoutFooter)
app.component('n-layout-header', NLayoutHeader)
app.component('n-message-provider', NMessageProvider)
app.component('n-scrollbar', NScrollbar)
app.component('n-switch', NSwitch)
app.component('n-timeline', NTimeline)
app.component('n-timeline-item', NTimelineItem)
app.component('n-icon', NIcon)

// 移除 Element Plus 图标注册
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }

app.mount('#app') 