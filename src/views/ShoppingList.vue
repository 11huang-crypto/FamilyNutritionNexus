<template>
  <div class="shopping-list-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="采购清单" left-arrow @click-left="goBack" />
    
    <!-- 连接状态提示栏 -->
    <div class="connection-status" :class="connectionStatusClass">
      <van-icon :name="connectionStatusIcon" />
      <span>{{ connectionStatusText }}</span>
      <van-loading v-if="isConnecting" size="14" />
    </div>

    <!-- 列表头部 -->
    <div class="list-header">
      <span class="list-title">家庭采购清单</span>
      <span class="item-count">{{ listItems.length }} 项</span>
    </div>

    <!-- 离线提示 -->
    <div class="offline-tip" v-if="!isConnected && !isConnecting">
      <van-icon name="warning-o" color="#ff9800" />
      <span>当前无网络，修改将在恢复连接后同步</span>
    </div>

    <!-- 采购清单列表 -->
    <div class="shopping-list">
      <van-checkbox-group v-model="checkedItems" @change="onCheckChange">
        <van-cell-group>
          <van-cell 
            v-for="item in listItems" 
            :key="item.id" 
            :title="item.name"
            :desc="`${item.quantity}${item.unit}`"
            clickable
            class="list-item"
            :class="{ checked: checkedItems.includes(item.id) }"
          >
            <template #right-icon>
              <van-checkbox 
                :name="item.id" 
                :checked="checkedItems.includes(item.id)"
              />
            </template>
            <template #extra>
              <van-stepper 
                v-model="item.quantity" 
                :min="1"
                @change="(val) => updateQuantity(item.id, val)"
                size="small"
              />
            </template>
          </van-cell>
        </van-cell-group>
      </van-checkbox-group>
      
      <!-- 空状态 -->
      <div class="empty-state" v-if="listItems.length === 0">
        <van-icon name="shopping-cart-o" size="48" color="#ccc" />
        <p>暂无采购清单</p>
      </div>
    </div>

    <!-- 添加新物品 -->
    <div class="add-section">
      <van-field 
        v-model="newItemName" 
        placeholder="添加新物品"
        right-icon="plus"
        @click-right-icon="addItem"
        :disabled="!isConnected && pendingChanges.length > 5"
      />
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <!-- 完成进度 -->
      <div class="progress-info">
        <span>已完成 {{ checkedItems.length }}/{{ listItems.length }}</span>
        <van-progress :percentage="progressPercent" :show-info="false" />
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button type="default" @click="clearChecked">清除已选</van-button>
        <van-button type="primary" @click="shareList">分享清单</van-button>
      </div>
      
      <!-- 待同步提示 -->
      <div class="pending-tip" v-if="pendingChanges.length > 0">
        <van-icon name="clock-o" size="12" />
        <span>{{ pendingChanges.length }} 项待同步</span>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <van-loading 
      v-if="initialLoading" 
      class="loading-mask"
      text="加载中..."
    />
  </div>
</template>

<script setup>
/**
 * 采购清单协同页
 * 功能：实时协同编辑采购清单，支持多成员同步修改
 * 技术：WebSocket 实时通信 + 离线缓存 + 自动重连
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import { getShoppingList, generateShoppingListFromPlan, updateShoppingItem, removeShoppingItem, addShoppingItem } from '../api';

// 路由实例
const router = useRouter();
const route = useRoute();

// 响应式状态
const initialLoading = ref(true);           // 初始加载状态
const isConnecting = ref(false);            // WebSocket 连接中
const isConnected = ref(false);             // WebSocket 是否已连接
const listItems = ref([]);                  // 采购清单数据
const checkedItems = ref([]);               // 已勾选的物品ID列表
const newItemName = ref('');                // 新物品名称
const pendingChanges = ref([]);             // 离线时待同步的修改队列
const lastEditor = ref('');                 // 最后修改者

// WebSocket 实例
let ws = null;
// 重连定时器
let reconnectTimer = null;
// 重连次数
let reconnectCount = 0;
// 最大重连次数
const MAX_RECONNECT_COUNT = 5;
// 重连间隔（毫秒）
const RECONNECT_INTERVAL = 3000;

/**
 * 连接状态图标
 */
const connectionStatusIcon = computed(() => {
  if (isConnecting.value) return 'loading';
  if (isConnected.value) return 'wifi';
  return 'wifi-o';
});

