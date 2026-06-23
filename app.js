// ==========================================================================
// AI-POWERED GOVERNMENT BUS TRACKING & SMART TRANSPORT - CORE SYSTEM (app.js)
// ==========================================================================

// Global state variables
let map;
let busMarkers = {};
let stopMarkers = [];
let routeLines = {};
let showRoutePaths = true;
let simulationInterval = null;
let simulationSpeed = 1; // 1x, 2x, 5x, 0 (paused)
let activePortal = 'passenger'; // 'passenger' or 'admin'
let activeLanguage = 'en'; // 'en' or 'ta'
let isSimpleMode = false;
let activeRouteTab = '101'; // currently viewed route
let databaseSelectedTable = 'bus';

// Charts instances
let chartRouteBusCount = null;
let chartPassengerDemand = null;
let chartDelayStats = null;
let chartTrafficAnalysis = null;

// Speech variables
let voiceRecognition = null;
let isSpeaking = false;
let isListening = false;

// --------------------------------------------------------------------------
// MOCK DATABASE & STATIC CONFIGS
// --------------------------------------------------------------------------
const db = {
  routes: [
    {
      routeId: '101',
      routeNum: '101',
      routeName: 'Downtown Express',
      routeNameTa: 'டவுன்டவுன் எக்ஸ்பிரஸ்',
      source: 'Chennai Central',
      sourceTa: 'சென்னை சென்ட்ரல்',
      destination: 'Guindy IT Park',
      destinationTa: 'கிண்டி ஐடி பார்க்',
      distance: 12.8,
      color: '#38bdf8',
      path: [
        [13.0827, 80.2707], // Central
        [13.0782, 80.2605], // Egmore
        [13.0710, 80.2520], // Interpolated
        [13.0597, 80.2407], // Nungambakkam
        [13.0510, 80.2370], // Interpolated
        [13.0418, 80.2341], // T. Nagar
        [13.0320, 80.2280], // Interpolated
        [13.0234, 80.2238], // Saidapet
        [13.0067, 80.2206]  // Guindy IT Park
      ],
      stops: [
        { id: 'S1', name: 'Chennai Central', nameTa: 'சென்னை சென்ட்ரல்', coord: [13.0827, 80.2707], order: 0 },
        { id: 'S2', name: 'Egmore Station', nameTa: 'எழும்பூர் நிலையம்', coord: [13.0782, 80.2605], order: 1 },
        { id: 'S3', name: 'Nungambakkam', nameTa: 'நுங்கம்பாக்கம்', coord: [13.0597, 80.2407], order: 3 },
        { id: 'S4', name: 'T. Nagar Terminal', nameTa: 'தி. நகர் முனையம்', coord: [13.0418, 80.2341], order: 5 },
        { id: 'S5', name: 'Saidapet Metro', nameTa: 'சைதாப்பேட்டை மெட்ரோ', coord: [13.0234, 80.2238], order: 7 },
        { id: 'S6', name: 'Guindy IT Park', nameTa: 'கிண்டி ஐடி பார்க்', coord: [13.0067, 80.2206], order: 8 }
      ]
    },
    {
      routeId: '202',
      routeNum: '202',
      routeName: 'Tech Corridor Link',
      routeNameTa: 'டெக் காரிடார் இணைப்பு',
      source: 'Guindy IT Park',
      sourceTa: 'கிண்டி ஐடி பார்க்',
      destination: 'Marina Beach',
      destinationTa: 'மெரினா கடற்கரை',
      distance: 14.2,
      color: '#8b5cf6',
      path: [
        [13.0067, 80.2206], // Guindy IT Park
        [13.0063, 80.2575], // Adyar
        [13.0200, 80.2640], // Interpolated
        [13.0330, 80.2690], // Mylapore
        [13.0440, 80.2780], // Interpolated
        [13.0500, 80.2824], // Marina Beach
        [13.0680, 80.2800], // Interpolated
        [13.0827, 80.2707]  // Central
      ],
      stops: [
        { id: 'S6', name: 'Guindy IT Park', nameTa: 'கிண்டி ஐடி பார்க்', coord: [13.0067, 80.2206], order: 0 },
        { id: 'S7', name: 'Adyar Gate', nameTa: 'அடையார் கேட்', coord: [13.0063, 80.2575], order: 1 },
        { id: 'S8', name: 'Mylapore Temple', nameTa: 'மயிலாப்பூர் கோவில்', coord: [13.0330, 80.2690], order: 3 },
        { id: 'S9', name: 'Marina Beach', nameTa: 'மெரினா கடற்கரை', coord: [13.0500, 80.2824], order: 5 },
        { id: 'S1', name: 'Chennai Central', nameTa: 'சென்னை சென்ட்ரல்', coord: [13.0827, 80.2707], order: 7 }
      ]
    },
    {
      routeId: '303',
      routeNum: '303',
      routeName: 'Coastal Shuttle',
      routeNameTa: 'கடலோர விண்கலம்',
      source: 'Chennai Central',
      sourceTa: 'சென்னை சென்ட்ரல்',
      destination: 'Velachery Junction',
      destinationTa: 'வேளச்சேரி சந்திப்பு',
      distance: 18.5,
      color: '#10b981',
      path: [
        [13.0827, 80.2707], // Central
        [13.0500, 80.2824], // Marina Beach
        [13.0330, 80.2690], // Mylapore
        [13.0063, 80.2575], // Adyar
        [12.9900, 80.2410], // Interpolated
        [12.9796, 80.2241]  // Velachery
      ],
      stops: [
        { id: 'S1', name: 'Chennai Central', nameTa: 'சென்னை சென்ட்ரல்', coord: [13.0827, 80.2707], order: 0 },
        { id: 'S9', name: 'Marina Beach', nameTa: 'மெரினா கடற்கரை', coord: [13.0500, 80.2824], order: 1 },
        { id: 'S8', name: 'Mylapore Temple', nameTa: 'மயிலாப்பூர் கோவில்', coord: [13.0330, 80.2690], order: 2 },
        { id: 'S7', name: 'Adyar Gate', nameTa: 'அடையார் கேட்', coord: [13.0063, 80.2575], order: 3 },
        { id: 'S10', name: 'Velachery Junction', nameTa: 'வேளச்சேரி சந்திப்பு', coord: [12.9796, 80.2241], order: 5 }
      ]
    }
  ],
  buses: [
    { busId: 'B1', busNum: 'TN-01-N-4421', routeId: '101', driverId: 'D1', status: 'RUNNING', pathIndex: 0, direction: 1, speed: 45, delayMinutes: 0, load: 'Low' },
    { busId: 'B2', busNum: 'TN-01-N-8812', routeId: '101', driverId: 'D2', status: 'RUNNING', pathIndex: 4, direction: -1, speed: 38, delayMinutes: 4, load: 'Medium' },
    { busId: 'B3', busNum: 'TN-01-N-1209', routeId: '202', driverId: 'D3', status: 'RUNNING', pathIndex: 1, direction: 1, speed: 40, delayMinutes: 0, load: 'Low' },
    { busId: 'B4', busNum: 'TN-01-N-5590', routeId: '202', driverId: 'D4', status: 'RUNNING', pathIndex: 5, direction: -1, speed: 35, delayMinutes: 12, load: 'Crowded' },
    { busId: 'B5', busNum: 'TN-01-N-2418', routeId: '303', driverId: 'D5', status: 'RUNNING', pathIndex: 2, direction: 1, speed: 50, delayMinutes: 0, load: 'Low' },
    { busId: 'B6', busNum: 'TN-01-N-9988', routeId: '303', driverId: 'D6', status: 'DELAYED', pathIndex: 4, direction: -1, speed: 20, delayMinutes: 18, load: 'Medium' }
  ],
  drivers: [
    { driverId: 'D1', name: 'Ramanathan K', nameTa: 'இராமநாதன் கே', score: 98, delays: 1 },
    { driverId: 'D2', name: 'Gopalakrishnan V', nameTa: 'கோபாலகிருஷ்ணன் வி', score: 85, delays: 3 },
    { driverId: 'D3', name: 'Selvamurugan A', nameTa: 'செல்வமுருகன் ஏ', score: 92, delays: 0 },
    { driverId: 'D4', name: 'Kathiravan T', nameTa: 'கதிரவன் டி', score: 74, delays: 8 },
    { driverId: 'D5', name: 'Muthuvel M', nameTa: 'முத்துவேல் எம்', score: 95, delays: 1 },
    { driverId: 'D6', name: 'Sundaram P', nameTa: 'சுந்தரம் பி', score: 81, delays: 6 }
  ],
  gpsTracking: [], // compiled dynamically during simulation
  timetable: [],    // compiled dynamically
  cctvAlertActive: false,
  addedBusesCount: 0
};

