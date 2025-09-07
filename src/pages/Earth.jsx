import { useRef , Suspense} from 'react';
import { Canvas, useLoader,useFrame } from '@react-three/fiber';
import { Stars, OrbitControls, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useEffect,useContext} from 'react';
import React from 'react';
import { animate, motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import SignupModal from './SignupModal'; // Keep SignupModal for general signup flow
import LoginModal from './LoginModal'; // Import the dedicated LoginModal
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthContext } from '../context/AuthContext';
import Airplane from '../components/Airplane';
import EarthMap from '../components/EarthMap';

// Removed the unused 'function Earth()' component from here.
// It was not being rendered and contained redundant login/logout display logic.

// Animation variants (kept as they might be used by other parts if uncommented)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const fadeInUp = {
  hidden: { y: 60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {  
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeInOut"
    }
  }
};


function StaticGalaxy() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <Stars
        radius={50}
        depth={60}
        count={500}
        factor={4}
        fade
        saturation={0}
      />
    </>
  );
}


const domains = [
  {
    name: "Atmosphere",
    type: "EARTH SCIENCE",
    description: "Study of Earth's atmospheric layers, composition, and phenomena including weather patterns.",
  },
  {
    name: "Biosphere",
    type: "LIFE SYSTEMS",
    description: "Monitoring of Earth's living organisms, ecosystems, and biodiversity across environments.",
  },
  {
    name: "Climate Indicators",
    type: "ENVIRONMENT",
    description: "Tracking key metrics that reveal climate trends and environmental changes.",
  },
  {
    name: "Cryosphere",
    type: "EARTH SCIENCE",
    description: "Observation of Earth's frozen components including glaciers, ice sheets, and permafrost.",
  },
  {
    name: "Human Dimensions",
    type: "SOCIAL SCIENCE",
    description: "Analysis of human-environment interactions and socioeconomic impacts.",
  },
  {
    name: "Land Surface",
    type: "EARTH SCIENCE",
    description: "Mapping of terrestrial features including topography and geological formations.",
  },
  {
    name: "Oceans",
    type: "MARINE SCIENCE",
    description: "Comprehensive monitoring of ocean dynamics and marine ecosystems.",
  },
  {
    name: "Solid Earth",
    type: "GEOSCIENCE",
    description: "Study of Earth's crust and interior processes including tectonic movements.",
  },
  {
    name: "Terrestrial Hydrosphere",
    type: "WATER SYSTEMS",
    description: "Tracking freshwater systems including rivers, lakes, and groundwater resources.",
  }
];

