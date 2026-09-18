import { useState } from 'react'
import Map from 'react-map-gl/mapbox'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import 'mapbox-gl/dist/mapbox-gl.css'
import './MapPage.css'


const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Waypoint {
    lng: number
    lat: number
}

const INITIAL_VIEW = {
    longitude: -118.2437,
    latitude: 34.0522,
    zoom: 11,
}

function MapPage() {
    const [waypoints, setWaypoints] = useState<Waypoint[]>([])

    function handleClick(info: PickingInfo) {
        if (info.object && info.index !== undefined && info.index >= 0) {
            setWaypoints(waypoints.filter((_, i) => i !== info.index))
            return
        }
        //new point
        if (!info.coordinate) return
        const [lng, lat] = info.coordinate
        setWaypoints([...waypoints, { lng, lat }])
    }

    const scatterLayer = new ScatterplotLayer({
        id: 'waypoints',
        data: waypoints,
        getPosition: (d: Waypoint) => [d.lng, d.lat],
        getRadius: 8,
        getFillColor: [88, 166, 255],
        radiusUnits: 'pixels',
        pickable: true,
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
            >
                <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                />
            </DeckGL>

            <div className="map-info">
                Waypoints: {waypoints.length}
            </div>
        </div>
    )
}

export default MapPage