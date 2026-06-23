/**
 * API 接口封装
 * 所有后端接口统一在此管理
 * 开发环境使用 Mock API，生产环境使用真实接口
 */

import axios from '../utils/axios';
import { mockApi } from '../mock/api';

// 判断是否使用 Mock API
const USE_MOCK = true;

/**
 * 图片识别接口
 * POST /api/analyze
 * @param {FormData} formData - 包含图片的 FormData 对象
 * @returns {Promise<Object>} - 识别结果
 */
/** 快速识别（Mock模式下使用，仅需食材名称） */
export const analyzeFood = async (data) => {
  if (USE_MOCK) {
    return mockApi.analyzeFood(data);
  }
  try {
    const response = await axios.post('/api/analyze', data)
    return response
  } catch (error) {
    console.error('食材识别失败:', error)
    throw error
  }
}

export const analyzeImage = async (formData) => {
  if (USE_MOCK) {
    return mockApi.analyzeFood({});
  }
  
  if (!(formData instanceof FormData)) {
    throw new Error('参数必须是 FormData 类型');
  }
  
  if (!formData.has('image')) {
    throw new Error('FormData 中必须包含 image 字段');
  }
  
  try {
    const response = await axios.post('/api/analyze', formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    
    return response;
  } catch (error) {
    console.error('图片识别接口调用失败:', error);
    throw error;
  }
};

/**
 * 获取家庭菜篮子数据
 * GET /api/basket/family/{familyId}
 * @param {number} familyId - 家庭ID
 * @returns {Promise<Object>} - 菜篮子数据
 */
export const getFamilyBasket = async (familyId = 1) => {
  if (USE_MOCK) {
    return mockApi.getFamilyBasket();
  }
  try {
    const response = await axios.get(`/api/basket/family/${familyId}`);
    return response;
  } catch (error) {
    console.error('获取菜篮子数据失败:', error);
    throw error;
  }
};

export const checkFoodConflict = async (familyId = 1, data) => {
  if (USE_MOCK) {
    return mockApi.checkFoodConflict(data || { items: [] });
  }
  try {
    const response = await axios.get('/api/basket/check', { params: { family_id: familyId } });
    return response;
  } catch (error) {
    console.error('检查食材禁忌失败:', error);
    throw error;
  }
};

export const checkBasketConflict = checkFoodConflict

export const addToBasket = async (item, familyId = 1) => {
  if (USE_MOCK) {
    return mockApi.addToBasket(item);
  }
  try {
    const response = await axios.post('/api/basket/item', {
      family_id: familyId,
      ingredient_name: item.name || item.ingredient_name,
      quantity: String(item.quantity || 1)
    });
    return response;
  } catch (error) {
    console.error('添加到菜篮子失败:', error);
    throw error;
  }
};

export const deleteFromBasket = async (id) => {
  if (USE_MOCK) {
    return mockApi.deleteFromBasket(id);
  }
  try {
    const response = await axios.delete(`/api/basket/item/${id}`);
    return response;
  } catch (error) {
    console.error('从菜篮子删除失败:', error);
    throw error;
  }
};

export const getFamilyHealth = async (familyId = 1) => {
  if (USE_MOCK) {
    return mockApi.getFamilyHealth();
  }
  try {
    const response = await axios.get(`/api/health/family/${familyId}`);
    return response;
  } catch (error) {
    console.error('获取家庭健康信息失败:', error);
    throw error;
  }
};

export const saveFamilyHealth = async (data, familyId = 1) => {
  if (USE_MOCK) {
    return mockApi.saveFamilyHealth(data);
  }
  try {
    const response = await axios.post('/api/health/profile', {
      family_id: familyId,
      name: data.name || '',
      conditions: data.conditions || data.diseases || [],
      allergens: data.allergens || []
    });
    return response;
  } catch (error) {
    console.error('保存家庭健康信息失败:', error);
    throw error;
  }
};

export const getShoppingList = async (familyId = 1) => {
  if (USE_MOCK) {
    return mockApi.getShoppingList();
  }
  try {
    const response = await axios.get('/api/shopping-list/realtime', { params: { family_id: familyId } });
    return response;
  } catch (error) {
    console.error('获取采购清单失败:', error);
    throw error;
  }
};

export const generateMealPlan = async (data, familyId = 1) => {
  if (USE_MOCK) {
    return mockApi.generateMealPlan(data);
  }
  try {
    const response = await axios.post(`/api/meal-plan/generate`, null, { params: { family_id: familyId } });
    return response;
  } catch (error) {
    console.error('生成食谱失败:', error);
    throw error;
  }
};

export const generateShoppingList = async (data) => {
  if (USE_MOCK) {
    return mockApi.generateShoppingList(data);
  }
  try {
    const response = await axios.post('/api/shopping-list/generate', data);
    return response;
  } catch (error) {
    console.error('生成采购清单失败:', error);
    throw error;
  }
};

export const addToShoppingList = async (item) => {
  if (USE_MOCK) {
    return mockApi.addToShoppingList(item);
  }
  try {
    const response = await axios.post('/api/shopping-list/add', item);
    return response;
  } catch (error) {
    console.error('添加采购项失败:', error);
    throw error;
  }
};

export const updateShoppingItem = async (id, data) => {
  if (USE_MOCK) {
    return mockApi.updateShoppingItem(id, data);
  }
  try {
    const response = await axios.put(`/api/shopping-list/${id}`, data);
    return response;
  } catch (error) {
    console.error('更新采购项失败:', error);
    throw error;
  }
};

export const deleteShoppingItem = async (id) => {
  if (USE_MOCK) {
    return mockApi.deleteShoppingItem(id);
  }
  try {
    const response = await axios.delete(`/api/shopping-list/${id}`);
    return response;
  } catch (error) {
    console.error('删除采购项失败:', error);
    throw error;
  }
};

// 别名导出（兼容不同页面的导入名）
export const addShoppingItem = addToShoppingList
export const removeShoppingItem = deleteShoppingItem
export const removeFromBasket = deleteFromBasket
export const generateShoppingListFromPlan = generateShoppingList
