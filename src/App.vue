<template>
  <div class="travel-site">
    <header class="site-nav">
      <button class="brand-lockup" @click="setTab('explore')">
        <span class="brand-mark">F</span>
        <span>
          <strong>Faraway</strong>
          <small>旅行内容与搭子社区</small>
        </span>
      </button>

      <nav class="nav-pills">
        <button
          v-for="item in navItems"
          :key="item.key"
          :class="{ active: activeTab === item.key }"
          @click="setTab(item.key)"
        >
          {{ item.label }}
        </button>
      </nav>

      <div class="account-actions">
        <button class="download-button compact" type="button" @click="handleAndroidDownload">
          下载安卓版
        </button>
        <template v-if="isLoggedIn">
          <button class="text-button" @click="setTab('workspace')">{{ currentUser.nickname || currentUser.id || '我的空间' }}</button>
          <button class="outline-button compact" @click="handleLogout">退出</button>
        </template>
      </div>
    </header>

    <main>
      <section class="hero" :style="{ backgroundImage: `linear-gradient(90deg, rgba(12, 35, 37, 0.78), rgba(12, 35, 37, 0.28)), url('${heroImage}')` }">
        <div class="hero-copy">
          <p class="eyebrow">{{ currentSection.eyebrow }}</p>
          <h1>{{ currentSection.title }}</h1>
          <p>{{ currentSection.description }}</p>

          <div class="travel-search">
            <span>目的地</span>
            <input v-model.trim="keyword" placeholder="搜索城市、海岛、徒步、露营..." @keyup.enter="searchExplore" />
            <button class="primary-button" @click="searchExplore">探索</button>
          </div>

          <div class="hero-stats">
            <span><strong>{{ stats.strategyCount || exploreItems.length || 12 }}</strong> 篇攻略</span>
            <span><strong>{{ stats.postCount || 8 }}</strong> 条 Vlog</span>
            <span><strong>{{ stats.favoriteCount || 0 }}</strong> 个收藏</span>
          </div>
        </div>

        <aside class="journey-card">
          <template v-if="activeTab === 'auth' || !isLoggedIn">
            <p class="eyebrow">Account</p>
            <h2>登录后发布游记、保存草稿、实时找搭子。</h2>
            <form class="stack-form" @submit.prevent="authMode === 'login' ? handleLogin() : handleRegister()">
              <div class="segmented">
                <button type="button" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">登录</button>
                <button type="button" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">注册</button>
              </div>
              <label v-if="authMode === 'register'">
                昵称
                <input v-model.trim="authForm.nickname" autocomplete="nickname" placeholder="给自己起个旅行名" />
              </label>
              <label>
                账号
                <input v-model.trim="authForm.username" autocomplete="username" placeholder="3-32 位账号" />
              </label>
              <label>
                密码
                <input v-model="authForm.password" type="password" :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'" placeholder="至少 6 位" />
              </label>
              <button class="primary-button full" type="submit">{{ authMode === 'login' ? '登录 Faraway' : '创建账号' }}</button>
            </form>
          </template>

          <template v-else>
            <p class="eyebrow">Next trip</p>
            <h2>{{ matchForm.destination || '给下一段旅程找个搭子' }}</h2>
            <p>写下目的地、日期和偏好，系统会用实时规则匹配候选人，并给出安全见面地点。</p>
            <button class="primary-button full" @click="setTab('matches')">开始找搭子</button>
          </template>
        </aside>
      </section>

      <section v-if="globalError" class="alert-card">{{ globalError }}</section>

      <section v-if="activeTab === 'explore' || activeTab === 'auth'" class="page-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Explore</p>
            <h2>灵感目的地</h2>
          </div>
          <div class="explore-tools">
            <form class="inline-search" @submit.prevent="searchExplore">
              <input v-model.trim="keyword" type="search" placeholder="搜索城市、路线、主题或帖子" />
              <button class="primary-button compact" type="submit">搜索</button>
            </form>
            <div class="filter-row">
              <button :class="{ active: exploreType === 'all' }" @click="switchExplore('all')">全部</button>
              <button :class="{ active: exploreType === 'strategy' }" @click="switchExplore('strategy')">攻略</button>
              <button :class="{ active: exploreType === 'vlog' }" @click="switchExplore('vlog')">Vlog</button>
            </div>
          </div>
        </div>

        <div class="destination-grid">
          <article
            v-for="(item, index) in spotlightItems"
            :key="`${item.contentType || item.type || 'sample'}-${item.id || index}`"
            class="destination-card"
            :class="{ clickable: canOpenContent(item) }"
            @click="openContent(item)"
          >
            <div class="destination-media">
              <video v-if="isVlog(item) && getVideoUrl(item)" :src="getVideoUrl(item)" :poster="getCover(item, index)" muted loop controls />
              <img v-else :src="getCover(item, index)" alt="" />
              <span>{{ isVlog(item) ? 'Vlog' : '攻略' }}</span>
            </div>
            <div class="destination-body">
              <small>{{ item.destination || item.location || item.region || '未知目的地' }}</small>
              <h3>{{ item.title || '未命名旅行内容' }}</h3>
              <p>{{ item.summary || item.content || item.description || '记录路线、风景和旅行里的真实体验。' }}</p>
            </div>
          </article>
        </div>

      </section>

      <section v-else-if="activeTab === 'publish'" class="page-section editor-layout">
        <form class="surface-panel stack-form" @submit.prevent="submitContent">
          <div class="panel-title">
            <p class="eyebrow">Studio</p>
            <h2>{{ editingContent ? '编辑旅行内容' : '发布新的旅程' }}</h2>
          </div>
          <div class="segmented">
            <button type="button" :disabled="editingContent" :class="{ active: editor.type === 'strategy' }" @click="editor.type = 'strategy'">图文攻略</button>
            <button type="button" :disabled="editingContent" :class="{ active: editor.type === 'vlog' }" @click="editor.type = 'vlog'">视频 Vlog</button>
          </div>
          <label>
            标题
            <input v-model.trim="editor.title" required placeholder="例如：四天三夜的大理洱海路线" />
          </label>
          <label>
            地点
            <input v-model.trim="editor.location" required placeholder="城市、景区或目的地" />
          </label>
          <label>
            正文
            <textarea v-model.trim="editor.content" required rows="8" placeholder="写下路线、预算、避坑点、拍照位置和真实体验" />
          </label>
          <label v-if="editor.type === 'strategy'">
            图片上传
            <input type="file" accept="image/*" multiple @change="handleImageFiles" />
          </label>
          <label v-else>
            视频上传
            <input type="file" accept="video/*" @change="handleVideoFile" />
          </label>
          <div class="upload-preview">
            <span v-for="image in editor.imageList" :key="image.url">{{ image.url }}</span>
            <span v-if="editor.videoUrl">{{ editor.videoUrl }}</span>
          </div>
          <div class="button-row">
            <button class="primary-button" type="submit">{{ editingContent ? '保存修改' : '正式发布' }}</button>
            <button v-if="!editingContent" class="outline-button" type="button" @click="saveDraft">存草稿</button>
            <button v-if="editingContent" class="outline-button" type="button" @click="resetEditor">取消编辑</button>
          </div>
        </form>

        <article class="preview-travel-card">
          <div class="preview-cover">
            <img v-if="editor.imageList[0]" :src="editor.imageList[0].url" alt="" />
            <video v-else-if="editor.videoUrl" :src="editor.videoUrl" controls />
            <img v-else :src="fallbackCovers[2]" alt="" />
          </div>
          <div>
            <p class="eyebrow">Live preview</p>
            <h2>{{ editor.title || '标题会显示在这里' }}</h2>
            <p>{{ editor.content || '正文预览会随着输入变化，帮助你确认发布后的旅行内容效果。' }}</p>
            <small>{{ editor.location || '目的地' }}</small>
          </div>
        </article>
      </section>

      <section v-else-if="activeTab === 'matches'" class="page-section match-layout">
        <form class="surface-panel stack-form" @submit.prevent="createRealtime">
          <div class="panel-title">
            <p class="eyebrow">Partner</p>
            <h2>实时找搭子</h2>
          </div>
          <div class="button-row">
            <button class="outline-button compact" type="button" @click="startFreshMatch">新的匹配</button>
            <button class="outline-button compact" type="button" @click="toggleMatchHistory">
              {{ showMatchHistory ? '收起记录' : '匹配记录' }}
            </button>
          </div>
          <label>
            目的地
            <input v-model.trim="matchForm.destination" required placeholder="例如：北京、上海、广州、深圳" />
          </label>
          <label>
            出发日期
            <input v-model="matchForm.travel_start_date" type="date" required />
          </label>
          <label>
            结束日期
            <input v-model="matchForm.travel_end_date" type="date" required />
          </label>
          <label>
            偏好描述
            <textarea v-model.trim="matchForm.preference_text" rows="4" placeholder="慢旅行、拍照、美食、徒步、预算..." />
          </label>
          <button class="primary-button full" type="submit">开始实时匹配</button>
        </form>

        <div class="match-board">
          <article class="surface-panel status-panel">
            <p class="eyebrow">{{ showMatchHistory ? 'History' : 'Match status' }}</p>
            <template v-if="showMatchHistory">
              <h2>找搭子记录</h2>
              <p>这里保留以往提交过的匹配，新匹配不会被旧结果挡住。</p>
              <div class="list-stack history-list">
                <article v-for="item in realtimeHistory" :key="item.request_id" class="route-row">
                  <div>
                    <strong>{{ item.destination || '未填写目的地' }}</strong>
                    <small>{{ item.travel_start_date }} 至 {{ item.travel_end_date }} / {{ formatRealtimeStatus(item) }}</small>
                  </div>
                  <p v-if="item.candidate">候选：{{ item.candidate.peer_nickname }}</p>
                  <p v-else-if="item.pair">已确认：{{ item.pair.meet_location_text }}</p>
                  <p v-else>暂无候选结果</p>
                </article>
                <p v-if="!realtimeHistory.length" class="empty-note">还没有找搭子记录。</p>
              </div>
            </template>
            <template v-else>
              <h2>{{ realtimeStatusText }}</h2>
              <p>{{ realtimeDescription }}</p>
            <div v-if="realtimeState.candidate" class="candidate-box">
              <h3>{{ realtimeState.candidate.peer_nickname }}</h3>
              <p>{{ realtimeState.candidate.match_summary }}</p>
              <small>{{ realtimeState.candidate.meeting_place_text }}</small>
              <div class="button-row">
                <button class="primary-button" @click="acceptCandidate">同意见面</button>
                <button class="outline-button" @click="rejectCandidate">暂不合适</button>
              </div>
            </div>
            <div v-if="realtimeState.pair" class="candidate-box">
              <h3>已确认见面</h3>
              <p>{{ realtimeState.pair.meet_location_text }}</p>
              <small>{{ realtimeState.pair.meet_time }}</small>
              <div class="match-rating-panel">
                <strong>这次匹配满意度</strong>
                <p v-if="realtimeState.pair.rating_submitted">已评分：{{ realtimeState.pair.my_rating }} / 5</p>
                <template v-else>
                  <div class="rating-buttons" role="group" aria-label="match rating">
                    <button
                      v-for="score in [1, 2, 3, 4, 5]"
                      :key="score"
                      type="button"
                      :class="{ active: matchRating === score }"
                      @click="matchRating = score"
                    >
                      {{ score }}
                    </button>
                  </div>
                  <textarea v-model.trim="matchRatingComment" rows="2" maxlength="200" placeholder="可选：这次搭子哪里合适或不合适" />
                  <button class="primary-button compact" :disabled="!matchRating" @click="submitMatchRating">提交评分</button>
                </template>
              </div>
            </div>
            </template>
          </article>

          <div class="list-stack" v-if="myRecruitments.length">
            <article v-for="item in myRecruitments" :key="item.id" class="route-row">
              <div>
                <strong>{{ item.destination }} / {{ item.days }} 天</strong>
                <small>{{ item.startDate }} / {{ item.status }}</small>
              </div>
              <p>申请数：{{ item.applications ? item.applications.length : 0 }}</p>
              <div v-for="app in item.applications || []" :key="app.applicationId" class="application-row">
                <span>{{ app.applicantNickname }}：{{ app.status }}</span>
                <button @click="approveApplication(item.id, app.applicationId)">通过</button>
                <button @click="rejectApplication(item.id, app.applicationId)">拒绝</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'workspace'" class="page-section workspace-layout">
        <article class="profile-hero">
          <p class="eyebrow">Profile</p>
          <h2>{{ currentUser.nickname || '未命名旅行者' }}</h2>
          <p>{{ profile.bio || '还没有个人简介，可以先发布一篇旅行攻略。' }}</p>
          <div class="hero-stats">
            <span><strong>{{ stats.strategyCount || 0 }}</strong> 攻略</span>
            <span><strong>{{ stats.postCount || 0 }}</strong> Vlog</span>
            <span><strong>{{ stats.favoriteCount || 0 }}</strong> 收藏</span>
          </div>
        </article>

        <div class="management-grid">
          <section class="surface-panel">
            <div class="panel-head">
              <h2>我的发布</h2>
              <button class="outline-button compact" @click="loadWorkspace">刷新</button>
            </div>
            <article
              v-for="item in myContent"
              :key="`${item.contentType || item.type}-${item.id}`"
              class="manage-row clickable"
              role="button"
              tabindex="0"
              @click="openContent(item)"
              @keydown.enter.prevent="openContent(item)"
              @keydown.space.prevent="openContent(item)"
            >
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ isVlog(item) ? 'Vlog' : '攻略' }} / {{ item.destination || item.location }}</small>
              </div>
              <div class="button-row">
                <button class="outline-button compact" @click.stop="editContent(item)">编辑</button>
                <button class="danger-button compact" @click.stop="deleteContent(item)">删除</button>
              </div>
            </article>
          </section>

          <section class="surface-panel">
            <div class="panel-head">
              <h2>通知</h2>
              <button class="outline-button compact" @click="markAllRead">全部已读</button>
            </div>
            <article v-for="item in notifications" :key="item.id" class="notice-row" :class="{ unread: !item.read }">
              <strong>{{ item.title }}</strong>
              <small>{{ item.type }} / {{ item.createdAt }}</small>
            </article>
          </section>

          <section class="surface-panel">
            <h2>草稿</h2>
            <article v-for="item in drafts" :key="item.id" class="notice-row">
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.draftType }} / {{ item.updatedAt }}</small>
              </div>
              <button class="danger-button compact" @click="deleteDraft(item.id)">删除</button>
            </article>
          </section>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div v-if="selectedContent" class="detail-overlay" @click.self="selectedContent = null">
        <section class="content-detail-panel" role="dialog" aria-modal="true">
          <button class="detail-close" type="button" @click="selectedContent = null">关闭</button>
          <div class="detail-cover">
            <video v-if="isVlog(selectedContent) && getVideoUrl(selectedContent)" :src="getVideoUrl(selectedContent)" :poster="getCover(selectedContent, 0)" controls />
            <img v-else :src="getCover(selectedContent, 0)" alt="" />
          </div>
          <div class="detail-body">
            <p class="eyebrow">{{ isVlog(selectedContent) ? 'Travel Vlog' : 'Travel strategy' }}</p>
            <h2>{{ selectedContent.title }}</h2>
            <small>{{ selectedContent.destination || selectedContent.location || '未知目的地' }}</small>
            <p>{{ selectedContent.content || selectedContent.summary || selectedContent.description }}</p>
            <div class="detail-meta">
              <span>{{ selectedContent.likeCount || 0 }} 赞</span>
              <span>{{ selectedContent.favoriteCount || 0 }} 收藏</span>
              <span>{{ selectedContent.viewCount || 0 }} 浏览</span>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api, clearSession, getToken, getUser, saveSession, uploadFile } from './api'

