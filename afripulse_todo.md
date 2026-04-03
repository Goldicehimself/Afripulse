# 🚀 AfriPulse Development TODO

## ✅ MVP (Build This First)

### 🧱 Backend Setup
- [ ] Setup Node.js + Express backend
- [ ] Connect MongoDB (Atlas)
- [ ] Setup environment variables:
  - [ ] MONGO_URI
  - [ ] JWT_SECRET
  - [ ] CLOUDINARY_CONFIG

---

### 🧱 Models

#### 📌 Post Model
- [ ] title
- [ ] content
- [ ] category (news/sports/entertainment)
- [ ] image (URL)
- [ ] author
- [ ] reactions:
  - [ ] fire (Number)
  - [ ] cap (Number)
  - [ ] brain (Number)
- [ ] views (Number)
- [ ] createdAt

#### 🔐 Admin/User Model
- [ ] email
- [ ] password (hashed)
- [ ] role (admin)

---

### 🔐 Authentication
- [ ] Admin login (JWT)
- [ ] Protect routes:
  - [ ] POST /posts
  - [ ] DELETE /posts

---

### 🔌 APIs

#### 📰 Posts
- [ ] GET /posts?page=1&limit=10
- [ ] GET /posts/:id
- [ ] POST /posts (admin only)
- [ ] DELETE /posts (admin only)

#### ⚡ Reactions
- [ ] POST /posts/:id/react
  - [ ] Body:
    {
      "type": "fire" // or cap, brain
    }

---

### 🖼️ Media Handling
- [ ] Upload images (Cloudinary or similar)
- [ ] Store image URLs in database

---

## 📰 Frontend (User App)

### ⚙️ Setup
- [ ] Setup Vite + React
- [ ] Install Tailwind CSS

---

### 📄 Pages
- [ ] Homepage (Feed)
- [ ] Post Details Page

---

### 🧩 Components
- [ ] PostCard
- [ ] ReactionBar
- [ ] Loader (spinner)
- [ ] ErrorState UI

---

### ⚡ Features
- [ ] Fetch posts (paginated)
- [ ] Display posts in feed
- [ ] Click → open full post
- [ ] React to posts
- [ ] Display reaction counts
- [ ] Handle loading state
- [ ] Handle error state

---

### 🔥 Optional (Nice MVP Upgrade)
- [ ] Infinite scroll

---

## 🎯 MVP Goal
User can:
- Open app
- Scroll posts
- Click post
- React

---

## 🚀 POST-MVP (After Launch)

### ⚽ Sports Integration
- [ ] Integrate sports API
- [ ] Create endpoints:
  - [ ] /sports/live
  - [ ] /sports/fixtures
- [ ] Display live scores

---

### 💬 Comments System
- [ ] Create Comment model
- [ ] Add comment APIs
- [ ] Build comment UI

---

### 🔥 Trending System
- [ ] Track views + reactions
- [ ] Rank posts
- [ ] Display trending feed

---

### 🏆 Prediction System
- [ ] Create Prediction model
- [ ] Add prediction APIs
- [ ] Build scoring logic
- [ ] Create leaderboard UI

---

### 🔔 Notifications
- [ ] Integrate Firebase Cloud Messaging
- [ ] Send alerts (news, matches, predictions)

---

### 🧑‍🤝‍🧑 Community Features
- [ ] User profiles
- [ ] Follow system
- [ ] Groups/communities

---

### 🎬 Short-form Content
- [ ] Swipeable feed
- [ ] Short news format

---

### 🚀 Deployment
- [ ] Deploy frontend (Vercel)
- [ ] Deploy backend (Render)
- [ ] Setup environment variables

---

### 📊 Analytics
- [ ] Integrate Google Analytics
- [ ] Track DAU, engagement, retention

---

### 💰 Monetization
- [ ] Add AdSense
- [ ] Sponsored posts
- [ ] Affiliate links

---

## 🧠 Rule
If it doesn’t help users read + click + react → NOT MVP