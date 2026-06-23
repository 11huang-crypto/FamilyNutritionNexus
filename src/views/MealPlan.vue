<template>
  <div class="meal-plan-page">
    <AppNavbar title="一周食谱" :showBack="true" />
    
    <div class="week-tabs">
      <van-tab v-for="day in weekDays" :key="day.key" :title="day.label">
        <div class="day-content">
          <div class="meal-section" v-for="meal in mealTypes" :key="meal.key">
            <div class="meal-header">
              <van-icon :name="meal.icon" />
              <span>{{ meal.label }}</span>
            </div>
            
            <div class="food-list">
              <VegCard 
                v-for="(food, index) in getMealFoods(day.key, meal.key)" 
                :key="index"
                :name="food.name"
                :image="`https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20${encodeURIComponent(food.name)}%20dish%20on%20plate&image_size=square`"
                :desc="food.desc"
                :calories="food.calories"
                size="small"
              />
            </div>
          </div>
        </div>
      </van-tab>
    </div>

    <div class="bottom-bar">
      <van-button type="default" block @click="generateShoppingList">
        <van-icon name="shopping-cart" />
        生成采购清单
      </van-button>
      <van-button type="primary" block @click="generatePlan" :loading="loading">
        重新生成食谱
      </van-button>
    </div>

    <van-loading v-if="loading" />
    <van-toast id="toast" />
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import AppNavbar from '@/components/AppNavbar.vue';
import VegCard from '@/components/VegCard.vue';
import { generateMealPlan, getFamilyHealth } from '../api';
const router = useRouter();
const loading = ref(false);
const familyHealthData = ref(null);
const weekDays = [
 { key: 'monday', label: '周一' },
 { key: 'tuesday', label: '周二' },
 { key: 'wednesday', label: '周三' },
 { key: 'thursday', label: '周四' },
 { key: 'friday', label: '周五' },
 { key: 'saturday', label: '周六' },
 { key: 'sunday', label: '周日' }
];
const mealTypes = [
 { key: 'breakfast', label: '早餐', icon: 'coffee' },
 { key: 'lunch', label: '午餐', icon: 'utensils' },
 { key: 'dinner', label: '晚餐', icon: 'moon' }
];
const dayKeyMap = { '周一': 'monday', '周二': 'tuesday', '周三': 'wednesday', '周四': 'thursday', '周五': 'friday', '周六': 'saturday', '周日': 'sunday' };
const mealKeyMap = { '早餐': 'breakfast', '午餐': 'lunch', '晚餐': 'dinner' };
const mealPlan = ref({});
const defaultPlan = {
 monday: {
 breakfast: [
 { name: '燕麦粥', desc: '健康营养早餐', calories: 150 },
 { name: '水煮蛋', desc: '补充蛋白质', calories: 78 }
 ],
 lunch: [
 { name: '清炒西兰花', desc: '维生素丰富', calories: 80 },
 { name: '炒菠菜', desc: '补铁补血', calories: 50 },
 { name: '杂粮饭', desc: '膳食纤维充足', calories: 150 }
 ],
 dinner: [
 { name: '番茄炒蛋', desc: '家常美味', calories: 180 },
 { name: '凉拌黄瓜', desc: '清爽可口', calories: 30 }
 ]
 },
 tuesday: {
 breakfast: [
 { name: '全麦面包', desc: '粗粮早餐', calories: 120 },
 { name: '牛奶', desc: '补充钙质', calories: 100 }
 ],
 lunch: [
 { name: '蒜蓉油麦菜', desc: '绿色蔬菜', calories: 50 },
 { name: '清炒豆角', desc: '营养丰富', calories: 60 },
 { name: '白米饭', desc: '主食', calories: 130 }
 ],
 dinner: [
 { name: '豆腐汤', desc: '清淡营养', calories: 100 },
 { name: '凉拌木耳', desc: '清肺润燥', calories: 40 }
 ]
 },
 wednesday: {
 breakfast: [
 { name: '小米粥', desc: '养胃佳品', calories: 100 },
 { name: '茶叶蛋', desc: '风味独特', calories: 80 }
 ],
 lunch: [
 { name: '炒青菜', desc: '新鲜蔬菜', calories: 40 },
 { name: '清炒茄子', desc: '软糯可口', calories: 80 },
 { name: '荞麦面', desc: '健康主食', calories: 180 }
 ],
 dinner: [
 { name: '冬瓜汤', desc: '清热利湿', calories: 60 },
 { name: '凉拌萝卜丝', desc: '开胃消食', calories: 50 }
 ]
 },
 thursday: {
 breakfast: [
 { name: '包子', desc: '传统早餐', calories: 150 },
 { name: '豆浆', desc: '植物蛋白', calories: 80 }
 ],
 lunch: [
 { name: '炒土豆丝', desc: '家常小菜', calories: 100 },
 { name: '清炒白菜', desc: '清淡爽口', calories: 40 },
 { name: '米饭', desc: '主食', calories: 130 }
 ],
 dinner: [
 { name: '蔬菜沙拉', desc: '低脂健康', calories: 150 },
 { name: '蘑菇汤', desc: '鲜美营养', calories: 80 }
 ]
 },
 friday: {
 breakfast: [
 { name: '玉米', desc: '粗粮主食', calories: 120 },
 { name: '酸奶', desc: '助消化', calories: 100 }
 ],
 lunch: [
 { name: '炒豆芽', desc: '清爽可口', calories: 60 },
 { name: '清炒苦瓜', desc: '清热解毒', calories: 50 },
 { name: '米饭', desc: '主食', calories: 130 }
 ],
 dinner: [
 { name: '南瓜汤', desc: '甜糯可口', calories: 90 },
 { name: '凉拌海带丝', desc: '富含碘质', calories: 40 }
 ]
 },
 saturday: {
 breakfast: [
 { name: '红薯', desc: '天然甜味', calories: 120 },
 { name: '稀饭', desc: '清淡养胃', calories: 80 }
 ],
 lunch: [
 { name: '炒各种蔬菜', desc: '营养均衡', calories: 100 },
 { name: '清炒荷兰豆', desc: '脆嫩爽口', calories: 70 },
 { name: '杂粮饭', desc: '健康主食', calories: 140 }
 ],
 dinner: [
 { name: '蔬菜粥', desc: '清淡易消化', calories: 120 },
 { name: '凉拌番茄', desc: '酸甜可口', calories: 40 }
 ]
 },
 sunday: {
 breakfast: [
 { name: '三明治', desc: '西式早餐', calories: 200 },
 { name: '果汁', desc: '新鲜水果', calories: 80 }
 ],
 lunch: [
 { name: '清炒时蔬', desc: '绿色健康', calories: 60 },
 { name: '炒藕片', desc: '爽脆可口', calories: 80 },
 { name: '米饭', desc: '主食', calories: 130 }
 ],
 dinner: [
 { name: '蔬菜粥', desc: '清淡易消化', calories: 120 },
 { name: '凉拌番茄', desc: '酸甜可口', calories: 40 }
 ]
 }
};
const goBack = () => {
 router.back();
};
const getMealFoods = (day, meal) => {
 return mealPlan.value[day]?.[meal] || [];
};
const transformPlanData = (apiPlan) => {
 if (!apiPlan || !Array.isArray(apiPlan))
 return defaultPlan;
 const transformed = {};
 apiPlan.forEach(dayPlan => {
 const dayKey = dayKeyMap[dayPlan.day];
 if (!dayKey)
 return;
 transformed[dayKey] = { breakfast: [], lunch: [], dinner: [] };
 dayPlan.meals.forEach(meal => {
 const mealKey = mealKeyMap[meal.type];
 if (!mealKey)
 return;
 transformed[dayKey][mealKey] = [{
 name: meal.name,
 desc: meal.ingredients?.join('、') || '营养均衡',
 calories: meal.nutrition?.calories || 0
 }];
 });
 });
 return Object.keys(transformed).length > 0 ? transformed : defaultPlan;
};
const generatePlan = async () => {
 try {
 loading.value = true;
 const planData = {
 days: 7,
 preferences: familyHealthData.value?.preferences || '均衡营养',
 familySize: parseInt(familyHealthData.value?.peopleCount) || 3,
 allergies: familyHealthData.value?.allergies || '',
 restrictions: familyHealthData.value?.restrictions || '',
 diseases: familyHealthData.value?.diseases || ''
 };
 const response = await generateMealPlan(planData);
 if (response.code === 200) {
 mealPlan.value = transformPlanData(response.data.plan);
 showToast({ type: 'success', message: '食谱生成成功' });
 }
 else {
 mealPlan.value = defaultPlan;
 showToast({ type: 'warning', message: '使用默认食谱' });
 }
 }
 catch (error) {
 console.error('Failed to generate meal plan:', error);
 mealPlan.value = defaultPlan;
 showToast({ type: 'warning', message: '使用默认食谱' });
 }
 finally {
 loading.value = false;
 }
};

