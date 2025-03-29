// Initialize FFmpeg
let ffmpeg = null;

/**
 * Convert WebM video to MP4 format using FFmpeg.js
 * @param {Blob} webmBlob - The WebM blob to convert
 * @param {HTMLElement} statusElement - Element to show loading status
 * @returns {Promise<Blob>} - Promise resolving to MP4 blob
 */
async function webmToMp4(webmBlob, statusElement) {
    try {
        // Load FFmpeg if not already loaded
        if (!ffmpeg) {
            statusElement.innerHTML = `<span class="spinner"></span> Loading FFmpeg...`;
            const { createFFmpeg } = FFmpeg;
            ffmpeg = createFFmpeg({ 
                log: true,
                corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
            });
            await ffmpeg.load();
            console.log('FFmpeg loaded successfully');
        }
        
        statusElement.innerHTML = `<span class="spinner"></span> Converting to MP4...`;
        console.log('Starting WebM to MP4 conversion');
        
        // Get the input data
        const { fetchFile } = FFmpeg;
        const data = await fetchFile(webmBlob);
        
        // Write input file to virtual file system
        ffmpeg.FS('writeFile', 'input.webm', data);
        
        // Run conversion with simpler parameters for better compatibility
        await ffmpeg.run(
            '-i', 'input.webm',
            '-c:v', 'h264',
            '-c:a', 'aac',
            '-strict', 'experimental',
            'output.mp4'
        );
        
        // Read the output file
        const outputData = ffmpeg.FS('readFile', 'output.mp4');
        console.log('Conversion finished, creating MP4 blob');
        
        // Create MP4 blob
        const mp4Blob = new Blob([outputData.buffer], { type: 'video/mp4' });
        
        // Clean up memory
        try {
            ffmpeg.FS('unlink', 'input.webm');
            ffmpeg.FS('unlink', 'output.mp4');
        } catch (e) {
            console.warn('Failed to clean up FFmpeg files:', e);
        }
        
        return mp4Blob;
    } catch (error) {
        console.error('Error during MP4 conversion:', error);
        throw new Error(`MP4 conversion failed: ${error.message}`);
    }
}