const navItems = [
  { key: 'explore', label: '探索', title: '去远方，也找到同行的人', eyebrow: 'Travel community', description: '看真实攻略和 Vlog，发布自己的旅行故事，也可以按目的地和日期找搭子。' },
  { key: 'publish', label: '发布', title: '把旅程写成一张明信片', eyebrow: 'Creator studio', description: '上传图文攻略或视频 Vlog，沉淀路线、风景、预算和避坑经验。' },
  { key: 'matches', label: '找搭子', title: '让相同路线的人先遇见', eyebrow: 'Partner matching', description: '填写行程和偏好，系统会实时匹配候选人，并生成适合见面的地点。' },
  { key: 'workspace', label: '我的', title: '整理你的旅行足迹', eyebrow: 'My Faraway', description: '管理发布内容、草稿、通知和个人数据。' }
]

const fallbackCovers = [
  '/static/cover/city-beijing.jpg',
  '/static/bg/home-hero.jpg',
  '/static/cover/city-shanghai.jpg',
  '/static/cover/city-guangzhou.jpg',
  '/static/cover/city-shenzhen.jpg',
  '/static/cover/preview-default.jpg'
]

const localCityCovers = {
  北京: '/static/cover/city-beijing.jpg',
  上海: '/static/cover/city-shanghai.jpg',
  广州: '/static/cover/city-guangzhou.jpg',
  深圳: '/static/cover/city-shenzhen.jpg'
}

