<template>
  <div class="recognize-page">
    <!-- 顶部导航栏 -->
    <AppNavbar title="食材识别" :showBack="true" />
    
    <!-- 上传区域 - 未选择图片时显示 -->
    <div class="upload-area" v-if="!uploadedImage">
      <!-- Vant上传组件，支持拍照和相册选择 -->
      <van-uploader 
        :after-read="onAfterRead"           <!-- 图片选择后的回调 -->
        :before-read="onBeforeRead"         <!-- 图片选择前的校验 -->
        :max-count="1"                      <!-- 最多选择1张图片 -->
        accept="image/*"                    <!-- 接受所有图片格式 -->
        capture="environment"               <!-- 优先调用后置摄像头 -->
        upload-text="拍照或上传图片"
        :disabled="loading"                 <!-- 加载状态时禁止操作 -->
        :deletable="false"                  <!-- 不显示删除按钮（自定义重新选择） -->
      >
        <!-- 自定义上传提示区域 -->
        <div class="upload-content">
          <div class="upload-icon-wrapper">
            <van-icon name="camera" size="56" />
          </div>
          <p class="upload-title">点击拍照或选择图片</p>
          <p class="upload-desc">支持识别蔬菜水果、肉类海鲜等食材</p>
        </div>
      </van-uploader>
    </div>

    <!-- 预览区域 - 选择图片后显示 -->
    <div class="preview-area" v-else>
      <!-- 图片预览 -->
      <van-image 
        :src="uploadedImage" 
        mode="aspectFit"
        class="preview-image"
        @error="handleImageError"
      />
      
      <!-- 操作按钮 -->
      <div class="preview-actions">
        <van-button 
          type="default" 
          round 
          @click="cancelUpload"
          :disabled="loading"
        >
          重新选择
        </van-button>
        <van-button 
          type="primary" 
          round 
          @click="startAnalyze"
          :loading="loading"
          :disabled="loading"
        >
          {{ loading ? '识别中...' : '开始识别' }}
        </van-button>
      </div>
    </div>

    <!-- 识别结果区域 -->
    <div class="analysis-result" v-if="analysisResult">
      <div class="result-header">
        <h3 class="result-title">识别结果</h3>
        <van-tag type="success" size="small">识别成功</van-tag>
      </div>
      
      <!-- 识别食材卡片 -->
      <VegCard 
        :name="analysisResult.name"
        :image="generateFoodImage(analysisResult.name)"
        :desc="`新鲜度: ${analysisResult.freshness}`"
        :calories="analysisResult.nutrients?.calories || 0"
        :nutrients="getNutrientKeys(analysisResult)"
        size="medium"
      />
      
      <!-- 营养成分展示 -->
      <div class="nutrition-section">
        <h4 class="section-title">营养成分</h4>
        <div class="nutrition-badges">
          <NutriBadge 
            v-for="(value, key) in analysisResult.nutrients" 
            :key="key"
            :label="key"
            :value="value"
            :unit="getUnit(key)"
          />
          <NutriBadge v-if="!analysisResult.nutrients || Object.keys(analysisResult.nutrients).length === 0" 
            label="暂无数据" value="-" />
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="result-actions">
        <van-button type="primary" round block @click="addToBasket">
          <van-icon name="plus" /> 加入菜篮子
        </van-button>
        <van-button type="default" round block @click="viewNutritionDetail">
          <van-icon name="info" /> 查看详细营养分析
        </van-button>
        <van-button type="default" round block @click="backToUpload">
          <van-icon name="camera" /> 继续识别
        </van-button>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <van-loading 
      v-if="loading" 
      class="loading-mask"
      text="正在识别..."
    />
  </div>
</template>

<script setup>
/**
 * 拍照/上传图片识别页
 * 功能：支持拍照或上传图片，调用API进行食材识别，展示营养分析结果
 */

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import AppNavbar from '@/components/AppNavbar.vue';
import VegCard from '@/components/VegCard.vue';
import NutriBadge from '@/components/NutriBadge.vue';
import { analyzeImage, addToBasket as addToBasketAPI } from '../api';

// 路由实例
const router = useRouter();

// 响应式状态
const loading = ref(false);           // 加载状态（请求中禁用按钮，显示loading）
const uploadedImage = ref(null);      // 上传的图片（base64格式）
const analysisResult = ref(null);     // 识别结果

/**
 * 返回上一页
 */
const goBack = () => {
  router.back();
};

/**
 * 获取营养成分键列表
 */
const getNutrientKeys = (result) => {
  if (!result?.nutrients) return []
  return Object.keys(result.nutrients).filter(k => result.nutrients[k] > 0).slice(0, 4)
}

/**
 * 获取营养成分单位
 */
const getUnit = (key) => {
  const units = { vitaminC: 'mg', iron: 'mg', fiber: 'g', calcium: 'mg', protein: 'g', calories: 'kcal' }
  return units[key] || ''
}

/**
 * 图片选择前的校验
 * @param {Object} file - 选择的文件对象
 * @returns {boolean} - 是否允许选择
 */
const onBeforeRead = (file) => {
  // 校验文件类型（只允许图片格式）
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    showToast({
      type: 'fail',
      message: '请选择图片格式的文件'
    });
    return false;
  }
  
  // 校验文件大小（限制10MB以内）
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    showToast({
      type: 'fail',
      message: '图片大小不能超过10MB'
    });
    return false;
  }
  
  return true;
};

/**
 * 图片选择后的回调处理
 * @param {Object} file - 选择的文件对象（包含content属性，即base64编码的图片）
 */
