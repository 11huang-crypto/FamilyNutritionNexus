/**
 * API 接口封装
 * 所有后端接口统一在此管理
 */

import axios from '../utils/axios';

/**
 * 图片识别接口
 * POST /api/analyze
 * @param {FormData} formData - 包含图片的 FormData 对象
 * @returns {Promise<Object>} - 识别结果
 */
/** 快速识别（Mock模式下使用，仅需食材名称） */
export const analyzeFood = async (data) => {
  try {
    const response = await axios.post('/api/analyze', data)
    return response
  } catch (error) {
    console.error('食材识别失败:', error)
    throw error
  }
}

export const analyzeImage = async (formData) => {
  // 校验参数
  if (!(formData instanceof FormData)) {
    throw new Error('参数必须是 FormData 类型');
  }
  
  // 检查是否包含图片文件
  if (!formData.has('image')) {
    throw new Error('FormData 中必须包含 image 字段');
  }
  
  try {
    // 发送 POST 请求
    // 注意：上传文件时不需要手动设置 Content-Type
    // axios 会自动根据 FormData 设置正确的 Content-Type（包含 boundary）
    const response = await axios.post('/analyze', formData, {
      headers: {
        // 让浏览器自动设置 Content-Type（包含 multipart/form-data 和 boundary）
        'Content-Type': undefined
      }
    });
    
    return response;
  } catch (error) {
    // 错误已经在 axios 拦截器中处理，这里可以做额外的错误日志记录
    console.error('图片识别接口调用失败:', error);
    throw error;
  }
};

/**
 * 获取家庭菜篮子数据
 * GET /api/family/basket
 * @returns {Promise<Object>} - 菜篮子数据
 */
export const getFamilyBasket = async () => {
  try {
    const response = await axios.get('/family/basket');
    return response;
  } catch (error) {
    console.error('获取菜篮子数据失败:', error);
    throw error;
  }
};

/**
 * 扫描食材禁忌组合
 * POST /api/basket/check
 * @param {Object} data - 食材列表数据
 * @param {string[]} data.foods - 食材名称数组
 * @returns {Promise<Object>} - 检查结果
 */
export const checkFoodConflict = async (data) => {
  try {
    const response = await axios.post('/basket/check', data);
    return response;
  } catch (error) {
    console.error('检查食材禁忌失败:', error);
    throw error;
  }
};

/** 菜篮子冲突检查（别名，供BasketView调用） */
export const checkBasketConflict = checkFoodConflict

/**
 * 生成一周食谱
 * POST /api/meal-plan
 * @param {Object} data - 食谱生成参数
 * @param {number} data.days - 天数
 * @param {string} data.preferences - 饮食偏好
 * @returns {Promise<Object>} - 食谱数据
 */
export const generateMealPlan = async (data) => {
  try {
    const response = await axios.post('/meal-plan', data);
    return response;
  } catch (error) {
    console.error('生成食谱失败:', error);
    throw error;
  }
};

/**
 * 获取采购清单
 * GET /api/shopping-list
 * @returns {Promise<Object>} - 采购清单数据
 */
export const getShoppingList = async () => {
  try {
    const response = await axios.get('/shopping-list');
    return response;
  } catch (error) {
    console.error('获取采购清单失败:', error);
    throw error;
  }
};

/**
 * WebSocket 管理器
 * 用于采购清单实时协同编辑
 */
/**
 * 默认导出所有API方法
 */
export default {
  analyzeImage,
  getFamilyBasket,
  checkFoodConflict,
  generateMealPlan,
  getShoppingList,
  WebSocketManager
};

/**
 * WebSocket 管理器
 * 用于采购清单实时协同编辑
 */
export class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.callbacks = {};
  }
  
  /**
   * 连接 WebSocket
   * @returns {Promise} - 连接成功的 Promise
   */
  connect() {
    return new Promise((resolve, reject) => {
      // 构建完整的 WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const fullUrl = `${protocol}//${host}${this.url}`;
      
      this.socket = new WebSocket(fullUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected:', fullUrl);
        resolve();
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket closed:', event);
        // 可以在这里实现重连逻辑
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.callbacks[data.type]) {
            this.callbacks[data.type](data.payload);
          }
        } catch (parseError) {
          console.error('WebSocket message parse error:', parseError);
        }
      };
    });
  }
  
  /**
   * 注册消息回调
   * @param {string} type - 消息类型
   * @param {Function} callback - 回调函数
   */
  on(type, callback) {
    this.callbacks[type] = callback;
  }
  
  /**
   * 发送消息
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息内容
   */
  send(type, payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }
  
  /**
   * 关闭连接
   */
  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}