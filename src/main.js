import Alpine from 'alpinejs'
import Plyr from 'plyr'
import Hls from 'hls.js'
import 'plyr/dist/plyr.css'

import { ScreenOrientation } from '@capacitor/screen-orientation';

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

          if (data.data.background) {
            this.videoBackgroundStyle = `background-image: url('${data.data.background}'); background-size: cover; background-position: center;`;
            this.streamPoster = data.data.background; // Set as video poster
          }

            const video = document.getElementById('player');
            const player = new Plyr(video, {
                poster: this.streamPoster,
                fullscreen:{ enabled: true, fallback: true, iosNative: false, container: null },
                ratio:'16:9',
                controls:['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen']
            });

            if (!Hls.isSupported()) {
                video.src = this.streamUrl;
            } else {
                const hls = new Hls();
                hls.loadSource(this.streamUrl);
                hls.attachMedia(video);
            }
            player.on('canplay', () => {this.loading = false})
        }
      } catch (error) {
        console.error('Error loading channel data:', error);
      } finally {

      }
    },
  }
}

Alpine.start()


await ScreenOrientation.lock({ orientation: 'landscape' });