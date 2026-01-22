<script setup lang="ts">
import { useTemplateRef, h, ref, watch, resolveComponent, onMounted } from 'vue'
import { upperFirst } from 'scule'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { SysUser, PageParams, UserQuery, UserStatus } from '@/types/api'
import { api } from '@/services/api'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import UserFormDialog from './UserFormDialog.vue'
import UserResetPasswordDialog from './UserResetPasswordDialog.vue'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// 确认对话框
const { confirm } = useConfirmDialog()

const columnFilters = ref([{
  id: 'username',
  value: ''
}])
const columnVisibility = ref({ id: true })
const rowSelection = ref({})

const data = ref<SysUser[]>([])
const loading = ref(false)
const total = ref<string | number>(0)

// Dialog refs
const addDialogOpen = ref(false)
const editDialogOpen = ref(false)
const editUserId = ref<string>()
const resetPasswordDialogOpen = ref(false)
const resetPasswordUserId = ref<string>()
const resetPasswordUsername = ref<string>()

// Status filter
const statusFilter = ref<UserStatus | 'all'>('all')

// Fetch users function
async function fetchUsers() {
  if (!table.value?.tableApi) return

  try {
    loading.value = true
    const paginationState = table.value.tableApi.getState().pagination
    const username = table.value.tableApi.getColumn('username')?.getFilterValue() as string || ''
    const status = statusFilter.value === 'all' ? undefined : statusFilter.value as UserStatus

    const params: PageParams & UserQuery = {
      current: (paginationState.pageIndex || 0) + 1,
      size: paginationState.pageSize || 10
    }

    if (username) params.username = username
    if (status !== undefined) params.status = status

    const result = await api.users.page(params)
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

// Initial fetch
onMounted(fetchUsers)

function getRowItems(row: Row<SysUser>) {
  return [
    {
      label: '编辑',
      icon: 'i-lucide-edit',
      onSelect() {
        openEditDialog(row.original.id)
      }
    },
    {
      type: 'separator'
    },
    {
      label: '重置密码',
      icon: 'i-lucide-key',
      onSelect() {
        openResetPasswordDialog(row.original.id, row.original.username)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        confirmDelete(row.original.id)
      }
    }
  ]
}

const columns: TableColumn<SysUser>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'username',
    header: '用户名'
  },
  {
    accessorKey: 'nickname',
    header: '昵称',
    cell: ({ row }) => row.original.nickname || '-'
  },
  {
    accessorKey: 'email',
    header: '邮箱',
    cell: ({ row }) => row.original.email || '-'
  },
  {
    accessorKey: 'phone',
    header: '手机号',
    cell: ({ row }) => row.original.phone || '-'
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const color = row.original.status === 1 ? 'success' as const : 'error' as const
      const label = row.original.status === 1 ? '启用' : '禁用'

      return h(UBadge, { variant: 'subtle', color }, () =>
        label
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

// Search state (separate from table state to avoid loops)
const searchUsername = ref('')

watch(() => statusFilter.value, () => {
  fetchUsers()
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchUsername, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchUsers()
  }, 300)
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Watch pagination changes
watch(() => pagination.value.pageIndex, () => {
  fetchUsers()
})

// Sync search input with table filter
watch(searchUsername, (newVal) => {
  table.value?.tableApi?.getColumn('username')?.setFilterValue(newVal || undefined)
})

// Dialog functions
function openEditDialog(id: string) {
  editUserId.value = id
  editDialogOpen.value = true
}

function openResetPasswordDialog(id: string, username: string) {
  resetPasswordUserId.value = id
  resetPasswordUsername.value = username
  resetPasswordDialogOpen.value = true
}

async function confirmDelete(id: string) {
  const confirmed = await confirm({
    title: '确认删除',
    description: '删除后无法恢复，确定要删除该用户吗？',
    confirmText: '删除',
    type: 'danger',
    icon: 'i-lucide-alert-triangle'
  })

  if (!confirmed) return

  try {
    await api.users.delete(id)
    toast.add({
      title: '删除成功',
      description: '用户已删除',
      color: 'success'
    })
    fetchUsers()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

async function confirmBulkDelete() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (selectedRows.length === 0) return

  const confirmed = await confirm({
    title: '确认批量删除',
    description: `确定要删除选中的 ${selectedRows.length} 个用户吗？此操作无法撤销。`,
    confirmText: '删除',
    type: 'danger',
    icon: 'i-lucide-alert-triangle'
  })

  if (!confirmed) return

  try {
    await Promise.all(selectedRows.map(row => api.users.delete(row.original.id)))
    toast.add({
      title: '删除成功',
      description: `已删除 ${selectedRows.length} 个用户`,
      color: 'success'
    })
    rowSelection.value = {}
    fetchUsers()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: (error as Error).message,
      color: 'error'
    })
  }
}

function handleRefresh() {
  fetchUsers()
}
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="用户管理">
        <template #right>
          <UButton
            label="新增用户"
            icon="i-lucide-plus"
            @click="addDialogOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="searchUsername"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="搜索用户名..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="删除"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="confirmBulkDelete"
          >
            <template #trailing>
              <UKbd>
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>

          <USelect
            v-model="statusFilter"
            :items="[
              { label: '全部', value: 'all' },
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="状态筛选"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="显示"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="loading"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} /
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} 行已选中
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="Number(total)"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>

      <!-- Dialogs -->
      <UserFormDialog v-model:open="addDialogOpen" @refresh="handleRefresh" />
      <UserFormDialog v-model:open="editDialogOpen" :user-id="editUserId" @refresh="handleRefresh" />
      <UserResetPasswordDialog
        v-model:open="resetPasswordDialogOpen"
        :user-id="resetPasswordUserId"
        :username="resetPasswordUsername"
      />
    </template>
  </UDashboardPanel>
</template>
