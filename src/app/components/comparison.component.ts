import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlsService } from '../services/hls.service';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="comparison-container">
      <div class="comparison-header">
        <h1 class="comparison-title">Stream Comparison</h1>
        <p class="comparison-subtitle">
          Compare different streaming configurations side by side
        </p>
      </div>

      <div class="comparison-layout">
        <div class="player-panel">
          <div class="panel-header">
            <h3>Player A <span class="player-label">(Control - Unlimited)</span></h3>
            <select class="stream-selector" [(ngModel)]="playerA.selectedStream" (change)="onPlayerAStreamChange()">
              <option value="">Select stream...</option>
              <option *ngFor="let stream of availableStreams" [value]="stream.url">
                {{ stream.name }}
              </option>
            </select>
          </div>
          <div class="video-container">
            <video #videoPlayerA class="comparison-video" controls playsinline>
              Your browser does not support the video tag.
            </video>
          </div>
          <div class="player-stats">
            <div class="stat-item">
              <span class="stat-label">Bitrate:</span>
              <span class="stat-value">{{ playerA.stats.bitrate }} kbps</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Quality:</span>
              <span class="stat-value">{{ playerA.stats.quality }}</span>
            </div>
          </div>
        </div>

        <div class="player-panel">
          <div class="panel-header">
            <h3>Player B <span class="player-label">(Throttled)</span></h3>
            <select class="stream-selector" [(ngModel)]="playerB.selectedStream" (change)="onPlayerBStreamChange()">
              <option value="">Select stream...</option>
              <option *ngFor="let stream of availableStreams" [value]="stream.url">
                {{ stream.name }}
              </option>
            </select>
          </div>
          <div class="video-container">
            <video #videoPlayerB class="comparison-video" controls playsinline>
              Your browser does not support the video tag.
            </video>
          </div>
          <div class="player-stats">
            <div class="stat-item">
              <span class="stat-label">Bitrate:</span>
              <span class="stat-value">{{ playerB.stats.bitrate }} kbps</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Quality:</span>
              <span class="stat-value">{{ playerB.stats.quality }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="comparison-controls">
        <div class="control-section">
          <h4>Playback Controls</h4>
          <div class="control-buttons">
            <button class="icon-btn play-btn" (click)="syncPlay()" title="Sync Play">
              <span class="btn-icon">▶️</span>
            </button>
            <button class="icon-btn pause-btn" (click)="syncPause()" title="Sync Pause">
              <span class="btn-icon">⏸️</span>
            </button>
            <button class="icon-btn seek-btn" (click)="syncSeek()" title="Sync Seek">
              <span class="btn-icon">⏭️</span>
            </button>
          </div>
        </div>

        <div class="control-section">
          <h4>Network Simulation (Player B Only)</h4>
          <div class="network-controls">
            <label>
              Player B Connection Speed:
              <select [(ngModel)]="networkSpeed" (change)="applyNetworkThrottling()">
                <option value="unlimited">Unlimited</option>
                <option value="fast">Fast 3G (1.6 Mbps)</option>
                <option value="slow">Slow 3G (400 Kbps)</option>
                <option value="2g">2G (250 Kbps)</option>
              </select>
            </label>
            <div class="network-status" *ngIf="networkSpeed !== 'unlimited'">
              <span class="status-indicator">🌐</span>
              <span class="status-text">Player B throttling active</span>
            </div>
            <p class="network-description">
              Player A maintains unlimited bandwidth as a control reference.
            </p>
          </div>
        </div>
      </div>

      <div class="comparison-analytics">
        <h3>📊 Performance Comparison</h3>
        <div class="analytics-grid">
          <div class="analytics-card">
            <h4>Startup Time</h4>
            <div class="comparison-bars">
              <div class="bar-container">
                <span class="bar-label">Player A</span>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 75%"></div>
                </div>
                <span class="bar-value">2.3s</span>
              </div>
              <div class="bar-container">
                <span class="bar-label">Player B</span>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 60%"></div>
                </div>
                <span class="bar-value">1.8s</span>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <h4>Rebuffering Events</h4>
            <div class="comparison-bars">
              <div class="bar-container">
                <span class="bar-label">Player A</span>
                <div class="progress-bar">
                  <div class="progress-fill error" style="width: 20%"></div>
                </div>
                <span class="bar-value">2</span>
              </div>
              <div class="bar-container">
                <span class="bar-label">Player B</span>
                <div class="progress-bar">
                  <div class="progress-fill error" style="width: 10%"></div>
                </div>
                <span class="bar-value">1</span>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <h4>Average Bitrate</h4>
            <div class="comparison-bars">
              <div class="bar-container">
                <span class="bar-label">Player A</span>
                <div class="progress-bar">
                  <div class="progress-fill success" style="width: 85%"></div>
                </div>
                <span class="bar-value">2.1 Mbps</span>
              </div>
              <div class="bar-container">
                <span class="bar-label">Player B</span>
                <div class="progress-bar">
                  <div class="progress-fill success" style="width: 90%"></div>
                </div>
                <span class="bar-value">2.3 Mbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comparison-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      color: white;
    }

    .comparison-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .comparison-title {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #fff, #e0e7ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .comparison-subtitle {
      font-size: 1.2rem;
      opacity: 0.8;
    }

    .comparison-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .player-panel {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1.3rem;
    }

    .player-label {
      font-size: 0.875rem;
      font-weight: 400;
      opacity: 0.8;
      color: rgba(255, 255, 255, 0.7);
    }

    .stream-selector {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.5rem;
      border-radius: 0.25rem;
      min-width: 200px;
    }

    .stream-selector option {
      background: #1f2937;
      color: white;
    }

    .video-container {
      aspect-ratio: 16/9;
      background: #000;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .comparison-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .player-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .stat-label {
      opacity: 0.8;
      margin-right: 0.5rem;
    }

    .stat-value {
      font-weight: 600;
    }

    .comparison-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .control-section {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .control-section h4 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .control-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .icon-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    }

    .icon-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .icon-btn:hover::before {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.05);
    }

    .icon-btn:active {
      transform: scale(0.95);
    }

    .btn-icon {
      font-size: 1.2rem;
      z-index: 1;
      position: relative;
    }

    .play-btn .btn-icon {
      filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
    }

    .pause-btn .btn-icon {
      filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6));
    }

    .seek-btn .btn-icon {
      filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
    }

    .icon-btn:hover .btn-icon {
      transform: scale(1.1);
    }

    .network-controls label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .network-controls select {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.5rem;
      border-radius: 0.25rem;
    }

    .network-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 0.25rem;
    }

    .status-indicator {
      font-size: 1rem;
    }

    .status-text {
      color: #f59e0b;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .network-description {
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      font-style: italic;
      line-height: 1.4;
    }

    .comparison-analytics {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }

    .comparison-analytics h3 {
      margin: 0 0 2rem 0;
      font-size: 1.5rem;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .analytics-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .analytics-card h4 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .comparison-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .bar-container {
      display: grid;
      grid-template-columns: 80px 1fr 60px;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .progress-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s ease;
    }

    .progress-fill.success {
      background: #22c55e;
    }

    .progress-fill.error {
      background: #ef4444;
    }

    .bar-value {
      font-size: 0.875rem;
      font-weight: 600;
      text-align: right;
    }

    @media (max-width: 1024px) {
      .comparison-layout {
        grid-template-columns: 1fr;
      }
      
      .comparison-controls {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .comparison-container {
        padding: 1rem;
      }
      
      .panel-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .control-buttons {
        justify-content: center;
      }
    }
  `]
})
export class ComparisonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoPlayerA') videoPlayerA!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoPlayerB') videoPlayerB!: ElementRef<HTMLVideoElement>;

  networkSpeed = 'unlimited';

  // Create separate HLS service instances for each player
  private readonly hlsServiceA: HlsService;
  private readonly hlsServiceB: HlsService;

  availableStreams = [
    { name: 'Big Buck Bunny', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Sintel 4K', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' },
    { name: 'Tears of Steel', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' }
  ];

  playerA = {
    selectedStream: '',
    stats: {
      bitrate: '0',
      quality: 'Not loaded'
    }
  };

  playerB = {
    selectedStream: '',
    stats: {
      bitrate: '0',
      quality: 'Not loaded'
    }
  };

  constructor() {
    // Create separate HLS service instances for independent control
    this.hlsServiceA = new HlsService();
    this.hlsServiceB = new HlsService();
  }

  ngAfterViewInit() {
    this.initializeHlsPlayers();
    this.preselectFirstStream();
  }

  ngOnDestroy() {
    this.hlsServiceA.destroy();
    this.hlsServiceB.destroy();
  }

  private initializeHlsPlayers() {
    // Initialize Player A
    if (this.hlsServiceA.isSupported()) {
      this.hlsServiceA.initialize(this.videoPlayerA.nativeElement);
      this.hlsServiceA.onMetrics((metrics) => {
        this.playerA.stats = {
          bitrate: metrics.bitrate.toString(),
          quality: metrics.qualityLevel
        };
      });
      // Start faster metrics updates for responsive UI
      this.hlsServiceA.startMetricsUpdate(250); // Update every 250ms instead of 1000ms
    }

    // Initialize Player B
    if (this.hlsServiceB.isSupported()) {
      this.hlsServiceB.initialize(this.videoPlayerB.nativeElement);
      this.hlsServiceB.onMetrics((metrics) => {
        this.playerB.stats = {
          bitrate: metrics.bitrate.toString(),
          quality: metrics.qualityLevel
        };
      });
      // Start faster metrics updates for responsive UI
      this.hlsServiceB.startMetricsUpdate(250); // Update every 250ms instead of 1000ms
    }
  }

  private preselectFirstStream() {
    // Preselect the first available stream for both players
    if (this.availableStreams.length > 0) {
      const firstStreamUrl = this.availableStreams[0].url;

      // Set the selected stream for both players
      this.playerA.selectedStream = firstStreamUrl;
      this.playerB.selectedStream = firstStreamUrl;

      // Load the streams after a short delay to ensure HLS is initialized
      setTimeout(() => {
        this.onPlayerAStreamChange();
        this.onPlayerBStreamChange();
      }, 100);
    }
  }

  onPlayerAStreamChange() {
    if (this.playerA.selectedStream) {
      this.hlsServiceA.loadSource(this.playerA.selectedStream);
    }
  }

  onPlayerBStreamChange() {
    if (this.playerB.selectedStream) {
      this.hlsServiceB.loadSource(this.playerB.selectedStream);
    }
  }

  syncPlay() {
    this.videoPlayerA.nativeElement.play();
    this.videoPlayerB.nativeElement.play();
  }

  syncPause() {
    this.videoPlayerA.nativeElement.pause();
    this.videoPlayerB.nativeElement.pause();
  }

  syncSeek() {
    const currentTime = this.videoPlayerA.nativeElement.currentTime;
    this.videoPlayerB.nativeElement.currentTime = currentTime;
  }

  applyNetworkThrottling() {
    console.log('Applying network throttling to Player B:', this.networkSpeed);

    // Apply bandwidth limitations only to Player B
    const bandwidthLimits = {
      'unlimited': 0, // 0 means no limit
      'fast': 1600000, // 1.6 Mbps in bits per second
      'slow': 400000,  // 400 Kbps in bits per second
      '2g': 250000     // 250 Kbps in bits per second
    };

    const maxBandwidth = bandwidthLimits[this.networkSpeed as keyof typeof bandwidthLimits];

    // Player A always has unlimited bandwidth (control/reference)
    if (this.hlsServiceA) {
      this.hlsServiceA.setMaxBandwidth(0); // Always unlimited
      console.log('Player A: Unlimited bandwidth (control)');
    }

    // Apply throttling only to Player B
    if (this.hlsServiceB && maxBandwidth > 0) {
      this.hlsServiceB.setMaxBandwidth(maxBandwidth);
      console.log(`Player B: Set max bandwidth to ${maxBandwidth / 1000}kbps`);
    } else if (this.hlsServiceB) {
      this.hlsServiceB.setMaxBandwidth(0); // Remove limit
      console.log('Player B: Removed bandwidth limit');
    }

    // Show user feedback
    this.showNetworkThrottlingFeedback();
  }

  private showNetworkThrottlingFeedback() {
    const speedNames = {
      'unlimited': 'Unlimited',
      'fast': 'Fast 3G (1.6 Mbps)',
      'slow': 'Slow 3G (400 Kbps)',
      '2g': '2G (250 Kbps)'
    };

    const speedName = speedNames[this.networkSpeed as keyof typeof speedNames];

    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(59, 130, 246, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;
    notification.textContent = `Player B network speed: ${speedName}`;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
