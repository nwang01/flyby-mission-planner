import { useEffect, useState } from 'react'
import './MissionListPage.css'
import {useNavigate} from "react-router-dom";
import NavBar from '../components/NavBar'

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

    const navigate = useNavigate()
    const role = localStorage.getItem('role')
    const isAdmin = role === 'ADMIN'

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

    function handleLogout() {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/login')
    }

    return (
        <>
            <NavBar />
            <div className="list-page">
                <div className="list-container">
                    <header className="list-header">
                        <h1 className="list-title">Missions</h1>
                        <button className="list-logout-btn" onClick={handleLogout}>
                            Log out
                        </button>
                    </header>
                    {isAdmin && (
                        <button className="list-create-btn" onClick={() => navigate('/map')}>
                            + Create Mission
                        </button>
                    )}


                    {loading && <p className="list-muted">Loading…</p>}
                    {error && <p className="list-error">{error}</p>}

                    {!loading && !error && missions.length === 0 && (
                        <p className="list-muted">No missions yet.</p>
                    )}

                    {!loading && !error && missions.length > 0 && (
                        <div className="mission-grid">
                            {missions.map((m) => (
                                <div key={m.id}
                                     className="mission-card"
                                     onClick={() => navigate('/missions/' + m.id)}
                                >
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
        </>
    )
}

export default MissionListPage
