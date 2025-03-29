document.addEventListener('DOMContentLoaded', () => {
    // Add structured data for main screen recorder page
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        const screenRecorderSchema = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ScrRec.online",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Windows, MacOS, Linux, Android, iOS",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "description": "Free HD screen recorder with no watermark. Record your screen directly in your browser with webcam and audio support.",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "356"
            }
        };

        addStructuredData(screenRecorderSchema);
    }

    // Add structured data for converter page
    if (window.location.pathname.includes('converter')) {
        const converterSchema = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "WebM to MP4 Converter - ScrRec.online",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Windows, MacOS, Linux, Android, iOS",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "description": "Free WebM to MP4 converter with no watermark. Convert your screen recordings to MP4 format for better compatibility.",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.7",
                "ratingCount": "218"
            }
        };

        addStructuredData(converterSchema);
    }

    // Function to add schema data to page
    function addStructuredData(schemaData) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schemaData);
        document.head.appendChild(script);
    }
});
