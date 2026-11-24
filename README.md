# Connext (Hotspot) 📍
### A Complete Loneliness-Reducing Hotspot Discovery, Meetup, Live Navigation & Temporary Chat Platform

Connext is a full-stack, zero-cost, privacy-first web application designed to help people who experience loneliness discover opportunities to connect with others in the real physical world. Instead of endless algorithmic social media feeds, Connext focuses exclusively on local geographic discovery, scheduled meetups, built-in turn-by-turn navigation, and automatic temporary chat rooms.

---

## 🌟 Key Features

1. **Interactive Geographic Hotspot Discovery**
   - High-performance, dark sleek map powered by Leaflet and OpenStreetMap tiles.
   - Categorized hotspot markers (Cafés, Parks, College Hangouts, Libraries, Board Games, Music, Running Groups, Sports, and more).
   - Filter by type: *Public Hangout Places* vs *Scheduled Meetups*.
   - Filter by category, search text, or sort by nearest distance and upcoming meetup time.

2. **Built-in Live Navigation (Core Feature)**
   - True in-app turn-by-turn navigation using the browser's Geolocation API and real OSRM (Open Source Routing Machine) routing.
   - Live user tracking (`navigator.geolocation.watchPosition`), remaining distance counter, dynamically updated ETA, and next-turn maneuver instructions.
   - Real-time deviation detection: automatically reroutes when the user strays off the planned path.
   - Arrival detection: detects arrival within 25 meters and displays an arrival celebration card with quick access to the chat room.
   - Multiple travel modes: Driving, Walking, and Cycling.

3. **Temporary Real-Time Group Chat Rooms**
   - Instant real-time group chat powered by Socket.IO.
   - Message persistence in MongoDB while the room is active.
   - Live room participant counter, connection pulse, and expiry countdown clock.
   - Explicit retention policy: Rooms for casual hangouts auto-expire after 24 hours; scheduled meetups auto-expire after event conclusion + grace period. Stale messages are purged automatically by a background maintenance worker.

4. **Privacy, Safety & Community Moderation**
   - Location Privacy: User live GPS coordinates remain strictly local to the device during navigation and are **never** broadcast to chat rooms.
   - Public-only meetup recommendations (parks, libraries, cafes).
   - Safety reporting system (`/api/reports`) and user blocking capabilities.

5. **Zero-Cost Local Architecture (₹0 / $0 Cost)**
   - No paid API keys, credit cards, or cloud hosting required.
   - Uses local MongoDB Community Server (already running as a local Windows service or configurable in `.env`).
   - Uses free public OpenStreetMap tiles, Nominatim geocoding, and OSRM routing.

---

## 📂 Architecture and Folder Structure

```
connext/
├── client/                     # Frontend Application (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # MapView, HotspotCard, LiveNavigationModal, ChatRoomModal, Navbar, etc.
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # LandingPage, DiscoveryPage, LoginPage, SignupPage, ProfilePage, NotFoundPage
│   │   ├── services/           # api.js (Axios), socket.js (Socket.IO), mapService.js (OSRM & Leaflet)
│   │   ├── styles/             # index.css (Dark theme & Leaflet customizations)
│   │   ├── test/               # frontend.test.jsx (Vitest unit tests)
│   │   ├── App.jsx             # React Router routing & protected route wrappers
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend Application (Node.js + Express + Socket.IO + MongoDB)
│   ├── src/
│   │   ├── config/             # db.js (Mongoose connection)
│   │   ├── controllers/        # authController, hotspotController, roomController, meetupController, reportController
│   │   ├── middleware/         # auth.js (JWT & Socket auth), errorHandler.js, validate.js (Zod)
│   │   ├── models/             # User, Hotspot (GeoJSON 2dsphere), ChatRoom, Message, Report
│   │   ├── routes/             # authRoutes, hotspotRoutes, roomRoutes, meetupRoutes, mapRoutes, reportRoutes
│   │   ├── services/           # osmService.js (OSRM & Nominatim proxy with caching), cleanupService.js
│   │   ├── sockets/            # chatSocket.js (Real-time Socket.IO handler)
│   │   ├── scripts/            # seed.js (Demo seeder), seedClear.js (Safe demo data cleanup)
│   │   ├── app.js              # Express app setup with Helmet, CORS & rate limiters
│   │   └── server.js           # Server entry point & Socket.IO server initialization
│   ├── tests/                  # backend.test.js & integration.test.js (Vitest suites)
│   ├── .env                    # Local environment variables
│   ├── .env.example
│   └── package.json
│
├── .env.example                # Example configuration template
├── .gitignore
├── package.json                # Root orchestration scripts
└── README.md                   # Complete documentation
```