// Seeding timetables with static schedules
function seedTimetables() {
  db.timetable = [];
  const hours = [8, 10, 12, 14, 16, 18, 20];
  db.routes.forEach(r => {
    db.buses.filter(b => b.routeId === r.routeId).forEach((b, index) => {
      hours.forEach((h, hIdx) => {
        let dept = `${String(h + index).padStart(2, '0')}:00`;
        let arr = `${String(h + index + 1).padStart(2, '0')}:15`;
        db.timetable.push({
          timetableId: `T_${r.routeId}_${b.busId}_${hIdx}`,
          busId: b.busId,
          routeId: r.routeId,
          departureTime: dept,
          arrivalTime: arr
        });
      });
    });
  });
}

// --------------------------------------------------------------------------
// TRANSLATION DICTIONARY
// --------------------------------------------------------------------------
const translations = {
  en: {
    title: "METRO-AI",
    subtitle: "Govt. Transport Management",
    simStatus: "Sim Status:",
    simLive: "LIVE",
    langBtn: "தமிழ்",
    simpleBtn: "Simple Mode",
    simpleBtnDisable: "Disable Simple",
    passengerBtn: "Passenger",
    adminBtn: "Admin Portal",
    weather: "Weather:",
    weatherClear: "☀️ Clear Sky",
    weatherRainy: "🌧️ Heavy Rain",
    weatherStormy: "⛈️ Storm & Fog",
    traffic: "Traffic Level:",
    trafficLow: "🟢 Low Traffic",
    trafficMod: "🟡 Moderate Traffic",
    trafficHeavy: "🔴 Peak Congestion",
    aiEngineTitle: "AI Prediction HUD",
    aiModelType: "Model: Random Forest Regressor (Live)",
    aiTrafficFactor: "Traffic Factor",
    aiWeatherDelay: "Weather Delay",
    aiConfidence: "Prediction Accuracy",
    mapTitle: "Interactive Bus Locator Map",
    locateMe: "Find Nearest Stop",
    toggleRoutes: "Toggle Route Paths",
    scheduleTitle: "Route Schedule & Next Stop ETAs",
    searchPlaceholder: "Search by route, stop name...",
    chatbotTitle: "MetroAI - Assistant",
    chatbotWelcome: "Welcome to Metro-AI transit assistant! Ask me route directions or bus schedules. (Supports speech recognition in Tamil/English).",
    bookTicket: "Book Ticket",
    chatPlaceholder: "Ask MetroAI (e.g., 'When is the next Route 101 bus?')",
    kpiRunning: "Total Buses Running",
    kpiOnTime: "On-Time Status",
    kpiDelayed: "Delayed Buses",
    kpiAvgWait: "Avg. Waiting Time",
    cctvTitle: "AI Video CCTV Stop Crowd Monitoring",
    cctvForce: "Force Passenger Peak",
    cctvForceReset: "Reset Crowd Peak",
    cctvLoadText: "PASSENGERS WAITING IN VIEW",
    cctvAnalyticsTitle: "CCTV Image AI Analytics",
    cctvAnalyticsDesc: "Real-time object detection models track passengers waiting on the physical bus platform to estimate route demand factors.",
    cctvCount: "Crowd Count",
    cctvCongestion: "Congestion Rate",
    cctvAdvice: "AI Dispatch Advice:",
    cctvAdviceOk: "Standard schedule capacity is optimal. No action required.",
    cctvAdviceAlert: "High Crowd Density! Recommend deploying extra bus to Route 101.",
    chartRouteBusTitle: "Route-wise Bus Allocations",
    chartDemandTitle: "Hourly Passenger Demand (AI Predicted)",
    chartDelayTitle: "Fulfillment & Delay Incidents",
    chartTrafficTitle: "Peak Congestion Level By Location",
    rptFreqTitle: "Least Frequent Routes Audit",
    rptFreqAdd: "Add Extra Bus",
    rptDriverTitle: "Driver Performance Analysis",
    dbViewerTitle: "Database Storage & Relational Schema Visualizer",
    qrModalTitle: "Smart QR Ticket Booking",
    qrSelectRoute: "SELECT ROUTE:",
    qrFare: "FARE TOTAL:",
    qrSeats: "SEATS:",
    qrConfirm: "Confirm Purchase",
    qrClose: "Close",
    qrInstructions: "Scan this QR Code at the bus gateway reader during boarding.",
    locateResponse: "Your simulated position is Marina Beach Stop! Nearest stop is Marina Beach (Route 202, 303).",
    cctvAlertTitleText: "AI Route Recommendation Alert",
    cctvAlertContentText: "Peak passenger demand identified at Central Terminal. Deploying additional bus on Route 101 is highly recommended to reduce waiting times.",
    deployBtnText: "Deploy Bus",
    btnLocateMe: "Find Nearest Stop",
    btnToggleRoutes: "Toggle Route Paths",
    thRoute: "Route",
    thDestination: "Destination",
    thBusesRun: "Buses Running",
    thFrequency: "Frequency",
    thDemand: "Demand",
    thDriver: "Driver Name",
    thBusNum: "Bus Number",
    thDelay: "Delay Time",
    thSafety: "Safety Score",
    thRating: "Rating"
  },
  ta: {
    title: "மெட்ரோ-ஏஐ",
    subtitle: "அரசு போக்குவரத்து மேலாண்மை",
    simStatus: "நிலை:",
    simLive: "நேரலை",
    langBtn: "English",
    simpleBtn: "எளிய முறை",
    simpleBtnDisable: "சாதாரண முறை",
    passengerBtn: "பயணிகள்",
    adminBtn: "நிர்வாகி",
    weather: "வானிலை:",
    weatherClear: "☀️ தெளிவான வானம்",
    weatherRainy: "🌧️ கனமழை",
    weatherStormy: "⛈️ புயல் & மூடுபனி",
    traffic: "போக்குவரத்து நெரிசல்:",
    trafficLow: "🟢 குறைந்த நெரிசல்",
    trafficMod: "🟡 நடுத்தர நெரிசல்",
    trafficHeavy: "🔴 அதிக நெரிசல்",
    aiEngineTitle: "ஏஐ கணிப்பு மையம்",
    aiModelType: "மாதிரி: ரேண்டம் ஃபாரஸ்ட் ரெக்ரஸர்",
    aiTrafficFactor: "போக்குவரத்து காரணி",
    aiWeatherDelay: "வானிலை தாமதம்",
    aiConfidence: "கணிப்பு துல்லியம்",
    mapTitle: "பஸ்கள் இருக்கும் வரைபடம்",
    locateMe: "அருகிலுள்ள நிறுத்தத்தைக் காண்க",
    toggleRoutes: "பாதைகளை காட்டு/மறை",
    scheduleTitle: "பேருந்து கால அட்டவணை மற்றும் வருகை நேரம்",
    searchPlaceholder: "பேருந்து எண், நிறுத்தம் மூலம் தேடுக...",
    chatbotTitle: "மெட்ரோ-ஏஐ -உதவியாளர்",
    chatbotWelcome: "மெட்ரோ-ஏஐ போக்குவரத்து உதவியாளருக்கு உங்களை வரவேற்கிறோம்! வழிகள் அல்லது பேருந்து அட்டவணைகளைக் கேளுங்கள். (தமிழ்/ஆங்கிலக் குரல் கட்டளைகளை ஏற்கும்).",
    bookTicket: "டிக்கெட் முன்பதிவு",
    chatPlaceholder: "பேருந்து கால அட்டவணையை கேளுங்கள்...",
    kpiRunning: "இயங்கும் பேருந்துகள்",
    kpiOnTime: "சரியான நேர நிலை",
    kpiDelayed: "தாமதமாகும் பேருந்துகள்",
    kpiAvgWait: "சராசரி காத்திருப்பு நேரம்",
    cctvTitle: "ஏஐ சிசிடிவி கூட்ட நெரிசல் கண்காணிப்பு",
    cctvForce: "நெரிசலை உருவாக்கு",
    cctvForceReset: "நெரிசலை மீட்டமை",
    cctvLoadText: "காத்திருக்கும் பயணிகள்",
    cctvAnalyticsTitle: "சிசிடிவி பட ஏஐ பகுப்பாய்வு",
    cctvAnalyticsDesc: "பேருந்து நிலையத்தில் காத்திருக்கும் பயணிகளை கணக்கிட்டு நெரிசல் அளவை ஏஐ மதிப்பிடுகிறது.",
    cctvCount: "பயணிகள் எண்ணிக்கை",
    cctvCongestion: "நெரிசல் விகிதம்",
    cctvAdvice: "ஏஐ ஆலோசனை:",
    cctvAdviceOk: "அட்டவணை திறன் போதுமானது. கூடுதல் பேருந்து தேவையில்லை.",
    cctvAdviceAlert: "அதிக நெரிசல்! தடம் 101-ல் கூடுதல் பேருந்தை இயக்க பரிந்துரைக்கப்படுகிறது.",
    chartRouteBusTitle: "தடம் வாரியாக பேருந்து ஒதுக்கீடு",
    chartDemandTitle: "மணிநேர பயணிகள் தேவை (ஏஐ கணிப்பு)",
    chartDelayTitle: "பேருந்து சரியான நேர புள்ளிவிவரம்",
    chartTrafficTitle: "இட வாரியாக அதிக நெரிசல் பகுப்பாய்வு",
    rptFreqTitle: "குறைந்த பேருந்து தடங்கள் தணிக்கை",
    rptFreqAdd: "கூடுதல் பேருந்தை சேர்",
    rptDriverTitle: "ஓட்டுநர் செயல்திறன் பகுப்பாய்வு",
    dbViewerTitle: "தரவுத்தள சேமிப்பு மற்றும் அட்டவணைகள்",
    qrModalTitle: "ஸ்மார்ட் கியூஆர் டிக்கெட் முன்பதிவு",
    qrSelectRoute: "தடத்தைத் தேர்ந்தெடுக்கவும்:",
    qrFare: "மொத்த கட்டணம்:",
    qrSeats: "இருக்கைகள்:",
    qrConfirm: "முன்பதிவை உறுதி செய்",
    qrClose: "மூடுக",
    qrInstructions: "பேருந்தில் ஏறும்போது கியூஆர் குறியீட்டை ஸ்கேன் செய்யவும்.",
    locateResponse: "உங்கள் இருப்பிடம் மெரினா கடற்கரை நிறுத்தம்! அருகிலுள்ள நிறுத்தம் மெரினா கடற்கரை (தடம் 202, 303).",
    cctvAlertTitleText: "ஏஐ தடம் பரிந்துரை எச்சரிக்கை",
    cctvAlertContentText: "சென்ட்ரல் முனையத்தில் பயணிகள் நெரிசல் கண்டறியப்பட்டுள்ளது. காத்திருப்பு நேரத்தைக் குறைக்க தடம் 101-ல் கூடுதல் பேருந்தை இயக்க பரிந்துரைக்கப்படுகிறது.",
    deployBtnText: "பேருந்தை இயக்கு",
    btnLocateMe: "அருகிலுள்ள நிறுத்தத்தைக் காண்க",
    btnToggleRoutes: "பாதைகளை காட்டு/மறை",
    thRoute: "தடம்",
    thDestination: "இறுதி நிறுத்தம்",
    thBusesRun: "இயங்கும் பேருந்துகள்",
    thFrequency: "அதிர்வெண்",
    thDemand: "தேவை",
    thDriver: "ஓட்டுநர் பெயர்",
    thBusNum: "பேருந்து எண்",
    thDelay: "தாமத நேரம்",
    thSafety: "பாதுகாப்பு மதிப்பெண்",
    thRating: "மதிப்பீடு"
  }
};

