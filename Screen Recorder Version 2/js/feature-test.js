/**
 * This script tests all features to ensure they're working correctly
 */
document.addEventListener('DOMContentLoaded', () => {
    // Test environment detection
    console.log('Feature Testing Initialized');
    
    // Feature detection tests
    const features = {
        mediaDevices: !!navigator.mediaDevices,
        getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        mediaRecorder: !!window.MediaRecorder,
        webAudioAPI: !!window.AudioContext,
        fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
    };
    
    console.table(features);
    
    // Check for missing critical features
    const criticalFeatures = ['mediaDevices', 'getDisplayMedia', 'mediaRecorder', 'fileAPI'];
    const missingCritical = criticalFeatures.filter(f => !features[f]);
    
    if (missingCritical.length > 0) {
        console.error(`Missing critical features: ${missingCritical.join(', ')}`);
        // Add a warning banner to the UI
        const warningBanner = document.createElement('div');
        warningBanner.style.background = '#ffcc00';
        warningBanner.style.color = '#333';
        warningBanner.style.padding = '10px';
        warningBanner.style.textAlign = 'center';
        warningBanner.style.fontWeight = 'bold';
        warningBanner.innerHTML = `Warning: Your browser is missing features required for optimal screen recording: ${missingCritical.join(', ')}`;
        document.body.prepend(warningBanner);
    }
    
    // Test MediaRecorder mimeType support
    function checkMediaRecorderFormats() {
        if (!window.MediaRecorder) return {};
        
        const formats = [
            'video/webm',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm;codecs=h264',
            'video/webm;codecs=opus',
            'video/webm;codecs=vp9,opus',
            'video/mp4',
            'video/mp4;codecs=h264,aac'
        ];
        
        const supported = {};
        for (const format of formats) {
            supported[format] = MediaRecorder.isTypeSupported(format);
        }
        
        console.log('Supported media recording formats:');
        console.table(supported);
        
        return supported;
    }
    
    checkMediaRecorderFormats();
    
    // Test for MP4 conversion capability
    function testMP4Conversion() {
        if (typeof FFmpeg !== 'undefined' && typeof FFmpeg.createFFmpeg === 'function') {
            console.log('FFmpeg.js is available for MP4 conversion');
            
            // Check SharedArrayBuffer for full ffmpeg support
            if (!features.sharedArrayBuffer) {
                console.warn('SharedArrayBuffer not available - in-browser MP4 conversion may fail');
            }
        } else {
            console.warn('FFmpeg.js not loaded or not available');
        }
    }
    
    // Test with some delay to ensure all scripts are loaded
    setTimeout(testMP4Conversion, 1000);
    
    // Test audio mixing capability
    function testAudioMixing() {
        try {
            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();
            audioContext.close();
            console.log('Audio mixing capability: Available');
        } catch (e) {
            console.error('Audio mixing capability: Not available', e);
        }
    }
    
    testAudioMixing();
});
