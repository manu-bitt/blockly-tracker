// call socket in script
const socket=io()

// browser ke liye check karenge if Geolocation is available or not
if (navigator.geolocation ){
    // ye position batayega
    navigator.geolocation.watchPosition(
        (position) => {
            const {latitude,longitude} = position.coords

            // coordinates pata chalenege yha se

            // frontend se event emit phle function preform hoga then error handle hoga then settings of data
            socket.emit('send-location', {latitude, longitude})
        },
        (error) => {
            console.error(error)
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    )
}
// ab marker banayenge
const marker={}

// ab map setup hoga  set view([initial cordinates],zoom)
const map = L.map('map').setView([0,0], 10);

// Standard street map layer
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
});

// Satellite view layer
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
});

// Add the default layer to the map
streets.addTo(map);

// Define basemaps object for layer control
const baseMaps = {
    "Streets": streets,
    "Satellite": satellite
};

// Add layer control to switch between map types
L.control.layers(baseMaps).addTo(map);

// socket recieve karega frontend pe data
socket.on('receive-location',(data)=>{
    // data ko store karenge
    const {id,latitude,longitude}=data;
    // fir map pe set karenge
    map.setView([latitude,longitude],20)
     
    // setting marker
    if (marker[id]){
        marker[id].setLatLng([latitude,longitude])
    }
    else{
        marker[id]=L.marker([latitude,longitude]).addTo(map)
    }
    
})
socket.on('user-disconnected',(id)=>{
    if(marker[id]){
        map.removeLayer(marker[id])
        delete marker[id]
    }
})
