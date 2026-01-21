<template>
  <UDashboardPanel id="embed">
    <template #header>
      <UDashboardNavbar title="嵌入式管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col items-center justify-center h-full text-center p-8">
        <UIcon name="i-lucide-code" class="text-6xl text-gray-400 mb-4" />
        <h3 class="text-lg font-semibold mb-2">嵌入式管理</h3>
        <p class="text-gray-500">嵌入式应用配置 - 页面功能开发中...</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
