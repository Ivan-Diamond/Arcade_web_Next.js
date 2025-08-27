# MSA ARCADE - Next.js Gaming Platform

A modern web-based arcade gaming platform built with Next.js 14, featuring real-time game controls, WebRTC streaming, and a neon-cyberpunk aesthetic.

## 🎮 Features

### Core Features
- **Authentication System**: Simple username/password authentication with session management
- **Game Lobby**: Browse and select from available arcade machines
- **Profile Management**: Track your stats, coins, and gaming history  
- **Game Rooms**: Real-time game controls with WebRTC video streaming
- **Leaderboard**: Compete with other players and track rankings
- **Virtual Currency**: Earn coins through gameplay (no real money involved)

### Design
- Neon/cyberpunk themed UI with dark backgrounds
- Responsive design for mobile and desktop
- Smooth animations with Framer Motion
- Custom neon glow effects and gradients

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios
- **UI Components**: Lucide React Icons
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
msa_arcade/
├── app/
│   ├── (auth)/          # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (main)/          # Protected pages with sidebar layout
│   │   ├── lobby/
│   │   ├── profile/
│   │   ├── games/
│   │   ├── leaderboard/
│   │   ├── room/[id]/
│   │   └── layout.tsx
│   ├── globals.css      # Global styles and Tailwind
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   ├── cards/           # Card components
│   │   └── GameMachineCard.tsx
│   └── providers/       # Context providers
│       └── Providers.tsx
├── lib/
│   ├── api/            # API configuration and services
│   │   ├── axios-config.ts
│   │   └── services/
│   │       ├── userService.ts
│   │       └── roomService.ts
│   ├── socket/         # WebSocket client
│   │   └── socket-client.ts
│   ├── stores/         # Zustand stores
│   │   ├── useAuthStore.ts
│   │   └── useGameStore.ts
│   └── types/          # TypeScript definitions
│       └── index.ts
└── public/            # Static assets
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Clone the repository
```bash
git clone https://github.com/Ivan-Diamond/Arcade_web_Next.js.git
cd msa_arcade
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory with these exact values:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# API Endpoints
NEXT_PUBLIC_API_URL=https://www.ruyuan.live/game
NEXT_PUBLIC_WS_URL=ws://206.81.25.143:59199/ws

# Development Settings
NODE_ENV=development
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 System Requirements & Setup

### Backend API
- **Production API**: `https://www.ruyuan.live/game`
- **WebSocket Server**: `ws://206.81.25.143:59199/ws` (Protobuf binary messages)
- **Authentication**: JWT tokens via `/uaa/user/login` endpoint

### WebRTC Camera Servers
The app connects to multiple camera servers:
- `206.81.25.143:1985` - Primary camera server
- `46.101.131.181:1985` - Secondary server  
- `www.xbdoll.cn:1985` - Animated machines server

### Required Browser Permissions
- **Camera/Microphone**: For WebRTC connections (even though we only receive)
- **Network Access**: Direct connections to camera servers on port 1985

## 🚀 First-Time Setup Steps

### 1. Test API Connection
```bash
# Test if backend API is accessible
curl https://www.ruyuan.live/game/app/lobby
```

### 2. Test WebRTC Camera Servers
Open the included test file in your browser:
```
file:///{project-path}/test-camera.html
```
- Enter camera URL: `rtmp://206.81.25.143:1935/live/104_0`
- Click "Test Connection" to verify WebRTC signaling works

### 3. Login Credentials
Use these test credentials:
- **Username**: `test` 
- **Password**: `test123`

Or register a new account via the `/register` page.

## 🎮 How It Works

### Authentication Flow
1. Login with username/password → Gets JWT + socketPassword
2. JWT used for API calls, socketPassword for WebSocket authentication
3. Session persisted with NextAuth

### Game Room Flow  
1. **Lobby** → Fetches machines from `/app/lobby` API
2. **Enter Room** → Connects to WebSocket + WebRTC camera stream
3. **Controls** → Sends protobuf messages via WebSocket
4. **Video** → Receives live stream via WebRTC from camera servers

### Camera System
- **camera0Url**: Front/main view of machine
- **camera1Url**: Side/alternate view  
- Switch between cameras with the camera button
- Streams connect directly to camera servers (bypasses main API)

## 🐛 Troubleshooting

### WebRTC Video Not Loading
1. **Check browser console** for WebRTC errors
2. **Test camera servers** using `test-camera.html`
3. **Network issues**: Some networks block port 1985
4. **CORS**: Use the built-in proxy `/api/webrtc/signaling` as fallback

### Authentication Issues
- Clear browser storage and cookies
- Check if `https://www.ruyuan.live/game/uaa/user/login` responds
- Verify JWT token in browser dev tools

### Connection Problems
- Ensure WebSocket connects to `ws://206.81.25.143:59199/ws`
- Check browser console for protobuf errors
- Verify socketPassword is included in session

### Development Tips
- Use browser DevTools Network tab to monitor API calls
- WebRTC connections show in console with detailed logs
- Test individual camera URLs in `test-camera.html` first

## 🎨 Design System

### Colors
- **Neon Cyan**: #00FFFF
- **Neon Pink**: #FF10F0  
- **Neon Purple**: #9D00FF
- **Neon Green**: #39FF14
- **Dark Background**: #0A0E27
- **Dark Card**: #151A3C
- **Dark Surface**: #1E2344

### Typography
- **Headers**: Orbitron font family
- **Body**: System UI with Roboto Mono for monospace

## 🎮 Game Flow

1. **Registration/Login**: Users create an account with username and password
2. **Lobby**: Browse available game machines and check queue status
3. **Join Game**: Select a machine and join the queue
4. **Play**: Use on-screen controls to play the game via WebRTC stream
5. **Earn Rewards**: Win coins based on game performance
6. **Track Progress**: View stats and rankings on profile and leaderboard

## 📱 Pages

### Public Pages
- `/` - Landing page with feature showcase
- `/login` - User login
- `/register` - New user registration

### Protected Pages (Requires Authentication)
- `/lobby` - Game machine grid
- `/profile` - User profile and stats
- `/games` - Browse and filter all games
- `/leaderboard` - Player rankings
- `/room/[id]` - Individual game room with controls

## 🔧 Configuration

### API Integration
The app expects a backend API server running on port 3001. Update the environment variables to point to your API endpoints.

### WebSocket Connection
Real-time features use Socket.io. Configure the WebSocket URL in the environment variables.

## 🚀 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

### Start Production Server
```bash
npm start
# or
yarn start
```

### Deploy to Vercel
The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

## 🔄 State Management

The app uses Zustand for state management with the following stores:

- **AuthStore**: Manages user authentication state
- **GameStore**: Handles game room and session state

## 🌐 API Services

- **UserService**: Profile, stats, and leaderboard endpoints
- **RoomService**: Game room management and queue operations

## 📝 Development Notes

### Mock Data
Currently using mock data for development. Replace with actual API calls when backend is ready.

### WebRTC Integration
WebRTC streaming is prepared but requires backend implementation for full functionality.

### Authentication
Basic auth flow is implemented. Consider adding:
- Password reset functionality
- Email verification
- Social auth providers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is proprietary software for MSA Arcade.

## 🆘 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using Next.js and TypeScript
#   A r c a d e _ w e b _ N e x t . j s  
 