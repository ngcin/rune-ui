<script setup lang="ts">
import { useTemplateRef, h, ref, watch, resolveComponent, onMounted, computed, nextTick } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { WorkspaceMember, PageParams, Workspace } from '@/types/api'
import { workspacesApi } from '@/services/api'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import WorkspaceMemberDialog from './WorkspaceMemberDialog.vue'
import MemberRoleDialog from './MemberRoleDialog.vue'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const props = defineProps<{
  workspace: Workspace
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const toast = useToast()
const table = useTemplateRef('table')

// 确认对话框
const { confirm } = useConfirmDialog()

const columnFilters = ref([{
  id: 'username',
  value: ''
}])
const rowSelection = ref({})

const data = ref<WorkspaceMember[]>([])
const loading = ref(false)
const total = ref<string | number>(0)

// Dialog refs
const addDialogOpen = ref(false)
const editRoleDialogOpen = ref(false)
const editMember = ref<WorkspaceMember | null>(null)

// Fetch members function
async function fetchMembers() {
  if (!table.value?.tableApi) return

  try {
    loading.value = true
    const paginationState = table.value.tableApi.getState().pagination
    const keyword = table.value.tableApi.getColumn('username')?.getFilterValue() as string || ''

    const params: PageParams & { keyword?: string } = {
      current: (paginationState.pageIndex || 0) + 1,
      size: paginationState.pageSize || 10
    }

    if (keyword) params.keyword = keyword

    const result = await workspacesApi.pageMembers(props.workspace.id, params)
    data.value = result.records
    total.value = result.total
  } catch (error) {
    toast.add({
      title: '加载失败',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Initial fetch when component is mounted
onMounted(() => {
  // Wait for table to initialize
  nextTick(() => {
    if (table.value?.tableApi && props.workspace?.id) {
      fetchMembers()
    }
  })
})

// Watch workspace ID changes for refetching
watch(() => props.workspace.id, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  if (!table.value?.tableApi) {
    await nextTick()
  }
  if (table.value?.tableApi) {
    fetchMembers()
  }
})

const columns: TableColumn<WorkspaceMember>[] = [
  {
    accessorKey: 'username',
    header: '姓名',
    cell: ({ row }) => row.original.nickname || row.original.username
  },
  {
    accessorKey: 'username',
    header: '账号'
  },
  {
    accessorKey: 'status',
    header: '用户状态',
    cell: ({ row }) => {
      const color = row.original.status === 1 ? 'success' as const : 'neutral' as const
      const label = row.original.status === 1 ? '已启用' : '已禁用'

      return h(UBadge, { variant: 'subtle', color }, () =>
        label
      )
    }
  },
  {
    accessorKey: 'email',
    header: '邮箱',
    cell: ({ row }) => row.original.email || '-'
  },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ row }) => {
      const role = row.original.role
      const label = role === 'WORKSPACE_ADMIN' ? '管理员' : '普通成员'
      const color = role === 'WORKSPACE_ADMIN' ? 'primary' as const : 'neutral' as const

      return h(UBadge, { variant: 'subtle', color }, () => label)
    }
  },
  {
    id: 'actions',
    header: '操作',
    size: 150,
    minSize: 150,
    maxSize: 150,
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center'
      }
    },
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center justify-center gap-1' }, [
        h(UButton, {
          icon: 'i-lucide-edit',
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          onClick: () => openEditRoleDialog(row.original)
        }),
        h(UButton, {
          icon: 'i-lucide-trash',
          color: 'error',
          variant: 'ghost',
          size: 'xs',
          onClick: () => confirmRemoveMember(row.original)
        })
      ])
    }
  }
]

// Search state (separate from table state to avoid loops)
const searchKeyword = ref('')

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchKeyword, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchMembers()
  }, 300)
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Watch pagination changes
watch(() => pagination.value.pageIndex, () => {
  fetchMembers()
})

// Sync search input with table filter
watch(searchKeyword, (newVal) => {
  table.value?.tableApi?.getColumn('username')?.setFilterValue(newVal || undefined)
})

// Dialog functions
function openEditRoleDialog(member: WorkspaceMember) {
  editMember.value = member
  editRoleDialogOpen.value = true
}

async function confirmRemoveMember(member: WorkspaceMember) {
  const confirmed = await confirm({
    title: '确认移除成员',
    description: `确定要将 ${member.nickname || member.username} 从工作空间中移除吗？`,
    confirmText: '移除',
    type: 'danger',
    icon: 'i-lucide-alert-triangle'
  })

  if (!confirmed) return

  try {
    await workspacesApi.removeMember(props.workspace.id, member.userId)
    toast.add({
      title: '移除成功',
      description: '成员已从工作空间中移除',
      color: 'success'
    })
    fetchMembers()
    emit('refresh')
  } catch (error) {
    toast.add({
      title: '移除失败',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

function handleRefresh() {
  fetchMembers()
  emit('refresh')
}

function handleRoleUpdated() {
  fetchMembers()
}

// Computed for pagination display
const start = computed(() => {
  const pageIndex = pagination.value.pageIndex || 0
  const pageSize = pagination.value.pageSize || 10
  return pageIndex * pageSize + 1
})

const end = computed(() => {
  const pageIndex = pagination.value.pageIndex || 0
  const pageSize = pagination.value.pageSize || 10
  return Math.min(pageIndex * pageSize + pageSize, parseInt(total.value))
})

const totalMembers = computed(() => total.value)
const currentPage = computed({
  get: () => (pagination.value.pageIndex || 0) + 1,
  set: (val: number) => {
    pagination.value.pageIndex = val - 1
  }
})
</script>

<template>
  <UDashboardPanel id="workspaces-right" class="pl-2 pr-2">
    <UDashboardNavbar :title="workspace.name" :toggle="false">
      <UInput
        v-model="searchKeyword"
        icon="i-lucide-search"
        placeholder="搜索姓名、用户名、邮箱"
        class="w-80"
      />

      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emit('close')"
        />
      </template>
      <template #trailing>
        <UBadge :label="totalMembers" variant="subtle" />
      </template>
      <template #right>
        <UButton
          icon="i-lucide-plus"
          label="添加成员"
          color="primary"
          @click="addDialogOpen = true"
        />
      </template>
    </UDashboardNavbar>

    <UTable
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:row-selection="rowSelection"
      v-model:pagination="pagination"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }"
      class="shrink-0 pt-2 pb-2"
      :data="data"
      :columns="columns"
      :loading="loading"
      :ui="{
        base: 'table-fixed w-full border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 px-4 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r whitespace-nowrap',
        td: 'py-2 px-4 border-b border-default',
        separator: 'h-0'
      }"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        显示 {{ start }}-{{ end }} / 共 {{ totalMembers }} 条
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pagination.pageSize"
          :total="parseInt(totalMembers)"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <WorkspaceMemberDialog
      v-model:open="addDialogOpen"
      :workspace-id="String(workspace.id)"
      @refresh="handleRefresh"
    />
    <MemberRoleDialog
      v-model:open="editRoleDialogOpen"
      :workspace-id="String(workspace.id)"
      :member="editMember"
      @refresh="handleRoleUpdated"
    />
  </UDashboardPanel>
</template>
