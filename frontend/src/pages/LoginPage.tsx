import { useState } from 'react'

function LoginPage() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    async function handleLogin() {
        setError('')
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
            console.log('Login success:', data)
            alert('Login success! Token stored. Role: ' + data.role)
        } catch (e) {
            setError('Something went wrong')
        }
    }

    return (
        <div style={{ maxWidth: 320, margin: '80px auto', fontFamily: 'sans-serif' }}>
            <h1>Flyby Login</h1>

            <div style={{ marginBottom: 12 }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: 8 }}
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: 8 }}
                />
            </div>

            <button onClick={handleLogin} style={{ width: '100%', padding: 10 }}>
                Log in
            </button>

            {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
        </div>
    )
}

export default LoginPage