// Apply language translations
function applyLanguage() {
  const dict = translations[activeLanguage];
  
  // Header
  document.getElementById('header-title').textContent = dict.title;
  document.getElementById('header-subtitle').textContent = dict.subtitle;
  document.getElementById('sim-status-label').textContent = dict.simStatus;
  document.getElementById('sim-status-state').textContent = dict.simLive;
  document.getElementById('lang-btn-text').textContent = dict.langBtn;
  document.getElementById('simple-btn-text').textContent = isSimpleMode ? dict.simpleBtnDisable : dict.simpleBtn;
  document.getElementById('portal-passenger-txt').textContent = dict.passengerBtn;
  document.getElementById('portal-admin-txt').textContent = dict.adminBtn;
  
  // Passenger View Top HUD
  document.getElementById('weather-lbl').textContent = dict.weather;
  document.getElementById('weather-clear').textContent = dict.weatherClear;
  document.getElementById('weather-rainy').textContent = dict.weatherRainy;
  document.getElementById('weather-stormy').textContent = dict.weatherStormy;
  
  document.getElementById('traffic-lbl').textContent = dict.traffic;
  document.getElementById('traffic-low').textContent = dict.trafficLow;
  document.getElementById('traffic-mod').textContent = dict.trafficMod;
  document.getElementById('traffic-heavy').textContent = dict.trafficHeavy;
  
  document.getElementById('ai-engine-title').textContent = dict.aiEngineTitle;
  document.getElementById('ai-model-type').textContent = dict.aiModelType;
  document.getElementById('ai-hud-factor-lbl').textContent = dict.aiTrafficFactor;
  document.getElementById('ai-hud-weather-lbl').textContent = dict.aiWeatherDelay;
  document.getElementById('ai-hud-confidence-lbl').textContent = dict.aiConfidence;
  
  // Passenger View Main
  document.getElementById('map-title').textContent = dict.mapTitle;
  document.getElementById('locate-me-txt').textContent = dict.locateMe;
  document.getElementById('toggle-route-txt').textContent = dict.toggleRoutes;
  document.getElementById('schedule-title').textContent = dict.scheduleTitle;
  document.getElementById('route-search').placeholder = dict.searchPlaceholder;
  document.getElementById('book-ticket-txt').textContent = dict.bookTicket;
  document.getElementById('chat-user-input').placeholder = dict.chatPlaceholder;

  // Bot welcome message check
  const welcomeMsg = document.getElementById('bot-welcome-msg');
  if (welcomeMsg) welcomeMsg.textContent = dict.chatbotWelcome;

  // Admin View KPIs
  document.getElementById('kpi-running-lbl').textContent = dict.kpiRunning;
  document.getElementById('kpi-ontime-lbl').textContent = dict.kpiOnTime;
  document.getElementById('kpi-delayed-lbl').textContent = dict.kpiDelayed;
  document.getElementById('kpi-waiting-lbl').textContent = dict.kpiAvgWait;

  // CCTV
  document.getElementById('cctv-widget-title').textContent = dict.cctvTitle;
  document.getElementById('cctv-load-status').textContent = dict.cctvLoadText;
  document.getElementById('cctv-analytics-lbl').textContent = dict.cctvAnalyticsTitle;
  document.getElementById('cctv-analytics-desc').textContent = dict.cctvAnalyticsDesc;
  document.getElementById('cctv-density-lbl').textContent = dict.cctvCount;
  document.getElementById('cctv-status-lbl').textContent = dict.cctvCongestion;
  document.getElementById('cctv-recommendation-lbl').textContent = dict.cctvAdvice;
  
  document.getElementById('cctv-trigger-btn').textContent = db.cctvAlertActive ? dict.cctvForceReset : dict.cctvForce;
  
  if (db.cctvAlertActive) {
    document.getElementById('cctv-dispatch-advice').innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger)"></i> ${dict.cctvAdviceAlert}`;
    document.getElementById('cctv-dispatch-advice').style.color = 'var(--danger)';
    
    // update ai alert box text
    document.getElementById('ai-alert-title').textContent = dict.cctvAlertTitleText;
    document.getElementById('ai-alert-text').textContent = dict.cctvAlertContentText;
    document.getElementById('deploy-bus-btn').textContent = dict.deployBtnText;
  } else {
    document.getElementById('cctv-dispatch-advice').innerHTML = `<i class="fa-solid fa-circle-check"></i> ${dict.cctvAdviceOk}`;
    document.getElementById('cctv-dispatch-advice').style.color = 'var(--success)';
  }

  // Admin Table column headers
  document.getElementById('th-route').textContent = dict.thRoute;
  document.getElementById('th-destination').textContent = dict.thDestination;
  document.getElementById('th-buses-run').textContent = dict.thBusesRun;
  document.getElementById('th-frequency').textContent = dict.thFrequency;
  document.getElementById('th-demand').textContent = dict.thDemand;
  
  document.getElementById('th-driver').textContent = dict.thDriver;
  document.getElementById('th-bus-num').textContent = dict.thBusNum;
  document.getElementById('th-delay').textContent = dict.thDelay;
  document.getElementById('th-safety').textContent = dict.thSafety;
  document.getElementById('th-rating').textContent = dict.thRating;

  document.getElementById('rpt-freq-title').textContent = dict.rptFreqTitle;
  document.getElementById('rpt-freq-add-btn').textContent = dict.rptFreqAdd;
  document.getElementById('rpt-driver-title').textContent = dict.rptDriverTitle;
  
  document.getElementById('db-viewer-title').textContent = dict.dbViewerTitle;
  
  // Modal
  document.getElementById('qr-modal-title').textContent = dict.qrModalTitle;
  document.getElementById('qr-select-route-lbl').textContent = dict.qrSelectRoute;
  document.getElementById('qr-fare-lbl').textContent = dict.qrFare;
  document.getElementById('qr-seats-lbl').textContent = dict.qrSeats;
  document.getElementById('qr-confirm-btn').textContent = dict.qrConfirm;
  document.getElementById('qr-close-btn').textContent = dict.qrClose;
  document.getElementById('qr-instructions').textContent = dict.qrInstructions;

  // Chart titles update
  document.getElementById('chart-route-bus-count-title').textContent = dict.chartRouteBusTitle;
  document.getElementById('chart-passenger-demand-title').textContent = dict.chartDemandTitle;
  document.getElementById('chart-delay-stats-title').textContent = dict.chartDelayTitle;
  document.getElementById('chart-traffic-analysis-title').textContent = dict.chartTrafficTitle;

  // Re-fill elements
  renderRouteTabs();
  fillTimetable();
  fillLeastFrequentTable();
  fillDriverTable();
  renderDatabaseTable();
}

