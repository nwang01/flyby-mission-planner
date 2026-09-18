import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MissionListPage from './pages/MissionListPage'
import MapPage from "./pages/MapPage.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/missions" element={<MissionListPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
                <Route path="/map" element={<MapPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App