function DomainCard({ domain, index }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Animation variants
  const cardVariants = {
    hidden: { 
      y: 50,
      opacity: 0,
      scale: 0.95
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 10,
        duration: 0.5
      }
    }
  };

  // Button hover animation variants
  const buttonVariants = {
    rest: { 
      background: 'transparent',
      color: '#4fc3f7',
      borderColor: '#4fc3f7'
    },
    hover: {
      background: '#4fc3f7',
      color: 'white',
      borderColor: '#4fc3f7',
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={cardVariants}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          padding: '20px',
          borderLeft: '4px solid #4fc3f7',
          backdropFilter: 'blur(10px)',
          height: '75%',
          display: 'flex',
          flexDirection: 'column',
          willChange: 'transform, opacity'
        }}
        whileHover={{
          y: -5,
          boxShadow: '0 10px 25px rgba(79, 195, 247, 0.3)',
          transition: { duration: 0.3 }
        }}
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '1.8rem',
            marginBottom: '12px',
            color: '#4fc3f7'
          }}
        >
          {domain.icon}
        </motion.div>
        
        <motion.h3 
          initial={{ x: -10 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            fontSize: '1.3rem',
            marginBottom: '8px',
            color: 'white'
          }}
        >
          {domain.name}
        </motion.h3>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: '#255b91ff',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {domain.type}
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            fontSize: '0.95rem',
            lineHeight: '1.5',
            color: 'rgba(255, 255, 255, 0.8)',
            flexGrow: 1,
            marginBottom: '16px'
          }}
        >
          {domain.description}
        </motion.p>
        
          <motion.button
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '2px solid #4fc3f7',
            borderRadius: '4px',
            color: '#4fc3f7',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem',
            alignSelf: 'flex-start'
          }}
        >
          Explore
        </motion.button>
      </motion.div>
      {isModalOpen && (
        <SignupModal 
          onClose={() => setIsModalOpen(false)}
          domain={domain} // Pass domain data if needed
        />
      )}
    </>
  );
}
function DomainsSection() {
  return (
    <section id="domains" style={{
      padding: '80px 8%',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, rgba(37, 91, 145, 0.2) 0%, rgba(2, 12, 27, 1) 70%)',
    }}>
      <h2 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        textAlign: 'center',
        color: '#4fc3f7'
      }}>
        Earth Observation Domains
      </h2>
      <p style={{
        fontSize: '1.1rem',
        marginBottom: '3rem',
        lineHeight: '1.6',
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        Explore the key domains of Earth observation that help us understand and monitor our planet's complex systems.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {domains.map((domain, index) => (
          <DomainCard key={index} domain={domain} />
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const imagePath = "/images/features.png";

  return (
    <section id="features" style={{
      padding: '80px 8%',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at center, rgba(37, 91, 145, 0.2) 0%, 
          rgba(2, 12, 27, 1) 70%
        `,
        zIndex: -3
      }}></div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          radial-gradient(white 1px, transparent 1px),
          radial-gradient(white 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        backgroundPosition: '0 0, 25px 25px',
        opacity: 0.1,
        zIndex: -2
      }}></div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: -1
      }}></div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '60px',
          alignItems: 'center'
        }}>
          <div style={{ order: 1 }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: '#4fc3f7',
              textAlign: 'center'
            }}>
              Advanced Earth Monitoring ✈️
            </h2>
            
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '3rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
At ETRx, we've streamlined Earth observation to its most efficient form—deploying our advanced sensor pods on aircraft to capture critical environmental data with unmatched speed and precision. While the concept is elegantly simple—connecting our devices to aircraft and collecting targeted data—the real power lies in our proprietary technology stack that transforms raw measurements into actionable intelligence.            </p>

            <div style={{
              marginBottom: '60px',
              padding: '30px',
              background: 'rgba(37, 91, 145, 0.15)',
              borderRadius: '8px',
              borderLeft: '4px solid #4fc3f7'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: 'white'
              }}>
                Cross-Platform Earth Monitoring
              </h3>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0'
              }}>
                Seamless environmental data access across all devices. Whether you're in the field or at mission control, 
                access real-time Earth observation data from any web browser with our optimized delivery systems.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '20px',
              marginTop: '40px',
              flexWrap: 'wrap'
            }}>
              {[
                {
                  title: "Resolution",
                  items: [
                    { label: "Optical:", value: "0.3 m" },
                    { label: "Infrared:", value: "0.5 m" }
                  ]
                },
                {
                  title: "Spectral Bands",
                  items: [
                    { label: "Visible:", value: "8 bands" },
                    { label: "Non-visible:", value: "12 bands" }
                  ]
                },
                {
                  title: "Coverage",
                  items: [
                    { label: "Daily:", value: "500,000 km²" },
                    { label: "Response time:", value: "4 hours" }
                  ]
                }
              ].map((feature, index) => (
                <div key={index} style={{
                  padding: '15px',
                  background: 'rgba(37, 91, 145, 0.1)',
                  borderRadius: '8px',
                  borderTop: '2px solid #4fc3f7',
                  flex: '1',
                  minWidth: '200px'
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginBottom: '0.8rem',
                    color: 'white'
                  }}>{feature.title}</h4>
                  <div style={{ marginBottom: '10px' }}>
                    {feature.items.map((item, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '5px'
                      }}>
                        <span style={{ 
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.8)' 
                        }}>{item.label}</span>
                        <span style={{ 
                          fontSize: '0.85rem',
                          color: 'white', 
                          fontWeight: 'bold' 
                        }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            position: 'relative',
            height: '400px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
            order: 2,
            background: 'rgba(37, 91, 145, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            <img
              src={imagePath}
              alt="Earth Observation Features"
              style={{
                width: '90%',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 20px rgba(79, 195, 247, 0.3))'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '15px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              color: 'white',
              fontSize: '0.7rem',
              textAlign: 'center'
            }}>
              ETRx Earth Observation System
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MoreDataSection() {
  return (
    <section id="more-data" style={{
      padding: '80px 8%',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at center, rgba(37, 91, 145, 0.2) 0%, 
          rgba(2, 12, 27, 1) 70%
        `,
        zIndex: -3
      }}></div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          radial-gradient(white 1px, transparent 1px),
          radial-gradient(white 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        backgroundPosition: '0 0, 25px 25px',
        opacity: 0.1,
        zIndex: -2
      }}></div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: -1
      }}></div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: '#4fc3f7'
          }}>
            More Data We've Collected 📈
          </h2>
          
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '1rem',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Our Earth observation project has gathered petabytes of environmental data across multiple continents,
            providing unprecedented insights into climate patterns, urban development, and natural ecosystems.
          </p>
          
          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Below are some highlights from our extensive dataset collection over the past 3 years of operation.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {[
            {
              title: "Climate Patterns",
              icon: "🌡️",
              description: "Temperature anomaly tracking across 120 locations with 0.1°C precision",
              stats: [
                { label: "Data Points", value: "4.2M" },
                { label: "Coverage", value: "Global" }
              ]
            },
            {
              title: "Urban Development",
              icon: "🏙️",
              description: "High-resolution mapping of 45 major metropolitan areas",
              stats: [
                { label: "Cities Tracked", value: "45" },
                { label: "Resolution", value: "0.5m" }
              ]
            },
            {
              title: "Forest Coverage",
              icon: "🌲",
              description: "Annual deforestation monitoring with 95% accuracy",
              stats: [
                { label: "Forests Monitored", value: "320" },
                { label: "Change Detected", value: "12.7%" }
              ]
            }
          ].map((card, index) => (
            <div key={index} style={{
              padding: '30px',
              background: 'rgba(37, 91, 145, 0.15)',
              borderRadius: '12px',
              borderTop: '4px solid #4fc3f7',
              transition: 'transform 0.3s ease',
              ':hover': {
                transform: 'translateY(-10px)'
              }
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '20px'
              }}>
                {card.icon}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '15px',
                color: 'white'
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '25px'
              }}>
                {card.description}
              </p>
              <div style={{
                display: 'flex',
                gap: '20px'
              }}>
                {card.stats.map((stat, i) => (
                  <div key={i}>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '5px'
                    }}>
                      {stat.label}
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#4fc3f7'
                    }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: 'white'
            }}>
              Data Collection Methodology
            </h3>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '20px'
            }}>
              Our proprietary sensor arrays combine multispectral imaging with LiDAR technology,
              capturing data across 20 spectral bands at resolutions previously only available
              from government satellites.
            </p>
            <ul style={{
              listStyleType: 'none',
              paddingLeft: '0',
              marginBottom: '30px'
            }}>
              {[
                "Automated quality control algorithms",
                "Real-time atmospheric correction",
                "Cross-sensor calibration",
                "Machine learning validation"
              ].map((item, i) => (
                <li key={i} style={{
                  marginBottom: '10px',
                  position: 'relative',
                  paddingLeft: '25px'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: '#4fc3f7'
                  }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{
            background: 'rgba(37, 91, 145, 0.2)',
            borderRadius: '12px',
            padding: '30px',
            border: '1px solid rgba(79, 195, 247, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: 'white'
            }}>
              Research Applications
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {[
                "Climate Modeling",
                "Disaster Response",
                "Agricultural Planning",
                "Urban Heat Islands",
                "Water Resources",
                "Biodiversity"
              ].map((app, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4fc3f7',
                    marginRight: '10px'
                  }}></div>
                  <span>{app}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LatestNewsScroller() {
  const newsItems = [
    {
      id: 1,
      title: "Atmospheric Breakthrough: New Data Shows Significant Improvement",
      description: "Our latest atmospheric scans reveal a 12% improvement in air quality across European urban centers compared to last year. The data correlates with recent policy changes in industrial emissions.",
      timestamp: "2 hours ago",
      icon: "🌫️",
      details: "The ETRx-3000 sensors captured unprecedented detail in particulate matter distribution, enabling more accurate pollution modeling. Preliminary findings suggest the improvements are most notable in Northern Italy and Western Germany.",
      status: "Trending"
    },
    {
      id: 2,
      title: "Pacific Ocean Temperature Anomaly Detected",
      description: "Our marine monitoring network has identified a 0.5°C increase in sea surface temperatures across the central Pacific region, exceeding seasonal averages.",
      timestamp: "5 hours ago",
      icon: "🌊",
      details: "The temperature spike appears concentrated in an area spanning 200,000 square kilometers. Early analysis suggests this may be related to changing wind patterns and reduced upwelling.",
      status: "Critical"
    },
    {
      id: 3,
      title: "Amazon Deforestation Rate Shows Promising Decline",
      description: "Latest forest coverage analysis indicates a 2.3% reduction in deforestation rates compared to the same period last year.",
      timestamp: "8 hours ago",
      icon: "🌳",
      details: "High-resolution scans show particular improvement in protected areas of Brazil. However, new hotspots have emerged in previously unaffected regions that require monitoring.",
      status: "Improving"
    },
    {
      id: 4,
      title: "Antarctic Glacier Movement Accelerating",
      description: "Pine Island Glacier now moving at 4.5 km/year, a 15% increase from our last measurement cycle.",
      timestamp: "12 hours ago",
      icon: "❄️",
      details: "The acceleration appears linked to warmer ocean currents beneath the ice shelf. Our thermal imaging reveals new fracture patterns developing in the ice structure.",
      status: "Accelerating"
    },
    {
      id: 5,
      title: "Urban Heat Island Effect Reaches Record Levels",
      description: "New York City shows 3.2°C higher temperatures than surrounding rural areas during the latest heat wave.",
      timestamp: "1 day ago",
      icon: "🏙️",
      details: "The temperature differential has increased by 0.8°C compared to similar weather conditions five years ago. Nighttime cooling is particularly affected, with minimum temperatures 4.1°C warmer.",
      status: "Record High"
    },
    {
      id: 6,
      title: "Coral Bleaching Event Detected in Great Barrier Reef",
      description: "Early warning systems have detected the beginning of a significant bleaching event across northern sectors.",
      timestamp: "1 day ago",
      icon: "🐠",
      details: "Our hyperspectral imaging shows 23% of monitored colonies exhibiting early signs of stress. Water temperatures in the region are 1.8°C above seasonal norms.",
      status: "Developing"
    }
  ];

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateNews = (direction) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    
    setCurrentNewsIndex(prev => {
      if (direction === 'next') {
        return prev === newsItems.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? newsItems.length - 1 : prev - 1;
      }
    });

    setTimeout(() => {
      setIsTransitioning(false);
      setTimeout(() => setIsAutoPlaying(true), 10000);
    }, 500);
  };

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setIsTransitioning(true);
        setCurrentNewsIndex(prev => (prev === newsItems.length - 1 ? 0 : prev + 1));
        setTimeout(() => setIsTransitioning(false), 500);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, newsItems.length]);

  const currentNews = newsItems[currentNewsIndex];

  return (
    <section style={{
      padding: '80px 0',
      background: 'rgba(0, 0, 0, 0.85)',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid rgba(37, 91, 145, 0.3)',
      borderBottom: '1px solid rgba(37, 91, 145, 0.3)'
    }}>
      <h2 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginBottom: '3rem',
        textAlign: 'center',
        color: '#4fc3f7',
        textTransform: 'uppercase',
        letterSpacing: '3px'
      }}>
        Latest Earth Observations 🌎
      </h2>
      
      <div style={{
        width: '100vw',
        padding: '40px 0',
        marginLeft: 'calc(-50vw + 50%)',
        position: 'relative'
      }}>
        <button 
          onClick={() => navigateNews('prev')}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(37, 91, 145, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            color: 'white',
            fontSize: '28px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            opacity: isTransitioning ? 0.5 : 1
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(37, 91, 145, 0.9)'}
          onMouseLeave={e => e.target.style.background = 'rgba(37, 91, 145, 0.7)'}
          disabled={isTransitioning}
        >
          &lt;
        </button>

        <div style={{
          width: '90%',
          maxWidth: '1400px',
          margin: '0 auto',
          background: 'rgba(37, 91, 145, 0.15)',
          borderRadius: '12px',
          padding: '40px',
          borderLeft: '6px solid #4fc3f7',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.5s ease',
          opacity: isTransitioning ? 0.7 : 1,
          transform: isTransitioning ? 'scale(0.98)' : 'scale(1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '3.5rem',
              marginRight: '30px',
              flexShrink: 0
            }}>
              {currentNews.icon}
            </div>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginRight: '20px'
                }}>
                  {currentNews.title}
                </h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: '#4fc3f7',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {currentNews.status}
                </span>
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#4fc3f7',
                fontWeight: 'bold',
                marginBottom: '15px'
              }}>
                {currentNews.timestamp}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px'
          }}>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '20px'
            }}>
              {currentNews.description}
            </p>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
              borderLeft: '2px solid #4fc3f7',
              paddingLeft: '20px'
            }}>
              {currentNews.details}
            </p>
          </div>

          <div style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              {newsItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentNewsIndex(index);
                    setTimeout(() => setIsAutoPlaying(true), 10000);
                  }}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: index === currentNewsIndex ? '#255b91ff' : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Observation ID: ETR-{currentNews.id.toString().padStart(4, '0')}-2023
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigateNews('next')}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(37, 91, 145, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            color: 'white',
            fontSize: '28px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            opacity: isTransitioning ? 0.5 : 1
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(37, 91, 145, 0.9)'}
          onMouseLeave={e => e.target.style.background = 'rgba(37, 91, 145, 0.7)'}
          disabled={isTransitioning}
        >
          &gt;
        </button>
      </div>
    </section>
  );
}

