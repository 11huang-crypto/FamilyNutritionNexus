import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ========== Supowe 的页面路由 ==========
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/recognize',
    name: 'Recognize',
    component: () => import('@/views/Recognize.vue'),
    meta: { title: '拍照识材' }
  },
  {
    path: '/nutrition',
    name: 'Nutrition',
    component: () => import('@/views/Nutrition.vue'),
    meta: { title: '营养分析' }
  },
  {
    path: '/family-health',
    name: 'FamilyHealth',
    component: () => import('@/views/FamilyHealth.vue'),
    meta: { title: '家庭健康' }
  },
  {
    path: '/meal-plan',
    name: 'MealPlan',
    component: () => import('@/views/MealPlan.vue'),
    meta: { title: '食谱推荐' }
  },
  {
    path: '/shopping-list',
    name: 'ShoppingList',
    component: () => import('@/views/ShoppingList.vue'),
    meta: { title: '采购清单' }
  },

  // ========== 成员4 唐峰 — 公共组件展示与原型页面 ==========
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/views/DemoView.vue'),
    meta: { title: '组件库展示' }
  },
  {
    path: '/analyze',
    name: 'analyze',
    component: () => import('@/views/AnalyzeView.vue'),
    meta: { title: '拍照识材' }
  },
  {
    path: '/basket',
    name: 'basket',
    component: () => import('@/views/BasketView.vue'),
    meta: { title: '菜篮子' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI智能菜篮子`
  }
})

export default router
