import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MuxService, VideoMetadata, ConversionProgress } from '../services/mux.service';

export interface DemoStream {
  name: string;
  url: string;
  description: string;
  type: 'hls' | 'mp4';
  quality: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-container">
      <div class="hero-section">
        <h1 class="hero-title">VidStream Demo</h1>
        <p class="hero-subtitle">
          Experience the power of HLS.js and mux.js in action
        </p>
        <p class="hero-description">
          This demo showcases adaptive streaming, format conversion, and real-time analytics
          for modern web video applications.
        </p>
      </div>

      <div class="demo-sections">
        <div class="section">
          <h2 class="section-title">🎥 Sample Streams</h2>
          <p class="section-description">
            Choose from our curated collection of test streams to see HLS.js in action
          </p>
          <div class="streams-grid">
            <div 
              *ngFor="let stream of demoStreams" 
              class="stream-card"
              (click)="playStream(stream)"
            >
              <div class="stream-header">
                <h3 class="stream-name">{{ stream.name }}</h3>
                <span class="stream-quality">{{ stream.quality }}</span>
              </div>
              <p class="stream-description">{{ stream.description }}</p>
              <div class="stream-footer">
                <span class="stream-type">{{ stream.type.toUpperCase() }}</span>
                <button class="play-button">▶ Play</button>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🔧 Upload & Convert</h2>
          <p class="section-description">
            Upload your own video files and see mux.js format conversion in action
          </p>
          <div class="upload-area" (click)="!isProcessing && fileInput.click()">
            <div class="upload-content" *ngIf="!isProcessing && !uploadProgress">
              <span class="upload-icon">📁</span>
              <p class="upload-text">Click to upload video file</p>
              <p class="upload-hint">Supports MP4, WebM, MOV formats</p>
            </div>

            <div class="upload-progress" *ngIf="isProcessing || uploadProgress">
              <span class="upload-icon">🔄</span>
              <p class="upload-text">Processing video file...</p>
              <div class="progress-bar" *ngIf="uploadProgress">
                <div class="progress-fill" [style.width.%]="uploadProgress.percentage"></div>
              </div>
              <p class="upload-hint" *ngIf="uploadProgress">
                {{ uploadProgress.percentage }}% complete ({{ uploadProgress.speed }}x speed)
              </p>
            </div>

            <input
              #fileInput
              type="file"
              accept="video/*"
              (change)="onFileSelected($event)"
              style="display: none"
              [disabled]="isProcessing"
            >
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 4rem;
      color: white;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #fff, #e0e7ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    }

    .hero-description {
      font-size: 1.1rem;
      opacity: 0.8;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .demo-sections {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }

    .section {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .section-title {
      color: white;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }

    .section-description {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .streams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .stream-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stream-card:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .stream-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .stream-name {
      color: white;
      font-size: 1.2rem;
      margin: 0;
    }

    .stream-quality {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .stream-description {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .stream-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stream-type {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .play-button {
      background: linear-gradient(45deg, #3b82f6, #1d4ed8);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .play-button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .upload-area {
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 1rem;
      padding: 3rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .upload-area:hover {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.05);
    }

    .upload-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .upload-text {
      color: white;
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .upload-hint {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }

    .upload-progress {
      text-align: center;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin: 1rem 0;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(45deg, #3b82f6, #1d4ed8);
      transition: width 0.3s ease;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      text-align: center;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .feature-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      color: white;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .feature-card p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .landing-container {
        padding: 1rem;
      }
      
      .hero-title {
        font-size: 2.5rem;
      }
      
      .streams-grid,
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LandingComponent {
  uploadProgress: ConversionProgress | null = null;
  isProcessing = false;

  demoStreams: DemoStream[] = [
    {
      name: "Big Buck Bunny",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      description: "Classic test video with multiple quality levels for adaptive streaming",
      type: "hls",
      quality: "Multi-bitrate"
    },
    {
      name: "Sintel 4K",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      description: "High-quality 4K content perfect for testing streaming performance",
      type: "hls",
      quality: "4K UHD"
    },
    {
      name: "Tears of Steel",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      description: "Professional quality content with multiple audio tracks",
      type: "hls",
      quality: "HD"
    }
  ];

  constructor(
    private readonly router: Router,
    private readonly muxService: MuxService
  ) {}

  playStream(stream: DemoStream) {
    this.router.navigate(['/player'], {
      queryParams: {
        url: stream.url,
        name: stream.name,
        type: stream.type
      }
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.muxService.isFormatSupported(file)) {
      alert('Unsupported file format. Please select a video file.');
      return;
    }

    this.isProcessing = true;
    this.uploadProgress = null;

    try {
      // Extract metadata first
      const metadata: VideoMetadata = await this.muxService.extractMetadata(file);
      console.log('Video metadata:', metadata);

      // Convert file using mux.js
      const convertedData = await this.muxService.convertMp4ToTs(file, (progress) => {
        this.uploadProgress = progress;
      });

      // Create blob URL for the converted data
      const blobUrl = this.muxService.createBlobUrl(convertedData);

      // Navigate to player with converted stream
      this.router.navigate(['/player'], {
        queryParams: {
          url: blobUrl,
          name: `${file.name} (Converted)`,
          type: 'converted',
          originalFile: file.name
        }
      });

    } catch (error) {
      console.error('File processing failed:', error);
      alert('Failed to process the video file. Please try another file.');
    } finally {
      this.isProcessing = false;
      this.uploadProgress = null;
    }
  }
}
