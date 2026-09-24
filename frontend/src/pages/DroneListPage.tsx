import { useEffect, useState } from 'react'
import NavBar from '../components/NavBar'
import './DroneListPage.css'

interface Drone {
    id: number
    name: string
    model: string
    status: string
    flightHours: number
    missionsFlown: number
}

function DroneListPage() {
    const role = localStorage.getItem('role')
    const isAdmin = role === 'ADMIN'

    const [drones, setDrones] = useState<Drone[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    // dialog state
    const [showDialog, setShowDialog] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null) // null = 新增
    const [name, setName] = useState('')
    const [model, setModel] = useState('')
    const [status, setStatus] = useState('AVAILABLE')

    useEffect(() => {
        loadDrones()
    }, [])

    async function loadDrones() {
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('/api/v1/drones', {
                headers: { Authorization: 'Bearer ' + token },
            })
            if (!response.ok) {
                setError('Failed to load drones')
                return
            }
            setDrones(await response.json())
        } catch {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    function openAdd() {
        setEditingId(null)
        setName('')
        setModel('')
        setStatus('AVAILABLE')
        setShowDialog(true)
    }

    function openEdit(d: Drone) {
        setEditingId(d.id)
        setName(d.name)
        setModel(d.model)
        setStatus(d.status)
        setShowDialog(true)
    }

    async function saveDrone() {
        if (!name.trim() || !model.trim()) return
        const token = localStorage.getItem('token')
        const url = editingId ? '/api/v1/drones/' + editingId : '/api/v1/drones'
        const method = editingId ? 'PUT' : 'POST'
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
                body: JSON.stringify({ name, model, status }),
            })
            if (!response.ok) {
                const err = await response.json()
                alert(err.message || 'Failed to save drone')
                return
            }
            setShowDialog(false)
            loadDrones()
        } catch {
            alert('Something went wrong')
        }
    }

    async function deleteDrone(id: number) {
        if (!confirm('Delete this drone?')) return
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('/api/v1/drones/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
            })
            if (!response.ok) {
                alert('Failed to delete')
                return
            }
            loadDrones()
        } catch {
            alert('Something went wrong')
        }
    }

    return (
        <>
            <NavBar />
            <div className="fleet-page">
                <div className="fleet-container">
                    <div className="fleet-header">
                        <h1 className="fleet-title">Fleet</h1>
                        {isAdmin && (
                            <button className="fleet-add-btn" onClick={openAdd}>
                                + Add Drone
                            </button>
                        )}
                    </div>

                    {loading && <p className="fleet-muted">Loading…</p>}
                    {error && <p className="fleet-error">{error}</p>}

                    {!loading && !error && drones.length === 0 && (
                        <p className="fleet-muted">No drones yet.</p>
                    )}

                    {!loading && !error && drones.length > 0 && (
                        <div className="drone-grid">
                            {drones.map((d) => (
                                <div key={d.id} className="drone-card">
                                    <div className="drone-card-top">
                                        <span className="drone-name">{d.name}</span>
                                        <span className={`drone-status status-${d.status.toLowerCase()}`}>
                                            {d.status}
                                        </span>
                                    </div>
                                    <div className="drone-model">{d.model}</div>
                                    <div className="drone-stats">
                                        <span>{d.flightHours.toFixed(1)} flight hrs</span>
                                        <span>{d.missionsFlown} missions</span>
                                    </div>
                                    {isAdmin && (
                                        <div className="drone-actions">
                                            <button className="drone-edit" onClick={() => openEdit(d)}>Edit</button>
                                            <button className="drone-delete" onClick={() => deleteDrone(d.id)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h2 className="dialog-title">{editingId ? 'Edit Drone' : 'Add Drone'}</h2>
                        <label className="dialog-label">Name</label>
                        <input
                            className="dialog-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Falcon-1"
                            autoFocus
                        />
                        <label className="dialog-label">Model</label>
                        <input
                            className="dialog-input"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="Flyby F-11T"
                        />
                        <label className="dialog-label">Status</label>
                        <select
                            className="dialog-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="AVAILABLE">Available</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                        <div className="dialog-actions">
                            <button className="dialog-cancel" onClick={() => setShowDialog(false)}>Cancel</button>
                            <button className="dialog-confirm" onClick={saveDrone}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default DroneListPage