const androidPackageAvailable = false

const sampleTrips = [
  { id: 'sample-1', title: '在洱海边住三晚，慢慢看日落', destination: '大理', description: '适合第一次去云南的人，路线轻松，重点是骑行、咖啡馆和海西日落。', contentType: 'strategy', coverUrl: fallbackCovers[0] },
  { id: 'sample-2', title: '川西小环线的雪山窗口期', destination: '川西', description: '把天气、路况、住宿和拍照点放在同一条路线里，适合 4-5 天出发。', contentType: 'strategy', coverUrl: fallbackCovers[3] },
  { id: 'sample-3', title: '海岛 Vlog：清晨出海和夜市', location: '万宁', description: '用一天时间记录冲浪、椰林公路、海鲜夜市和民宿露台。', type: 'vlog', coverUrl: fallbackCovers[5] }
]

const heroImage = fallbackCovers[1]
const activeTab = ref('explore')
const authMode = ref('login')
const keyword = ref('')
const exploreType = ref('all')
const globalError = ref('')
const sessionToken = ref(getToken())
const currentUser = ref(getUser() || {})
const profile = ref({})
const stats = ref({})
const exploreItems = ref([])
const selectedContent = ref(null)
const myContent = ref([])
const drafts = ref([])
const notifications = ref([])
const myRecruitments = ref([])
const realtimeState = ref({})
const realtimeHistory = ref([])
const showMatchHistory = ref(false)
const editingContent = ref(null)
const matchRating = ref(0)
const matchRatingComment = ref('')

