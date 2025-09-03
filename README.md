# 🌍 Earth Observation System

A comprehensive Earth observation and agriculture monitoring system built with React and Node.js, featuring real-time satellite data visualization, agriculture analysis, and interactive mapping capabilities.

## 🚀 **Live Demo**

- **Frontend**: [https://earth-observation-system-ygrk.vercel.app/earth](https://earth-observation-system-ygrk.vercel.app/earth)
- **Backend API**: [https://earth-observationsystem.onrender.com](https://earth-observationsystem.onrender.com)

## 🌟 **Features**

- **🛰️ Real-time Earth Observation**: Interactive 3D globe with satellite data visualization
- **🌾 Agriculture Monitoring**: Advanced agriculture sector analysis with cloud data integration
- **🗺️ Interactive Maps**: Multiple mapping solutions with Leaflet and Mapbox integration
- **📊 Data Analytics**: Comprehensive data extraction and analysis tools
- **👤 User Authentication**: Secure login/register with OTP verification
- **☁️ Cloud Integration**: Google Cloud Platform integration for data storage and processing
- **📧 Email Services**: Automated notifications and communications

## 🛠️ **Tech Stack**

### Frontend
- **React 18** - Modern UI library with hooks and context
- **Three.js & React Three Fiber** - 3D graphics and globe visualization
- **Leaflet & React-Leaflet** - Interactive mapping
- **Mapbox GL** - Advanced mapping and geospatial visualization
- **Framer Motion** - Smooth animations and transitions
- **Axios** - API communication
- **React Router DOM** - Client-side routing

### Backend
- **Node.js & Express** - Server-side runtime and framework
- **JWT Authentication** - Secure token-based authentication
- **Nodemailer** - Email service integration
- **Google Cloud Storage** - Cloud data storage and retrieval
- **RESTful APIs** - Standard API architecture

## 📦 **Installation & Setup**

### Prerequisites
- Node.js (v22.x)
- npm (v10.x)
- Mapbox Account (for mapping features)
- Google Cloud Platform Account (for data services)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/VasanthiYarroju/Earth_Observation_System.git
   cd Earth_Observation_System
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Configuration**
   
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```properties
   # Mapbox Token for map visualization
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
   
   # Backend API URL (for local development)
   REACT_APP_API_BASE_URL=http://localhost:8080
   ```

4. **Start the development servers**
   
   ```bash
   # Start frontend (React)
   npm run dev:client
   
   # In a new terminal, start backend (Express)
   npm start
   ```

5. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8080](http://localhost:8080)

## 🚀 **Deployment**

### Frontend (Vercel)
The frontend is deployed on Vercel with automatic deployments from the main branch.

**Environment Variables on Vercel:**
- `REACT_APP_MAPBOX_TOKEN`: Your Mapbox access token
- `REACT_APP_API_BASE_URL`: Your deployed backend URL

### Backend (Render)
The backend is deployed on Render with automatic deployments.

**Environment Variables on Render:**
- Database configurations
- API keys and secrets
- Email service credentials

## 📁 **Project Structure**

```
etr-clean/
├── public/                 # Static assets
│   ├── images/            # Application images and icons
│   └── models/            # 3D models for globe visualization
├── src/
│   ├── components/        # React components
│   │   ├── AgricultureCloudData.jsx
│   │   ├── EarthMap.jsx
│   │   ├── EOSAgricultureMap.jsx
│   │   └── ...
│   ├── pages/             # Page components
│   │   ├── Earth.jsx
│   │   ├── FlightsPage.jsx
│   │   ├── Home.jsx
│   │   └── ...
│   ├── services/          # API and external service integrations
│   │   ├── api.js
│   │   ├── agricultureDataExtractor.js
│   │   └── ...
│   ├── context/           # React context providers
│   └── utils/             # Utility functions
├── server/                # Backend Express server
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── config/           # Configuration files
│   └── server.js         # Main server file
├── .env.example          # Environment variables template
├── vercel.json           # Vercel deployment configuration
└── package.json          # Project dependencies and scripts
```

## 🔧 **Available Scripts**

### Frontend Development
- `npm run dev:client` - Start React development server
- `npm run build:client` - Build React app for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (irreversible)

### Backend Development
- `npm start` - Start Express server (production)
- `npm run dev` - Start Express server with nodemon (development)

### Full Stack
- `npm run build` - Build frontend and install backend dependencies
- `npm run heroku-postbuild` - Build script for deployment platforms

## 🌍 **Key Components**

### Earth Visualization
- **BasicEarthView**: Simple 3D Earth representation
- **EarthMap**: Interactive Earth with satellite overlay
- **GlobalAgricultureMap**: Agriculture-focused Earth visualization

### Agriculture Monitoring
- **AgricultureCloudData**: Cloud-based agriculture data integration
- **EOSAgricultureMap**: Enhanced agriculture monitoring system
- **RealDataAgricultureMap**: Real-time agriculture data visualization

### Mapping Solutions
- **LeafletMap**: OpenStreetMap-based interactive maps
- **MapWrapper**: Unified mapping interface
- **StaticEarthMap**: Static Earth visualization component

## 🔒 **Authentication & Security**

- JWT-based authentication system
- OTP verification for secure registration
- Protected routes with authentication middleware
- Secure API endpoints with token validation

## 🌐 **API Integration**

### External Services
- **Mapbox API**: Advanced mapping and geocoding
- **Google Cloud Platform**: Data storage and processing
- **Email Services**: SMTP integration for notifications

### Internal APIs
- Authentication endpoints (`/api/auth/*`)
- User management (`/api/user/*`)
- Agriculture data (`/api/agriculture/*`)
- Real coordinates service (`/api/real-coordinates/*`)

## 📊 **Data Sources**

- Satellite imagery and observation data
- Agriculture sector information
- Real-time coordinate data
- Cloud-based storage systems

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Vasanthi Yarroju**
- GitHub: [@VasanthiYarroju](https://github.com/VasanthiYarroju)
- Repository: [Earth_Observation_System](https://github.com/VasanthiYarroju/Earth_Observation_System)

## 🙏 **Acknowledgments**

- React team for the amazing framework
- Three.js community for 3D visualization tools
- Mapbox for geospatial services
- Google Cloud Platform for data infrastructure
- Open source contributors and the developer community

---

**📧 For support or questions, please open an issue on GitHub.**
