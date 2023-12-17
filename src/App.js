import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import moment from 'moment';
import 'moment-timezone';
import {
  Asia,
  Oceania,
  NorthAmerica,
  SouthAmerica,
  Europe,
} from './TimeZone';
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFpbGl3ZWkiLCJhIjoiY2lwZG4xMTQ2MDAwN3VlbmYzMmg2djh2eiJ9.LCYPLI1_XSNZzdvxIlcSfA';

// The following values can be changed to control rotation speed:
// At low zooms, complete a revolution every two minutes.
const secondsPerRevolution = 60;
// Above zoom level 5, do not rotate.
const maxSpinZoom = 5;
// Rotate at intermediate speeds between zoom levels 3 and 5.
const slowSpinZoom = 3;
const spinEnabled = true;
let autoRotate = false;
const isDay = timeZone => moment().tz(timeZone).format('HH') >= 6 && moment().tz(timeZone).format('HH') <= 18

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentCount, setCount] = useState(10);
  const [userInteracting, setUserInteracting] = useState(false);
  // const [selectedLocations, setSelectedLocations] = useState([]);

  const spinGlobe = () => {
    const zoom = map.current.getZoom();
    if (spinEnabled && autoRotate && zoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution;
      if (zoom > slowSpinZoom) {
        // Slow spinning at higher zooms
        const zoomDif =
          (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
        distancePerSecond *= zoomDif;
      }
      const center = map.current.getCenter();
      center.lng -= distancePerSecond;
      // Smoothly animate the map over one second.
      // When this animation is complete, it calls a 'moveend' event.
      map.current.easeTo({ center, duration: 500, easing: (n) => n });
    }
  }


  const addMarker = (location) => {
    const el = document.createElement('div');
    el.className = `location-label ${location.class}`;

    const locationSpan = document.createElement('span');
    locationSpan.className = 'location-title';
    locationSpan.innerText = location.title;

    const timeSpan = document.createElement('span');
    timeSpan.className = `location-time`;
    timeSpan.innerText = moment().tz(location.timeZone).format('MM/DD HH:mma');

    const icon = document.createElement('i');
    icon.className = `icon ${isDay(location.timeZone) ? 'day' : 'night'}`;

    el.append(icon);
    el.append(locationSpan);
    el.append(timeSpan);

    const marker = new mapboxgl.Marker(el)
      .setLngLat(location.lngLat)
      .addTo(map.current);

    return marker;
  }

  const addLocationMarkers = () => {
    Asia.forEach(item => {
      addMarker(item);
    });
    Oceania.forEach(item => {
      addMarker(item);
    });
    NorthAmerica.forEach(item => {
      addMarker(item);
    });
    SouthAmerica.forEach(item => {
      addMarker(item);
    });
    Europe.forEach(item => {
      addMarker(item);
    });
  }

  const updateLocationTime = () => {
    setCount(currentCount => currentCount + 1);
    [...Asia, ...Oceania, ...NorthAmerica, ...SouthAmerica, ...Europe].forEach(item => {
      if (document.querySelector(`.${item.class}.location-label .location-time`)?.innerText) {
        document.querySelector(`.${item.class}.location-label .location-time`).innerText = moment().tz(item.timeZone).format('MM/DD HH:mma');
      }
      if (isDay(item.timeZone)) {
        document.querySelector(`.${item.class}.location-label i.icon`)?.classList?.remove('night');
        if (!document.querySelector(`.${item.class}.location-label i.icon`)?.classList?.contains('day')) {
          document.querySelector(`.${item.class}.location-label i.icon`)?.classList?.add('day');
        }
      } else {
        document.querySelector(`.${item.class}.location-label i.icon`)?.classList?.remove('day');
        if (!document.querySelector(`.${item.class}.location-label i.icon`)?.classList?.contains('night')) {
          document.querySelector(`.${item.class}.location-label i.icon`)?.classList?.add('night');
        }
      }
    });
  }

  const autoRotateOnchange = (e) => {
    setUserInteracting(e.target.checked);
  }

  const flyTo = (center) => {
    map.current.flyTo({
      center,
      essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
  }

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 1.5,
      maxZoom: 5,
      center: [95, 20],
      projection: 'globe',
      attributionControl: false
    });

    map.current.on('load', () => {
      // Set the default atmosphere style
      map.current.setFog({});

      map.current.style.stylesheet.layers.forEach(function (layer) {
        if (layer.type === 'symbol') {
          map.current.setLayoutProperty(layer.id, "visibility", "none");
        }
      });

      addLocationMarkers();
    });

    // When animation is complete, start spinning if there is no ongoing interaction
    map.current.on('moveend', () => {
      spinGlobe();
    });
  });

  useEffect(
    () => {
      if (currentCount <= 0) {
        return;
      }
      const id = setInterval(updateLocationTime, 1000);
      return () => clearInterval(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCount]
  );

  useEffect(() => {
    autoRotate = userInteracting;
    if (userInteracting) spinGlobe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInteracting]);

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
      <div className="location-list">
        <h3>Asia/Oceania</h3>
        <div className="location-header">
          <div className="auto-rotate">Auto-rotate</div>
          <label className="switch">
            <input onChange={autoRotateOnchange} checked={userInteracting} type="checkbox" />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="location-items">
          <h4>Asia</h4>
          {
            Asia.map(item =>
              <div key={item.class} className="location-item" onClick={() => flyTo(item.lngLat)}>
                <div className="location-pic" style={{ backgroundImage: `url(./${item.class}.jpg)` }}></div>
                <div className="location-detail">
                  <div className="location-title">{item.title}</div>
                  <div className={`location-time ${item.class}`}>{moment().tz(item.timeZone).format('MM/DD HH:mm:ss')}</div>
                </div>
              </div>)
          }
          <h4>Oceania</h4>
          {
            Oceania.map(item =>
              <div key={item.class} className="location-item" onClick={() => flyTo(item.lngLat)}>
                <div className="location-pic" style={{ backgroundImage: `url(./${item.class}.jpg)` }}></div>
                <div className="location-detail">
                  <div className="location-title">{item.title}</div>
                  <div className={`location-time ${item.class}`}>{moment().tz(item.timeZone).format('MM/DD HH:mm:ss')}</div>
                </div>
              </div>)
          }
        </div>
      </div>

      <div className="location-list-Europe">
        <h3>NA/SA/Europe</h3>
        <div className="location-header">
          <div className="auto-rotate">Auto-rotate</div>
          <label className="switch">
            <input onChange={autoRotateOnchange} checked={userInteracting} type="checkbox" />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="location-items">
          {
            NorthAmerica.map(item =>
              <div key={item.class} className="location-item" onClick={() => flyTo(item.lngLat)}>
                <div className="location-pic" style={{ backgroundImage: `url(./${item.class}.jpg)` }}></div>
                <div className="location-detail">
                  <div className="location-title">{item.title}</div>
                  <div className={`location-time ${item.class}`}>{moment().tz(item.timeZone).format('MM/DD HH:mm:ss')}</div>
                </div>
              </div>)
          }
          {/* {
            SouthAmerica.map(item =>
              <div key={item.class} className="location-item" onClick={() => flyTo(item.lngLat)}>
                <div className="location-pic" style={{ backgroundImage: `url(./${item.class}.jpg)` }}></div>
                <div className="location-detail">
                  <div className="location-title">{item.title}</div>
                  <div className={`location-time ${item.class}`}>{moment().tz(item.timeZone).format('MM/DD HH:mm:ss')}</div>
                </div>
              </div>)
          } */}
          {
            Europe.map(item =>
              <div key={item.class} className="location-item" onClick={() => flyTo(item.lngLat)}>
                <div className="location-pic" style={{ backgroundImage: `url(./${item.class}.jpg)` }}></div>
                <div className="location-detail">
                  <div className="location-title">{item.title}</div>
                  <div className={`location-time ${item.class}`}>{moment().tz(item.timeZone).format('MM/DD HH:mm:ss')}</div>
                </div>
              </div>)
          }
        </div>
      </div>
    </div>
  );
}