const onAfterRead = (file) => {
  // 将图片base64保存到状态中，用于预览
  uploadedImage.value = file.content;
  // 清除之前的识别结果
  analysisResult.value = null;
};

/**
 * 图片加载失败处理
 */
const handleImageError = () => {
  showToast({
    type: 'fail',
    message: '图片加载失败'
  });
  uploadedImage.value = null;
};

/**
 * 取消上传，重置状态
 */
const cancelUpload = () => {
  uploadedImage.value = null;
  analysisResult.value = null;
};

/**
 * 【核心功能】开始识别（调用后端 POST /api/analyze 接口）
 * 流程：
 * 1. 校验是否选择了图片
 * 2. 将base64图片转换为Blob
 * 3. 创建FormData对象
 * 4. 调用API接口
 * 5. 处理响应结果或错误
 */
const startAnalyze = async () => {
  if (!uploadedImage.value) {
    showToast({
      type: 'fail',
      message: '请先选择图片'
    });
    return;
  }
  
  try {
    loading.value = true;
    const blob = await base64ToBlob(uploadedImage.value);
    const formData = new FormData();
    formData.append('image', blob, 'food.jpg');
    
    const result = await analyzeImage(formData);
    
    if (result.data && result.data.results && result.data.results.length > 0) {
      analysisResult.value = result.data.results[0];
      if (result.data.alerts && result.data.alerts.length > 0) {
        analysisResult.value.alerts = result.data.alerts;
      }
    } else if (result.data) {
      analysisResult.value = result.data;
    } else {
      analysisResult.value = null;
      showToast({ type: 'fail', message: '未识别到食材' });
      return;
    }
    
    showToast({
      type: 'success',
      message: result.message || '识别成功'
    });
    
  } catch (error) {
    console.error('识别过程出错:', error);
    analysisResult.value = null;
  } finally {
    loading.value = false;
  }
};

/**
 * 将base64编码的图片转换为Blob对象
 * @param {string} base64String - base64编码的图片字符串（格式：data:image/xxx;base64,xxx）
 * @returns {Promise<Blob>} - Blob对象
 */
const base64ToBlob = async (base64String) => {
  // 移除base64前缀（如data:image/png;base64,）
  const base64Data = base64String.split(',')[1];
  // 解码base64数据为二进制字符串
  const byteCharacters = atob(base64Data);
  // 获取图片类型（从dataURL头部提取）
  const mimeMatch = base64String.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  
  // 将二进制字符串转换为Uint8Array
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  // 返回Blob对象
  return new Blob([byteArray], { type: mimeType });
};

/**
 * 生成食材图片URL
 * @param {string} foodName - 食材名称
 * @returns {string} - 图片URL
 */
const generateFoodImage = (foodName) => {
  const encodedName = encodeURIComponent(foodName);
  return `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20${encodedName}%20food%20on%20white%20background&image_size=square`;
};

/**
 * 将识别结果加入菜篮子
 */
const addToBasket = async () => {
  if (!analysisResult.value) {
    showToast({ type: 'fail', message: '请先识别食材' });
    return;
  }
  
  try {
    const itemData = {
      name: analysisResult.value.name,
      category: analysisResult.value.category || '蔬菜',
      quantity: 1,
      unit: '个',
      image: analysisResult.value.image || '',
      nutrients: analysisResult.value.nutrients || {}
    };
    
    await addToBasketAPI(itemData);
    
    showToast({
      type: 'success',
      message: '已加入菜篮子'
    });
    
    setTimeout(() => {
      router.push('/basket');
    }, 1500);
  } catch (error) {
    console.error('添加到菜篮子失败:', error);
    showToast({ type: 'fail', message: '添加失败，请重试' });
  }
};

/**
 * 跳转到营养分析详情页，传递识别结果数据
 */
const viewNutritionDetail = () => {
  // 将识别结果通过路由参数传递给营养分析页
  const data = encodeURIComponent(JSON.stringify(analysisResult.value));
  router.push({
    path: '/nutrition',
    query: { data }
  });
};

/**
 * 返回上传界面，继续识别
 */
const backToUpload = () => {
  uploadedImage.value = null;
  analysisResult.value = null;
};
</script>

<style lang="scss" scoped>
.recognize-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 30px;
}

/* 上传区域 */
.upload-area {
  padding: 30px 20px;
  
  :deep(.van-uploader) {
    background: #fff;
    border-radius: 20px;
    border: 2px dashed #e0e0e0;
    padding: 0;
    overflow: hidden;
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 20px;
    
    .upload-icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      
      .van-icon {
        color: #4CAF50;
      }
    }
    
    .upload-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }
    
    .upload-desc {
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }
}

/* 预览区域 */
.preview-area {
  padding: 20px;
  
  .preview-image {
    width: 100%;
    height: 320px;
    background: #f8f8f8;
    border-radius: 16px;
    margin-bottom: 20px;
  }
  
  .preview-actions {
    display: flex;
    gap: 15px;
    
    .van-button {
      flex: 1;
      height: 48px;
      font-size: 16px;
    }
  }
}

/* 识别结果区域 */
.analysis-result {
  padding: 0 20px;
  
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .result-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
  }
  
  .nutrition-section {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 20px;
    
    .section-title {
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
  
  .result-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .van-button {
      height: 50px;
      font-size: 16px;
    }
  }
}

/* 加载遮罩 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  
  :deep(.van-loading__text) {
    color: #fff;
  }
}
</style>