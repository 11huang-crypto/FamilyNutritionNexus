import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vant 组件库
import { Button, Image as VantImage, Uploader, Divider, Tag, Cell, CellGroup, Card, Progress, List, Stepper, Checkbox, Icon, NavBar, Popup, Dialog, Toast, Loading, Swipe, SwipeItem, Tabbar, TabbarItem, Badge, Notify, Empty, PullRefresh } from 'vant'
import 'vant/lib/index.css'

// 全局样式
import './styles/design-system.scss'

// Mock 数据（开发环境）
import './mock'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(Button)
app.use(VantImage)
app.use(Uploader)
app.use(Divider)
app.use(Tag)
app.use(Cell)
app.use(CellGroup)
app.use(Card)
app.use(Progress)
app.use(List)
app.use(Stepper)
app.use(Checkbox)
app.use(Icon)
app.use(NavBar)
app.use(Popup)
app.use(Dialog)
app.use(Toast)
app.use(Loading)
app.use(Swipe)
app.use(SwipeItem)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Badge)
app.use(Notify)
app.use(Empty)
app.use(PullRefresh)

app.mount('#app')
