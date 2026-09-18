
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    async function handleLogin() {
        setError('')
        setLoading(true)
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                setError('Invalid email or password')
                return
            }

            const data = await response.json()
            localStorage.setItem('token', data.token)
            localStorage.setItem('role', data.role)
            console.log('Login success:', data)
            navigate('/missions')
        } catch {
            setError('Something went wrong. Is the server running?')
        } finally {
            setLoading(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            handleLogin()
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-brand">
                    <span className="login-logo">✈</span>
                    <h1 className="login-title">Flyby</h1>
                </div>
                <p className="login-subtitle">Mission Planner</p>

                <div className="login-field">
                    <label className="login-label">Email</label>
                    <input
                        className="login-input"
                        type="email"
                        placeholder="you@flyby.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="login-field">
                    <label className="login-label">Password</label>
                    <input
                        className="login-input"
                        type={'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <button
                    className="login-button"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>

                {error && <p className="login-error">{error}</p>}
            </div>
        </div>
    )
}

export default LoginPage