const authForm = reactive({ username: '', password: '', nickname: '' })
const editor = reactive({
  type: 'strategy',
  title: '',
  location: '',
  content: '',
  imageList: [],
  videoUrl: '',
  coverUrl: ''
})
const matchForm = reactive({
  destination: '',
  travel_start_date: defaultDate(4),
  travel_end_date: defaultDate(7),
  preference_text: ''
})

const isLoggedIn = computed(() => !!sessionToken.value)
const currentSection = computed(() => navItems.find((item) => item.key === activeTab.value) || navItems[0])
const spotlightItems = computed(() => (exploreItems.value.length ? exploreItems.value : sampleTrips))
const realtimeDescription = computed(() => {
  if (realtimeState.value.candidate) return '已经找到候选搭子，请确认是否继续。'
  if (realtimeState.value.pair) return '双方已确认，可以准备见面。'
  if (realtimeState.value.status === 'pending') return '正在等待同目的地、时间重合的人。'
  return '填写行程偏好后开始实时匹配。'
})
const realtimeStatusText = computed(() => {
  if (realtimeState.value.candidate) return '已找到候选搭子'
  if (realtimeState.value.pair) return '双方已确认'
  if (realtimeState.value.status === 'pending') return '匹配中'
  if (realtimeState.value.active === false) return '暂无匹配'
  return '未开始'
})

