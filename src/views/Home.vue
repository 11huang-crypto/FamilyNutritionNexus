<template>
  <div class="home-page">
    <AppNavbar title="AI智能菜篮子" :showBack="false" />
    
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <h1 class="hero-title">AI智能菜篮子</h1>
        <p class="hero-subtitle">让健康饮食更简单</p>
      </div>
    </div>

    <div class="menu-grid">
      <div class="menu-item" @click="navigateTo('/recognize')">
        <div class="menu-icon camera">
          <van-icon name="camera" size="32" />
        </div>
        <span class="menu-text">拍照识别</span>
      </div>
      
      <div class="menu-item" @click="navigateTo('/family-health')">
        <div class="menu-icon health">
          <van-icon name="heart" size="32" />
        </div>
        <span class="menu-text">健康档案</span>
      </div>
      
      <div class="menu-item" @click="navigateTo('/meal-plan')">
        <div class="menu-icon calendar">
          <van-icon name="calendar" size="32" />
        </div>
        <span class="menu-text">一周食谱</span>
      </div>
      
      <div class="menu-item" @click="navigateTo('/shopping-list')">
        <div class="menu-icon list">
          <van-icon name="list" size="32" />
        </div>
        <span class="menu-text">采购清单</span>
      </div>
    </div>

    <div class="basket-section" v-if="basketData.items?.length > 0">
      <div class="section-header">
        <h2 class="section-title">我的菜篮子</h2>
        <span class="section-count">{{ basketData.items?.length || 0 }} 种食材</span>
      </div>
      
      <div class="risk-alert" v-if="riskWarnings.length > 0">
        <AlertBar type="warning" :message="riskWarnings[0]" :closable="true" @close="riskWarnings = []" />
      </div>
      
      <div class="basket-items">
        <VegCard 
          v-for="item in basketData.items?.slice(0, 4)" 
          :key="item.id"
          :name="item.name"
          :image="item.image"
          :desc="`${item.quantity}${item.unit}`"
          :calories="getCalories(item)"
          :nutrients="getNutrientKeys(item)"
          size="small"
        />
      </div>
      
      <div class="view-all" @click="navigateTo('/basket')">
        <span>查看全部</span>
        <van-icon name="arrow-right" />
      </div>
    </div>

    <div class="quick-actions">
      <van-button 
        type="primary" 
        round 
        block 
        class="action-btn"
        @click="navigateTo('/recognize')"
      >
        <van-icon name="plus" />
        添加食材
      </van-button>
    </div>

    <van-loading v-if="loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import AppNavbar from '@/components/AppNavbar.vue'
import AlertBar from '@/components/AlertBar.vue'
import VegCard from '@/components/VegCard.vue'
import NutriBadge from '@/components/NutriBadge.vue'
import { useAppStore } from '@/stores'
import { getFamilyBasket, checkFoodConflict } from '../api'

const router = useRouter()
const store = useAppStore()
const loading = ref(true)
const riskWarnings = ref([])

const basketData = computed(() => ({
  items: store.basket,
  total: store.basket.length
}))

const navigateTo = (path) => {
  router.push(path)
}

const getCalories = (item) => {
  const nutrients = item.nutrients || {}
  return nutrients.calories || Math.round((nutrients.vitaminC || 0) * 0.5 + (nutrients.fiber || 0) * 10 + (nutrients.potassium || 0) * 0.1)
}

const getNutrientKeys = (item) => {
  const nutrients = item.nutrients || {}
  return Object.keys(nutrients).filter(k => nutrients[k] > 0).slice(0, 3)
}

const fetchBasketData = async () => {
  try {
    loading.value = true
    const response = await getFamilyBasket()
    if (response.code === 200) {
      if (response.data?.items) {
        store.basket = response.data.items
      }
      checkFoodConflicts()
    } else {
      console.error('Failed to fetch basket:', response.message)
      showToast({ type: 'fail', message: response.message || '获取数据失败' })
    }
  } catch (error) {
    console.error('Error fetching basket:', error)
    showToast({ type: 'fail', message: '网络连接失败，请检查网络' })
  } finally {
    loading.value = false
  }
}

const checkFoodConflicts = async () => {
  try {
    const items = store.basket.map(item => item.name) || []
    const response = await checkFoodConflict(1, { items })
    if (response.code === 200 && response.data.conflicts?.length > 0) {
      riskWarnings.value = response.data.conflicts.map(c => `${c.items.join(' + ')}：${c.reason}`)
    } else {
      riskWarnings.value = []
    }
  } catch (error) {
    console.error('Error checking conflicts:', error)
    riskWarnings.value = []
  }
}

onMounted(() => {
  fetchBasketData()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.hero-section {
  position: relative;
  height: 200px;
  border-radius: 0 0 30px 30px;
  overflow: hidden;
  
  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    
    .hero-title {
      color: #fff;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .hero-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
  }
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  margin-top: -40px;
  position: relative;
  z-index: 2;
  
  .menu-item {
    background: #fff;
    border-radius: 16px;
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    
    .menu-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      color: #fff;
      
      &.camera {
        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
      }
      
      &.health {
        background: linear-gradient(135deg, #f44336 0%, #ff9800 100%);
      }
      
      &.calendar {
        background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%);
      }
      
      &.list {
        background: linear-gradient(135deg, #9C27B0 0%, #E91E63 100%);
      }
    }
    
    .menu-text {
      font-size: 12px;
      color: #666;
    }
  }
}

.basket-section {
  background: #fff;
  margin: 0 16px;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
    
    .section-count {
      font-size: 12px;
      color: #999;
    }
  }
  
  .risk-alert {
    margin-bottom: 12px;
  }
  
  .basket-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .view-all {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px;
    margin-top: 8px;
    color: #4CAF50;
    font-size: 14px;
    
    .van-icon {
      margin-left: 4px;
    }
  }
}

.quick-actions {
  padding: 20px 16px;
  
  .action-btn {
    height: 48px;
    font-size: 16px;
  }
}
</style>