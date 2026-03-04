<script setup lang="ts">
import { WorldMapTopoJSON } from '@unovis/ts/maps'

const PSI_SERVERS = [
  { id: 'oregon', label: 'Oregon', latitude: 45.84, longitude: -119.7, region: 'US West' },
  { id: 'south-carolina', label: 'S. Carolina', latitude: 33.84, longitude: -81.16, region: 'US East' },
  { id: 'netherlands', label: 'Netherlands', latitude: 52.37, longitude: 4.89, region: 'Europe' },
  { id: 'taiwan', label: 'Taiwan', latitude: 25.03, longitude: 121.57, region: 'Asia Pacific' },
]

const userLocation = ref<{ latitude: number, longitude: number } | null>(null)
const locating = ref(false)
const locationError = ref('')

const mapPoints = computed(() => {
  const points = PSI_SERVERS.map(s => ({
    ...s,
    color: '#8B5CF6',
    radius: 8,
    isServer: true,
  }))
  if (userLocation.value) {
    points.push({
      id: 'user',
      label: 'You',
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      region: '',
      color: '#22d3ee',
      radius: 10,
      isServer: false,
    })
  }
  return points
})

const mapLinks = computed(() => {
  if (!userLocation.value)
    return []
  return PSI_SERVERS.map(s => ({
    id: `user-${s.id}`,
    source: 'user',
    target: s.id,
    width: s.id === closestServer.value?.id ? 2 : 0.5,
    color: s.id === closestServer.value?.id ? '#8B5CF6' : 'rgba(139,92,246,0.2)',
  }))
})

const mapData = computed(() => ({
  points: mapPoints.value,
  links: mapLinks.value,
}))

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Rough RTT estimate: ~0.012ms per km (fiber speed + overhead)
function estimatePing(distanceKm: number) {
  return Math.round(distanceKm * 0.012 + 10)
}

const distances = computed(() => {
  if (!userLocation.value)
    return []
  return PSI_SERVERS.map((s) => {
    const km = haversineDistance(userLocation.value!.latitude, userLocation.value!.longitude, s.latitude, s.longitude)
    return { ...s, km: Math.round(km), ping: estimatePing(km) }
  }).sort((a, b) => a.km - b.km)
})

const closestServer = computed(() => distances.value[0] ?? null)

function locateMe() {
  locating.value = true
  locationError.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      locating.value = false
    },
    (err) => {
      locationError.value = err.code === 1 ? 'Location permission denied' : 'Could not determine location'
      locating.value = false
    },
    { timeout: 10000 },
  )
}
</script>

<template>
  <div class="my-6">
    <ClientOnly>
      <div class="rounded-xl border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-elevated)]">
        <!-- Map -->
        <div class="h-[360px] relative">
          <VisSingleContainer :data="mapData" :height="360">
            <VisTopoJSONMap
              :topojson="WorldMapTopoJSON"
              :point-label="(d: any) => d.label"
              :point-color="(d: any) => d.color"
              :point-radius="(d: any) => d.radius"
              :point-id="(d: any) => d.id"
              :longitude="(d: any) => d.longitude"
              :latitude="(d: any) => d.latitude"
              :link-width="(d: any) => d.width"
              :link-color="(d: any) => d.color"
              :link-source="(d: any) => d.source"
              :link-target="(d: any) => d.target"
              :disable-zoom="true"
              :zoom-factor="1.2"
            />
          </VisSingleContainer>
        </div>

        <!-- Controls -->
        <div class="p-4 border-t border-[var(--ui-border)]">
          <div v-if="!userLocation" class="flex items-center gap-3 flex-wrap">
            <UButton
              icon="i-heroicons-map-pin"
              :loading="locating"
              size="sm"
              variant="soft"
              @click="locateMe"
            >
              Find my nearest PSI server
            </UButton>
            <span v-if="locationError" class="text-sm text-[var(--ui-text-dimmed)]">{{ locationError }}</span>
            <span v-else class="text-sm text-[var(--ui-text-dimmed)]">See which data center PSI routes your test to</span>
          </div>

          <!-- Distance results -->
          <div v-else class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <UIcon name="i-heroicons-map-pin" class="text-cyan-400" />
              <span>PSI will route your test to <strong class="text-[var(--ui-primary)]">{{ closestServer?.label }}</strong> ({{ closestServer?.region }})</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div
                v-for="d in distances"
                :key="d.id"
                class="rounded-lg p-3 text-sm border"
                :class="d.id === closestServer?.id
                  ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                  : 'border-[var(--ui-border)]'"
              >
                <div class="font-semibold flex items-center gap-1.5">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="d.id === closestServer?.id ? 'bg-[var(--ui-primary)]' : 'bg-[var(--ui-text-dimmed)]'"
                  />
                  {{ d.label }}
                </div>
                <div class="text-[var(--ui-text-dimmed)] mt-1">
                  {{ d.km.toLocaleString() }} km &middot; ~{{ d.ping }}ms
                </div>
              </div>
            </div>
            <UButton variant="link" size="xs" class="!p-0" @click="userLocation = null">
              Reset
            </UButton>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
:deep(.unovis-topojson-map .feature) {
  fill: rgba(139, 92, 246, 0.08);
  stroke: rgba(139, 92, 246, 0.15);
  stroke-width: 0.5;
}
:deep(.unovis-topojson-map .point-label) {
  fill: #fff;
  font-size: 11px;
  font-weight: 600;
}
</style>
