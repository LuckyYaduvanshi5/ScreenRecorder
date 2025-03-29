document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileName = document.getElementById('fileName');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadStep = document.getElementById('uploadStep');
    const convertStep = document.getElementById('convertStep');
    const downloadStep = document.getElementById('downloadStep');
    
    // Variables
    let selectedFile = null;
    let convertedFile = null;
    let ffmpeg = null;
    
    // Initialize FFmpeg
    async function initFFmpeg() {
        if (ffmpeg) return ffmpeg;
        
        try {
            // Show progress
            updateProgress(5, 'Loading converter...');
            
            // Create FFmpeg instance
            const { createFFmpeg } = FFmpeg;
            ffmpeg = createFFmpeg({ 
                log: true,
                progress: ({ ratio }) => {
                    const percent = Math.round(ratio * 100);
                    updateProgress(percent, `Converting: ${percent}%`);
                }
            });
            
            // Load FFmpeg
            await ffmpeg.load();
            console.log('FFmpeg loaded');
            return ffmpeg;
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            alert('Could not load the converter. Redirecting to online service...');
            window.open('https://cloudconvert.com/webm-to-mp4', '_blank');
            throw error;
        }
    }
    
    // Handle file selection via input
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        handleFileSelection(file);
    });
    
    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            handleFileSelection(file);
        }
    });
    
    // Click on drop zone to open file selection
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle selected file
    function handleFileSelection(file) {
        // Check if it's a WebM file
        if (!file.type.includes('webm')) {
            alert('Please select a WebM file.');
            return;
        }
        
        // Update UI
        selectedFile = file;
        fileName.textContent = file.name;
        
        // Enable convert button
        convertBtn.disabled = false;
        
        // Mark step as completed
        uploadStep.classList.add('completed');
        
        // Activate next step
        convertStep.classList.add('active');
        
        // Scroll to convert button
        convertBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Update progress function
    function updateProgress(percent, text) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = text;
    }
    
    // Convert WebM to MP4
    async function convertWebMtoMP4(webmFile) {
        try {
            // Initialize FFmpeg
            const ffmpegInstance = await initFFmpeg();
            
            // Read file data
            const { fetchFile } = FFmpeg;
            const data = await fetchFile(webmFile);
            
            // Write to virtual filesystem
            ffmpegInstance.FS('writeFile', 'input.webm', data);
            
            // Run conversion
            await ffmpegInstance.run(
                '-i', 'input.webm',
                '-c:v', 'h264',
                '-preset', 'fast',
                '-c:a', 'aac',
                '-b:a', '128k',
                'output.mp4'
            );
            
            // Read output file
            const outputData = ffmpegInstance.FS('readFile', 'output.mp4');
            
            // Create MP4 blob
            const mp4Blob = new Blob([outputData.buffer], { type: 'video/mp4' });
            
            // Clean up
            ffmpegInstance.FS('unlink', 'input.webm');
            ffmpegInstance.FS('unlink', 'output.mp4');
            
            return mp4Blob;
        } catch (error) {
            console.error('Conversion error:', error);
            
            // If conversion fails, redirect to online converter
            alert('Conversion failed. Redirecting to online converter...');
            window.open('https://cloudconvert.com/webm-to-mp4', '_blank');
            
            throw error;
        }
    }
    
    // Handle convert button click
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        // Show progress
        progressContainer.classList.remove('hidden');
        updateProgress(0, 'Starting conversion...');
        convertBtn.disabled = true;
        
        try {
            // Check for SharedArrayBuffer support
            if (typeof SharedArrayBuffer === 'undefined') {
                throw new Error('Your browser does not support the required features. Redirecting to online converter...');
            }
            
            // Convert file
            convertedFile = await convertWebMtoMP4(selectedFile);
            
            // Update UI
            updateProgress(100, 'Conversion completed!');
            
            // Mark step as completed
            convertStep.classList.add('completed');
            
            // Activate next step
            downloadStep.classList.add('active');
            
            // Enable download button
            downloadBtn.disabled = false;
            
            // Scroll to download button
            downloadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (error) {
            console.error('Error during conversion:', error);
            progressContainer.classList.add('hidden');
            convertBtn.disabled = false;
        }
    });
    
    // Handle download button click
    downloadBtn.addEventListener('click', () => {
        if (!convertedFile) return;
        
        // Create a download link
        const url = URL.createObjectURL(convertedFile);
        const a = document.createElement('a');
        a.href = url;
        
        // Set filename based on original file
        const originalName = selectedFile.name.replace('.webm', '');
        a.download = `${originalName}.mp4`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        // Show completion message
        alert('Download complete! Thank you for using our converter.');
    });
    
    // Fallback to online conversion when errors happen
    function fallbackToOnlineConverter() {
        // Direct users to the online service with good UI
        const shouldRedirect = confirm('Could not convert in browser. Would you like to use our online conversion service instead?');
        
        if (shouldRedirect) {
            window.open('https://cloudconvert.com/webm-to-mp4', '_blank');
        }
    }
    
    // Add ads.js for the converter page
    const adsScript = document.createElement('script');
    adsScript.src = '../js/ads.js';
    document.body.appendChild(adsScript);
});