function defaultDate(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function setTab(tab) {
  if (tab !== 'explore' && tab !== 'auth' && !isLoggedIn.value) {
    activeTab.value = 'auth'
    return
  }
  activeTab.value = tab
  globalError.value = ''
  if (tab === 'explore') loadExplore()
  if (tab === 'workspace') loadWorkspace()
  if (tab === 'matches') startFreshMatch()
}

function switchExplore(type) {
  exploreType.value = type
  loadExplore()
}

function searchExplore() {
  activeTab.value = 'explore'
  loadExplore()
}

function canOpenContent(item) {
  return item && item.id && !String(item.id).startsWith('sample-')
}

async function openContent(item) {
  if (!canOpenContent(item)) {
    selectedContent.value = item
    return
  }
  await run(async () => {
    selectedContent.value = isVlog(item)
      ? await api.postDetail(item.id)
      : await api.strategyDetail(item.id)
  }, '内容详情加载失败')
}

function getCover(item, index = 0) {
  const cover = item.coverUrl || item.imageList?.[0]?.url || item.rawCoverUrl || ''
  if (cover && !isSlowRemoteImage(cover)) return cover
  return localCityCovers[item.destination || item.location] || fallbackCovers[index % fallbackCovers.length]
}

function isSlowRemoteImage(url) {
  return /^https?:\/\/images\.unsplash\.com\//i.test(String(url || ''))
}

function isVlog(item) {
  return item.contentType === 'vlog' || item.type === 'vlog'
}

function getVideoUrl(item) {
  return item.mediaList?.find((entry) => entry.type === 'video')?.url || item.mediaList?.[0]?.url || ''
}

async function run(task, fallback = '操作失败') {
  globalError.value = ''
  try {
    return await task()
  } catch (error) {
    globalError.value = error?.message || fallback
    if (!getToken() && activeTab.value !== 'explore' && activeTab.value !== 'auth') activeTab.value = 'auth'
    return null
  }
}

async function handleAndroidDownload(event) {
  if (androidPackageAvailable) {
    window.location.href = '/downloads/faraway-android.apk'
    return
  }
  event.preventDefault()
  globalError.value = '安卓版安装包还没有上传到服务器，当前网页功能可以正常演示。'
}

async function handleLogin() {
  await run(async () => {
    const result = await api.passwordLogin({ username: authForm.username, password: authForm.password })
    saveSession(result.token, result.userInfo)
    sessionToken.value = result.token
    currentUser.value = result.userInfo || {}
    activeTab.value = 'explore'
    await Promise.all([loadExplore(), loadWorkspace().catch(() => {})])
  }, '登录失败')
}

async function handleRegister() {
  await run(async () => {
    await api.register({ username: authForm.username, password: authForm.password, nickname: authForm.nickname, phone: '', smsCode: '', email: '' })
    authMode.value = 'login'
    await handleLogin()
  }, '注册失败')
}

async function handleLogout() {
  try {
    await api.logout()
  } catch {
    // Token may already be expired; local logout should still complete.
  }
  clearSession()
  sessionToken.value = ''
  currentUser.value = {}
  profile.value = {}
  stats.value = {}
  activeTab.value = 'explore'
}

async function loadExplore() {
  if (!isLoggedIn.value) {
    exploreItems.value = []
    globalError.value = ''
    return
  }
  try {
    if (exploreType.value === 'strategy') {
      const result = await api.strategies({ keyword: keyword.value, pageSize: 50 })
      exploreItems.value = (result.list || []).map((item) => ({ ...item, contentType: 'strategy' }))
      selectedContent.value = null
      return
    }
    if (exploreType.value === 'vlog') {
      const result = await api.posts({ keyword: keyword.value, pageSize: 50 })
      exploreItems.value = result.list || []
      selectedContent.value = null
      return
    }
    if (keyword.value) {
      const [strategyResult, postResult] = await Promise.all([
        api.strategies({ keyword: keyword.value, pageSize: 50 }),
        api.posts({ keyword: keyword.value, pageSize: 50 })
      ])
      exploreItems.value = [
        ...(strategyResult.list || []).map((item) => ({ ...item, contentType: 'strategy' })),
        ...(postResult.list || [])
      ].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      selectedContent.value = null
      globalError.value = ''
      return
    }
    const result = await api.feed()
    exploreItems.value = result.list || []
    selectedContent.value = null
    globalError.value = ''
  } catch {
    exploreItems.value = []
  }
}

async function handleImageFiles(event) {
  const files = Array.from(event.target.files || [])
  for (const file of files) {
    const uploaded = await uploadFile(file, 'image')
    editor.imageList.push({ url: uploaded.url })
  }
  editor.coverUrl = editor.imageList[0]?.url || editor.coverUrl
}

async function handleVideoFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const uploaded = await uploadFile(file, 'video')
  editor.videoUrl = uploaded.url
}