// Loader for 3D objects
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: 'white', fontSize: '14px' }}>
        Loading {progress.toFixed(2)}%
      </div>
    </Html>
  );
}

function HeroSection({ onGetStarted }) {
  const { isAuthenticated } = useContext(AuthContext); // Only need isAuthenticated here for redirection logic
  const navigate = useNavigate();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Effect to redirect to /home if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('HeroSection: User is authenticated, navigating to /home.');
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: "'Arial', sans-serif",
      backgroundImage: 'url(/images/earth1.jpg)',
      backgroundColor: 'black',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',

    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
      }}>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <img
            src="/AWSC_LOGO.png"
            alt="Company Logo"
            style={{ height: '50px', width: 'auto' }}
          />
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0 10px rgba(255,255,255,0.5)',
          }}>
            PROJECT ETRx - AEROVISION
          </span>
        </motion.div>

        {/* Only show Login button if NOT authenticated. 
            If authenticated, the useEffect above will redirect the user. */}
        {!isAuthenticated && (
          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLoginModal(true)}
            style={{
              padding: '0.8rem 2rem',
              background: 'rgba(37, 91, 145, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              right: '100px',
              position: 'absolute',
            }}
          >
            Login
          </motion.button>
        )}
      </div>

      {/* 3D Canvas for Airplane */}
      <Canvas camera={{ scale: [10,10,10], position: [0, 2, 10], fov: 50 }}>
        <ambientLight intensity={1.5} />
        
        <directionalLight position={[10, 10, 10]} intensity={2} />

        <Suspense fallback={<Loader />}>
          <Airplane />
        </Suspense>
        <OrbitControls enableZoom={false} />
        
      </Canvas>

      {/* Text overlay */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '1200px',
        textAlign: 'center',
        color: 'white',
        zIndex: 100,
        padding: '0 2rem',
      }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: '3rem',
            margin: '0 0 1rem 0',
            textShadow: '0 0 10px rgba(0,0,0,0.7)',
            color: '#4fc3f7'
          }}
        >
          Project ETRx - AeroVision
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{
            fontSize: '1.2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
            textShadow: '0 0 5px rgba(0,0,0,0.5)',
          }}
        >
          "Advanced aircraft-mounted Earth observation systems delivering satellite-grade data with operational efficiency."
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          // If authenticated, go to /home (dashboard). Otherwise, trigger scroll.
          onClick={isAuthenticated ? () => navigate('/home') : onGetStarted}
          style={{
            padding: '1rem 2.5rem',
            background: 'rgba(37, 91, 145, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          }}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Begin Exploration'}
        </motion.button>
      </div>

      {/* Login Modal (uses the imported LoginModal component) */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          showSignup={() => {
            setShowLoginModal(false);
            setShowSignupModal(true);
          }}
        />
      )}
      {/* Signup Modal (still uses SignupModal component) */}
      {showSignupModal && (
        <SignupModal 
          onClose={() => {
            setShowSignupModal(false);
          }}
          showLogin={() => {
            setShowSignupModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}


function TeamSection() {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const teamMembers = [
    {
      name: "Jose Isaac Christy B",
      role: "Founder & CEO",
      title: "Mechanical & Aeronautical Engineer | Astropreneur",
      icon: "🚀",
      description: "Jose is the visionary behind Away Space Covenant (AwSc) and the driving force of AeroVision. With advanced studies in Aeronautical Engineering and Space Entrepreneurship, plus hands-on projects in Earth Observation, satellites, and propulsion design, he combines engineering mastery with entrepreneurial leadership.",
      specialties: ["Aeronautical Engineering", "Space Systems", "Mission Planning", "Strategic Leadership"],
      philosophy: "Honoring Excellence, Inspiring a New Era of Greatness",
      gradient: "linear-gradient(135deg, rgba(79, 195, 247, 0.2) 0%, rgba(37, 91, 145, 0.2) 100%)"
    },
    {
      name: "Esther Maina",
      role: "Geospatial Technology Lead",
      title: "Geospatial Developer | Remote Sensing Expert | Space Advocate",
      icon: "🌐",
      description: "Esther is a Geospatial Engineer at the Kenya Space Agency, where she leads national projects in agriculture, disaster risk reduction, and environmental monitoring using Earth Observation. An IAF Launchpad and Space4Women mentee, she is passionate about empowering communities through data.",
      specialties: ["Remote Sensing", "GIS Systems", "Environmental Monitoring", "Data Analytics"],
      philosophy: "Empowering communities through geospatial intelligence",
      gradient: "linear-gradient(135deg, rgba(147, 197, 114, 0.2) 0%, rgba(37, 91, 145, 0.2) 100%)"
    },
    {
      name: "Muhammad Faraz",
      role: "Strategic Operations Director",
      title: "Management Engineer | Strategist | Space Entrepreneur",
      icon: "🌌",
      description: "Faraz blends engineering, management, and entrepreneurial insight. Currently at Marposs and pursuing studies in Management Engineering and Space Entrepreneurship, he has held global leadership roles at Junior Enterprises and is recognized as an Aspire Leaders Finalist and Aurora Fellow.",
      specialties: ["Strategic Planning", "Operations Management", "Business Development", "Team Leadership"],
      philosophy: "Excellence at the intersection of technology and strategy",
      gradient: "linear-gradient(135deg, rgba(255, 159, 67, 0.2) 0%, rgba(37, 91, 145, 0.2) 100%)"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        when: "beforeChildren"
      }
    }
  };

  const cardVariants = {
    hidden: { 
      y: 100, 
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.8
      }
    }
  };

  return (
    <section id="team" style={{
      padding: '120px 8%',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at center, rgba(37, 91, 145, 0.2) 0%, rgba(2, 12, 27, 1) 70%)'
    }}>
      {/* Enhanced Background Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(79, 195, 247, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 197, 114, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(255, 159, 67, 0.1) 0%, transparent 50%)
        `,
        zIndex: -3
      }}></div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          radial-gradient(white 1px, transparent 1px),
          radial-gradient(white 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        backgroundPosition: '0 0, 30px 30px',
        opacity: 0.05,
        zIndex: -2
      }}></div>

      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={containerVariants}
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Enhanced Header Section */}
        <motion.div
          variants={cardVariants}
          style={{
            textAlign: 'center',
            marginBottom: '80px'
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{
              margin: '40px auto 60px',
              maxWidth: '700px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              border: '3px solid rgba(79, 195, 247, 0.4)',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(79, 195, 247, 0.1), rgba(147, 197, 114, 0.1))',
              zIndex: 1
            }}></div>
            <img
              src="/images/etr_pic.jpg"
              alt="Project ETRx - AeroVision"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                position: 'relative',
                zIndex: 2
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              color: 'white',
              padding: '20px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textAlign: 'center',
              zIndex: 3
            }}>
              Project ETRx - AeroVision Mission Platform
            </div>
          </motion.div>

          <motion.h2
            variants={cardVariants}
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: '800',
              marginBottom: '30px',
              background: 'linear-gradient(135deg, #4fc3f7 0%, #93c572 50%, #ff9f43 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              letterSpacing: '2px'
            }}
          >
            🌍 Meet Our Visionary Team
          </motion.h2>
          
          <motion.p
            variants={cardVariants}
            style={{
              fontSize: '1.3rem',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '1000px',
              margin: '0 auto',
              fontWeight: '300'
            }}
          >
            At ETRx – EO: AeroVision Project, we are a global consortium of dreamers, engineers, and innovators 
            united by an unwavering commitment to harness Earth Observation and space technology for a 
            sustainable and inspiring future.
          </motion.p>
        </motion.div>

        {/* Enhanced Team Members Grid */}
        <motion.div
          variants={containerVariants}
          style={{
            marginBottom: '80px'
          }}
        >
          <motion.h3
            variants={cardVariants}
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 'bold',
              marginBottom: '60px',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            Our Leadership Excellence
            <div style={{
              width: '100px',
              height: '4px',
              background: 'linear-gradient(90deg, #4fc3f7, #93c572)',
              margin: '20px auto',
              borderRadius: '2px'
            }}></div>
          </motion.h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '40px',
            alignItems: 'stretch'
          }}>
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                style={{
                  background: member.gradient,
                  borderRadius: '20px',
                  padding: '40px',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {/* Subtle gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                  pointerEvents: 'none'
                }}></div>

                <div style={{
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    fontSize: '3.5rem',
                    marginBottom: '25px',
                    textAlign: 'center',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}>
                    {member.icon}
                  </div>

                  <div style={{
                    textAlign: 'center',
                    marginBottom: '25px'
                  }}>
                    <h4 style={{
                      fontSize: '1.6rem',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#4fc3f7'
                    }}>
                      {member.name}
                    </h4>
                    
                    <div style={{
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginBottom: '5px',
                      fontWeight: 'bold'
                    }}>
                      {member.role}
                    </div>
                    
                    <div style={{
                      fontSize: '0.95rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontStyle: 'italic'
                    }}>
                      {member.title}
                    </div>
                  </div>

                  <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.7',
                    color: 'rgba(255, 255, 255, 0.85)',
                    marginBottom: '25px',
                    textAlign: 'justify'
                  }}>
                    {member.description}
                  </p>

                  {/* Specialties */}
                  <div style={{
                    marginBottom: '25px'
                  }}>
                    <h5 style={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: '#4fc3f7',
                      marginBottom: '15px'
                    }}>
                      Core Expertise:
                    </h5>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {member.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(79, 195, 247, 0.2)',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            color: 'white',
                            border: '1px solid rgba(79, 195, 247, 0.3)'
                          }}
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Philosophy */}
                  <div style={{
                    padding: '20px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #4fc3f7',
                    fontStyle: 'italic',
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    "{member.philosophy}"
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Team Summary */}
        <motion.div
          variants={cardVariants}
          style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.15) 0%, rgba(37, 91, 145, 0.15) 100%)',
            borderRadius: '25px',
            padding: '60px 40px',
            border: '2px solid rgba(79, 195, 247, 0.3)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(79, 195, 247, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            pointerEvents: 'none'
          }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 'bold',
              marginBottom: '30px',
              background: 'linear-gradient(135deg, #4fc3f7 0%, #93c572 50%, #ff9f43 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ✨ Together, we are ETRx – EO: AeroVision
            </h3>
            
            <p style={{
              fontSize: '1.2rem',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '900px',
              margin: '0 auto 40px',
              fontWeight: '300'
            }}>
              Merging cutting-edge engineering, advanced geospatial intelligence, and visionary entrepreneurial 
              spirit to design revolutionary solutions that transform Earth observation today and inspire 
              humanity's bold journey into the cosmic frontier tomorrow.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '30px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {[
                { value: '3', label: 'Visionary Leaders', icon: '👥' },
                { value: '5+', label: 'Years Combined Experience', icon: '⭐' },
                { value: '∞', label: 'Innovation Potential', icon: '🚀' }
              ].map((stat, idx) => (
                <div key={idx} style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    marginBottom: '10px'
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#4fc3f7',
                    marginBottom: '5px'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" style={{
      padding: '80px 8%',
      color: 'white',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at center, rgba(37, 91, 145, 0.2) 0%, rgba(2, 12, 27, 1) 70%)'
    }}>
      {/* Stars Effect */}
      <div style={{
        background: 'rgba(37, 91, 145, 0.2)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          radial-gradient(white 1px, transparent 1px),
          radial-gradient(white 1px, transparent 1px)
        `,
        background: `
          radial-gradient(circle at center, rgba(37, 91, 145, 0.2) 0%, 
          rgba(2, 12, 27, 1) 70%
        `,
        backgroundSize: '50px 50px',
        backgroundPosition: '0 0, 25px 25px',
        opacity: 0.1,
        zIndex: -2
      }}></div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#4fc3f7'
        }}>
          Get In Touch ☎️
        </h2>
        
        <p style={{
          fontSize: '1.1rem',
          lineHeight: '1.7',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '3rem',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Have questions about our Earth observation technology or want to collaborate? Reach out to our team.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '15px',
              color: '#4fc3f7'
            }}>
              ✉️
            </div>
            <h3 style={{
              fontSize: '1.2rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}>
              jic@awayspacecovenant.com
            </h3>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '15px',
              color: '#4fc3f7'
            }}>
              📱
            </div>
            <h3 style={{
              fontSize: '1.2rem',
              marginBottom: '10px',
              color: 'white'
            }}>
              Follow Us
            </h3>
            <a href="https://www.instagram.com/the.real.awsc?igsh=MThkNDhsczBwZWd1NA%3D%3D" target="_blank" rel="noopener noreferrer" style={{
              color: '#4fc3f7',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}>
              @the.real.awsc
            </a>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '15px',
              color: '#4fc3f7'
            }}>
              🌐
            </div>
            <h3 style={{
              fontSize: '1.2rem',
              marginBottom: '10px',
              color: 'white'
            }}>
              Visit Us
            </h3>
            <a href="https://awayspacecovenant.in/" target="_blank" rel="noopener noreferrer" style={{
              color: '#4fc3f7',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}>
              awaywithus.squarespace.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
export default function EarthA() {
  const handleScrollToDomains = () => {
    const domainsSection = document.getElementById('domains');
    if (domainsSection) {
      domainsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw',
      overflowX: 'hidden'
    }}>
      <div style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <Canvas camera={{ position: [5, 5, 25], fov: 45 }}>
          <StaticGalaxy />
          {/* Consider adding a 3D Earth model here if intended */}
        </Canvas>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 2
      }}>
        <HeroSection onGetStarted={handleScrollToDomains} />
        <LatestNewsScroller />
        <DomainsSection />
        <FeaturesSection />
        <MoreDataSection />
        <TeamSection />
        <ContactSection />
      </div>
    </div>
  );
}