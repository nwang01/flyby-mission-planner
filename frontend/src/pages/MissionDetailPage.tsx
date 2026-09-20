import { useEffect, useState } from 'react'
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
}

function MissionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const role = localStorage.getItem('role')
    const isAdmin = role === 'ADMIN'

    const [mission, setMission] = useState<MissionDetail | null>(null)
    const [error, setError] = useState('')
    const [assignedPilotEmail, setAssignedPilotEmail] = useState('Unassigned')


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
            navigate('/missions')   // 删除成功回列表
        } catch {
            alert('Something went wrong')
        }
    }

    //map
    const scatterLayer = new ScatterplotLayer({
        id: 'wp',
        data: mission.waypoints,
        getPosition: (d: Waypoint) => [d.lng, d.lat],
        getRadius: 8,
        getFillColor: [88, 166, 255],
        radiusUnits: 'pixels',
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
                        <span className="detail-label">Waypoints</span>
                        <span>{mission.waypoints.length}</span>
                    </div>
                    <div className="detail-info-row">
                        <span className="detail-label">Distance</span>
                        <span>{Math.round(mission.distanceM)} m</span>
                    </div>
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
                    <button className="detail-edit-btn" onClick={() => navigate('/map/' + id)}>
                        Edit Mission
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
                >
                    <Map
                        mapboxAccessToken={MAPBOX_TOKEN}
                        mapStyle="mapbox://styles/mapbox/dark-v11"
                    />
                </DeckGL>
            </main>
        </div>
    )
}

export default MissionDetailPage