function toggleLanguage() {
  activeLanguage = activeLanguage === 'en' ? 'ta' : 'en';
  applyLanguage();
}

// --------------------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------------------
window.onload = function () {
  // 1. Seed GPS history log & Timetables
  seedTimetables();
  db.buses.forEach(b => {
    db.gpsTracking.push({
      trackingId: `G_${b.busId}_init`,
      busId: b.busId,
      latitude: db.routes.find(r => r.routeId === b.routeId).path[b.pathIndex][0],
      longitude: db.routes.find(r => r.routeId === b.routeId).path[b.pathIndex][1],
      timestamp: new Date().toISOString()
    });
  });

  // 2. Initialize Leaflet Map
  initMap();

  // 3. Initialize Charts
  initCharts();

  // 4. Populate GUI Lists
  renderRouteTabs();
  fillTimetable();
  fillLeastFrequentTable();
  fillDriverTable();
  renderDatabaseTable();
  populateQRRoutes();

  // 5. Start Physics Simulation
  startSimulation();

  // 6. Recalculate AI Engine Factors
  recalculateAIPredictions();
  
  // 7. Setup Speech System
  initSpeechSystem();
};

// --------------------------------------------------------------------------
// ACCESSIBILITY & MODE SWITCHERS
// --------------------------------------------------------------------------
function toggleSimpleMode() {
  isSimpleMode = !isSimpleMode;
  if (isSimpleMode) {
    document.body.classList.add('simple-mode');
    speakText("Simple Mode Activated. Grid simplified, high contrast, increased text sizes.", "en");
  } else {
    document.body.classList.remove('simple-mode');
  }
  applyLanguage();
}

function switchPortal(portalName) {
  activePortal = portalName;
  document.getElementById('btn-portal-passenger').classList.remove('active');
  document.getElementById('btn-portal-admin').classList.remove('active');
  document.getElementById('passenger-view').classList.remove('active');
  document.getElementById('admin-view').classList.remove('active');

  if (portalName === 'passenger') {
    document.getElementById('btn-portal-passenger').classList.add('active');
    document.getElementById('passenger-view').classList.add('active');
    // Leaflet map refresh needed when element gets displayed
    setTimeout(() => { map.invalidateSize(); }, 200);
  } else {
    document.getElementById('btn-portal-admin').classList.add('active');
    document.getElementById('admin-view').classList.add('active');
    // Refresh charts
    setTimeout(() => {
      chartRouteBusCount.update();
      chartPassengerDemand.update();
      chartDelayStats.update();
      chartTrafficAnalysis.update();
    }, 200);
  }
}

// --------------------------------------------------------------------------
// LEAFLET MAP IMPLEMENTATION
// --------------------------------------------------------------------------
function initMap() {
  // Center on Chennai Central coords
  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([13.045, 80.25], 12);

  // CartoDB Dark Matter tiles (Perfect fit for dark glassmorphic theme)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  // Draw bus stops on map
  const uniqueStops = {};
  db.routes.forEach(r => {
    r.stops.forEach(st => {
      if (!uniqueStops[st.id]) {
        uniqueStops[st.id] = true;
        const myIcon = L.divIcon({
          className: 'stop-marker-icon',
          iconSize: [12, 12]
        });
        
        const stopMarker = L.marker(st.coord, { icon: myIcon }).addTo(map);
        stopMarker.bindPopup(`<strong>${activeLanguage === 'ta' ? st.nameTa : st.name} Stop</strong><br/>Routes: ${getRoutesForStop(st.id)}`);
        stopMarkers.push(stopMarker);
      }
    });
  });

  // Draw Route Polylines
  drawRoutePolylines();

  // Create Bus Marker Pins
  updateBusMarkersOnMap();
}

function getRoutesForStop(stopId) {
  return db.routes
    .filter(r => r.stops.some(st => st.id === stopId))
    .map(r => r.routeNum)
    .join(', ');
}

function drawRoutePolylines() {
  // Clear existing if any
  for (let key in routeLines) {
    map.removeLayer(routeLines[key]);
  }
  routeLines = {};

  if (!showRoutePaths) return;

  db.routes.forEach(r => {
    const polyline = L.polyline(r.path, {
      color: r.color,
      weight: 4,
      opacity: 0.7,
      dashArray: '8, 8'
    }).addTo(map);
    routeLines[r.routeId] = polyline;
  });
}

function toggleRouteOverlays() {
  showRoutePaths = !showRoutePaths;
  drawRoutePolylines();
  
  // translate button
  const dict = translations[activeLanguage];
  document.getElementById('btn-toggle-routes').className = showRoutePaths ? 'btn btn-primary' : 'btn';
}

