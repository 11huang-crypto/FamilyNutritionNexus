<template>
  <div class="nutrition-analysis">
    <!-- 页面头部 -->
    <AppNavbar title="营养分析" :showBack="true" />
    
    <!-- 加载状态 -->
    <van-loading v-if="loading" class="loading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="error" 
      :type="errorType"
      :showRetry="true"
      :loading="retryLoading"
      @retry="loadNutritionData"
    />
    
    <!-- 空状态 -->
    <EmptyState 
      v-else-if="!error && !nutritionData" 
      type="list"
      :showAction="true"
      actionText="去分析"
      @action="goToRecognize"
    />
    
    <!-- 内容区域 -->
    <van-scroll-view v-else scroll-y class="content">
      <!-- 食物基本信息 -->
      <VegCard 
        :name="nutritionData.name"
        :image="nutritionData.image"
        :desc="nutritionData.category"
        :calories="nutritionData.calories"
        :nutrients="getNutrientKeys(nutritionData)"
        size="medium"
      />
      
      <!-- 营养成分概览 -->
      <div class="nutrition-overview-card">
        <h4 class="card-title">营养成分概览</h4>
        <div class="nutrition-badges">
          <NutriBadge 
            v-for="item in nutritionOverview" 
            :key="item.label"
            :label="item.label"
            :value="item.value"
          />
        </div>
      </div>
      
      <!-- 详细营养数据 -->
      <div class="detail-card">
        <h4 class="card-title">详细营养数据</h4>
        <div class="nutrition-badges">
          <NutriBadge 
            v-for="(value, key) in nutritionData.details" 
            :key="key"
            :label="key"
            :value="value"
          />
        </div>
      </div>
      
      <!-- 健康建议 -->
      <div class="detail-card">
        <h4 class="card-title">健康建议</h4>
        <AlertBar v-for="(tag, index) in nutritionData.healthTags" :key="index" 
          :type="getAlertType(tag)" :message="tag" />
        <p class="health-desc">{{ nutritionData.healthTips }}</p>
      </div>
    </van-scroll-view>
  </div>
</template>

<script setup>
/**
 * 营养分析页示例
 * 展示如何使用通用的请求工具、错误状态组件、空状态组件
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { vanLoading } from 'vant';
import { get } from '@/utils/request';
import AppNavbar from '@/components/AppNavbar.vue';
import VegCard from '@/components/VegCard.vue';
import NutriBadge from '@/components/NutriBadge.vue';
import AlertBar from '@/components/AlertBar.vue';
import ErrorState from '@/components/ErrorState.vue';
import EmptyState from '@/components/EmptyState.vue';

// 路由实例
const router = useRouter();

// 响应式状态
const loading = ref(false);           // 加载状态
const error = ref(false);             // 错误状态
const errorType = ref('network');     // 错误类型
const retryLoading = ref(false);      // 重试加载状态
const nutritionData = ref(null);      // 营养数据

/**
 * 营养概览数据（用于展示在网格中）
 */
const nutritionOverview = computed(() => {
  if (!nutritionData.value) return [];
  
  const data = nutritionData.value;
  return [
    { label: '热量', value: data.calories + ' kcal' },
    { label: '蛋白质', value: data.protein + 'g' },
    { label: '碳水', value: data.carbs + 'g' },
    { label: '脂肪', value: data.fat + 'g' }
  ];
});

/**
 * 获取营养成分键列表
 */
const getNutrientKeys = (data) => {
  if (!data?.details) return []
  return Object.keys(data.details).filter(k => data.details[k] > 0).slice(0, 4)
}

/**
 * 获取 AlertBar 类型
 */
const getAlertType = (tag) => {
  if (tag.includes('高')) return 'warning'
  if (tag.includes('低')) return 'success'
  if (tag.includes('适宜')) return 'info'
  return 'info'
};

/**
 * 加载营养数据
 */
const loadNutritionData = async () => {
  // 设置加载状态
  loading.value = true;
  error.value = false;
  
  try {
    // 使用封装的 get 方法请求数据
    const response = await get(
      '/nutrition/analysis',
      { id: '123' }, // 示例参数
      {
        showLoading: true,           // 显示加载动画（默认）
        loadingText: '分析中...',    // 自定义加载文字
        forbidClick: true,           // 加载时禁止点击（默认）
        showError: true,             // 显示错误提示（默认）
        showRetry: true,             // 显示重试弹窗
        retryCallback: loadNutritionData // 重试回调
      }
    );
    
    // 成功获取数据
    nutritionData.value = response.data;
  } catch (err) {
    // 捕获错误，设置错误状态
    error.value = true;
    
    // 根据错误类型设置对应的错误提示
    if (err.message.includes('网络')) {
      errorType.value = 'network';
    } else if (err.message.includes('权限')) {
      errorType.value = 'auth';
    } else {
      errorType.value = 'server';
    }
  } finally {
    loading.value = false;
  }
};

/**
 * 返回上一页
 */
const handleBack = () => {
  router.back();
};

/**
 * 跳转到识别页
 */
const goToRecognize = () => {
  router.push('/recognize');
};

/**
 * 页面挂载时加载数据
 */
onMounted(() => {
  loadNutritionData();
});
</script>

<style lang="scss" scoped>
.nutrition-analysis {
  min-height: 100vh;
  background: #f5f5f5;
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.content {
  height: calc(100vh - 46px);
  padding: 16px;
}

.nutrition-overview-card,
.detail-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;

  .card-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin: 0 0 12px 0;
  }

  .nutrition-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.health-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-top: 12px;
}
</style>