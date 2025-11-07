import React, { useState, useEffect } from 'react';
import { AppIcons } from './Icons';

interface SystemInfo {
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
  };
  hardware: {
    manufacturer: string;
    model: string;
    version: string;
    serial: string;
  };
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    speedMax: number;
    currentLoad: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: Array<{
    filesystem: string;
    size: number;
    used: number;
    available: number;
    usagePercent: number;
    mount: string;
  }>;
  network: Array<{
    interface: string;
    ip4: string;
    ip6: string;
    mac: string;
    speed: number;
    duplex: string;
    rx_bytes: number;
    tx_bytes: number;
    rx_errors: number;
    tx_errors: number;
  }>;
}

interface SystemMonitorProps {
  systemInfo: SystemInfo;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ systemInfo }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <AppIcons.Dashboard className="h-4 w-4" /> },
    { id: 'cpu', label: 'CPU', icon: <AppIcons.ChartBar className="h-4 w-4" /> },
    { id: 'memory', label: 'Memory', icon: <AppIcons.Bolt className="h-4 w-4" /> },
    { id: 'disk', label: 'Disk', icon: <AppIcons.Reports className="h-4 w-4" /> },
    { id: 'network', label: 'Network', icon: <AppIcons.Globe className="h-4 w-4" /> },
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (speed: number) => {
    if (speed >= 1000) {
      return `${(speed / 1000).toFixed(1)} Gbps`;
    }
    return `${speed} Mbps`;
  };

  const getStatusColor = (usage: number) => {
    if (usage < 50) return 'text-green-500';
    if (usage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-surface p-4 rounded-lg border border-muted">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-subtle">CPU Usage</p>
            <p className={`text-2xl font-bold ${getStatusColor(systemInfo.cpu.currentLoad)}`}>
              {systemInfo.cpu.currentLoad}%
            </p>
          </div>
          <AppIcons.ChartBar className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-muted">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-subtle">Memory Usage</p>
            <p className={`text-2xl font-bold ${getStatusColor(systemInfo.memory.usagePercent)}`}>
              {systemInfo.memory.usagePercent}%
            </p>
          </div>
          <AppIcons.Bolt className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-muted">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-subtle">Disk Usage</p>
            <p className={`text-2xl font-bold ${getStatusColor(systemInfo.disk[0]?.usagePercent || 0)}`}>
              {systemInfo.disk[0]?.usagePercent || 0}%
            </p>
          </div>
          <AppIcons.Reports className="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-muted">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-subtle">Network Status</p>
            <p className="text-2xl font-bold text-green-500">Online</p>
          </div>
          <AppIcons.Globe className="h-8 w-8 text-indigo-500" />
        </div>
      </div>
    </div>
  );

  const renderCPU = () => (
    <div className="space-y-4">
      <div className="bg-surface p-6 rounded-lg border border-muted">
        <h3 className="text-lg font-semibold mb-4">CPU Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-subtle">Manufacturer</p>
            <p className="font-medium">{systemInfo.cpu.manufacturer}</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Brand</p>
            <p className="font-medium">{systemInfo.cpu.brand}</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Cores</p>
            <p className="font-medium">{systemInfo.cpu.cores}</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Physical Cores</p>
            <p className="font-medium">{systemInfo.cpu.physicalCores}</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Current Speed</p>
            <p className="font-medium">{systemInfo.cpu.speed} GHz</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Max Speed</p>
            <p className="font-medium">{systemInfo.cpu.speedMax} GHz</p>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg border border-muted">
        <h3 className="text-lg font-semibold mb-4">CPU Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Current Load</span>
            <span className={`font-medium ${getStatusColor(systemInfo.cpu.currentLoad)}`}>
              {systemInfo.cpu.currentLoad}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${systemInfo.cpu.currentLoad < 50 ? 'bg-green-500' : systemInfo.cpu.currentLoad < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${systemInfo.cpu.currentLoad}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMemory = () => (
    <div className="space-y-4">
      <div className="bg-surface p-6 rounded-lg border border-muted">
        <h3 className="text-lg font-semibold mb-4">Memory Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-subtle">Total</p>
            <p className="font-medium">{systemInfo.memory.total} GB</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Used</p>
            <p className="font-medium">{systemInfo.memory.used} GB</p>
          </div>
          <div>
            <p className="text-sm text-subtle">Free</p>
            <p className="font-medium">{systemInfo.memory.free} GB</p>
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg border border-muted">
        <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Usage</span>
            <span className={`font-medium ${getStatusColor(systemInfo.memory.usagePercent)}`}>
              {systemInfo.memory.usagePercent}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${systemInfo.memory.usagePercent < 50 ? 'bg-green-500' : systemInfo.memory.usagePercent < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${systemInfo.memory.usagePercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisk = () => (
    <div className="space-y-4">
      {systemInfo.disk.map((disk, index) => (
        <div key={index} className="bg-surface p-6 rounded-lg border border-muted">
          <h3 className="text-lg font-semibold mb-4">{disk.mount} ({disk.filesystem})</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-subtle">Total Size</p>
              <p className="font-medium">{disk.size} GB</p>
            </div>
            <div>
              <p className="text-sm text-subtle">Used</p>
              <p className="font-medium">{disk.used} GB</p>
            </div>
            <div>
              <p className="text-sm text-subtle">Available</p>
              <p className="font-medium">{disk.available} GB</p>
            </div>
            <div>
              <p className="text-sm text-subtle">Usage</p>
              <p className={`font-medium ${getStatusColor(disk.usagePercent)}`}>
                {disk.usagePercent}%
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${disk.usagePercent < 50 ? 'bg-green-500' : disk.usagePercent < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${disk.usagePercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderNetwork = () => (
    <div className="space-y-4">
      {systemInfo.network.map((net, index) => (
        <div key={index} className="bg-surface p-6 rounded-lg border border-muted">
          <h3 className="text-lg font-semibold mb-4">{net.interface}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-subtle">IPv4</p>
              <p className="font-medium font-mono text-sm">{net.ip4 || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-subtle">MAC Address</p>
              <p className="font-medium font-mono text-sm">{net.mac}</p>
            </div>
            <div>
              <p className="text-sm text-subtle">Speed</p>
              <p className="font-medium">{net.speed} Mbps</p>
            </div>
            <div>
              <p className="text-sm text-subtle">Duplex</p>
              <p className="font-medium">{net.duplex}</p>
            </div>
            <div>
              <p className="text-sm text-subtle">RX Bytes</p>
              <p className="font-medium">{formatBytes(net.rx_bytes)}</p>
            </div>
            <div>
              <p className="text-sm text-subtle">TX Bytes</p>
              <p className="font-medium">{formatBytes(net.tx_bytes)}</p>
            </div>
            <div>
              <p className="text-sm text-subtle">RX Errors</p>
              <p className={`font-medium ${net.rx_errors > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {net.rx_errors}
              </p>
            </div>
            <div>
              <p className="text-sm text-subtle">TX Errors</p>
              <p className={`font-medium ${net.tx_errors > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {net.tx_errors}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-muted">
      <div className="border-b border-muted">
        <div className="flex space-x-1 p-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-subtle hover:text-on-surface hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'cpu' && renderCPU()}
        {activeTab === 'memory' && renderMemory()}
        {activeTab === 'disk' && renderDisk()}
        {activeTab === 'network' && renderNetwork()}
      </div>
    </div>
  );
};

export default SystemMonitor;