function updateBusMarkersOnMap() {
  db.buses.forEach(b => {
    const route = db.routes.find(r => r.routeId === b.routeId);
    if (!route) return;

    const coords = route.path[b.pathIndex];
    const isDelayed = b.status === 'DELAYED' || b.delayMinutes > 5;

    // Custom marker html content
    const htmlContent = `
      <div class="bus-marker-wrapper ${isDelayed ? 'delayed' : ''}" id="bus-pin-${b.busId}">
        <i class="fa-solid fa-bus"></i>
        <span class="bus-marker-route-num">${route.routeNum}</span>
      </div>
    `;

    if (busMarkers[b.busId]) {
      // update position
      busMarkers[b.busId].setLatLng(coords);
      // update marker icon to preserve dynamic rotation and delay styling
      const element = document.getElementById(`bus-pin-${b.busId}`);
      if (element) {
        if (isDelayed) element.classList.add('delayed');
        else element.classList.remove('delayed');
      }
    } else {
      // create new marker
      const busIcon = L.divIcon({
        className: 'bus-marker-icon',
        html: htmlContent,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker(coords, { icon: busIcon }).addTo(map);
      marker.bindPopup(`
        <strong>Bus: ${b.busNum}</strong><br/>
        Route: ${route.routeNum} - ${activeLanguage === 'ta' ? route.routeNameTa : route.routeName}<br/>
        Status: <span class="badge ${isDelayed ? 'badge-warning' : 'badge-success'}">${b.status}</span><br/>
        Load: <span class="badge badge-primary">${b.load}</span><br/>
        Speed: ${b.speed} km/h<br/>
        AI Predicted Delay: ${b.delayMinutes} min
      `);
      busMarkers[b.busId] = marker;
    }
  });
}

function simulateUserLocation() {
  // Simulate locating passenger near Marina Beach stop
  const userCoords = [13.048, 80.279];
  map.setView(userCoords, 14);

  // User marker
  const userIcon = L.divIcon({
    className: 'user-marker-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  L.marker(userCoords, { icon: userIcon }).addTo(map).bindPopup("<b>You are here!</b>").openPopup();
  
  // Highlight nearest stops
  const response = translations[activeLanguage].locateResponse;
  addChatMessage("user", activeLanguage === 'en' ? "Find nearest stop." : "அருகிலுள்ள நிறுத்தத்தைக் காண்க.");
  setTimeout(() => {
    addChatMessage("bot", response);
    speakText(response, activeLanguage);
  }, 500);
}

// --------------------------------------------------------------------------
// AI PREDICTION ENGINE LOGIC
// --------------------------------------------------------------------------
function recalculateAIPredictions() {
  const weatherVal = document.getElementById('weather-select').value;
  const trafficVal = document.getElementById('traffic-select').value;

  // Factors
  let trafficFactor = 1.0;
  let weatherDelay = 0;
  let accuracy = 94.2;

  if (trafficVal === 'moderate') {
    trafficFactor = 1.35;
    accuracy = 89.5;
  } else if (trafficVal === 'heavy') {
    trafficFactor = 1.85;
    accuracy = 78.1;
  }

  if (weatherVal === 'rainy') {
    weatherDelay = 5;
    accuracy -= 4.2;
  } else if (weatherVal === 'stormy') {
    weatherDelay = 12;
    accuracy -= 10.5;
  }

  // Update HUD
  document.getElementById('ai-hud-traffic-factor').textContent = `${trafficFactor.toFixed(2)}x`;
  document.getElementById('ai-hud-weather-delay').textContent = `+${weatherDelay} min`;
  
  const accuracyElem = document.getElementById('ai-hud-confidence');
  accuracyElem.textContent = `${accuracy.toFixed(1)}%`;
  if (accuracy > 85) {
    accuracyElem.style.color = 'var(--success)';
  } else if (accuracy > 70) {
    accuracyElem.style.color = 'var(--warning)';
  } else {
    accuracyElem.style.color = 'var(--danger)';
  }

  // Update mock bus entities delay times
  db.buses.forEach(b => {
    let baseDelay = b.load === 'Crowded' ? 6 : 0;
    let computedDelay = Math.round(weatherDelay + (baseDelay * trafficFactor));
    b.delayMinutes = computedDelay;
    b.status = computedDelay > 8 ? 'DELAYED' : 'RUNNING';
  });

  // Sync to display elements
  updateBusMarkersOnMap();
  fillTimetable();
  updateAdminKPIs();
  
  if (chartDelayStats) updateDelayChartData();
}

// --------------------------------------------------------------------------
// PASSENGER PORTAL SIDEBAR LISTS
// --------------------------------------------------------------------------
function renderRouteTabs() {
  const container = document.getElementById('route-tabs-container');
  container.innerHTML = '';

  db.routes.forEach(r => {
    const btn = document.createElement('button');
    btn.className = `route-tab-btn ${activeRouteTab === r.routeId ? 'active' : ''}`;
    btn.innerHTML = `<i class="fa-solid fa-route"></i> Route ${r.routeNum}`;
    btn.onclick = function () {
      activeRouteTab = r.routeId;
      renderRouteTabs();
      fillTimetable();
    };
    container.appendChild(btn);
  });
}

function fillTimetable() {
  const container = document.getElementById('timetable-list-container');
  container.innerHTML = '';

  const route = db.routes.find(r => r.routeId === activeRouteTab);
  if (!route) return;

  // Search input filter
  const query = document.getElementById('route-search').value.toLowerCase();

  // Find buses active on this route
  const activeBusesOnRoute = db.buses.filter(b => b.routeId === activeRouteTab);

  route.stops.forEach((st, idx) => {
    const stopNameMatch = st.name.toLowerCase().includes(query) || st.nameTa.includes(query);
    const routeNumMatch = route.routeNum.includes(query);

    if (query && !stopNameMatch && !routeNumMatch) return; // filter out

    // Determine nearest bus and calculate ETA
    let minEtaMinutes = 999;
    let closestBus = null;

    activeBusesOnRoute.forEach(b => {
      // Distance estimation in nodes
      let stopIndexInPath = st.order;
      let busIndexInPath = b.pathIndex;

      // Calculate path node distance
      let nodeDist = 0;
      if (b.direction === 1) {
        if (stopIndexInPath >= busIndexInPath) {
          nodeDist = stopIndexInPath - busIndexInPath;
        } else {
          // Bus already passed this stop, calculate loop around route path
          nodeDist = (route.path.length - busIndexInPath) + stopIndexInPath;
        }
      } else {
        if (stopIndexInPath <= busIndexInPath) {
          nodeDist = busIndexInPath - stopIndexInPath;
        } else {
          nodeDist = busIndexInPath + (route.path.length - stopIndexInPath);
        }
      }

      // Convert node distance to mock minutes (approx 3 min per node at 1x speed)
      let baseMinutes = nodeDist * 3;
      let computedEta = Math.round(baseMinutes * (1.0 + (b.delayMinutes / 60.0)));
      
      if (computedEta < minEtaMinutes) {
        minEtaMinutes = computedEta;
        closestBus = b;
      }
    });

    const stopRow = document.createElement('div');
    stopRow.className = `stop-row ${idx === 0 ? 'active' : ''}`;
    
    // accessibility speak
    stopRow.onclick = function() {
      if (isSimpleMode) {
        const txt = activeLanguage === 'ta' 
          ? `${st.nameTa} நிறுத்தம், அடுத்த பேருந்து வருகை நேரம் ${minEtaMinutes} நிமிடங்கள்.`
          : `Stop ${st.name}, next bus arrival predicted in ${minEtaMinutes} minutes.`;
        speakText(txt, activeLanguage);
      }
    };

    let etaDisplay = '';
    const dict = translations[activeLanguage];
    if (minEtaMinutes === 0) {
      etaDisplay = `<span class="stop-eta-time" style="color: var(--success)"><i class="fa-solid fa-circle-play"></i> ARRIVING</span>`;
    } else if (closestBus && closestBus.status === 'DELAYED') {
      etaDisplay = `
        <span class="stop-eta-time delayed">${minEtaMinutes} min</span>
        <span class="stop-eta-label" style="color: var(--warning)">${dict.kpiDelayed} (${closestBus.delayMinutes}m delay)</span>
      `;
    } else {
      etaDisplay = `
        <span class="stop-eta-time">${minEtaMinutes} min</span>
        <span class="stop-eta-label">${dict.kpiOnTime}</span>
      `;
    }

    stopRow.innerHTML = `
      <div>
        <div class="stop-name">${activeLanguage === 'ta' ? st.nameTa : st.name}</div>
        <div style="font-size: 0.65rem; color: var(--text-secondary)">
          <i class="fa-solid fa-circle-notch"></i> ${dict.thRoute} ${route.routeNum} • Bus: ${closestBus ? closestBus.busNum : 'N/A'}
        </div>
      </div>
      <div class="stop-eta">
        ${etaDisplay}
      </div>
    `;
    container.appendChild(stopRow);
  });
}

function filterTimetables() {
  fillTimetable();
}

// --------------------------------------------------------------------------
// METROAI VOICE ASSISTANT & CHATBOT
// --------------------------------------------------------------------------
function initSpeechSystem() {
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      voiceRecognition = new SpeechRecognition();
      voiceRecognition.continuous = false;
      voiceRecognition.lang = 'en-US';
      voiceRecognition.interimResults = false;

      voiceRecognition.onstart = function () {
        isListening = true;
        document.getElementById('btn-voice-mic').classList.add('recording');
      };

      voiceRecognition.onerror = function (event) {
        console.error('Speech error:', event.error);
        stopListeningState();
      };

      voiceRecognition.onend = function () {
        stopListeningState();
      };

      voiceRecognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chat-user-input').value = transcript;
        handleChatInput();
      };
    }
  } catch (e) {
    console.warn("Speech recognition not supported in this browser:", e);
  }
}

function stopListeningState() {
  isListening = false;
  document.getElementById('btn-voice-mic').classList.remove('recording');
}

function toggleVoiceAssistant() {
  if (isListening) {
    voiceRecognition.stop();
  } else {
    // Detect Language to set speech recognition dialect
    if (voiceRecognition) {
      voiceRecognition.lang = activeLanguage === 'ta' ? 'ta-IN' : 'en-US';
      voiceRecognition.start();
    } else {
      // Mock dialogue for offline/unsupported browsers
      const promptTxt = activeLanguage === 'ta' 
        ? "உங்கள் குரல் கட்டளையை தட்டச்சு செய்யவும் (பிரவுசர் ஸ்பீச் சப்போர்ட் இல்லை)"
        : "Type your query (Voice recognition is not supported in this browser)";
      alert(promptTxt);
    }
  }
}

function speakText(text, lang) {
  if (!window.speechSynthesis) return;

  // Stop previous speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
  
  // Try to find a fitting voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => { isSpeaking = true; };
  utterance.onend = () => { isSpeaking = false; };
  window.speechSynthesis.speak(utterance);
}

function addChatMessage(sender, text) {
  const container = document.getElementById('chat-messages-container');
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}`;
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function handleChatInput() {
  const inputElem = document.getElementById('chat-user-input');
  const text = inputElem.value.trim();
  if (!text) return;

  addChatMessage("user", text);
  inputElem.value = "";

  // Compute AI response
  const response = getChatbotResponse(text);
  setTimeout(() => {
    addChatMessage("bot", response);
    speakText(response, activeLanguage);
  }, 600);
}

function getChatbotResponse(input) {
  const query = input.toLowerCase();
  
  // Tamil mappings
  const hasTamilRoute101 = query.includes('101') || query.includes('தடம் 101');
  const hasTamilRoute202 = query.includes('202') || query.includes('தடம் 202');
  const hasTamilRoute303 = query.includes('303') || query.includes('தடம் 303');
  const isTamilDelay = query.includes('தாமதம்') || query.includes('தாமதமா');
  const isTamilRoute = query.includes('வழி') || query.includes('பாதை') || query.includes('எப்படி');

  // English mappings
  const isDelay = query.includes('delay') || query.includes('late') || isTamilDelay;
  const isRouteQuery = query.includes('route') || query.includes('schedule') || query.includes('go to') || isTamilRoute;

  if (activeLanguage === 'ta') {
    if (hasTamilRoute101) {
      return "தடம் 101 பேருந்து சென்னை சென்ட்ரல் முதல் கிண்டி வரை இயங்குகிறது. அடுத்த பேருந்து இன்னும் 6 நிமிடங்களில் வரும்.";
    }
    if (hasTamilRoute202) {
      return "தடம் 202 பேருந்து கிண்டி ஐடி பார்க் முதல் மெரினா வரை இயங்குகிறது. தற்சமயம் பஸ் 4 நிமிடங்களில் மெரினாவை அடையும்.";
    }
    if (hasTamilRoute303) {
      return "தடம் 303 பேருந்து வேளச்சேரிக்கு செல்கிறது. அடுத்த பேருந்து பஸ் TN-01-N-9988 இப்போது மயிலாப்பூரில் உள்ளது.";
    }
    if (isDelay) {
      const delayedCount = db.buses.filter(b => b.status === 'DELAYED').length;
      return `தற்போது ${delayedCount} பேருந்துகள் தாமதமாக இயங்குகின்றன. நெரிசல் காரணமாக தடம் 303 பஸ் 18 நிமிடம் தாமதமாக வருகிறது.`;
    }
    return "மன்னிக்கவும், தங்களின் கேள்வி எனக்கு புரியவில்லை. பேருந்து எண்கள் (101, 202, 303) அல்லது தாமதம் பற்றி கேட்கலாம்.";
  } else {
    // English responses
    if (hasTamilRoute101) {
      return "Route 101 (Downtown Express) runs between Central Station and Guindy IT Park. Next bus arrives at your stop in 6 mins.";
    }
    if (hasTamilRoute202) {
      return "Route 202 connects Guindy IT Park with Marina Beach. Bus TN-01-N-1209 is currently on-time at Mylapore.";
    }
    if (hasTamilRoute303) {
      return "Route 303 runs to Velachery Junction. Next arrival is at Marina Beach stop in 3 mins.";
    }
    if (isDelay) {
      const delayedCount = db.buses.filter(b => b.status === 'DELAYED').length;
      return `Currently, ${delayedCount} buses are showing delays. Route 303 has a minor 18-minute delay due to traffic.`;
    }
    if (isRouteQuery) {
      return "We operate 3 primary lines: Route 101 (Central-Guindy), Route 202 (Guindy-Central via Marina), and Route 303 (Central-Velachery). Which one do you want to inspect?";
    }
    return "I can assist with bus routes, delays, and schedules. Try asking 'When is the next Route 101 bus?' or 'Are there any delays?'";
  }
}

// --------------------------------------------------------------------------
// SMART QR TICKET BOOKING MODAL
// --------------------------------------------------------------------------
function openQRModal() {
  document.getElementById('qr-modal-backdrop').classList.add('active');
  generateDynamicQR();
}

function closeQRModal() {
  document.getElementById('qr-modal-backdrop').classList.remove('active');
}

function populateQRRoutes() {
  const select = document.getElementById('qr-route-select');
  select.innerHTML = '';
  db.routes.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.routeId;
    opt.textContent = `Route ${r.routeNum} - ${activeLanguage === 'ta' ? r.routeNameTa : r.routeName}`;
    select.appendChild(opt);
  });
}

function generateDynamicQR() {
  const routeId = document.getElementById('qr-route-select').value;
  const route = db.routes.find(r => r.routeId === routeId);
  if (!route) return;

  // Mock pricing: Rs. 15 for short, Rs. 25 for long
  const fare = route.distance > 15 ? 25.0 : 18.0;
  document.getElementById('qr-ticket-fare').textContent = `₹${fare.toFixed(2)}`;

  // Random free seats
  const seats = Math.floor(Math.random() * 20) + 15;
  document.getElementById('qr-seats-available').textContent = `${seats} Seats Free`;

  // Draw custom canvas QR style pattern in placeholder
  const canvasDisplay = document.getElementById('qr-code-display');
  canvasDisplay.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Generate mock QR dots
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 160, 160);
  
  ctx.fillStyle = '#fff';
  // Position anchor boxes
  ctx.fillRect(10, 10, 40, 40);
  ctx.fillStyle = '#000';
  ctx.fillRect(18, 18, 24, 24);
  ctx.fillStyle = '#fff';
  ctx.fillRect(24, 24, 12, 12);

  ctx.fillRect(110, 10, 40, 40);
  ctx.fillStyle = '#000';
  ctx.fillRect(118, 18, 24, 24);
  ctx.fillStyle = '#fff';
  ctx.fillRect(124, 24, 12, 12);

  ctx.fillRect(10, 110, 40, 40);
  ctx.fillStyle = '#000';
  ctx.fillRect(18, 118, 24, 24);
  ctx.fillStyle = '#fff';
  ctx.fillRect(24, 124, 12, 12);

  // Draw random pixels
  ctx.fillStyle = '#fff';
  for (let x = 10; x < 150; x += 6) {
    for (let y = 10; y < 150; y += 6) {
      if ((x < 55 && y < 55) || (x > 105 && y < 55) || (x < 55 && y > 105)) continue; // skip anchors
      if (Math.random() > 0.45) {
        ctx.fillRect(x, y, 5, 5);
      }
    }
  }

  // Draw tiny bus icon in middle
  ctx.fillStyle = 'var(--secondary)';
  ctx.beginPath();
  ctx.arc(80, 80, 15, 0, Math.PI * 2);
  ctx.fill();

  canvasDisplay.appendChild(canvas);
}

function confirmQRBooking() {
  const routeId = document.getElementById('qr-route-select').value;
  const route = db.routes.find(r => r.routeId === routeId);
  const successMsg = activeLanguage === 'ta'
    ? `முன்பதிவு வெற்றிகரமாக முடிந்தது! டிக்கெட் தடம் ${route.routeNum}-க்கு உறுதி செய்யப்பட்டது.`
    : `Ticket Booked Successfully! Smart QR pass generated for Route ${route.routeNum}.`;
  alert(successMsg);
  closeQRModal();
}

// --------------------------------------------------------------------------
// ADMIN CONTROL PANEL ACTIONS & KPIS
// --------------------------------------------------------------------------
function updateAdminKPIs() {
  const totalBuses = db.buses.length;
  const delayedBuses = db.buses.filter(b => b.status === 'DELAYED' || b.delayMinutes > 5).length;
  const onTimeBuses = totalBuses - delayedBuses;

  // Waiting time changes with weather/traffic factors
  const weatherVal = document.getElementById('weather-select').value;
  const trafficVal = document.getElementById('traffic-select').value;
  let baseWait = 10;
  if (trafficVal === 'moderate') baseWait += 4;
  if (trafficVal === 'heavy') baseWait += 9;
  if (weatherVal === 'rainy') baseWait += 3;
  if (weatherVal === 'stormy') baseWait += 7;

  document.getElementById('kpi-total-buses').textContent = totalBuses;
  document.getElementById('kpi-ontime-count').textContent = onTimeBuses;
  document.getElementById('kpi-delayed-count').textContent = delayedBuses;
  document.getElementById('kpi-avg-wait').textContent = `${baseWait}m`;

  const changeElem = document.getElementById('kpi-wait-change');
  if (baseWait <= 10) {
    changeElem.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> -3 min`;
    changeElem.className = "kpi-change up";
  } else {
    changeElem.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +${baseWait - 10} min`;
    changeElem.className = "kpi-change down";
  }
}

function fillLeastFrequentTable() {
  const tbody = document.getElementById('least-frequent-routes-table');
  tbody.innerHTML = '';

  db.routes.forEach(r => {
    const runningBusesCount = db.buses.filter(b => b.routeId === r.routeId).length;
    let frequencyScore = 'Good';
    let freqBadgeClass = 'badge-success';
    let demand = 'Medium';
    let demandBadgeClass = 'badge-primary';

    if (runningBusesCount <= 2) {
      frequencyScore = 'Critical';
      freqBadgeClass = 'badge-danger';
      demand = 'High';
      demandBadgeClass = 'badge-danger';
    } else if (runningBusesCount <= 3) {
      frequencyScore = 'Moderate';
      freqBadgeClass = 'badge-warning';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>Route ${r.routeNum}</strong></td>
      <td>${activeLanguage === 'ta' ? r.destinationTa : r.destination}</td>
      <td><span style="font-weight: 600;">${runningBusesCount} Buses</span></td>
      <td><span class="badge ${freqBadgeClass}">${frequencyScore}</span></td>
      <td><span class="badge ${demandBadgeClass}">${demand}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function addBusToLeastFrequent() {
  // Find route with lowest bus count
  let minBuses = 999;
  let targetRoute = null;

  db.routes.forEach(r => {
    const count = db.buses.filter(b => b.routeId === r.routeId).length;
    if (count < minBuses) {
      minBuses = count;
      targetRoute = r;
    }
  });

  if (targetRoute) {
    db.addedBusesCount++;
    const newBusId = `B_ADD_${db.addedBusesCount}`;
    const newBusNum = `TN-01-N-ADD${String(db.addedBusesCount).padStart(2, '0')}`;
    
    // Add extra driver if needed
    const newDriverId = `D_ADD_${db.addedBusesCount}`;
    db.drivers.push({
      driverId: newDriverId,
      name: `Added Driver ${db.addedBusesCount}`,
      nameTa: `கூடுதல் ஓட்டுநர் ${db.addedBusesCount}`,
      score: 90,
      delays: 0
    });

    db.buses.push({
      busId: newBusId,
      busNum: newBusNum,
      routeId: targetRoute.routeId,
      driverId: newDriverId,
      status: 'RUNNING',
      pathIndex: 0,
      direction: 1,
      speed: 40,
      delayMinutes: 0,
      load: 'Low'
    });

    // Notify
    alert(`Success: Deployed Bus ${newBusNum} on Route ${targetRoute.routeNum} to improve frequency!`);
    
    // Recalculate
    recalculateAIPredictions();
    fillLeastFrequentTable();
    fillDriverTable();
    renderDatabaseTable();
    updateRouteChartData();
  }
}

function fillDriverTable() {
  const tbody = document.getElementById('driver-performance-table');
  tbody.innerHTML = '';

  db.drivers.forEach(d => {
    const bus = db.buses.find(b => b.driverId === d.driverId);
    const busNum = bus ? bus.busNum : 'Standby';
    const safetyGlow = d.score >= 90 ? 'var(--success)' : d.score >= 80 ? 'var(--warning)' : 'var(--danger)';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${activeLanguage === 'ta' ? d.nameTa : d.name}</strong></td>
      <td><span style="color: var(--primary); font-family: monospace;">${busNum}</span></td>
      <td>${d.delays} times</td>
      <td><span style="color: ${safetyGlow}; font-weight: bold;">${d.score}%</span></td>
      <td>${'★'.repeat(Math.round(d.score / 20))}${'☆'.repeat(5 - Math.round(d.score / 20))}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --------------------------------------------------------------------------
// CCTV CROWD MONITORING SIMULATOR
// --------------------------------------------------------------------------
function triggerCCTVSimulation() {
  db.cctvAlertActive = !db.cctvAlertActive;

  const viewport = document.getElementById('cctv-viewport');
  const countBox = document.getElementById('cctv-passenger-count');
  const statusBox = document.getElementById('cctv-congestion-status');
  const container = document.getElementById('cctv-bounding-boxes-container');

  container.innerHTML = '';

  if (db.cctvAlertActive) {
    viewport.style.border = '2px solid var(--danger)';
    viewport.style.boxShadow = '0 0 15px var(--danger-glow)';
    
    countBox.textContent = "38 People";
    countBox.style.color = "var(--danger)";
    statusBox.textContent = "CRITICAL PEAK";
    statusBox.style.color = "var(--danger)";

    // Inject AI detection bounding boxes overlaying the camera viewport
    for (let i = 0; i < 6; i++) {
      const box = document.createElement('div');
      box.className = 'cctv-ai-box';
      box.style.top = `${Math.floor(Math.random() * 50) + 20}%`;
      box.style.left = `${Math.floor(Math.random() * 70) + 10}%`;
      box.style.width = '40px';
      box.style.height = '70px';
      box.innerHTML = `PERSON<br/>98.4%`;
      container.appendChild(box);
    }

    // Display banner alerts
    document.getElementById('admin-ai-alert-box').style.display = 'flex';
    
    // Speak Warning in simple mode
    if (isSimpleMode) {
      speakText("Warning: High crowd density detected at central stop. Recommend deploying extra bus.", activeLanguage);
    }
  } else {
    // reset
    viewport.style.border = '1px solid var(--glass-border)';
    viewport.style.boxShadow = 'none';
    
    countBox.textContent = "8 People";
    countBox.style.color = "var(--text-primary)";
    statusBox.textContent = "Low";
    statusBox.style.color = "var(--success)";

    document.getElementById('admin-ai-alert-box').style.display = 'none';
  }

  // refresh headers
  applyLanguage();
}

function deployRecommendedBus() {
  // Deploys bus on Route 101 to relieve peak demand
  addBusToLeastFrequent();
  // Reset CCTV Peak
  triggerCCTVSimulation();
}

// --------------------------------------------------------------------------
// DATABASE SCHEMA VISUALIZER
// --------------------------------------------------------------------------
function switchDbTable(tableName) {
  databaseSelectedTable = tableName;
  
  // Toggle tab buttons
  const tabs = document.querySelectorAll('.db-tab-btn');
  tabs.forEach(t => t.classList.remove('active'));

  const activeTabIdx = tableName === 'bus' ? 0 : tableName === 'route' ? 1 : tableName === 'gps' ? 2 : 3;
  tabs[activeTabIdx].classList.add('active');

  renderDatabaseTable();
}

function renderDatabaseTable() {
  const table = document.getElementById('db-visualizer-table');
  table.innerHTML = '';

  if (databaseSelectedTable === 'bus') {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Bus ID</th>
          <th>Bus Number</th>
          <th>Route ID</th>
          <th>Driver ID</th>
          <th>Status</th>
          <th>ETA Delay</th>
        </tr>
      </thead>
      <tbody>
        ${db.buses.map(b => `
          <tr>
            <td><strong>${b.busId}</strong></td>
            <td><span style="color: var(--primary); font-family: monospace;">${b.busNum}</span></td>
            <td>Route ${b.routeId}</td>
            <td>${b.driverId}</td>
            <td><span class="badge ${b.status === 'DELAYED' ? 'badge-warning' : 'badge-success'}">${b.status}</span></td>
            <td>+${b.delayMinutes} min</td>
          </tr>
        `).join('')}
      </tbody>
    `;
  } else if (databaseSelectedTable === 'route') {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Route ID</th>
          <th>Number</th>
          <th>Source</th>
          <th>Destination</th>
          <th>Distance</th>
          <th>Route Path Points</th>
        </tr>
      </thead>
      <tbody>
        ${db.routes.map(r => `
          <tr>
            <td><strong>${r.routeId}</strong></td>
            <td><span class="badge badge-primary">R-${r.routeNum}</span></td>
            <td>${activeLanguage === 'ta' ? r.sourceTa : r.source}</td>
            <td>${activeLanguage === 'ta' ? r.destinationTa : r.destination}</td>
            <td>${r.distance} km</td>
            <td>${r.path.length} coords loaded</td>
          </tr>
        `).join('')}
      </tbody>
    `;
  } else if (databaseSelectedTable === 'gps') {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Tracking ID</th>
          <th>Bus ID</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${db.gpsTracking.slice(-6).map(g => `
          <tr>
            <td><strong>${g.trackingId}</strong></td>
            <td>${g.busId}</td>
            <td>${g.latitude.toFixed(6)}</td>
            <td>${g.longitude.toFixed(6)}</td>
            <td><span style="font-size:0.65rem; color:var(--text-muted);">${g.timestamp}</span></td>
          </tr>
        `).join('')}
      </tbody>
    `;
  } else if (databaseSelectedTable === 'timetable') {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Schedule ID</th>
          <th>Bus ID</th>
          <th>Route ID</th>
          <th>Departure</th>
          <th>Scheduled Arrival</th>
        </tr>
      </thead>
      <tbody>
        ${db.timetable.slice(0, 7).map(t => `
          <tr>
            <td><strong>${t.timetableId}</strong></td>
            <td>${t.busId}</td>
            <td>Route ${t.routeId}</td>
            <td>${t.departureTime}</td>
            <td>${t.arrivalTime}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
  }
}

// --------------------------------------------------------------------------
// PHYSICS LOOP & BUS MOVEMENT SIMULATION
// --------------------------------------------------------------------------
function startSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(() => {
    if (simulationSpeed === 0) return; // paused

    db.buses.forEach(b => {
      if (b.status === 'OUT_OF_SERVICE') return;

      const route = db.routes.find(r => r.routeId === b.routeId);
      if (!route) return;

      // Update index on path coordinates
      let nextIndex = b.pathIndex + (b.direction * 1);

      if (nextIndex >= route.path.length) {
        // Reverse direction or loop
        b.direction = -1;
        nextIndex = route.path.length - 2;
      } else if (nextIndex < 0) {
        b.direction = 1;
        nextIndex = 1;
      }

      b.pathIndex = nextIndex;

      // Seed GPS tracking log inside mock database table
      const coords = route.path[nextIndex];
      const timeStr = new Date().toISOString();
      const trackingId = `G_${b.busId}_${Date.now()}`;
      
      db.gpsTracking.push({
        trackingId: trackingId,
        busId: b.busId,
        latitude: coords[0],
        longitude: coords[1],
        timestamp: timeStr
      });
      
      // Cap size of GPS tracking table to prevent memory leaks
      if (db.gpsTracking.length > 100) {
        db.gpsTracking.shift();
      }
    });

    // Sync views
    updateBusMarkersOnMap();
    fillTimetable();
    renderDatabaseTable();
    
    // Auto-update timestamps inside CCTV frame
    document.getElementById('cctv-timestamp').textContent = `LIVE: ${new Date().toISOString().slice(0,19).replace('T', ' ')}`;
  }, 4000); // simulation ticks every 4 seconds

  // Bind speed buttons click listeners
  document.getElementById('btn-speed-pause').onclick = () => setSpeed(0);
  document.getElementById('btn-speed-1x').onclick = () => setSpeed(1);
  document.getElementById('btn-speed-2x').onclick = () => setSpeed(2);
  document.getElementById('btn-speed-5x').onclick = () => setSpeed(5);
}

function setSpeed(speedVal) {
  simulationSpeed = speedVal;
  
  // Update GUI buttons active states
  document.getElementById('btn-speed-pause').classList.remove('active');
  document.getElementById('btn-speed-1x').classList.remove('active');
  document.getElementById('btn-speed-2x').classList.remove('active');
  document.getElementById('btn-speed-5x').classList.remove('active');

  if (speedVal === 0) {
    document.getElementById('btn-speed-pause').classList.add('active');
    document.getElementById('sim-status-state').textContent = activeLanguage === 'ta' ? 'நிறுத்தப்பட்டது' : 'PAUSED';
    document.getElementById('sim-status-state').style.color = 'var(--danger)';
  } else {
    document.getElementById(`btn-speed-${speedVal}x`).classList.add('active');
    document.getElementById('sim-status-state').textContent = activeLanguage === 'ta' ? 'இயங்குகிறது' : 'LIVE';
    document.getElementById('sim-status-state').style.color = 'var(--success)';
    
    // Adjust simulator interval rate based on multiplier
    clearInterval(simulationInterval);
    simulationInterval = setInterval(() => {
      // Loop movement logic
      db.buses.forEach(b => {
        const route = db.routes.find(r => r.routeId === b.routeId);
        if (!route) return;
        let nextIndex = b.pathIndex + (b.direction * 1);
        if (nextIndex >= route.path.length) { b.direction = -1; nextIndex = route.path.length - 2; }
        else if (nextIndex < 0) { b.direction = 1; nextIndex = 1; }
        b.pathIndex = nextIndex;
      });
      updateBusMarkersOnMap();
      fillTimetable();
      renderDatabaseTable();
    }, 4000 / speedVal);
  }
}

// --------------------------------------------------------------------------
// ADMIN CHART.JS INTEGRATION
// --------------------------------------------------------------------------
function initCharts() {
  // Chart 1: Route-wise Bus Allocation
  const ctx1 = document.getElementById('chartRouteBusCount').getContext('2d');
  chartRouteBusCount = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Route 101', 'Route 202', 'Route 303'],
      datasets: [{
        label: 'Bus Count',
        data: getRouteBusCounts(),
        backgroundColor: ['rgba(56, 189, 248, 0.45)', 'rgba(139, 92, 246, 0.45)', 'rgba(16, 185, 129, 0.45)'],
        borderColor: ['#38bdf8', '#8b5cf6', '#10b981'],
        borderWidth: 1.5
      }]
    },
    options: getChartOptions()
  });

  // Chart 2: Hourly Passenger Demand (AI Predicted)
  const ctx2 = document.getElementById('chartPassengerDemand').getContext('2d');
  chartPassengerDemand = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      datasets: [{
        label: 'Predicted Passenger Volume',
        data: [180, 240, 110, 130, 290, 380, 210, 80],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        fill: true,
        tension: 0.4
      }]
    },
    options: getChartOptions()
  });

  // Chart 3: Delay Statistics
  const ctx3 = document.getElementById('chartDelayStats').getContext('2d');
  chartDelayStats = new Chart(ctx3, {
    type: 'doughnut',
    data: {
      labels: ['On Time', 'Minor Delay (<10m)', 'Major Delay (>10m)'],
      datasets: [{
        data: getDelayStatusCounts(),
        backgroundColor: ['rgba(16, 185, 129, 0.55)', 'rgba(245, 158, 11, 0.55)', 'rgba(239, 68, 68, 0.55)'],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });

  // Chart 4: Peak Traffic congestion level
  const ctx4 = document.getElementById('chartTrafficAnalysis').getContext('2d');
  chartTrafficAnalysis = new Chart(ctx4, {
    type: 'radar',
    data: {
      labels: ['Central', 'Egmore', 'Nungambakkam', 'Mylapore', 'Guindy', 'Adyar'],
      datasets: [{
        label: 'Congestion Factor',
        data: [85, 60, 75, 50, 90, 65],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { color: '#94a3b8' },
          ticks: { backdropColor: 'transparent', color: '#64748b' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function getRouteBusCounts() {
  return [
    db.buses.filter(b => b.routeId === '101').length,
    db.buses.filter(b => b.routeId === '202').length,
    db.buses.filter(b => b.routeId === '303').length
  ];
}

function getDelayStatusCounts() {
  const onTime = db.buses.filter(b => b.delayMinutes === 0).length;
  const minor = db.buses.filter(b => b.delayMinutes > 0 && b.delayMinutes <= 10).length;
  const major = db.buses.filter(b => b.delayMinutes > 10).length;
  return [onTime, minor, major];
}

function updateRouteChartData() {
  if (chartRouteBusCount) {
    chartRouteBusCount.data.datasets[0].data = getRouteBusCounts();
    chartRouteBusCount.update();
  }
}

function updateDelayChartData() {
  if (chartDelayStats) {
    chartDelayStats.data.datasets[0].data = getDelayStatusCounts();
    chartDelayStats.update();
  }
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };
}
