import { NavLink, useNavigate } from 'react-router-dom'
import './NavBar.css'

function NavBar() {
    const navigate = useNavigate()

    function handleLogout() {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/login')
    }

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <span className="navbar-brand">✈ Flyby</span>
                <NavLink
                    to="/missions"
                    className={({ isActive }) =>
                        isActive ? 'navbar-link navbar-link-active' : 'navbar-link'
                    }
                >
                    Missions
                </NavLink>
                <NavLink
                    to="/drones"
                    className={({ isActive }) =>
                        isActive ? 'navbar-link navbar-link-active' : 'navbar-link'
                    }
                >
                    Fleet
                </NavLink>
            </div>
            <button className="navbar-logout" onClick={handleLogout}>
                Log out
            </button>
        </nav>
    )
}

export default NavBar