---

## 🛠️ Required Software on Windows

1. **Node.js LTS (v18, v20, or v22)**
   - Download from: [https://nodejs.org/](https://nodejs.org/)
   - Verify in PowerShell:
     ```powershell
     node -v
     npm -v
     ```

2. **MongoDB Community Server** (Local Database)
   - Connext runs completely locally using MongoDB Community Edition.
   - Check if MongoDB is already installed as a Windows service:
     ```powershell
     Get-Service -Name *mongo*
     ```
   - If not installed, download the free MongoDB Community Server MSI from: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - To start the Windows service if stopped:
     ```powershell
     net start MongoDB
     ```
   - **Alternative (MongoDB Atlas)**: If you prefer using cloud MongoDB, your connection string can be set in `server/.env` under `MONGODB_URI`.

---

## 🚀 Quick Start Guide (Windows PowerShell)

### Step 1: Clone or Open the Project
```powershell
cd d:\semester_5\full_stack\connext
```

### Step 2: Install All Dependencies
Run the root install script which installs dependencies across root, server, and client:
```powershell
npm run install:all
```

### Step 3: Configure Environment Variables
A pre-configured `server/.env` file is already created. You can inspect or modify it:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/connext
JWT_SECRET=connext_super_secret_jwt_key_local_dev_2026_change_in_production
CLIENT_URL=http://localhost:5173
```

### Step 4: Seed Demonstration Data
Seed realistic demo hotspots, scheduled meetups, and test accounts in the Bengaluru demo area:
```powershell
npm run seed
```

This creates 3 test accounts:
- `demo_alex@connext.test` / `DemoPassword123!`
- `demo_priya@connext.test` / `DemoPassword123!`
- `demo_sam@connext.test` / `DemoPassword123!`

*(You can also use the one-click demo login buttons on the login page!)*

### Step 5: Start Frontend and Backend Concurrently
```powershell
npm run dev
```

This will launch:
- 🌐 **Frontend**: [http://localhost:5173](http://localhost:5173)
- 🚀 **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🧪 Running Automated Tests

Connext includes automated test suites covering backend authentication, password hashing, geospatial 2dsphere indexing, room access, OSRM routing integration, and frontend components.

Run all tests from root:
```powershell
npm test
```

Or run individually:
```powershell
# Run backend & integration test suites
npm run test:server

# Run frontend React & component test suites
npm run test:client
```

---

## 🧹 Safe Reset of Demo Data

To remove only seeded demo hotspots, users, and rooms without affecting any real user-generated data:
```powershell
npm run seed:clear
```

To re-seed fresh demo data afterwards:
```powershell
npm run seed
```

---

## 🧭 Live Navigation & Browser Geolocation Usage

1. Open [http://localhost:5173/explore](http://localhost:5173/explore).
2. Click on any hotspot marker or card.
3. Click **"Get Directions / Live Nav"**.
4. The browser will prompt you: *"Allow http://localhost:5173 to access your location?"* Click **Allow**.
5. Choose your travel mode (**Driving**, **Walking**, or **Cycling**).
6. Click **"Start Live Navigation"**.
7. As you move (or when GPS coordinates update), your position marker updates on the map, the next turn step instruction counts down, remaining distance updates, and the system automatically reroutes if you stray more than 45 meters off-route.
8. Upon reaching within 25 meters of the destination, an **"You Have Arrived!"** card appears with a direct button into the temporary chat room.

> [!NOTE]
> Modern web browsers require either `localhost` or an `https://` secure context to grant geolocation access. Running locally on `http://localhost:5173` satisfies this requirement completely.

---

## 🌐 Mapping Services, Policies & Zero Cost Verification

- **Map Tiles**: [OpenStreetMap Foundation](https://operations.osmfoundation.org/policies/tiles/) (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`). Displayed with standard attribution.
- **Routing Engine**: [OSRM Public Server](https://project-osrm.org/) (`https://router.project-osrm.org/`).
- **Geocoding**: [Nominatim](https://nominatim.openstreetmap.org/).
- **Acceptable Use & Caching**: The Connext backend implements in-memory caching and compliant `User-Agent` headers (`ConnextPlatform/1.0`) to avoid spamming community servers.
- **Cost**: **₹0.00**. No API keys, credit cards, or paid subscriptions are required.
- **Internet Requirement**: Public map tiles, geocoding, and routing require an internet connection to fetch real-world road network data. The database, authentication, chat persistence, and application logic run 100% locally.

---

## 🛡️ License & Academic Project Notice

Developed as a pair-programmed college project demonstration for **Connext**. Structured cleanly for future extensions into a production mobile/web product.
