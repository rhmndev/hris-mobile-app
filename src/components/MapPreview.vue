<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  latitude: number | null
  longitude: number | null
  companyLatitude?: number | null
  companyLongitude?: number | null
  companyRadius?: number | null // in meters
  height?: string
  hidePopups?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  hidePopups: false
})

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
let circle: L.Circle | null = null

// Fix for default marker icon issue in webpack/vite
const fixDefaultIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

const initMap = () => {
  if (!mapContainer.value) return

  fixDefaultIcon()

  // Initialize map - center on company location if available, otherwise use current location or default
  const centerLat = props.companyLatitude ?? props.latitude ?? -6.2088
  const centerLng = props.companyLongitude ?? props.longitude ?? 106.8456
  const zoom = props.companyLatitude && props.companyLongitude && props.companyRadius ? 15 : 13

  map = L.map(mapContainer.value).setView([centerLat, centerLng], zoom)

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  // Update map with company circle and marker
  updateCompanyCircle()
  if (props.latitude && props.longitude) {
    updateMarker()
  }
}

const updateCompanyCircle = () => {
  if (!map || !props.companyLatitude || !props.companyLongitude || !props.companyRadius) {
    // Remove circle if company data is not available
    if (circle && map) {
      map.removeLayer(circle)
      circle = null
    }
    return
  }

  const companyLat = props.companyLatitude
  const companyLng = props.companyLongitude
  const radius = props.companyRadius

  // Remove existing circle if any
  if (circle) {
    map.removeLayer(circle)
  }

  // Create circle for company radius (without marker)
  circle = L.circle([companyLat, companyLng], {
    radius: radius,
    color: '#3b82f6', // blue color
    fillColor: '#3b82f6',
    fillOpacity: 0.2,
    weight: 2,
  }).addTo(map)

  // Fit map to show the entire circle with padding
  // Get bounds from circle and add padding to ensure full visibility
  const circleBounds = circle.getBounds()
  
  if (props.latitude && props.longitude) {
    // Include current location in bounds
    const locationPoint = L.latLng(props.latitude, props.longitude)
    const bounds = circleBounds.extend(locationPoint)
    map.fitBounds(bounds, { padding: [80, 80] })
  } else {
    // Just fit to circle with padding
    map.fitBounds(circleBounds, { padding: [80, 80] })
  }
}

const updateMarker = () => {
  if (!map || !props.latitude || !props.longitude) return

  const lat = props.latitude
  const lng = props.longitude

  // Remove existing marker if any
  if (marker) {
    map.removeLayer(marker)
  }

  // Create new marker for current location
  marker = L.marker([lat, lng]).addTo(map)

  // Add popup to marker (but don't auto-open to avoid blocking other UI)
  marker.bindPopup('Lokasi Saat Ini')
  
  // Close popup if hidePopups is true
  if (props.hidePopups) {
    map.closePopup()
  }

  // Fit map to show both company circle and current location if company data is available
  if (props.companyLatitude && props.companyLongitude && props.companyRadius && circle) {
    const locationPoint = L.latLng(lat, lng)
    const circleBounds = circle.getBounds()
    const bounds = circleBounds.extend(locationPoint)
    map.fitBounds(bounds, { padding: [80, 80] })
  } else {
    map.setView([lat, lng], 15)
  }
}

watch(
  () => [props.latitude, props.longitude],
  () => {
    if (map && props.latitude && props.longitude) {
      updateMarker()
    }
  }
)

watch(
  () => [props.companyLatitude, props.companyLongitude, props.companyRadius],
  () => {
    if (map) {
      updateCompanyCircle()
    }
  }
)

watch(
  () => props.hidePopups,
  (hide) => {
    if (map && hide) {
      map.closePopup()
    }
  }
)

onMounted(async () => {
  // Wait for DOM to be ready
  await nextTick()
  // Small delay to ensure map container is fully rendered
  setTimeout(() => {
    initMap()
  }, 100)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="map-preview w-full rounded-lg overflow-hidden" :style="{ height: height }">
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>

<style scoped>
.map-preview {
  z-index: 0;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

:deep(.leaflet-popup) {
  z-index: 1000 !important;
}
</style>