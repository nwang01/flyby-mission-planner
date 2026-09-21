import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './MissionDetailPage.css'
import Map from 'react-map-gl/mapbox'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Waypoint {
    seq: number
    lat: number
    lng: number
    altM: number | null
    action: string | null
}

interface MissionDetail {
    id: number
    name: string
    description: string | null
    status: string
    assignedPilotId: number | null
    defaultAltitudeM: number | null
    speedMs: number | null
    waypoints: Waypoint[]
    distanceM: number
    estimatedDurationS: number | null
    droneId: number | null
}

function MissionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const role = localStorage.getItem('role')
    const isAdmin = role === 'ADMIN'

    const [mission, setMission] = useState<MissionDetail | null>(null)
    const [error, setError] = useState('')
    const [assignedPilotEmail, setAssignedPilotEmail] = useState('Unassigned')
    const [is3D, setIs3D] = useState(true)
    const mapRef = useRef<any>(null)
    const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; wp: Waypoint } | null>(null)
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11')
    const [droneName, setDroneName] = useState('None')


    useEffect(() => {
        async function fetchMission() {
            const token = localStorage.getItem('token')
            try {
                const response = await fetch('/api/v1/missions/' + id, {
                    headers: { Authorization: 'Bearer ' + token },
                })
                if (!response.ok) {
                    setError('Failed to load mission')
                    return
                }
                const data = await response.json()
                setMission(data)
            } catch {
                setError('Something went wrong')
            }
        }
        fetchMission()
    }, [id])

    useEffect(() => {
        if (!mission?.assignedPilotId) return
        async function fetchAssignedPilot() {
            const token = localStorage.getItem('token')
            try {
                const response = await fetch('/api/v1/users/' + mission?.assignedPilotId, {
                    headers: { Authorization: 'Bearer ' + token },
                })
                if (response.ok) {
                    const data = await response.json()
                    setAssignedPilotEmail(data.email)
                }
            } catch (e) {
                console.error(e)
            }
        }
        fetchAssignedPilot()
    }, [mission])

    useEffect(() => {
        if (!mission?.droneId) return
        async function fetchDrone() {
            const token = localStorage.getItem('token')
            try {
                const response = await fetch('/api/v1/drones/' + mission?.droneId, {
                    headers: { Authorization: 'Bearer ' + token },
                })
                if (response.ok) setDroneName((await response.json()).name)
            } catch (e) {
                console.error(e)
            }
        }
        fetchDrone()
    }, [mission])

    if (error) return <div className="detail-page"><p className="detail-error">{error}</p></div>
    if (!mission) return <div className="detail-page"><p className="detail-muted">Loading…</p></div>

    async function handleDelete() {
        if (!confirm('Delete this mission? This cannot be undone.')) return
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('/api/v1/missions/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
            })
            if (!response.ok) {
                alert('Failed to delete')
                return
            }
            navigate('/missions')
        } catch {
            alert('Something went wrong')
        }
    }

    async function changeStatus(newStatus: string) {
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('/api/v1/missions/' + id + '/status', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!response.ok) {
                const err = await response.json()
                alert(err.message || 'Failed to change status')
                return
            }
            setMission(await response.json())
        } catch {
            alert('Something went wrong')
        }
    }

    function apply3DState(map: any, enabled: boolean) {
        if (enabled) {
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
        } else {
            map.setTerrain(null)
        }
        if (map.getLayer('3d-buildings')) {
            map.setLayoutProperty('3d-buildings', 'visibility', enabled ? 'visible' : 'none')
        }
    }

    function setup3DFeatures(map: any, enable3D: boolean) {
        if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512, maxzoom: 14,
            })
        }
        if (!map.getLayer('3d-buildings')) {
            map.addLayer({
                id: '3d-buildings', source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion', minzoom: 14,
                paint: {
                    'fill-extrusion-color': '#2d333b',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.8,
                },
            })
        }
        apply3DState(map, enable3D)
    }

    function toggle3D() {
        const map = mapRef.current?.getMap?.() ?? mapRef.current
        if (!map) return
        const next = !is3D
        map.easeTo({ pitch: next ? 50 : 0, duration: 500 })
        apply3DState(map, next)
        setIs3D(next)
    }

    function toggleMapStyle() {
        const newStyle = mapStyle.includes('satellite')
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/satellite-streets-v12'
        setMapStyle(newStyle)
        const map = mapRef.current?.getMap?.() ?? mapRef.current
        map?.once('style.load', () => setup3DFeatures(map, is3D))
    }

    //map
    const scatterLayer = new ScatterplotLayer({
        id: 'wp',
        data: mission.waypoints,
        getPosition: (d: Waypoint) => [d.lng, d.lat],
        getRadius: 8,
        getFillColor: [88, 166, 255],
        radiusUnits: 'pixels',
        pickable: true,
    })

    const pathLayer = new PathLayer({
        id: 'path',
        data: mission.waypoints.length > 1
            ? [{ path: mission.waypoints.map((w) => [w.lng, w.lat]) }]
            : [],
        getPath: (d) => d.path,
        getColor: [88, 166, 255],
        getWidth: 3,
        widthUnits: 'pixels',
    })

    const firstWp = mission.waypoints[0]
    const initialView = {
        longitude: firstWp ? firstWp.lng : -118.2437,
        latitude: firstWp ? firstWp.lat : 34.0522,
        zoom: 12,
        pitch: 50,
        bearing: 0,
    }

    return (
        <div className="detail-page">
            {/* left info bar */}
            <aside className="detail-sidebar">
                <button className="detail-back" onClick={() => navigate('/missions')}>
                    ← Back
                </button>
                <h1 className="detail-title">{mission.name}</h1>
                <div className="detail-info-list">
                    <div className="detail-info-row">
                        <span className="detail-label">Status</span>
                        <span>{mission.status}</span>
                    </div>
                    <div className="detail-info-row">
                        <span className="detail-label">Drone</span>
                        <span>{droneName}</span>
                    </div>
                    <div className="detail-info-row">
                        <span className="detail-label">Waypoints</span>
                        <span>{mission.waypoints.length}</span>
                    </div>
                    <div className="detail-info-row">
                        <span className="detail-label">Distance</span>
                        <span>{Math.round(mission.distanceM)} m</span>
                    </div>
                    {mission.speedMs && (
                        <div className="detail-info-row">
                            <span className="detail-label">Speed</span>
                            <span>{mission.speedMs} m/s</span>
                        </div>
                    )}
                    {mission.estimatedDurationS && (
                        <div className="detail-info-row">
                            <span className="detail-label">Est. duration</span>
                            <span>{mission.estimatedDurationS} s</span>
                        </div>
                    )}
                    {mission.defaultAltitudeM && (
                        <div className="detail-info-row">
                            <span className="detail-label">Altitude</span>
                            <span>{mission.defaultAltitudeM} m</span>
                        </div>
                    )}
                    {mission.speedMs && (
                        <div className="detail-info-row">
                            <span className="detail-label">Speed</span>
                            <span>{mission.speedMs} m/s</span>
                        </div>
                    )}
                    <div className="detail-info-row">
                        <span className="detail-label">Assigned Pilot</span>
                        <span>{assignedPilotEmail}</span>
                    </div>

                </div>
                {mission.description && <p className="detail-desc">{mission.description}</p>}
                {/* admin: edit button */}
                {isAdmin && (
                    <button
                        className="detail-edit-btn"
                        onClick={() => navigate('/map/' + id)}
                        disabled={mission.status !== 'DRAFT'}
                    >
                        Edit Mission
                    </button>
                )}
                {/* admin: draft ⟷ ready */}
                {isAdmin && mission.status === 'DRAFT' && (
                    <button className="detail-status-btn ready" onClick={() => changeStatus('READY')}>
                        Mark as Ready
                    </button>
                )}
                {isAdmin && mission.status === 'READY' && (
                    <button className="detail-status-btn draft" onClick={() => changeStatus('DRAFT')}>
                        Back to Draft
                    </button>
                )}
                {/* pilot: ready → flown */}
                {!isAdmin && (
                    <button
                        className="detail-status-btn flown"
                        onClick={() => changeStatus('FLOWN')}
                        disabled={mission.status !== 'READY'}
                    >
                        Mark as Flown
                    </button>
                )}
                {/* admin: delete button */}
                {isAdmin && (
                    <button className="detail-delete-btn" onClick={handleDelete}>
                        Delete Mission
                    </button>
                )}
            </aside>

            {/* right map */}
            <main className="detail-map">
                <DeckGL
                    initialViewState={initialView}
                    controller={true}
                    layers={[pathLayer, scatterLayer]}
                    onHover={(info) => {
                        if (info.object) {
                            setHoverInfo({ x: info.x, y: info.y, wp: info.object })
                        } else {
                            setHoverInfo(null)
                        }
                    }}
                    getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
                >
                    <Map
                        ref={mapRef}
                        mapboxAccessToken={MAPBOX_TOKEN}
                        mapStyle={mapStyle}
                        onLoad={(e) => setup3DFeatures(e.target, is3D)}
                    />
                </DeckGL>

                {hoverInfo && (
                    <div
                        className="wp-tooltip"
                        style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
                    >
                        <div className="wp-tooltip-title">Waypoint {hoverInfo.wp.seq + 1}</div>
                        <div>Lat: {hoverInfo.wp.lat.toFixed(6)}</div>
                        <div>Lng: {hoverInfo.wp.lng.toFixed(6)}</div>
                        <div>Alt: {hoverInfo.wp.altM ?? 'default'} m</div>
                        <div>Action: {hoverInfo.wp.action ?? '—'}</div>
                    </div>
                )}

                <button className="detail-3d-toggle" onClick={toggle3D}>
                    {is3D ? 'to 2D' : 'to 3D'}
                </button>
                <button className="detail-style-toggle" onClick={toggleMapStyle}>
                    {mapStyle.includes('satellite') ? 'to Default' : 'to Satellite'}
                </button>
            </main>
        </div>
    )
}

export default MissionDetailPage