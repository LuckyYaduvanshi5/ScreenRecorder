/**
 * Ad management script for Screen Recorder app
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const adConfig = {
        enabled: true,
        headerAdId: 'headerAd',
        footerAdId: 'footerAd',
        adRefreshInterval: 60000, // 60 seconds
        // Add your AdSense publisher ID when available
        publisherId: ''
    };
    
    // Function to load Google AdSense
    function loadAdSense() {
        if (!adConfig.enabled || !adConfig.publisherId) return;
        
        // Create AdSense script
        const adScript = document.createElement('script');
        adScript.async = true;
        adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.publisherId}`;
        adScript.crossOrigin = 'anonymous';
        document.head.appendChild(adScript);
        
        console.log('AdSense script loaded');
    }
    
    // Function to create ad units
    function createAdUnit(containerId, format) {
        if (!adConfig.enabled) return;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        if (!adConfig.publisherId) {
            // Show placeholder if no publisher ID is set
            container.innerHTML = `<div class="ad-placeholder">Advertisement Placeholder</div>`;
            return;
        }
        
        // Create AdSense format
        const adInsElement = document.createElement('ins');
        adInsElement.className = 'adsbygoogle';
        adInsElement.style.display = 'block';
        adInsElement.style.width = '100%';
        adInsElement.style.height = format === 'banner' ? '90px' : '250px';
        adInsElement.setAttribute('data-ad-client', adConfig.publisherId);
        adInsElement.setAttribute('data-ad-slot', ''); // Add your ad slot when available
        adInsElement.setAttribute('data-ad-format', format);
        adInsElement.setAttribute('data-full-width-responsive', 'true');
        
        container.appendChild(adInsElement);
        
        // Push ad command
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
    
    // Initialize ads
    function initializeAds() {
        if (!adConfig.enabled) return;
        
        // Load AdSense script
        loadAdSense();
        
        // Create ad units with a small delay to ensure the script is loaded
        setTimeout(() => {
            createAdUnit(adConfig.headerAdId, 'banner');
            createAdUnit(adConfig.footerAdId, 'banner');
        }, 1000);
    }
    
    // Initialize ads when page is ready
    if (document.readyState === 'complete') {
        initializeAds();
    } else {
        window.addEventListener('load', initializeAds);
    }
});