function buildStrategyPayload(status = 'published') {
  return {
    title: editor.title,
    summary: editor.content.slice(0, 80),
    content: editor.content,
    destination: editor.location,
    days: 3,
    coverUrl: editor.coverUrl || editor.imageList[0]?.url || '',
    imageList: editor.imageList,
    tags: editor.location ? [editor.location] : [],
    status
  }
}

function buildPostPayload(status = 'published') {
  return {
    type: 'vlog',
    title: editor.title,
    location: editor.location,
    content: editor.content,
    coverUrl: editor.coverUrl,
    mediaList: editor.videoUrl ? [{ type: 'video', url: editor.videoUrl }] : [],
    tags: editor.location ? [editor.location] : [],
    status
  }
}

async function submitContent() {
  await run(async () => {
    let result
    if (editor.type === 'strategy') {
      result = editingContent.value
        ? await api.updateStrategy(editingContent.value.id, buildStrategyPayload())
        : await api.createStrategy(buildStrategyPayload())
    } else {
      result = editingContent.value
        ? await api.updatePost(editingContent.value.id, buildPostPayload())
        : await api.createPost(buildPostPayload())
    }
    resetEditor()
    activeTab.value = 'workspace'
    await loadWorkspace()
    return result
  }, '保存失败')
}

async function saveDraft() {
  await run(async () => {
    if (editor.type === 'strategy') {
      await api.createStrategyDraft({ ...buildStrategyPayload('draft'), status: 'draft' })
    } else {
      await api.createPostDraft({ ...buildPostPayload('draft'), status: 'draft' })
    }
    resetEditor()
    activeTab.value = 'workspace'
    await loadWorkspace()
  }, '草稿保存失败')
}

