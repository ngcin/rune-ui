<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

// Form schema
const schema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  captchaAnswer: z.string().min(1, '请输入验证码'),
})

type Schema = z.infer<typeof schema>

// Form state
const state = ref<Partial<Schema>>({
  username: '',
  password: '',
  captchaAnswer: '',
})

// Captcha state
const captchaKey = ref('')
const captchaImage = ref('')
const loading = ref(false)
const captchaLoading = ref(false)

// Fetch captcha
async function fetchCaptcha() {
  captchaLoading.value = true
  try {
    const captcha = await api.auth.getCaptcha()
    captchaKey.value = captcha.key
    captchaImage.value = captcha.image
  } catch (error: any) {
    toast.add({
      title: '获取验证码失败',
      description: error.message,
      color: 'error',
    })
  } finally {
    captchaLoading.value = false
  }
}

// Handle form submit
async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const response = await api.auth.login({
      username: event.data.username,
      password: event.data.password,
      captchaKey: captchaKey.value,
      captchaAnswer: event.data.captchaAnswer,
    })

    // Save auth info
    authStore.setAuth(response.token, response.user)

    toast.add({
      title: '登录成功',
      description: `欢迎回来，${response.user.nickname || response.user.username}`,
      color: 'success',
    })

    // Redirect to the page user was trying to access, or home
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error: any) {
    toast.add({
      title: '登录失败',
      description: error.message,
      color: 'error',
    })
    // Refresh captcha on error
    await fetchCaptcha()
    state.value.captchaAnswer = ''
  } finally {
    loading.value = false
  }
}

// Refresh captcha
function refreshCaptcha() {
  fetchCaptcha()
}

// Fetch captcha on mount
onMounted(() => {
  fetchCaptcha()
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-12 dark:bg-neutral-950">
    <div class="w-full max-w-[420px]">
      <!-- Logo/Brand Header -->
      <div class="mb-8 flex flex-col items-center text-center">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/30">
          <UIcon name="i-lucide-sparkles" class="text-3xl text-white" />
        </div>
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Rune AI APPS
        </h2>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          欢迎回来！请登录以继续
        </p>
      </div>

      <!-- Login Card -->
      <div class="rounded-2xl bg-white p-8 shadow-xl shadow-neutral-200/50 dark:bg-neutral-900 dark:shadow-neutral-900/50">
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-5"
          @submit="onSubmit"
        >
          <!-- Username Field -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              用户名
            </label>
            <UInput
              v-model="state.username"
              placeholder="请输入用户名"
              size="lg"
              icon="i-lucide-user"
              :disabled="loading"
              autocomplete="username"
              class="w-full"
              :ui="{
                root: 'w-full',
                icon: { base: 'text-neutral-400 flex-shrink-0' }
              }"
            />
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              密码
            </label>
            <UInput
              v-model="state.password"
              type="password"
              placeholder="请输入密码"
              size="lg"
              icon="i-lucide-lock"
              :disabled="loading"
              autocomplete="current-password"
              class="w-full"
              :ui="{
                root: 'w-full',
                icon: { base: 'text-neutral-400 flex-shrink-0' }
              }"
            />
          </div>

          <!-- Captcha Field -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              验证码
            </label>
            <div class="flex gap-3">
              <UInput
                v-model="state.captchaAnswer"
                placeholder="请输入验证码"
                size="lg"
                icon="i-lucide-shield"
                :disabled="loading"
                autocomplete="off"
                class="flex-1"
                :ui="{
                  root: 'flex-1',
                  icon: { base: 'text-neutral-400 flex-shrink-0' }
                }"
              />
              <div
                v-if="captchaImage"
                class="relative flex h-11 w-[120px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-neutral-200 bg-neutral-50 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
                @click="refreshCaptcha"
              >
                <img
                  :src="`data:image/png;base64,${captchaImage}`"
                  alt="验证码"
                  class="h-full w-full object-cover"
                >
                <div
                  v-if="captchaLoading"
                  class="absolute inset-0 flex items-center justify-center bg-neutral-50/90 dark:bg-neutral-800/90"
                >
                  <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
              <UButton
                v-else
                size="lg"
                variant="outline"
                icon="i-lucide-refresh-cw"
                :loading="captchaLoading"
                :disabled="loading"
                class="h-11 w-[120px] shrink-0"
                @click="refreshCaptcha"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            size="lg"
            block
            :loading="loading"
            class="mt-6 h-12 bg-primary shadow-lg shadow-primary/30 transition-all hover:shadow-primary/40"
          >
            {{ loading ? '登录中...' : '登录' }}
          </UButton>
        </UForm>
      </div>

      <!-- Footer -->
      <p class="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        登录即表示您同意我们的
        <a href="#" class="font-medium text-primary hover:underline">服务条款</a>
        和
        <a href="#" class="font-medium text-primary hover:underline">隐私政策</a>
      </p>
    </div>
  </div>
</template>
