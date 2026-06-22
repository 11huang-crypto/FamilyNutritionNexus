<template>
  <div class="family-health-page">
    <van-nav-bar title="家庭健康档案" left-arrow @click-left="goBack" />
    
    <div class="form-container">
      <div class="section-header">
        <van-icon name="users" size="20" />
        <span>家庭成员信息</span>
      </div>
      
      <van-form @submit="onSubmit">
        <van-cell-group>
          <van-field 
            v-model="form.familyName" 
            label="家庭名称" 
            placeholder="请输入家庭名称"
            required
          />
          
          <van-field 
            v-model="form.peopleCount" 
            label="家庭成员数" 
            placeholder="请输入成员数量"
            type="number"
            required
          />
        </van-cell-group>

        <div class="section-header">
          <van-icon name="heart" size="20" />
          <span>健康状况</span>
        </div>
        
        <van-cell-group>
          <van-field 
            v-model="form.allergies" 
            label="过敏食物" 
            placeholder="请输入过敏食物，用逗号分隔"
          />
          
          <van-field 
            v-model="form.diseases" 
            label="慢性疾病" 
            placeholder="请输入慢性疾病，用逗号分隔"
          />
          
          <van-field 
            v-model="form.preferences" 
            label="饮食偏好" 
            placeholder="请输入饮食偏好"
          />
          
          <van-field 
            v-model="form.restrictions" 
            label="饮食禁忌" 
            placeholder="请输入饮食禁忌"
          />
        </van-cell-group>

        <div class="section-header">
          <van-icon name="user" size="20" />
          <span>成员详情</span>
        </div>
        
        <div class="member-list">
          <div 
            v-for="(member, index) in form.members" 
            :key="index" 
            class="member-item"
          >
            <div class="member-header">
              <span>成员 {{ index + 1 }}</span>
              <van-icon 
                name="delete-o" 
                size="16" 
                color="#f44336" 
                @click="removeMember(index)"
              />
            </div>
            <van-cell-group inset>
              <van-field 
                v-model="member.name" 
                label="姓名" 
                placeholder="请输入姓名"
              />
              <van-field 
                v-model="member.age" 
                label="年龄" 
                placeholder="请输入年龄"
                type="number"
              />
              <van-field 
                v-model="member.gender" 
                label="性别" 
                placeholder="请输入性别"
              />
              <van-field 
                v-model="member.allergies" 
                label="过敏史" 
                placeholder="请输入过敏史"
              />
              <van-field 
                v-model="member.dietaryNeeds" 
                label="饮食需求" 
                placeholder="请输入饮食需求"
              />
            </van-cell-group>
          </div>
        </div>
        
        <van-button type="primary" plain block @click="addMember">
          <van-icon name="plus" />
          添加家庭成员
        </van-button>

        <div class="submit-area">
          <van-button type="primary" native-type="submit" block :loading="loading">
            保存档案
          </van-button>
        </div>
      </van-form>
    </div>
    
    <van-toast id="successToast" />
  </div>
</template>

<script setup>import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
const router = useRouter();
const loading = ref(false);
const form = reactive({
 familyName: '',
 peopleCount: '',
 allergies: '',
 diseases: '',
 preferences: '',
 restrictions: '',
 members: [
 {
 name: '',
 age: '',
 gender: '',
 allergies: '',
 dietaryNeeds: ''
 }
 ]
});
const goBack = () => {
 router.back();
};
const addMember = () => {
 form.members.push({
 name: '',
 age: '',
 gender: '',
 allergies: '',
 dietaryNeeds: ''
 });
};
const removeMember = (index) => {
 if (form.members.length > 1) {
 form.members.splice(index, 1);
 }
};
const onSubmit = async () => {
 // 表单验证
 if (!form.familyName.trim()) {
 showToast({ type: 'fail', message: '请输入家庭名称' });
 return;
 }
 
 const peopleCount = parseInt(form.peopleCount);
 if (isNaN(peopleCount) || peopleCount <= 0) {
 showToast({ type: 'fail', message: '家庭成员数必须大于0' });
 return;
 }
 
 // 验证至少有一位成员信息完整
 const validMembers = form.members.filter(m => m.name.trim() && m.age);
 if (validMembers.length === 0) {
 showToast({ type: 'fail', message: '请至少填写一位成员信息' });
 return;
 }
 
 // 验证年龄是否为有效数字
 for (const member of form.members) {
 if (member.age && (isNaN(parseInt(member.age)) || parseInt(member.age) < 0)) {
 showToast({ type: 'fail', message: '年龄必须为非负整数' });
 return;
 }
 }
 
 try {
 loading.value = true;
 console.log('提交家庭健康档案:', form);
 showToast({ type: 'success', message: '档案保存成功' });
 setTimeout(() => {
 router.push('/');
 }, 1500);
 }
 catch (error) {
 console.error('保存失败:', error);
 showToast({ type: 'fail', message: '保存失败，请重试' });
 }
 finally {
 loading.value = false;
 }
};
</script>

<style lang="scss" scoped>
.family-health-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.form-container {
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: #333;
  font-weight: bold;
  font-size: 16px;
}

.member-list {
  .member-item {
    background: #fff;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    
    .member-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-weight: bold;
      color: #333;
    }
  }
}

.submit-area {
  margin-top: 20px;
  
  .van-button {
    height: 48px;
  }
}
</style>