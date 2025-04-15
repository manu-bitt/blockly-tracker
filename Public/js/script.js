// Initialize map
const map = L.map('map').setView([18.5204, 73.8567], 12); // Center on Pune

// Add map layers
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Humanitarian style map - more contrast, good for tracking
const humanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: 'Manu----Tracker | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19
});

// Layer control with only two map options
L.control.layers({
    "Streets": streets,
    "Humanitarian": humanitarian
}).addTo(map);

// Variables
let currentLocationMarker = null;
let currentRoute = null;
let animatedMarker = null;
let routeCoordinates = [];
let currentSpeed = 'normal';
let currentMarkerType = 'car';

// Historical routes data
const historyData = {
    yesterday: {
        title: "Yesterday",
        waypoints: [
            L.latLng(18.5309, 73.8539),  // Shaniwar Wada
            L.latLng(18.5195, 73.8553),  // Dagdusheth Halwai Ganpati Temple
            L.latLng(18.5099, 73.8371)   // Aga Khan Palace
        ],
        color: '#FF5722'
    },
    twoDaysAgo: {
        title: "2 Days Ago",
        waypoints: [
            L.latLng(18.5619, 73.9159),  // Koregaon Park
            L.latLng(18.5593, 73.9127),  // Phoenix Marketcity
            L.latLng(18.5074, 73.9274)   // Magarpatta City
        ],
        color: '#9C27B0'
    }
};

// Available vehicle icons
const vehicleIcons = {
    car: L.icon({
        iconUrl: 'img/car_5615874.png',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    }),
    suv: L.icon({
        iconUrl: 'img/vecteezy_white-suv-on-transparent-background-3d-rendering_25310748.png',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    }),
    bike: L.icon({
        iconUrl: 'img/school-bus_9972260.png',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    })
};

// Other marker icons
const startIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const endIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684850.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const waypointIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Animation speeds
const animationSpeeds = {
    slow: { distance: 300, interval: 800 },
    normal: { distance: 500, interval: 500 },
    fast: { distance: 800, interval: 200 }
};

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                currentLocationMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup("You are here").openPopup();
                map.setView([lat, lng], 15);
            },
            function() {
                map.setView([18.5204, 73.8567], 12);
            }
        );
    } else {
        map.setView([18.5204, 73.8567], 12);
    }
}

// Show historical route
function showHistoricalRoute(routeKey) {
    clearRoute();
    
    const routeData = historyData[routeKey];
    const loadingMsg = createLoadingMessage();
    
    const router = L.Routing.control({
        waypoints: routeData.waypoints,
        routeWhileDragging: false,
        show: false,
        createMarker: function() { return null; },
    lineOptions: {
            styles: [{color: routeData.color, opacity: 0.7, weight: 5}]
        }
    }).addTo(map);
    
    router.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
            map.removeControl(loadingMsg);
            
            const route = routes[0];
            routeCoordinates = route.coordinates.map(coord => [coord.lat, coord.lng]);
            currentRoute = router;
            
            addRouteMarkers(routeData.waypoints);
            
            document.getElementById('startAnimation').disabled = false;
            document.querySelectorAll('.history-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(routeKey + 'Btn').classList.add('active');
            
            showRouteSummary(route, routeData.title);
        }
    });
}

// Create loading message
function createLoadingMessage() {
    const loadingMessage = L.control({position: 'topright'});
    loadingMessage.onAdd = function() {
        const container = L.DomUtil.create('div');
        const messageBox = L.DomUtil.create('div', 'loading-box', container);
        messageBox.textContent = 'Creating route...';
        return container;
    };
    loadingMessage.addTo(map);
    return loadingMessage;
}

