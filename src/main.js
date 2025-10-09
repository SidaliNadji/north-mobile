import Alpine from 'alpinejs'
import Plyr from 'plyr'
import Hls from 'hls.js'
import 'plyr/dist/plyr.css'

import { ScreenOrientation } from '@capacitor/screen-orientation';


// To unlock orientation which will default back to the global setting:
await ScreenOrientation.unlock();
 
window.Alpine = Alpine

window.app = function() {
  return {
    loading: true,
    channelName: 'Loading...',
    socialLinks: {},
    videoBackgroundStyle: '',
    isPlaying: false,
    videoLoading: false,
    player: null,
    hls: null,
    streamUrl: null,
    streamPoster: null,
    
    // Get configuration from environment variables
    get config() {
      return {
          assetBaseUrl: import.meta.env.VITE_ASSET_BASE_URL || 'https://api.awraas.tv',
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.awraas.tv/api',
        tenantName: import.meta.env.VITE_TENANT_NAME || 'northafricatv',
        defaultChannelName: import.meta.env.VITE_CHANNEL_NAME || 'Channel',
        appTitle: import.meta.env.VITE_APP_TITLE || 'TV Channel'
      }
    },
    
    async loadChannelData() {
      try {
        const { apiBaseUrl, tenantName } = this.config;
        const apiUrl = `${apiBaseUrl}/channel/${tenantName}/streams`;
        
        console.log(`Loading data for tenant: ${tenantName} from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.data) {
          this.channelName = data.data.channel.name;
          this.socialLinks = data.data.channel.social_links || {};
          this.streamUrl = data.data.url; // Store the HLS stream URL
          
          // Set video player background image and poster
          if (data.data.background) {
            this.videoBackgroundStyle = `background-image: url('${data.data.background}'); background-size: cover; background-position: center;`;
            this.streamPoster = data.data.background; // Set as video poster
          }
        }
      } catch (error) {
        console.error('Error loading channel data:', error);
        this.channelName = this.config.defaultChannelName;
      } finally {
        this.loading = false;
      }
    },
    
    async playVideo() {
      if (!this.streamUrl) {
        console.error('No stream URL available');
        return;
      }
      
      this.videoLoading = true;
      this.isPlaying = true;
      
      try {
        const videoElement = this.$refs.videoPlayer;

        // Initialize Plyr player
        this.player = new Plyr(videoElement, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'settings',
            'fullscreen'
          ],
          settings: ['quality', 'speed'],
          quality: {
            default: 720,
            options: [1080, 720, 480, 360]
          },
          speed: {
            selected: 1,
            options: [0.5, 0.75, 1, 1.25, 1.5, 2]
          },
          ratio: '16:9',
          fullscreen: {
            enabled: true,
            fallback: true,
            iosNative: false
          }
        });

        // Handle HLS stream
        if (Hls.isSupported()) {
          this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          this.hls.loadSource(this.streamUrl);
          this.hls.attachMedia(videoElement);

          this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed, starting playback');
            this.videoLoading = false;
            videoElement.play().catch(e => console.error('Playback failed:', e));
          });

          this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            this.videoLoading = false;
            if (data.fatal) {
              this.isPlaying = false;
            }
          });

        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          videoElement.src = this.streamUrl;
          videoElement.addEventListener('loadedmetadata', () => {
            this.videoLoading = false;
            videoElement.play().catch(e => console.error('Playback failed:', e));
          });
        } else {
          throw new Error('HLS is not supported in this browser');
        }

        // Handle player events
        this.player.on('play', () => {
          console.log('Video started playing');
        });

        this.player.on('pause', () => {
          console.log('Video paused');
        });

        this.player.on('ended', () => {
          console.log('Video ended');
        });

      } catch (error) {
        console.error('Error initializing video player:', error);
        this.videoLoading = false;
        this.isPlaying = false;
      }
    },

    stopVideo() {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }

      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }

      this.isPlaying = false;
      this.videoLoading = false;
    }
  }
}
 
Alpine.start()


await ScreenOrientation.lock({ orientation: 'landscape' });