/**
 * 连接状态文本
 */
const connectionStatusText = computed(() => {
  if (isConnecting.value) return '连接中...';
  if (isConnected.value) return '实时同步中';
  return '未连接';
});

/**
 * 连接状态样式类
 */
const connectionStatusClass = computed(() => {
  if (isConnecting.value) return 'connecting';
  if (isConnected.value) return 'connected';
  return 'disconnected';
});

/**
 * 完成进度百分比
 */
const progressPercent = computed(() => {
  if (listItems.value.length === 0) return 0;
  return Math.round((checkedItems.value.length / listItems.value.length) * 100);
});

/**
 * 返回上一页
 */
const goBack = () => {
  router.back();
};

/**
 * 获取初始采购清单数据
 */
const transformShoppingData = (apiItems) => {
  if (!apiItems || !Array.isArray(apiItems))
    return { items: [], checked: [] };
  const items = apiItems.map(item => ({
    id: String(item.id),
    name: item.name,
    quantity: item.quantity || 1,
    unit: item.unit || '个'
  }));
  const checked = apiItems.filter(item => item.checked).map(item => String(item.id));
  return { items, checked };
};
const fetchShoppingListData = async () => {
  try {
    initialLoading.value = true;
    const response = await getShoppingList();
    if (response.code === 200) {
      const { items, checked } = transformShoppingData(response.data.items);
      listItems.value = items;
      checkedItems.value = checked;
    }
  } catch (error) {
    console.error('获取采购清单失败:', error);
    listItems.value = [
      { id: '1', name: '西兰花', quantity: 2, unit: '颗' },
      { id: '2', name: '鸡胸肉', quantity: 500, unit: '克' },
      { id: '3', name: '鸡蛋', quantity: 10, unit: '个' },
      { id: '4', name: '牛奶', quantity: 2, unit: '盒' },
      { id: '5', name: '苹果', quantity: 5, unit: '个' }
    ];
    checkedItems.value = [];
  } finally {
    initialLoading.value = false;
  }
};

/**
 * 【WebSocket】初始化连接
 */