function editContent(item) {
  editingContent.value = item
  editor.type = isVlog(item) ? 'vlog' : 'strategy'
  editor.title = item.title || ''
  editor.location = item.destination || item.location || ''
  editor.content = item.content || ''
  editor.coverUrl = item.rawCoverUrl || item.coverUrl || ''
  editor.imageList = (item.imageList || []).map((entry) => ({ url: entry.rawUrl || entry.url || '' }))
  editor.videoUrl = getVideoUrl({ mediaList: (item.mediaList || []).map((entry) => ({ ...entry, url: entry.rawUrl || entry.url })) })
  activeTab.value = 'publish'
}

function resetEditor() {
  editingContent.value = null
  Object.assign(editor, { type: 'strategy', title: '', location: '', content: '', imageList: [], videoUrl: '', coverUrl: '' })
}

function resetMatchForm() {
  Object.assign(matchForm, {
    destination: '',
    travel_start_date: defaultDate(4),
    travel_end_date: defaultDate(7),
    preference_text: ''
  })
}

function startFreshMatch() {
  showMatchHistory.value = false
  realtimeState.value = {}
  resetMatchForm()
  loadMatchRecords().catch(() => {})
}

async function toggleMatchHistory() {
  showMatchHistory.value = !showMatchHistory.value
  if (showMatchHistory.value) {
    realtimeState.value = {}
    await loadMatchRecords()
  }
}

