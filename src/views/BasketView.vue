<template>
  <!--
    BasketView.vue - 家庭菜篮子页
  -->
  <div class="basket-page">
    <AppNavbar title="家庭菜篮子" rightIcon="add-o" @right-click="showAdd = true" />

    <div class="page-body">
      <!-- 统计概览 -->
      <div class="stats-bar card-base">
        <div class="stat-item">
          <span class="stat-value">{{ store.basketCount }}</span>
          <span class="stat-label">总食材</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ vegCount }}</span>
          <span class="stat-label">蔬菜</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ fruitCount }}</span>
          <span class="stat-label">水果</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value text-warning">{{ lowFreshCount }}</span>
          <span class="stat-label">需关注</span>
        </div>
      </div>

      <!-- 禁忌检查 -->
      <div class="check-area" v-if="conflicts.length > 0">
        <AlertBar
          v-for="c in conflicts"
          :key="c.items.join('+')"
          :type="c.severity"
          :message="`${c.items.join(' + ')}：${c.reason}`"
          action="了解"
        />
      </div>

      <!-- 食材列表 -->
      <div class="section-header flex-between">
        <h3 class="section-label">所有食材</h3>
        <van-button
          size="small"
          plain
          type="primary"
          round
          @click="checkConflict"
        >扫描禁忌</van-button>
      </div>

      <div v-if="store.basket.length === 0" class="empty-state">
        <van-empty description="菜篮子空空如也，去拍张照试试吧" />
        <van-button type="primary" round @click="$router.push('/recognize')">去拍照</van-button>
      </div>

      <TransitionGroup name="list" tag="div" class="basket-list">
        <VegCard
          v-for="item in store.basket"
          :key="item.id"
          :item="item"
          variant="list"
          :deletable="true"
          @click="viewDetail(item)"
          @delete="removeFromBasket(item)"
        />
      </TransitionGroup>

      <div style="height: 20px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import AppNavbar from '@/components/AppNavbar.vue'
import VegCard from '@/components/VegCard.vue'
import AlertBar from '@/components/AlertBar.vue'
import { useAppStore } from '@/stores'
import { checkBasketConflict, getFamilyBasket, removeFromBasket as removeFromBasketAPI } from '@/api'

const router = useRouter()
const store = useAppStore()
const showAdd = ref(false)
const conflicts = ref([])

const vegCount = computed(() => store.basket.filter(i => i.category === '蔬菜').length)
const fruitCount = computed(() => store.basket.filter(i => i.category === '水果').length)
const lowFreshCount = computed(() => store.basket.filter(i => i.freshness < 80).length)

const checkConflict = async () => {
  try {
    const res = await checkBasketConflict({ items: store.basket.map(i => i.name) })
    conflicts.value = res.data.conflicts

    if (!res.data.hasConflict) {
      Toast.success('未发现禁忌组合，可以放心食用')
    }
  } catch (err) {
    Toast.fail('检查失败，请重试')
  }
}

const viewDetail = (item) => {
  const nutrients = item.nutrients || {}
  const enrichedData = {
    ...item,
    calories: nutrients.calories || Math.round((nutrients.vitaminC || 0) * 1.5 + (nutrients.fiber || 0) * 20 + (nutrients.potassium || 0) * 0.2),
    protein: nutrients.protein || 0,
    carbs: nutrients.carbs || 0,
    fat: nutrients.fat || 0,
    fiber: nutrients.fiber || 0,
    vitaminC: nutrients.vitaminC || 0,
    calcium: nutrients.calcium || 0,
    iron: nutrients.iron || 0
  }
  const data = encodeURIComponent(JSON.stringify(enrichedData))
  router.push({ path: '/nutrition', query: { data } })
}

const removeFromBasket = async (item) => {
  try {
    await removeFromBasketAPI(item.id)
    store.removeFromBasket(item.id)
  } catch (err) {
    Toast.fail('删除失败，请重试')
  }
}

const loadBasketData = async () => {
  try {
    const res = await getFamilyBasket()
    if (res.code === 200 && res.data?.items) {
      store.basket = res.data.items
    }
  } catch (err) {
    console.error('加载菜篮子数据失败:', err)
  }
}

onMounted(() => {
  loadBasketData()
})
</script>

<style scoped lang="scss">
.basket-page {
  min-height: 100vh;
  background: var(--ab-bg-page);
}

.page-body {
  padding: var(--ab-space-4);
  padding-bottom: 80px;
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--ab-space-3) var(--ab-space-4);
  margin-bottom: var(--ab-space-3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: var(--ab-text-xl);
  font-weight: var(--ab-font-bold);
  color: var(--ab-primary-600);
}

.stat-label {
  font-size: var(--ab-text-xs);
  color: var(--ab-text-tertiary);
}

.text-warning {
  color: var(--ab-warning);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--ab-border-light);
}

.check-area {
  margin-bottom: var(--ab-space-3);
}

.section-header {
  margin-bottom: var(--ab-space-3);
}

.section-label {
  font-size: var(--ab-text-base);
  font-weight: var(--ab-font-bold);
  color: var(--ab-text-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ab-space-3);
  padding-top: var(--ab-space-10);
}

.basket-list {
  display: flex;
  flex-direction: column;
  gap: var(--ab-space-2);
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