// Show route summary
function showRouteSummary(route, title) {
    const routeSummary = L.control({position: 'bottomleft'});
    routeSummary.onAdd = function() {
        // Create container
        const container = L.DomUtil.create('div');
        
        // Create summary box
        const summaryBox = L.DomUtil.create('div', 'summary-box', container);
        
        // Add title
        const titleElem = L.DomUtil.create('h4', '', summaryBox);
        titleElem.textContent = title;
        
        // Add stats container
        const statsContainer = L.DomUtil.create('div', 'stats-container', summaryBox);
        
        // Add distance
        const distanceDiv = L.DomUtil.create('div', '', statsContainer);
        const distanceLabel = L.DomUtil.create('strong', '', distanceDiv);
        distanceLabel.textContent = 'Distance: ';
        distanceDiv.appendChild(document.createTextNode((route.summary.totalDistance / 1000).toFixed(1) + ' km'));
        
        // Add time
        const timeDiv = L.DomUtil.create('div', '', statsContainer);
        const timeLabel = L.DomUtil.create('strong', '', timeDiv);
        timeLabel.textContent = 'Time: ';
        timeDiv.appendChild(document.createTextNode(Math.round(route.summary.totalTime / 60) + ' min'));
        
        return container;
    };
    
    routeSummary.addTo(map);
    currentRoute.summary = routeSummary;
}

// Add route markers
function addRouteMarkers(waypoints) {
    if (!waypoints || waypoints.length < 2) return;
    
    // Start marker
    L.marker(waypoints[0], {icon: startIcon}).addTo(map).bindPopup('Start Point');
    
    // End marker
    L.marker(waypoints[waypoints.length - 1], {icon: endIcon}).addTo(map).bindPopup('End Point');
    
    // Intermediate waypoints
    for (let i = 1; i < waypoints.length - 1; i++) {
        L.marker(waypoints[i], {icon: waypointIcon}).addTo(map).bindPopup(`Waypoint ${i}`);
    }
}

// Animate the marker along the route
function animateRoute() {
    if (animatedMarker) {
        map.removeLayer(animatedMarker);
    }
    
    if (!routeCoordinates || routeCoordinates.length < 2) return;
    
    const speedSettings = animationSpeeds[currentSpeed];
    
    animatedMarker = L.animatedMarker(routeCoordinates, {
        icon: vehicleIcons[currentMarkerType],
        autoStart: true,
        distance: speedSettings.distance,
        interval: speedSettings.interval,
        onEnd: function() {
            const endPoint = routeCoordinates[routeCoordinates.length - 1];
            L.popup()
                .setLatLng(endPoint)
                .setContent("<strong>Destination reached!</strong><br>Journey completed successfully.")
                .openOn(map);
    }
}).addTo(map);

    document.getElementById('startAnimation').disabled = true;
    document.getElementById('stopAnimation').disabled = false;
}

// Stop animation
function stopAnimation() {
    if (animatedMarker) {
        map.removeLayer(animatedMarker);
        animatedMarker = null;
        document.getElementById('startAnimation').disabled = false;
        document.getElementById('stopAnimation').disabled = true;
    }
}

// Change animation speed
function changeSpeed(speed) {
    currentSpeed = speed;
    
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(speed + 'Speed').classList.add('active');
    
    if (animatedMarker) {
        const currentPosition = animatedMarker.getLatLng();
        
        // Find closest point on route
        let closestPointIndex = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < routeCoordinates.length; i++) {
            const point = routeCoordinates[i];
            const distance = map.distance(currentPosition, point);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPointIndex = i;
            }
        }
        
        const remainingRoute = routeCoordinates.slice(closestPointIndex);
        map.removeLayer(animatedMarker);
        
        const speedSettings = animationSpeeds[currentSpeed];
        animatedMarker = L.animatedMarker(remainingRoute, {
            icon: vehicleIcons[currentMarkerType],
            autoStart: true,
            distance: speedSettings.distance,
            interval: speedSettings.interval,
            onEnd: function() {
                const endPoint = routeCoordinates[routeCoordinates.length - 1];
                L.popup()
                    .setLatLng(endPoint)
                    .setContent("<strong>Destination reached!</strong><br>Journey completed successfully.")
                    .openOn(map);
            }
        }).addTo(map);
    }
}

