<template>
  <div class="nutrition-page">
    <van-nav-bar title="营养分析" left-arrow @click-left="goBack" />
    
    <!-- 加载状态 -->
    <van-loading v-if="loading" class="loading" />
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="error" 
      type="network"
      :showRetry="true"
      :loading="retryLoading"
      @retry="loadFoodData"
    />
    
    <!-- 空状态 -->
    <EmptyState 
      v-else-if="!foodData" 
      type="custom"
      title="暂无数据"
      description="请先进行食材识别"
      :showAction="true"
      actionText="去识别"
      @action="goToRecognize"
    />
    
    <div class="food-header">
      <van-image 
        :src="`https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20${encodeURIComponent(foodData.name)}%20food%20on%20white%20background&image_size=square`"
        mode="aspectFill"
        class="food-image"
      />
      <div class="food-info">
        <h1 class="food-name">{{ foodData.name }}</h1>
        <p class="food-category">{{ foodData.category }}</p>
      </div>
    </div>

    <div class="nutrition-summary">
      <div class="summary-item">
        <div class="summary-value">{{ totalCalories }}</div>
        <div class="summary-label">总热量 (kcal)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{{ totalProtein }}</div>
        <div class="summary-label">蛋白质 (g)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{{ totalCarbs }}</div>
        <div class="summary-label">碳水 (g)</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{{ totalFat }}</div>
        <div class="summary-label">脂肪 (g)</div>
      </div>
    </div>

    <div class="nutrition-details">
      <h3 class="section-title">营养成分详情</h3>
      
      <van-cell-group>
        <van-cell title="热量" :value="`${foodData?.calories || 0} kcal/100g`" />
        <van-cell title="蛋白质" :value="`${foodData?.protein || 0} g/100g`" />
        <van-cell title="碳水化合物" :value="`${foodData?.carbs || 0} g/100g`" />
        <van-cell title="脂肪" :value="`${foodData?.fat || 0} g/100g`" />
        <van-cell title="膳食纤维" :value="`${foodData?.fiber || 0} g/100g`" />
        <van-cell title="维生素C" :value="`${foodData?.vitaminC || 0} mg/100g`" />
        <van-cell title="钙" :value="`${foodData?.calcium || 0} mg/100g`" />
        <van-cell title="铁" :value="`${foodData?.iron || 0} mg/100g`" />
      </van-cell-group>
    </div>

    <div class="health-tips">
      <h3 class="section-title">健康提示</h3>
      <div class="tips-list">
        <div class="tip-item" v-for="(tip, index) in healthTips" :key="index">
          <van-icon :name="tip.icon" :color="tip.color" />
          <span>{{ tip.text }}</span>
        </div>
      </div>
    </div>

    <div class="dietary-suggestions">
      <h3 class="section-title">食用建议</h3>
      <p class="suggestion-text">
        {{ foodData?.suggestion || '暂无特别建议' }}
      </p>
    </div>
  </div>
</template>

<script setup>import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import ErrorState from '../components/ErrorState.vue';
import EmptyState from '../components/EmptyState.vue';
const router = useRouter();
const route = useRoute();

// 响应式状态
const loading = ref(false);
const retryLoading = ref(false);
const error = ref(false);
const foodData = ref(null);
const healthTips = ref([]);

// 计算属性
const totalCalories = computed(() => foodData.value?.calories || 0);
const totalProtein = computed(() => foodData.value?.protein || 0);
const totalCarbs = computed(() => foodData.value?.carbs || 0);
const totalFat = computed(() => foodData.value?.fat || 0);

// 返回上一页
const goBack = () => {
 router.back();
};

// 跳转到识别页
const goToRecognize = () => {
 router.push('/recognize');
};