const loadFamilyHealthData = async () => {
 try {
 const response = await getFamilyHealth();
 if (response.code === 200) {
 familyHealthData.value = response.data;
 }
 } catch (error) {
 console.error('加载家庭健康数据失败:', error);
 }
};

const generateShoppingList = () => {
 const currentPlan = Object.entries(mealPlan.value).map(([dayKey, meals]) => ({
 day: Object.entries(dayKeyMap).find(([label, key]) => key === dayKey)?.[0] || dayKey,
 meals: Object.entries(meals).map(([mealKey, foods]) => ({
 type: Object.entries(mealKeyMap).find(([label, key]) => key === mealKey)?.[0] || mealKey,
 ingredients: foods.map(f => f.name)
 }))
 }));
 
 const planParam = encodeURIComponent(JSON.stringify(currentPlan));
 router.push({ path: '/shopping-list', query: { plan: planParam } });
};

onMounted(() => {
 mealPlan.value = defaultPlan;
 loadFamilyHealthData();
});
</script>

<style lang="scss" scoped>
.meal-plan-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.week-tabs {
  flex: 1;
  
  :deep(.van-tabs__content) {
    padding: 16px;
  }
  
  :deep(.van-tab) {
    font-size: 12px;
  }
}

.day-content {
  .meal-section {
    margin-bottom: 20px;
    
    .meal-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: bold;
      color: #333;
      font-size: 16px;
    }
    
    .food-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
  }
}

.bottom-bar {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
  
  .van-button {
    height: 48px;
  }
}
</style>