// Change marker type
function changeMarkerType(type) {
    currentMarkerType = type;
    
    // Update active marker in UI
    document.querySelectorAll('.marker-image').forEach(img => {
        img.classList.remove('active');
    });
    document.getElementById(type + 'Marker').classList.add('active');
    
    // Update the marker if animation is running
    if (animatedMarker) {
        const currentPosition = animatedMarker.getLatLng();
        
        // Find closest point on route
        let closestPointIndex = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < routeCoordinates.length; i++) {
            const point = routeCoordinates[i];
            const distance = map.distance(currentPosition, point);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPointIndex = i;
            }
        }
        
        const remainingRoute = routeCoordinates.slice(closestPointIndex);
        map.removeLayer(animatedMarker);
        
        const speedSettings = animationSpeeds[currentSpeed];
        animatedMarker = L.animatedMarker(remainingRoute, {
            icon: vehicleIcons[type],
            autoStart: true,
            distance: speedSettings.distance,
            interval: speedSettings.interval,
            onEnd: function() {
                const endPoint = routeCoordinates[routeCoordinates.length - 1];
                L.popup()
                    .setLatLng(endPoint)
                    .setContent("<strong>Destination reached!</strong><br>Journey completed successfully.")
                    .openOn(map);
            }
        }).addTo(map);
    }
}

