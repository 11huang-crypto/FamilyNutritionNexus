<template>
  <div class="app-layout">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
    <AppTabbar 
      v-model:active="activeTab" 
      :items="tabItems"
      @change="onTabChange" 
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppTabbar from './AppTabbar.vue'

const router = useRouter()
const route = useRoute()

const tabItems = [
  { name: 'home', label: '首页', icon: 'wap-home-o', iconActive: 'wap-home', path: '/' },
  { name: 'nutrition', label: '营养', icon: 'chart-trending-o', iconActive: 'chart-trending-o', path: '/nutrition' },
  { name: 'recognize', label: '识材', icon: 'photo-o', iconActive: 'photo', path: '/recognize' },
  { name: 'meal-plan', label: '食谱', icon: 'calendar-o', iconActive: 'records', path: '/meal-plan' },
  { name: 'shopping-list', label: '清单', icon: 'todo-list-o', iconActive: 'completed', path: '/shopping-list' },
]

const activeTab = ref(0)

// 根据当前路由同步 tab 高亮
watch(() => route.path, (path) => {
  const idx = tabItems.findIndex(item => item.path === path)
  if (idx >= 0) activeTab.value = idx
}, { immediate: true })

const onTabChange = (index, item) => {
  if (item.path) {
    router.push(item.path)
  }
}
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  padding-bottom: 56px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