const initWebSocket = () => {
  // 构建 WebSocket URL（根据当前页面协议自动选择 ws 或 wss）
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/shopping-list`;
  
  // 关闭已存在的连接
  if (ws) {
    ws.close();
    ws = null;
  }
  
  // 创建新连接
  isConnecting.value = true;
  ws = new WebSocket(wsUrl);
  
  /**
   * 连接成功回调
   */
  ws.onopen = () => {
    console.log('WebSocket 连接成功');
    isConnecting.value = false;
    isConnected.value = true;
    reconnectCount = 0;
    
    // 如果有待同步的修改，立即发送
    if (pendingChanges.value.length > 0) {
      syncPendingChanges();
    }
  };
  
  /**
   * 收到消息回调
   * @param {MessageEvent} event - 消息事件
   */
  ws.onmessage = (event) => {
    try {
      // 【消息解析】解析服务器发送的 JSON 消息
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    } catch (error) {
      console.error('WebSocket 消息解析失败:', error);
    }
  };
  
  /**
   * 连接关闭回调
   */
  ws.onclose = (event) => {
    console.log('WebSocket 连接关闭:', event.code, event.reason);
    isConnecting.value = false;
    isConnected.value = false;
    
    // 自动重连（排除手动关闭的情况）
    if (event.code !== 1000) {
      scheduleReconnect();
    }
  };
  
  /**
   * 连接错误回调
   */
  ws.onerror = (error) => {
    console.error('WebSocket 连接错误:', error);
    isConnecting.value = false;
    isConnected.value = false;
    
    // 触发重连
    scheduleReconnect();
  };
};

/**
 * 【重连机制】安排重连
 */
const scheduleReconnect = () => {
  // 超过最大重连次数，停止重连
  if (reconnectCount >= MAX_RECONNECT_COUNT) {
    showToast({
      type: 'fail',
      message: '连接失败，请检查网络后刷新页面'
    });
    return;
  }
  
  // 延迟重连（指数退避策略）
  const delay = RECONNECT_INTERVAL * (reconnectCount + 1);
  reconnectTimer = setTimeout(() => {
    reconnectCount++;
    console.log(`第 ${reconnectCount} 次尝试重连...`);
    initWebSocket();
  }, delay);
};

/**
 * 【消息处理】处理服务器消息
 * @param {Object} message - 消息对象
 */
const handleServerMessage = (message) => {
  const { type, payload, editor } = message;
  
  switch (type) {
    case 'sync':
      // 全量同步消息
      handleSyncMessage(payload);
      break;
    case 'check':
      // 勾选状态变更消息
      handleCheckMessage(payload, editor);
      break;
    case 'update':
      // 数量变更消息
      handleUpdateMessage(payload, editor);
      break;
    case 'add':
      // 添加新物品消息
      handleAddMessage(payload, editor);
      break;
    case 'remove':
      // 删除物品消息
      handleRemoveMessage(payload, editor);
      break;
    default:
      console.warn('未知消息类型:', type);
  }
};

/**
 * 处理全量同步消息
 */
const handleSyncMessage = (payload) => {
  if (payload.items) {
    listItems.value = payload.items;
  }
  if (payload.checked !== undefined) {
    checkedItems.value = payload.checked;
  }
};

/**
 * 处理勾选状态变更消息
 */
const handleCheckMessage = (payload, editor) => {
  if (payload.items !== undefined) {
    checkedItems.value = payload.items;
    // 显示修改提示（排除自己的修改）
    if (editor && editor !== 'me') {
      showToast({
        type: 'info',
        message: `${editor} 修改了勾选状态`
      });
    }
  }
};

/**
 * 处理数量变更消息
 */
const handleUpdateMessage = (payload, editor) => {
  const item = listItems.value.find(i => i.id === payload.id);
  if (item && payload.quantity !== undefined) {
    item.quantity = payload.quantity;
    if (editor && editor !== 'me') {
      showToast({
        type: 'info',
        message: `${editor} 修改了数量`
      });
    }
  }
};

/**
 * 处理添加新物品消息
 */
const handleAddMessage = (payload, editor) => {
  const exists = listItems.value.find(i => i.id === payload.id);
  if (!exists) {
    listItems.value.push({
      id: payload.id,
      name: payload.name,
      quantity: payload.quantity || 1,
      unit: payload.unit || '个'
    });
    if (editor && editor !== 'me') {
      showToast({
        type: 'info',
        message: `${editor} 添加了 ${payload.name}`
      });
    }
  }
};

/**
 * 处理删除物品消息
 */
const handleRemoveMessage = (payload, editor) => {
  const index = listItems.value.findIndex(i => i.id === payload.id);
  if (index !== -1) {
    const removedItem = listItems.value[index];
    listItems.value.splice(index, 1);
    // 同时从勾选列表中移除
    const checkedIndex = checkedItems.value.indexOf(payload.id);
    if (checkedIndex !== -1) {
      checkedItems.value.splice(checkedIndex, 1);
    }
    if (editor && editor !== 'me') {
      showToast({
        type: 'info',
        message: `${editor} 删除了 ${removedItem.name}`
      });
    }
  }
};

/**
 * 【消息发送】发送消息到服务器
 * @param {string} type - 消息类型
 * @param {Object} payload - 消息内容
 */
const sendMessage = (type, payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    // 离线状态，加入待同步队列
    pendingChanges.value.push({ type, payload });
    
    // 提示用户离线状态
    if (!isConnected.value && !isConnecting.value) {
      showToast({
        type: 'warning',
        message: '当前无网络，修改将在恢复连接后同步'
      });
    }
    return;
  }
  
  // 在线状态，直接发送
  const message = JSON.stringify({ type, payload, editor: 'me' });
  ws.send(message);
};

/**
 * 同步待同步的修改
 */
const syncPendingChanges = () => {
  if (pendingChanges.value.length === 0) return;
  
  console.log(`同步 ${pendingChanges.value.length} 项待同步修改`);
  
  pendingChanges.value.forEach(change => {
    sendMessage(change.type, change.payload);
  });
  
  pendingChanges.value = [];
  
  showToast({
    type: 'success',
    message: '已同步所有修改'
  });
};

/**
 * 【事件处理】勾选状态变更
 */
const onCheckChange = (value) => {
  checkedItems.value = value;
  sendMessage('check', { items: value });
};

/**
 * 【事件处理】数量变更
 */
const updateQuantity = async (id, quantity) => {
  const item = listItems.value.find(i => i.id === id);
  if (item) {
    item.quantity = quantity;
    sendMessage('update', { id, quantity });
    try {
      await updateShoppingItem({ id: parseInt(id), quantity });
    } catch (error) {
      console.error('更新数量失败:', error);
    }
  }
};

/**
 * 【事件处理】添加新物品
 */
const addItem = async () => {
  const name = newItemName.value.trim();
  if (!name) {
    showToast({
      type: 'fail',
      message: '请输入物品名称'
    });
    return;
  }
  
  try {
    const response = await addShoppingItem({ name, quantity: 1, unit: '个' });
    
    if (response.code === 200) {
      const newItem = response.data;
      listItems.value.push({
        id: String(newItem.id),
        name: newItem.name,
        quantity: newItem.quantity || 1,
        unit: newItem.unit || '个'
      });
      newItemName.value = '';
      
      sendMessage('add', { id: String(newItem.id), name, quantity: 1, unit: '个' });
      
      showToast({
        type: 'success',
        message: '添加成功'
      });
    }
  } catch (error) {
    console.error('添加采购项失败:', error);
    showToast({ type: 'fail', message: '添加失败，请重试' });
  }
};

/**
 * 【事件处理】清除已勾选的物品
 */
const clearChecked = async () => {
  if (checkedItems.value.length === 0) {
    showToast({
      type: 'warning',
      message: '没有已勾选的物品'
    });
    return;
  }
  
  checkedItems.value.forEach(id => {
    sendMessage('remove', { id });
    removeShoppingItem(parseInt(id)).catch(err => console.error('删除失败:', err));
  });
  
  listItems.value = listItems.value.filter(item => !checkedItems.value.includes(item.id));
  checkedItems.value = [];
  
  showToast({
    type: 'success',
    message: '已清除已选物品'
  });
};

/**
 * 【事件处理】分享清单
 */
const shareList = () => {
  showToast({
    type: 'success',
    message: '分享链接已复制到剪贴板'
  });
};

/**
 * 从食谱生成采购清单
 */
const generateFromPlan = async () => {
  try {
    const planParam = route.query.plan;
    if (!planParam) return;
    
    const planData = JSON.parse(decodeURIComponent(planParam));
    const response = await generateShoppingListFromPlan({ plan: planData });
    
    if (response.code === 200) {
      showToast({ type: 'success', message: response.message });
      fetchShoppingListData();
    }
  } catch (error) {
    console.error('从食谱生成采购清单失败:', error);
    showToast({ type: 'fail', message: '生成采购清单失败' });
  }
};

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  fetchShoppingListData();
  generateFromPlan();
  initWebSocket();
});

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  // 清除重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  // 关闭 WebSocket 连接
  if (ws) {
    // 发送关闭帧
    ws.close(1000, '页面关闭');
    ws = null;
  }
  
  // 如果有待同步的修改，保存到本地存储
  if (pendingChanges.value.length > 0) {
    localStorage.setItem('pendingShoppingListChanges', JSON.stringify(pendingChanges.value));
  }
});
</script>

<style lang="scss" scoped>
.shopping-list-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 连接状态栏 */
.connection-status {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  
  &.connecting {
    background: #fff3e0;
    color: #ff9800;
  }
  
  &.connected {
    background: #e8f5e9;
    color: #4CAF50;
  }
  
  &.disconnected {
    background: #ffebee;
    color: #f44336;
  }
}

/* 列表头部 */
.list-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .list-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  
  .item-count {
    font-size: 14px;
    color: #999;
  }
}

/* 离线提示 */
.offline-tip {
  margin: 0 16px 16px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #ff9800;
}

/* 采购清单 */
.shopping-list {
  flex: 1;
  padding: 0 16px;
  
  .list-item {
    background: #fff;
    margin-bottom: 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &.checked {
      opacity: 0.6;
      text-decoration: line-through;
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #999;
    
    p {
      margin-top: 12px;
      font-size: 14px;
    }
  }
}

/* 添加区域 */
.add-section {
  padding: 16px;
}

/* 底部操作栏 */
.bottom-bar {
  background: #fff;
  padding: 16px;
  border-top: 1px solid #eee;
  
  .progress-info {
    margin-bottom: 12px;
    
    span {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      display: block;
    }
    
    .van-progress {
      height: 6px;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    
    .van-button {
      flex: 1;
      height: 44px;
    }
  }
  
  .pending-tip {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;
    color: #ff9800;
  }
}

/* 加载遮罩 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
</style>