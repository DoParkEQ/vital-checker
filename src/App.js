import './App.css';
import React, { useEffect, useState } from 'react';
import Typography from './components/Typography';
const DEVICE_NAME = 'Oxysmart 1604';
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHT_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CONFIG = {
  filters: [{
    services: [SERVICE_UUID],
  }],
};

const storage = [];
const signal = [];
const timeInterval = 1000;

const getTime = (startTime) => {
  const endTime = new Date();
  const elapsedTime = endTime - startTime;
  const s = Math.round(elapsedTime / 1000) % 60;
  const m = Math.round(elapsedTime / 60000) % 60;
  const h = Math.round(elapsedTime / 360000) % 60;
  const prefix = '0';
  const time = `${h < 10 ? prefix + h : h}:${m < 10 ? prefix + m : m}:${s < 10 ? prefix + s : s}`;
  return time;

};

const App = () => {
  const [oxyData, setOxyData] = useState({ spo2: 0, heartRate: 0, graphPoint: [] });
  const [timer, setTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  // const [vitals, setVitals] = useState({spo2: 0, heartRate: 0, graph: []})
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('No devices are connected');

  const handleNotifications = (e) => {
    const value = e.target.value;
    const FLAG = 170;
    for (let i = 0; i < value.byteLength; i++) {
      const num = value.getUint8(i);
      if (num === FLAG && signal.length > 0) {
        const identifier = signal[3];
        const vital = signal[8];
        const graph = signal[7];
        if (identifier === 7) {
          setOxyData(prev => ({ ...prev, graphPoint: signal.slice(5, 10) }));
        }

        if (identifier === 8) {
          setOxyData(prev => ({ ...prev, spo2: signal[5], heartRate: signal[6] }));
        }
        storage.push(signal);
        signal.length = 0;
      }
      signal.push(num);
    }
  };
  // console.log(oxyData);
  const onDisconnected = () => {
    setIsConnected(false);
    setDeviceName('No devices are connected');
    setTimer(false);
  };

  const subscribeBLE = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice(CONFIG);
      setIsConnected(true);
      setDeviceName(device.name);
      setTimer(new Date());
      device.addEventListener('gattserverdisconnected', onDisconnected);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHT_UUID);
      const oximetry = await characteristic.startNotifications();
      oximetry.addEventListener('characteristicvaluechanged', handleNotifications);

    } catch(error) {
      alert(error);
    }
  };
  useEffect(() => {
    if (isConnected && timer!==null) {
      const interval = setInterval(() => {
        const elapsedTime = getTime(timer);
        setElapsedTime(elapsedTime);
      }, timeInterval);

      return ()=> clearInterval(interval);

    }
  },[isConnected, timer]);

  return (
    <div>
      <p>{deviceName}</p>
      {isConnected ? <p>Device connected</p> : <button onClick={subscribeBLE}>Connect</button>}
      <div>
        <Typography variant='title'>
          {`${oxyData.heartRate}bpm`}
        </Typography>
        <Typography variant='body'>
          Heart Rate 💖
        </Typography>
      </div>
      <div>
        <Typography variant='title'>
          {`${oxyData.spo2}%`}
        </Typography>
        <Typography variant='body'>
          SPO2 💨
        </Typography>
      </div>
      <div>
        <Typography variant='title'>
          {elapsedTime}
        </Typography>
        <Typography variant='body'>
            Elapsed Time 🕒
        </Typography>
      </div>
    </div>
  );
};

export default App;