// 根据食材数据动态生成健康提示
const generateHealthTips = (data) => {
 if (!data) return;
 const tips = [];
 if (data.vitaminC > 30) {
 tips.push({ icon: 'check-circle-o', color: '#4CAF50', text: '富含维生素C，有助于增强免疫力' });
 }
 if (data.fiber > 2) {
 tips.push({ icon: 'check-circle-o', color: '#4CAF50', text: '富含膳食纤维，有助于促进消化' });
 }
 if (data.calories < 50) {
 tips.push({ icon: 'check-circle-o', color: '#4CAF50', text: '低热量食材，适合控制体重' });
 }
 if (data.iron > 1) {
 tips.push({ icon: 'check-circle-o', color: '#4CAF50', text: '含铁丰富，有助于预防贫血' });
 }
 if (data.calcium > 30) {
 tips.push({ icon: 'check-circle-o', color: '#4CAF50', text: '含钙丰富，有助于骨骼健康' });
 }
 if (data.fat > 5) {
 tips.push({ icon: 'info-o', color: '#2196F3', text: '脂肪含量较高，建议适量食用' });
 }
 if (tips.length === 0) {
 tips.push({ icon: 'info-o', color: '#2196F3', text: '营养均衡，建议适量食用' });
 }
 healthTips.value = tips;
};

const loadFoodData = async () => {
 try {
 loading.value = true;
 retryLoading.value = true;
 error.value = false;
 
 const dataParam = route.query.data;
 if (dataParam) {
 try {
 const decodedData = decodeURIComponent(dataParam);
 const parsedData = JSON.parse(decodedData);
 
 if (!parsedData || typeof parsedData !== 'object') {
 throw new Error('数据格式无效');
 }
 
 const nutrients = parsedData.nutrition || parsedData;
 
 foodData.value = {
 name: parsedData.name || '未知食材',
 category: parsedData.category || '其他',
 calories: nutrients.calories || parsedData.calories || 0,
 protein: nutrients.protein || parsedData.protein || 0,
 carbs: nutrients.carbs || parsedData.carbs || 0,
 fat: nutrients.fat || parsedData.fat || 0,
 fiber: nutrients.fiber || parsedData.fiber || 0,
 vitaminC: nutrients.vitaminC || parsedData.vitaminC || 0,
 calcium: nutrients.calcium || parsedData.calcium || 0,
 iron: nutrients.iron || parsedData.iron || 0,
 suggestion: parsedData.suggestion || '根据营养成分分析，建议适量食用'
 };
 
 // 动态生成健康提示
 generateHealthTips(foodData.value);
 } catch (e) {
 console.error('解析数据失败:', e);
 foodData.value = null;
 }
 }
 
 if (!foodData.value) {
 foodData.value = {
 name: '西兰花',
 category: '蔬菜类',
 calories: 34,
 protein: 2.8,
 carbs: 7.6,
 fat: 0.4,
 fiber: 2.6,
 vitaminC: 51,
 calcium: 47,
 iron: 0.7,
 suggestion: '西兰花富含维生素C和膳食纤维，建议清炒或水后凉拌，保留营养成分。'
 };
 generateHealthTips(foodData.value);
 }
 } catch (e) {
 console.error('加载数据失败:', e);
 error.value = true;
 showToast({ type: 'fail', message: '加载失败，请重试' });
 } finally {
 loading.value = false;
 }
};

onMounted(() => {
 loadFoodData();
});
</script>

<style lang="scss" scoped>
.nutrition-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.food-header {
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  padding: 20px;
  display: flex;
  gap: 16px;
  
  .food-image {
    width: 100px;
    height: 100px;
    border-radius: 12px;
    background: #fff;
  }
  
  .food-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    .food-name {
      color: #fff;
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }
    
    .food-category {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      margin: 0;
    }
  }
}

.nutrition-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 20px;
  margin-top: -30px;
  position: relative;
  z-index: 1;
  
  .summary-item {
    background: #fff;
    border-radius: 12px;
    padding: 12px 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .summary-value {
      font-size: 20px;
      font-weight: bold;
      color: #4CAF50;
    }
    
    .summary-label {
      font-size: 10px;
      color: #999;
      margin-top: 4px;
    }
  }
}

.nutrition-details,
.health-tips,
.dietary-suggestions {
  background: #fff;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 16px;
  
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 12px;
  }
}

.tips-list {
  .tip-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    
    .van-icon {
      margin-right: 8px;
    }
    
    span {
      font-size: 14px;
      color: #666;
    }
  }
}

.dietary-suggestions {
  .suggestion-text {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
}
</style>