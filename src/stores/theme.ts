import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useThemeStore = defineStore('theme', () => {
  // 持久化主题配置
  const primaryColor = useStorage('theme-primary', 'green')
  const neutralColor = useStorage('theme-neutral', 'zinc')

  // 获取 Nuxt UI 的 appConfig
  const appConfig = useAppConfig()

  // 初始化主题（在 app 启动时调用）
  function initTheme() {
    appConfig.ui.colors.primary = primaryColor.value
    appConfig.ui.colors.neutral = neutralColor.value
  }

  // 设置主色
  function setPrimary(color: string) {
    primaryColor.value = color
    appConfig.ui.colors.primary = color
  }

  // 设置中性色
  function setNeutral(color: string) {
    neutralColor.value = color
    appConfig.ui.colors.neutral = color
  }

  return {
    primaryColor,
    neutralColor,
    initTheme,
    setPrimary,
    setNeutral,
  }
})