function formatRealtimeStatus(item) {
  if (item.candidate) return '已找到候选'
  if (item.pair) return '已确认见面'
  if (item.status === 'pending') return '匹配中'
  if (item.status === 'superseded') return '已被新匹配替换'
  if (item.status === 'failed') return '已结束'
  return item.status || '未开始'
}

async function loadWorkspace() {
  if (!isLoggedIn.value) {
    profile.value = {}
    stats.value = {}
    myContent.value = []
    drafts.value = []
    notifications.value = []
    return
  }
  await run(async () => {
    const [profileResult, statsResult, draftsResult, notificationsResult] = await Promise.all([
      api.profile(),
      api.stats(),
      api.drafts(),
      api.notifications()
    ])
    profile.value = profileResult
    stats.value = statsResult
    currentUser.value = { ...currentUser.value, ...profileResult }
    const contentResult = await api.myPosts()
    myContent.value = contentResult.list || []
    drafts.value = draftsResult.list || []
    notifications.value = notificationsResult.list || []
  }, '工作台加载失败')
}

async function deleteContent(item) {
  if (!confirm(`确认删除「${item.title}」吗？`)) return
  await run(async () => {
    if (isVlog(item)) await api.deletePost(item.id)
    else await api.deleteStrategy(item.id)
    await loadWorkspace()
  }, '删除失败')
}

async function deleteDraft(id) {
  await run(async () => {
    await api.deleteDraft(id)
    await loadWorkspace()
  }, '草稿删除失败')
}

async function markAllRead() {
  await run(async () => {
    await api.readAllNotifications()
    await loadWorkspace()
  }, '通知更新失败')
}

async function createRealtime() {
  await run(async () => {
    const payload = { ...matchForm, preference_tags: [], preference_text: matchForm.preference_text }
    showMatchHistory.value = false
    await api.createRealtime({ ...payload, replace_existing: true })
    await loadMatchData()
    await loadMatchRecords()
  }, '实时匹配创建失败')
}

async function loadMatchRecords() {
  if (!isLoggedIn.value) {
    realtimeHistory.value = []
    myRecruitments.value = []
    return
  }
  const [history, recruitments] = await Promise.all([api.realtimeHistory(), api.myRecruitments()])
  realtimeHistory.value = history.list || []
  myRecruitments.value = recruitments.list || []
}

async function loadMatchData() {
  await run(async () => {
    const state = await api.currentRealtime()
    realtimeState.value = state
  }, '找搭子数据加载失败')
}

async function acceptCandidate() {
  const id = realtimeState.value.candidate?.candidate_id
  if (!id) return
  await run(async () => {
    realtimeState.value = await api.acceptCandidate(id)
    await loadMatchData()
  }, '操作失败')
}

async function rejectCandidate() {
  const id = realtimeState.value.candidate?.candidate_id
  if (!id) return
  await run(async () => {
    await api.rejectCandidate(id)
    await loadMatchData()
  }, '操作失败')
}

async function submitMatchRating() {
  const pairId = realtimeState.value.pair?.pair_id
  if (!pairId || !matchRating.value) return
  await run(async () => {
    realtimeState.value.pair = await api.ratePair(pairId, {
      rating: matchRating.value,
      comment: matchRatingComment.value
    })
    matchRating.value = 0
    matchRatingComment.value = ''
  }, '评分提交失败')
}

async function approveApplication(recruitId, applicationId) {
  await api.approveApplication(recruitId, applicationId)
  await loadMatchData()
}

async function rejectApplication(recruitId, applicationId) {
  await api.rejectApplication(recruitId, applicationId)
  await loadMatchData()
}

onMounted(async () => {
  await loadExplore().catch(() => {})
})
</script>
