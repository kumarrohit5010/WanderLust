// Insert your API key here

const [longitude, latitude] = coordinates;

// Use with TomTom Map
function initMap() {
  const map = tt.map({
    key: mapToken,
    container: 'map',
    center: [longitude, latitude],
    zoom: 6
  });
  
  // Add a marker
  const marker = new tt.Marker({ color: "red" })
    .setLngLat([longitude, latitude])

    
    .setPopup(new tt.Popup({offset:25}).setHTML(
      `<h6>${locationName}</h6><p>Exact location will be shown after Booking.</p>`
    ))

    .addTo(map);
  
  // Add navigation control
  map.addControl(new tt.NavigationControl());
  
  console.log(coordinates);
  
  return map;
}

// Call on page load
window.onload = initMap;