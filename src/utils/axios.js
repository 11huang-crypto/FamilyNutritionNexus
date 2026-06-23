/**
 * Axios 请求封装
 * 统一处理请求头、拦截器、错误处理
 */

import axios from 'axios';
import { showToast } from 'vant';

// 创建 axios 实例
const instance = axios.create({
  timeout: 30000,
  withCredentials: true
});

// ============================================
// Mock 数据
// ============================================

const vegDatabase = [
  { name: '西红柿', category: '蔬菜', nutrients: { vitaminC: 23, fiber: 1.2, vitaminA: 42, potassium: 237 } },
  { name: '胡萝卜', category: '蔬菜', nutrients: { vitaminA: 835, fiber: 2.8, vitaminC: 6, potassium: 320 } },
  { name: '苹果', category: '水果', nutrients: { vitaminC: 5, fiber: 2.4, potassium: 107, sugar: 10 } },
  { name: '菠菜', category: '蔬菜', nutrients: { iron: 2.7, vitaminK: 483, vitaminC: 28, fiber: 2.2 } },
  { name: '香蕉', category: '水果', nutrients: { potassium: 358, vitaminC: 8.7, fiber: 2.6, sugar: 12 } },
  { name: '西兰花', category: '蔬菜', nutrients: { vitaminC: 89, fiber: 2.6, vitaminK: 101, iron: 0.7 } },
  { name: '橙子', category: '水果', nutrients: { vitaminC: 53, fiber: 2.4, folate: 30, potassium: 181 } },
  { name: '黄瓜', category: '蔬菜', nutrients: { vitaminC: 2.8, fiber: 0.5, potassium: 147, vitaminK: 16 } },
  { name: '猕猴桃', category: '水果', nutrients: { vitaminC: 93, fiber: 3, potassium: 312, vitaminK: 40 } },
  { name: '草莓', category: '水果', nutrients: { vitaminC: 59, fiber: 2, folate: 24, manganese: 0.39 } },
];

let basketItems = [
  { id: 1, name: '西红柿', category: '蔬菜', quantity: 3, unit: '个', freshness: 95, nutrients: { vitaminC: 23, fiber: 1.2, vitaminA: 42, potassium: 237 }, addedBy: 'u1', addedAt: '2026-06-06' },
  { id: 2, name: '胡萝卜', category: '蔬菜', quantity: 2, unit: '根', freshness: 88, nutrients: { vitaminA: 835, fiber: 2.8, vitaminC: 6, potassium: 320 }, addedBy: 'u2', addedAt: '2026-06-05' },
  { id: 3, name: '苹果', category: '水果', quantity: 5, unit: '个', freshness: 92, nutrients: { vitaminC: 5, fiber: 2.4, potassium: 107, sugar: 10 }, addedBy: 'u3', addedAt: '2026-06-06' },
  { id: 4, name: '菠菜', category: '蔬菜', quantity: 1, unit: '把', freshness: 75, nutrients: { iron: 2.7, vitaminK: 483, vitaminC: 28, fiber: 2.2 }, addedBy: 'u1', addedAt: '2026-06-04' },
  { id: 5, name: '香蕉', category: '水果', quantity: 4, unit: '根', freshness: 80, nutrients: { potassium: 358, vitaminC: 8.7, fiber: 2.6, sugar: 12 }, addedBy: 'u2', addedAt: '2026-06-03' },
];

let shoppingItems = [
  { id: 1, name: '西兰花', category: '蔬菜', quantity: 1, unit: '颗', checked: false, assignedTo: 'u1' },
  { id: 2, name: '猕猴桃', category: '水果', quantity: 6, unit: '个', checked: true, assignedTo: 'u2' },
  { id: 3, name: '草莓', category: '水果', quantity: 1, unit: '盒', checked: false, assignedTo: 'u3' },
  { id: 4, name: '玉米', category: '蔬菜', quantity: 2, unit: '根', checked: false, assignedTo: 'u1' },
  { id: 5, name: '柠檬', category: '水果', quantity: 3, unit: '个', checked: false, assignedTo: 'u2' },
];

