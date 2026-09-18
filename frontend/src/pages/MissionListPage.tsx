import { useEffect, useState } from 'react'
import './MissionListPage.css'

interface Mission {
    id: number
    name: string
    status: string
    assignedPilotId: number | null
    waypointCount: number
    updatedAt: string
}

function MissionListPage() {
    const [missions, setMissions] = useState<Mission[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMissions() {
            const token = localStorage.getItem('token')
            try {
                const response = await fetch('/api/v1/missions', {
                    headers: { Authorization: 'Bearer ' + token },
                })
                if (!response.ok) {
                    setError('Failed to load missions')
                    return
                }
                const data = await response.json()
                setMissions(data)
            } catch {
                setError('Something went wrong')
            } finally {
                setLoading(false)
            }
        }
        fetchMissions()
    }, [])

    return (
        <div className="list-page">
            <div className="list-container">
                <header className="list-header">
                    <h1 className="list-title">Missions</h1>
                </header>

                {loading && <p className="list-muted">Loading…</p>}
                {error && <p className="list-error">{error}</p>}

                {!loading && !error && missions.length === 0 && (
                    <p className="list-muted">No missions yet.</p>
                )}

                {!loading && !error && missions.length > 0 && (
                    <div className="mission-grid">
                        {missions.map((m) => (
                            <div key={m.id} className="mission-card">
                                <div className="mission-card-top">
                                    <span className="mission-name">{m.name}</span>
                                    <span className={`mission-status status-${m.status.toLowerCase()}`}>
                    {m.status}
                  </span>
                                </div>
                                <div className="mission-meta">
                                    <span>{m.waypointCount} waypoints</span>
                                    <span>Updated {new Date(m.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MissionListPage