// Clear route and animation
function clearRoute() {
    if (currentRoute) {
        map.removeControl(currentRoute);
        
        if (currentRoute.summary) {
            map.removeControl(currentRoute.summary);
        }
        
        currentRoute = null;
    }
    
    if (animatedMarker) {
        map.removeLayer(animatedMarker);
        animatedMarker = null;
    }
    
    routeCoordinates = [];
    
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker && layer !== currentLocationMarker) {
            map.removeLayer(layer);
        }
    });
    
    document.getElementById('startAnimation').disabled = true;
    document.getElementById('stopAnimation').disabled = true;
    
    document.querySelectorAll('.history-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Create UI controls
function createControls() {
    // History control
    const historyControl = L.control({position: 'topright'});
    historyControl.onAdd = function() {
        // Create main container
        const container = L.DomUtil.create('div');
        
        // Create panel div
        const panel = L.DomUtil.create('div', 'history-panel', container);
        
        // Add heading
        const heading = L.DomUtil.create('h4', '', panel);
        heading.textContent = 'Location History';
        
        // Create button container
        const buttonContainer = L.DomUtil.create('div', 'history-btn-container', panel);
        
        // Yesterday button
        const yesterdayBtn = L.DomUtil.create('button', 'history-btn btn', buttonContainer);
        yesterdayBtn.id = 'yesterdayBtn';
        yesterdayBtn.textContent = 'Yesterday';
        
        // 2 Days Ago button
        const twoDaysAgoBtn = L.DomUtil.create('button', 'history-btn btn', buttonContainer);
        twoDaysAgoBtn.id = 'twoDaysAgoBtn';
        twoDaysAgoBtn.textContent = '2 Days Ago';
        
        // Clear button
        const clearBtn = L.DomUtil.create('button', 'btn', buttonContainer);
        clearBtn.id = 'clearBtn';
        clearBtn.textContent = 'Clear Route';
        
        return container;
    };
    historyControl.addTo(map);
    
    // Animation controls
    setupAnimationControls();
}

// Set up animation controls
function setupAnimationControls() {
    const animationControl = L.control({position: 'bottomcenter'});
    
    // Create custom position for bottom center
    if (!L.Control.BottomCenter) {
        L.Control.BottomCenter = L.Control.extend({
            options: { position: 'bottomcenter' },
            onAdd: function(map) { return this._container; }
        });
        
        L.control.bottomcenter = function(opts) {
            return new L.Control.BottomCenter(opts);
        };
        
        map._controlCorners.bottomcenter = L.DomUtil.create('div', 'leaflet-bottom leaflet-center', map._controlContainer);
    }
    
    animationControl.onAdd = function() {
        // Create main container
        const container = L.DomUtil.create('div', 'animation-control');
        
        // Create control panel
        const panel = L.DomUtil.create('div', 'animation-panel', container);
        
        // Create layout container
        const layout = L.DomUtil.create('div', 'animation-layout', panel);
        
        // Speed buttons container
        const speedContainer = L.DomUtil.create('div', 'speed-container', layout);
        
        // Slow speed button
        const slowBtn = L.DomUtil.create('button', 'speed-btn', speedContainer);
        slowBtn.id = 'slowSpeed';
        slowBtn.textContent = 'Slow';
        
        // Normal speed button
        const normalBtn = L.DomUtil.create('button', 'speed-btn active', speedContainer);
        normalBtn.id = 'normalSpeed';
        normalBtn.textContent = 'Normal';
        
        // Fast speed button
        const fastBtn = L.DomUtil.create('button', 'speed-btn', speedContainer);
        fastBtn.id = 'fastSpeed';
        fastBtn.textContent = 'Fast';
        
        // Animation control buttons
        const controlBtns = L.DomUtil.create('div', 'animation-buttons', layout);
        
        // Start button
        const startBtn = L.DomUtil.create('button', 'animation-btn btn', controlBtns);
        startBtn.id = 'startAnimation';
        startBtn.disabled = true;
        startBtn.textContent = 'Start';
        
        // Stop button
        const stopBtn = L.DomUtil.create('button', 'animation-btn btn', controlBtns);
        stopBtn.id = 'stopAnimation';
        stopBtn.disabled = true;
        stopBtn.textContent = 'Stop';
        
        // Marker selection container
        const markerSelection = L.DomUtil.create('div', 'marker-selection', panel);
        
        // Car marker option
        const carOption = L.DomUtil.create('div', 'marker-option', markerSelection);
        const carImage = L.DomUtil.create('img', 'marker-image active', carOption);
        carImage.id = 'carMarker';
        carImage.src = 'img/car_5615874.png';
        carImage.alt = 'Car';
        carImage.title = 'Car';
        carImage.setAttribute('data-marker-type', 'car');
        const carLabel = L.DomUtil.create('span', 'marker-label', carOption);
        carLabel.textContent = 'Car';
        
        // SUV marker option
        const suvOption = L.DomUtil.create('div', 'marker-option', markerSelection);
        const suvImage = L.DomUtil.create('img', 'marker-image', suvOption);
        suvImage.id = 'suvMarker';
        suvImage.src = 'img/vecteezy_white-suv-on-transparent-background-3d-rendering_25310748.png';
        suvImage.alt = 'SUV';
        suvImage.title = 'SUV';
        suvImage.setAttribute('data-marker-type', 'suv');
        const suvLabel = L.DomUtil.create('span', 'marker-label', suvOption);
        suvLabel.textContent = 'SUV';
        
        // Bike marker option
        const bikeOption = L.DomUtil.create('div', 'marker-option', markerSelection);
        const bikeImage = L.DomUtil.create('img', 'marker-image', bikeOption);
        bikeImage.id = 'bikeMarker';
        bikeImage.src = 'img/school-bus_9972260.png';
        bikeImage.alt = 'Bus';
        bikeImage.title = 'Bus';
        bikeImage.setAttribute('data-marker-type', 'bike');
        const bikeLabel = L.DomUtil.create('span', 'marker-label', bikeOption);
        bikeLabel.textContent = 'Bus';
        
        return container;
    };
    
    animationControl.addTo(map);
}

// Initialize app and add event listeners
function init() {
    getCurrentLocation();
    createControls();
    
    document.addEventListener('click', function(e) {
        if (e.target.id === 'yesterdayBtn') showHistoricalRoute('yesterday');
        else if (e.target.id === 'twoDaysAgoBtn') showHistoricalRoute('twoDaysAgo');
        else if (e.target.id === 'clearBtn') clearRoute();
        else if (e.target.id === 'startAnimation') animateRoute();
        else if (e.target.id === 'stopAnimation') stopAnimation();
        else if (e.target.id === 'slowSpeed') changeSpeed('slow');
        else if (e.target.id === 'normalSpeed') changeSpeed('normal');
        else if (e.target.id === 'fastSpeed') changeSpeed('fast');
        else if (e.target.classList.contains('marker-image')) {
            const markerType = e.target.getAttribute('data-marker-type');
            if (markerType) changeMarkerType(markerType);
        }
    });
}

// Start the application
init();
