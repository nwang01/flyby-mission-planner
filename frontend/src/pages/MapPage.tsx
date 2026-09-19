import { useState, useEffect } from 'react'
import Map from 'react-map-gl/mapbox'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useNavigate } from 'react-router-dom'
import './MapPage.css'


const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Waypoint {
    lng: number
    lat: number
    altM: number
    action: string
}

const INITIAL_VIEW = {
    longitude: -118.2437,
    latitude: 34.0522,
    zoom: 11,
}

function MapPage() {
    const [waypoints, setWaypoints] = useState<Waypoint[]>([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [missionName, setMissionName] = useState('')
    const [pilots, setPilots] = useState<{ id: number; email: string }[]>([])
    const [selectedPilotId, setSelectedPilotId] = useState<string>('')
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [defaultAltitude, setDefaultAltitude] = useState('40')

    const navigate = useNavigate()

    useEffect(() => {
        async function fetchPilots() {
            const token = localStorage.getItem('token')
            try {
                const response = await fetch('/api/v1/users?role=PILOT', {
                    headers: { Authorization: 'Bearer ' + token },
                })
                if (response.ok) {
                    const data = await response.json()
                    setPilots(data)
                }
            } catch {
                //ignore
            }
        }
        fetchPilots()
    }, [])

    function handleClick(info: PickingInfo) {
        if (info.object && info.index !== undefined && info.index >= 0) {
            setSelectedIndex(info.index)
            return
        }
        //new point
        if (!info.coordinate) return
        const [lng, lat] = info.coordinate
        const newWaypoint: Waypoint = {
            lng: Number(lng.toFixed(6)),
            lat: Number(lat.toFixed(6)),
            altM: Number(defaultAltitude) || 0,
            action: '',
        }
        setWaypoints([...waypoints, newWaypoint])
        setSelectedIndex(waypoints.length)
    }

    function handleSave() {
        if (waypoints.length === 0) {
            alert('Add at least one waypoint first')
            return
        }
        setShowSaveDialog(true)
    }

    function updateSelectedWaypoint(field: 'altM' | 'action' | 'lat' | 'lng', value: number | string ) {
        if (selectedIndex === null) return
        setWaypoints(waypoints.map((w, i) =>
            i === selectedIndex ? { ...w, [field]: value } : w
        ))
    }

    function deleteSelectedWaypoint() {
        if (selectedIndex === null) return
        setWaypoints(waypoints.filter((_, i) => i !== selectedIndex))
        setSelectedIndex(null)
    }

    async function confirmSave() {
        if (!missionName.trim()) return
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('/api/v1/missions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
                body: JSON.stringify({
                    name: missionName,
                    assignedPilotId: selectedPilotId ? Number(selectedPilotId) : null,
                    defaultAltitudeM: Number(defaultAltitude) || null,
                    waypoints: waypoints.map((w, i) => ({
                        seq: i, lat: w.lat, lng: w.lng, altM: w.altM, action: w.action || null,
                    })),
                }),
            })
            if (!response.ok) {
                alert('Failed to save mission')
                return
            }
            navigate('/missions')
        } catch {
            alert('Something went wrong')
        }
    }

    const scatterLayer = new ScatterplotLayer({
        id: 'waypoints',
        data: waypoints,
        getPosition: (d: Waypoint) => [d.lng, d.lat],
        getRadius: (_d: Waypoint, { index }: { index: number }) =>
            index === selectedIndex ? 11 : 8,
        getFillColor: (_d: Waypoint, { index }: { index: number }) =>
            index === selectedIndex ? [88, 215, 215] : [88, 166, 255],
        radiusUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        //when to change
        updateTriggers: {
            getFillColor: selectedIndex,
            getRadius: selectedIndex,
        },
    })

    const pathLayer = new PathLayer({
        id: 'path',
        data: waypoints.length > 1 ? [{ path: waypoints.map((w) => [w.lng, w.lat]) }] : [],
        getPath: (d) => d.path,
        getColor: [88, 166, 255],
        getWidth: 3,
        widthUnits: 'pixels',
    })

    return (
        <div className="map-page">
            <DeckGL
                initialViewState={INITIAL_VIEW}
                //spatial consistency across different layers during camera movements
                controller={true}
                layers={[pathLayer, scatterLayer]}
                onClick={handleClick}
                getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
            >
                <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                />
            </DeckGL>

            <div className="map-info">
                <span>Waypoints: {waypoints.length}</span>
                <label className="map-alt-label">
                    Default alt (m):
                    <input
                        type="number"
                        className="map-alt-input"
                        value={defaultAltitude}
                        onChange={(e) => setDefaultAltitude(e.target.value)}
                    />
                </label>
                <button className="map-save-btn" onClick={handleSave}>
                    Save Mission
                </button>
            </div>

            {selectedIndex !== null && waypoints[selectedIndex] && (
                <div className="wp-sidebar">
                    <div className="wp-sidebar-header">
                        <span>Waypoint {selectedIndex + 1}</span>
                        <button className="wp-close" onClick={() => setSelectedIndex(null)}>×</button>
                    </div>
                    <div className="wp-field">
                        <label>Latitude</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={waypoints[selectedIndex].lat}
                            onChange={(e) => {
                                const v = e.target.value
                                //allow '-'
                                if (v === '' || v === '-') {
                                    updateSelectedWaypoint('lat', v)
                                    return
                                }
                                const num = Number(v)
                                if (!isNaN(num)) updateSelectedWaypoint('lat', num)
                            }}
                        />
                    </div>
                    <div className="wp-field">
                        <label>Longitude</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={waypoints[selectedIndex].lng}
                            onChange={(e) => {
                                const v = e.target.value
                                if (v === '' || v === '-') {
                                    updateSelectedWaypoint('lng', v)
                                    return
                                }
                                const num = Number(v)
                                if (!isNaN(num)) updateSelectedWaypoint('lng', num)
                            }}
                        />
                    </div>
                    <div className="wp-field">
                        <label>Altitude (m)</label>
                        <input
                            type="number"
                            value={waypoints[selectedIndex].altM}
                            onChange={(e) => updateSelectedWaypoint('altM', Number(e.target.value))}
                        />
                    </div>
                    <div className="wp-field">
                        <label>Action</label>
                        <input
                            value={waypoints[selectedIndex].action}
                            onChange={(e) => updateSelectedWaypoint('action', e.target.value)}
                            placeholder="e.g. TAKE A PHOTO"
                        />
                    </div>
                    <button className="wp-delete" onClick={deleteSelectedWaypoint}>
                        Delete waypoint
                    </button>
                </div>
            )}

            {showSaveDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h2 className="dialog-title">Save Mission</h2>
                        <input
                            className="dialog-input"
                            placeholder="Mission name"
                            value={missionName}
                            onChange={(e) => setMissionName(e.target.value)}
                            autoFocus
                        />
                        <select
                            className="dialog-select"
                            value={selectedPilotId}
                            onChange={(e) => setSelectedPilotId(e.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {pilots.map((p) => (
                                <option key={p.id} value={p.id}>{p.email}</option>
                            ))}
                        </select>
                        <div className="dialog-actions">
                            <button className="dialog-cancel" onClick={() => setShowSaveDialog(false)}>
                                Cancel
                            </button>
                            <button className="dialog-confirm" onClick={confirmSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MapPage