const familyMembers = [
  { id: 'u1', name: '爸爸', avatar: '', role: 'admin', color: '#3b82f6' },
  { id: 'u2', name: '妈妈', avatar: '', role: 'member', color: '#ec4899' },
  { id: 'u3', name: '宝宝', avatar: '', role: 'member', color: '#f59e0b' },
];

let familyHealthData = {
  familyName: '',
  peopleCount: 3,
  allergies: '',
  diseases: '',
  preferences: '',
  restrictions: '',
  members: []
};

let nextId = 100;

const mockResponse = (data, message = 'ok') => ({
  code: 200,
  data,
  message
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json;charset=UTF-8'
      };
    }
    return config;
  },
  (error) => {
    showToast({ type: 'fail', message: '请求配置错误' });
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    const config = response.config;
    const url = config?.url || '';
    const method = (config?.method || 'get').toLowerCase();
    
    let requestData = {};
    try {
      if (config?.data) {
        requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      }
    } catch (e) {
      // 忽略解析错误
    }
    
    // 开发环境：所有 /api 请求返回 Mock 数据
    if (url.startsWith('/api')) {
      // GET /api/family/basket
      if (url.includes('/family/basket') && method === 'get') {
        return mockResponse({
          items: basketItems,
          total: basketItems.length,
          summary: {
            vegetableCount: basketItems.filter(i => i.category === '蔬菜').length,
            fruitCount: basketItems.filter(i => i.category === '水果').length,
            lowFreshness: basketItems.filter(i => i.freshness < 80),
          }
        });
      }
      
      // GET /api/family/health
      if (url.includes('/family/health') && method === 'get') {
        return mockResponse(familyHealthData);
      }
      
      // POST /api/family/health
      if (url.includes('/family/health') && method === 'post') {
        familyHealthData = { ...familyHealthData, ...requestData };
        return mockResponse(familyHealthData, '保存成功');
      }
      
      // GET /api/shopping-list
      if (url.includes('/shopping-list') && method === 'get') {
        return mockResponse({
          items: shoppingItems,
          total: shoppingItems.length,
          completed: shoppingItems.filter(i => i.checked).length,
          assignees: familyMembers.map(m => ({
            ...m,
            count: shoppingItems.filter(i => i.assignedTo === m.id).length,
            completed: shoppingItems.filter(i => i.assignedTo === m.id && i.checked).length,
          }))
        });
      }
      
      // POST /api/analyze
      if (url.includes('/analyze')) {
        const count = Math.floor(Math.random() * 2) + 1;
        const results = vegDatabase.slice(0, count).map(item => ({
          ...item,
          confidence: 85 + Math.random() * 14,
          recognitionTime: '0.8s',
        }));
        
        const hasTaboo = results.some(r => r.name === '菠菜' && results.some(r2 => r2.name === '黄瓜'));
        const alerts = hasTaboo ? [
          { type: 'warning', message: '提示：菠菜 + 黄瓜同食可能影响维生素C吸收', icon: 'warning-o' }
        ] : [];
        
        const units = ['斤', '个', '把', '颗', '根', '盒'];
        const estimatedPrices = results.map(r => ({
          name: r.name,
          price: 2 + Math.random() * 13,
          unit: '元/' + units[Math.floor(Math.random() * 6)],
        }));
        
        return mockResponse({ results, alerts, estimatedPrices, totalItems: results.length }, '识别成功');
      }
      
      // POST /api/family/basket/add
      if (url.includes('/family/basket/add')) {
        const newItem = {
          id: nextId++,
          name: requestData.name,
          category: requestData.category || '蔬菜',
          quantity: requestData.quantity || 1,
          unit: requestData.unit || '个',
          freshness: 80 + Math.floor(Math.random() * 20),
          nutrients: requestData.nutrients || { vitaminC: Math.floor(Math.random() * 100), fiber: Math.random() * 5 },
          addedBy: 'u1',
          addedAt: new Date().toISOString().split('T')[0]
        };
        basketItems.push(newItem);
        return mockResponse(newItem, '添加成功');
      }
      
      // DELETE /api/family/basket/:id
      const deleteBasketMatch = url.match(/\/family\/basket\/(\d+)/);
      if (deleteBasketMatch && method === 'delete') {
        const id = parseInt(deleteBasketMatch[1]);
        const index = basketItems.findIndex(i => i.id === id);
        if (index !== -1) {
          basketItems.splice(index, 1);
        }
        return mockResponse({ id }, '删除成功');
      }
      
      // POST /api/basket/check
      if (url.includes('/basket/check')) {
        const items = requestData.items || [];
        const hasConflict = items.includes('菠菜') && items.includes('黄瓜');
        const conflicts = hasConflict ? [
          { type: 'warning', message: '菠菜 + 黄瓜同食可能影响维生素C吸收', icon: 'warning-o' }
        ] : [];
        return mockResponse({ hasConflict, conflicts }, hasConflict ? '发现禁忌组合' : '未发现禁忌组合');
      }
      
      // POST /api/meal-plan
      if (url.includes('/meal-plan')) {
        const days = requestData.days || 7;
        const apiPlan = [];
        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const mealTypes = ['早餐', '午餐', '晚餐'];
        
        for (let i = 0; i < days; i++) {
          const meals = {};
          mealTypes.forEach(meal => {
            const count = Math.floor(Math.random() * 2) + 1;
            meals[meal] = vegDatabase.slice(0, count).map(v => ({
              name: v.name,
              desc: `富含${Object.keys(v.nutrients)[0]}`,
              calories: Math.floor(Math.random() * 100) + 30
            }));
          });
          apiPlan.push({ day: dayNames[i % 7], meals });
        }
        
        return mockResponse({ plan: apiPlan }, '食谱生成成功');
      }
      
      // POST /api/shopping-list/generate
      if (url.includes('/shopping-list/generate')) {
        const plan = requestData.plan || [];
        const ingredientCount = {};
        
        plan.forEach(dayPlan => {
          Object.values(dayPlan.meals || {}).forEach(meal => {
            meal.forEach(food => {
              ingredientCount[food.name] = (ingredientCount[food.name] || 0) + 1;
            });
          });
        });
        
        const newItems = Object.keys(ingredientCount).map(name => ({
          id: nextId++,
          name,
          category: vegDatabase.find(v => v.name === name)?.category || '其他',
          quantity: ingredientCount[name],
          unit: '个',
          checked: false,
          assignedTo: 'u1'
        }));
        
        shoppingItems = [...newItems, ...shoppingItems];
        
        return mockResponse({ items: shoppingItems, generatedCount: newItems.length }, `成功生成${newItems.length}项采购清单`);
      }
      
      // POST /api/shopping-list/add
      if (url.includes('/shopping-list/add')) {
        const newItem = {
          id: nextId++,
          name: requestData.name,
          category: vegDatabase.find(v => v.name === requestData.name)?.category || '其他',
          quantity: requestData.quantity || 1,
          unit: requestData.unit || '个',
          checked: false,
          assignedTo: 'u1'
        };
        shoppingItems.push(newItem);
        return mockResponse(newItem, '添加成功');
      }
      
      // PUT /api/shopping-list/:id
      const putShoppingMatch = url.match(/\/shopping-list\/(\d+)/);
      if (putShoppingMatch && method === 'put') {
        const id = parseInt(putShoppingMatch[1]);
        const index = shoppingItems.findIndex(i => i.id === id);
        if (index !== -1) {
          shoppingItems[index] = { ...shoppingItems[index], ...requestData };
        }
        return mockResponse(shoppingItems[index] || {}, '更新成功');
      }
      
      // DELETE /api/shopping-list/:id
      const deleteShoppingMatch = url.match(/\/shopping-list\/(\d+)/);
      if (deleteShoppingMatch && method === 'delete') {
        const id = parseInt(deleteShoppingMatch[1]);
        const index = shoppingItems.findIndex(i => i.id === id);
        if (index !== -1) {
          shoppingItems.splice(index, 1);
        }
        return mockResponse({ id }, '删除成功');
      }
    }
    
    if (data instanceof Blob) {
      return response;
    }
    
    if (data.code === 200) {
      return data;
    } else {
      showToast({ type: 'fail', message: data.message || '操作失败' });
      return Promise.reject(new Error(data.message || '业务错误'));
    }
  },
  (error) => {
    console.error('HTTP Error:', error);
    
    const config = error.config;
    const url = config?.url || '';
    const method = (config?.method || 'get').toLowerCase();
    
    console.log('Mock 拦截 - URL:', url, 'Method:', method);
    
    let requestData = {};
    try {
      if (config?.data) {
        requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      }
    } catch (e) {
      // 忽略解析错误
    }
    
    // GET /api/family/basket
    if (url.includes('/family/basket') && method === 'get') {
      console.log('匹配到 GET /api/family/basket');
      return Promise.resolve(mockResponse({
        items: basketItems,
        total: basketItems.length,
        summary: {
          vegetableCount: basketItems.filter(i => i.category === '蔬菜').length,
          fruitCount: basketItems.filter(i => i.category === '水果').length,
          lowFreshness: basketItems.filter(i => i.freshness < 80),
        }
      }));
    }
    
    // GET /api/family/health
    if (url.includes('/family/health') && method === 'get') {
      return Promise.resolve(mockResponse(familyHealthData));
    }
    
    // POST /api/family/health
    if (url.includes('/family/health') && method === 'post') {
      familyHealthData = { ...familyHealthData, ...requestData };
      return Promise.resolve(mockResponse(familyHealthData, '保存成功'));
    }
    
    // GET /api/shopping-list
    if (url.includes('/shopping-list') && method === 'get') {
      return Promise.resolve(mockResponse({
        items: shoppingItems,
        total: shoppingItems.length,
        completed: shoppingItems.filter(i => i.checked).length,
        assignees: familyMembers.map(m => ({
          ...m,
          count: shoppingItems.filter(i => i.assignedTo === m.id).length,
          completed: shoppingItems.filter(i => i.assignedTo === m.id && i.checked).length,
        }))
      }));
    }
    
    // POST /api/analyze
    if (url.includes('/analyze')) {
      const count = Math.floor(Math.random() * 2) + 1;
      const results = vegDatabase.slice(0, count).map(item => ({
        ...item,
        confidence: 85 + Math.random() * 14,
        recognitionTime: '0.8s',
      }));
      
      const hasTaboo = results.some(r => r.name === '菠菜' && results.some(r2 => r2.name === '黄瓜'));
      const alerts = hasTaboo ? [
        { type: 'warning', message: '提示：菠菜 + 黄瓜同食可能影响维生素C吸收', icon: 'warning-o' }
      ] : [];
      
      const units = ['斤', '个', '把', '颗', '根', '盒'];
      const estimatedPrices = results.map(r => ({
        name: r.name,
        price: 2 + Math.random() * 13,
        unit: '元/' + units[Math.floor(Math.random() * 6)],
      }));
      
      return Promise.resolve(mockResponse({ results, alerts, estimatedPrices, totalItems: results.length }, '识别成功'));
    }
    
    // POST /api/family/basket/add
    if (url.includes('/family/basket/add')) {
      const newItem = {
        id: nextId++,
        name: requestData.name,
        category: requestData.category || '蔬菜',
        quantity: requestData.quantity || 1,
        unit: requestData.unit || '个',
        freshness: 80 + Math.floor(Math.random() * 20),
        nutrients: requestData.nutrients || { vitaminC: Math.floor(Math.random() * 100), fiber: Math.random() * 5 },
        addedBy: 'u1',
        addedAt: new Date().toISOString().split('T')[0]
      };
      basketItems.push(newItem);
      return Promise.resolve(mockResponse(newItem, '添加成功'));
    }
    
    // DELETE /api/family/basket/:id
    const deleteBasketMatch = url.match(/\/family\/basket\/(\d+)/);
    if (deleteBasketMatch && method === 'delete') {
      const id = parseInt(deleteBasketMatch[1]);
      const index = basketItems.findIndex(i => i.id === id);
      if (index !== -1) {
        basketItems.splice(index, 1);
      }
      return Promise.resolve(mockResponse({ id }, '删除成功'));
    }
    
    // POST /api/basket/check
    if (url.includes('/basket/check')) {
      const items = requestData.items || [];
      const hasConflict = items.includes('菠菜') && items.includes('黄瓜');
      const conflicts = hasConflict ? [
        { type: 'warning', message: '菠菜 + 黄瓜同食可能影响维生素C吸收', icon: 'warning-o' }
      ] : [];
      return Promise.resolve(mockResponse({ hasConflict, conflicts }, hasConflict ? '发现禁忌组合' : '未发现禁忌组合'));
    }
    
    // POST /api/meal-plan
    if (url.includes('/meal-plan')) {
      const days = requestData.days || 7;
      const apiPlan = [];
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const mealTypes = ['早餐', '午餐', '晚餐'];
      
      for (let i = 0; i < days; i++) {
        const meals = {};
        mealTypes.forEach(meal => {
          const count = Math.floor(Math.random() * 2) + 1;
          meals[meal] = vegDatabase.slice(0, count).map(v => ({
            name: v.name,
            desc: `富含${Object.keys(v.nutrients)[0]}`,
            calories: Math.floor(Math.random() * 100) + 30
          }));
        });
        apiPlan.push({ day: dayNames[i % 7], meals });
      }
      
      return Promise.resolve(mockResponse({ plan: apiPlan }, '食谱生成成功'));
    }
    
    // POST /api/shopping-list/generate
    if (url.includes('/shopping-list/generate')) {
      const plan = requestData.plan || [];
      const ingredientCount = {};
      
      plan.forEach(dayPlan => {
        Object.values(dayPlan.meals || {}).forEach(meal => {
          meal.forEach(food => {
            ingredientCount[food.name] = (ingredientCount[food.name] || 0) + 1;
          });
        });
      });
      
      const newItems = Object.keys(ingredientCount).map(name => ({
        id: nextId++,
        name,
        category: vegDatabase.find(v => v.name === name)?.category || '其他',
        quantity: ingredientCount[name],
        unit: '个',
        checked: false,
        assignedTo: 'u1'
      }));
      
      shoppingItems = [...newItems, ...shoppingItems];
      
      return Promise.resolve(mockResponse({ items: shoppingItems, generatedCount: newItems.length }, `成功生成${newItems.length}项采购清单`));
    }
    
    // POST /api/shopping-list/add
    if (url.includes('/shopping-list/add')) {
      const newItem = {
        id: nextId++,
        name: requestData.name,
        category: vegDatabase.find(v => v.name === requestData.name)?.category || '其他',
        quantity: requestData.quantity || 1,
        unit: requestData.unit || '个',
        checked: false,
        assignedTo: 'u1'
      };
      shoppingItems.push(newItem);
      return Promise.resolve(mockResponse(newItem, '添加成功'));
    }
    
    // PUT /api/shopping-list/:id
    const putShoppingMatch = url.match(/\/shopping-list\/(\d+)/);
    if (putShoppingMatch && method === 'put') {
      const id = parseInt(putShoppingMatch[1]);
      const index = shoppingItems.findIndex(i => i.id === id);
      if (index !== -1) {
        shoppingItems[index] = { ...shoppingItems[index], ...requestData };
      }
      return Promise.resolve(mockResponse(shoppingItems[index] || {}, '更新成功'));
    }
    
    // DELETE /api/shopping-list/:id
    const deleteShoppingMatch = url.match(/\/shopping-list\/(\d+)/);
    if (deleteShoppingMatch && method === 'delete') {
      const id = parseInt(deleteShoppingMatch[1]);
      const index = shoppingItems.findIndex(i => i.id === id);
      if (index !== -1) {
        shoppingItems.splice(index, 1);
      }
      return Promise.resolve(mockResponse({ id }, '删除成功'));
    }
    
    // 其他错误
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          showToast({ type: 'fail', message: data?.message || '图片格式错误，请重新上传' });
          break;
        case 401:
          showToast({ type: 'fail', message: '请先登录' });
          break;
        case 403:
          showToast({ type: 'fail', message: '权限不足，无法操作' });
          break;
        case 404:
          showToast({ type: 'fail', message: '请求的资源不存在' });
          break;
        case 500:
          showToast({ type: 'fail', message: '服务器繁忙，请稍后再试' });
          break;
        default:
          showToast({ type: 'fail', message: data?.message || `请求失败，状态码: ${status}` });
      }
    } else if (error.request) {
      showToast({ type: 'fail', message: '网络连接失败，请检查网络' });
    } else {
      showToast({ type: 'fail', message: error.message || '请求配置错误' });
    }
    
    return Promise.reject(error);
  }
);

export default instance;
