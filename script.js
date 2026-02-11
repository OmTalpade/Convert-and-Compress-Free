// ======================================================
// Convert and Compress Free - Main JavaScript
// - Theme toggle with localStorage
// - Responsive navigation
// - Image conversion & compression using Canvas
// - File size and reduction statistics
// - Contact form validation
// ======================================================

(function () {
    "use strict";

    // ---------------------------
    // Helpers
    // ---------------------------

    function $(selector) {
        return document.querySelector(selector);
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
        const units = ["B", "KB", "MB", "GB"];
        let i = 0;
        let val = bytes;
        while (val >= 1024 && i < units.length - 1) {
            val /= 1024;
            i++;
        }
        return `${val.toFixed(2)} ${units[i]}`;
    }

    // ---------------------------
    // Theme Toggle (Dark/Light)
    // ---------------------------

    const THEME_KEY = "ccf-theme";
    const body = document.body;
    const themeToggleBtn = $(".theme-toggle");
    const themeToggleIcon = $(".theme-toggle-icon");

    function applyTheme(theme) {
        if (!theme || theme === "light") {
            body.removeAttribute("data-theme");
            if (themeToggleIcon) themeToggleIcon.textContent = "🌙";
        } else {
            body.setAttribute("data-theme", "dark");
            if (themeToggleIcon) themeToggleIcon.textContent = "☀️";
        }
    }

    function detectInitialTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark") return stored;
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "dark" : "light";
    }

    const initialTheme = detectInitialTheme();
    applyTheme(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const current = body.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const next = current === "dark" ? "light" : "dark";
            applyTheme(next);
            try {
                localStorage.setItem(THEME_KEY, next);
            } catch {
                // ignore storage errors
            }
        });
    }

    // ---------------------------
    // Responsive Navigation
    // ---------------------------

    const navToggle = $(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("nav-open");
            navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        // Close menu when a link is clicked on mobile
        navLinks.addEventListener("click", (event) => {
            if (event.target.tagName === "A" && navLinks.classList.contains("nav-open")) {
                navLinks.classList.remove("nav-open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    // ---------------------------
    // Footer Year
    // ---------------------------

    const yearSpan = $("#year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ---------------------------
    // Image Conversion & Compression (Home page only)
    // ---------------------------

    const fileInput = $("#file-input");
    const dropArea = $("#drop-area");
    const previewCanvas = $("#preview-canvas");
    const noPreviewText = $("#no-preview-text");
    const formatSelect = $("#format-select");
    const qualityRange = $("#quality-range");
    const qualityValue = $("#quality-value");
    const convertBtn = $("#convert-btn");
    const downloadBtn = $("#download-btn");
    const statusMessage = $("#status-message");
    const originalSizeEl = $("#original-size");
    const compressedSizeEl = $("#compressed-size");
    const sizeReductionEl = $("#size-reduction");

    let originalFile = null;
    let convertedBlob = null;
    let previewContext = null;

    if (previewCanvas) {
        previewContext = previewCanvas.getContext("2d");
    }

    function setStatus(message, type) {
        if (!statusMessage) return;
        statusMessage.textContent = message || "";
        statusMessage.classList.remove("success", "error");
        if (type) statusMessage.classList.add(type);
    }

    function resetStats() {
        if (originalSizeEl) originalSizeEl.textContent = "–";
        if (compressedSizeEl) compressedSizeEl.textContent = "–";
        if (sizeReductionEl) sizeReductionEl.textContent = "–";
    }

    function updateStats(originalSize, compressedSize) {
        if (!originalSizeEl || !compressedSizeEl || !sizeReductionEl) return;
        originalSizeEl.textContent = originalSize ? formatBytes(originalSize) : "–";
        compressedSizeEl.textContent = compressedSize ? formatBytes(compressedSize) : "–";

        if (originalSize && compressedSize && compressedSize < originalSize) {
            const percent = ((originalSize - compressedSize) / originalSize) * 100;
            sizeReductionEl.textContent = `-${percent.toFixed(1)}%`;
        } else {
            sizeReductionEl.textContent = "0%";
        }
    }

    function enableButtons() {
        if (convertBtn) convertBtn.disabled = !originalFile;
        if (downloadBtn) downloadBtn.disabled = !convertedBlob;
    }

    function renderPreview(image) {
        if (!previewCanvas || !previewContext) return;
        const maxWidth = 500;
        const maxHeight = 260;
        let { width, height } = image;

        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        previewCanvas.width = width;
        previewCanvas.height = height;
        previewContext.clearRect(0, 0, width, height);
        previewContext.drawImage(image, 0, 0, width, height);

        previewCanvas.style.display = "block";
        if (noPreviewText) noPreviewText.style.display = "none";
    }

    function handleFile(file) {
        if (!file || !previewCanvas || !previewContext) return;

        const validTypes = /^image\//i;
        if (!validTypes.test(file.type)) {
            setStatus("Please select a valid image file (JPG, PNG, WebP, HEIC, etc.).", "error");
            return;
        }

        originalFile = file;
        convertedBlob = null;
        enableButtons();
        resetStats();
        updateStats(file.size, 0);
        setStatus("Loading image preview…", "");

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                renderPreview(img);
                updateStats(file.size, 0);
                setStatus("Image loaded. Adjust settings and click Convert / Compress.", "success");
            };
            img.onerror = function () {
                setStatus("Unable to read this image. Some formats (like HEIC) may not be supported in your browser.", "error");
            };
            img.src = event.target.result;
        };
        reader.onerror = function () {
            setStatus("Failed to load image. Please try again.", "error");
        };
        reader.readAsDataURL(file);
    }

    if (qualityRange && qualityValue) {
        qualityValue.textContent = qualityRange.value;
        qualityRange.addEventListener("input", () => {
            qualityValue.textContent = qualityRange.value;
        });
    }

    if (dropArea && fileInput) {
        ["dragenter", "dragover"].forEach((eventName) => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropArea.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropArea.classList.remove("dragover");
            });
        });

        dropArea.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const file = dt && dt.files && dt.files[0];
            if (file) {
                handleFile(file);
            }
        });

        fileInput.addEventListener("change", (e) => {
            const input = e.target;
            if (input.files && input.files[0]) {
                handleFile(input.files[0]);
            }
        });
    }

    async function convertImage() {
        if (!originalFile || !previewCanvas || !previewContext || !formatSelect || !qualityRange) {
            return;
        }

        setStatus("Processing image…", "");
        convertedBlob = null;
        enableButtons();

        // Determine MIME type and quality
        let outputType = formatSelect.value;
        let qualityVal = parseInt(qualityRange.value, 10) || 80;

        // Special case: "image/jpeg-high"
        let quality = 0.8;
        if (outputType === "image/jpeg-high") {
            outputType = "image/jpeg";
            quality = 0.92;
        } else {
            quality = Math.min(Math.max(qualityVal / 100, 0.02), 1);
        }

        // We already drew a scaled preview; to maintain maximum quality we re-draw
        // from original again using an Image.
        try {
            const dataURL = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = () => reject(new Error("Failed to read original file."));
                reader.readAsDataURL(originalFile);
            });

            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () =>
                    reject(
                        new Error(
                            "Your browser may not support this image format (for example, some HEIC files)."
                        )
                    );
                image.src = dataURL;
            });

            // Draw to a working canvas at full resolution, but keep size under a practical limit
            const maxWidth = 4000;
            const maxHeight = 4000;
            let { width, height } = img;
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to Blob
            const blob = await new Promise((resolve, reject) => {
                if (!canvas.toBlob) {
                    reject(new Error("Canvas toBlob is not supported in this browser."));
                    return;
                }
                canvas.toBlob(
                    (b) => {
                        if (!b) {
                            reject(new Error("Conversion failed. Please try different settings."));
                        } else {
                            resolve(b);
                        }
                    },
                    outputType,
                    outputType === "image/png" ? undefined : quality
                );
            });

            convertedBlob = blob;

            // Update preview to show final output resolution (scaled down)
            const previewImg = new Image();
            previewImg.onload = function () {
                renderPreview(previewImg);
            };
            previewImg.src = URL.createObjectURL(blob);

            updateStats(originalFile.size, blob.size);
            setStatus("Conversion and compression completed successfully. You can now download your image.", "success");
            enableButtons();
        } catch (err) {
            console.error(err);
            setStatus(err.message || "An error occurred during conversion. Please try again.", "error");
            convertedBlob = null;
            enableButtons();
        }
    }

    if (convertBtn) {
        convertBtn.addEventListener("click", () => {
            if (!originalFile) {
                setStatus("Please upload an image first.", "error");
                return;
            }
            convertImage();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            if (!convertedBlob || !originalFile) {
                setStatus("Please convert or compress an image before downloading.", "error");
                return;
            }

            const outputType = formatSelect ? formatSelect.value : "image/jpeg";
            let ext = "jpg";
            if (outputType === "image/png") ext = "png";
            else if (outputType === "image/webp") ext = "webp";

            const originalName = originalFile.name || "image";
            const baseName = originalName.includes(".")
                ? originalName.slice(0, originalName.lastIndexOf("."))
                : originalName;
            const downloadName = `${baseName}-optimized.${ext}`;

            const url = URL.createObjectURL(convertedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus("Download started. Your optimized image is ready.", "success");
        });
    }

    // Initialize buttons' disabled state on home page
    if (convertBtn || downloadBtn) {
        enableButtons();
    }

    // ---------------------------
    // Contact Form Validation
    // ---------------------------

    const contactForm = $("#contact-form");
    if (contactForm) {
        const nameInput = $("#contact-name");
        const emailInput = $("#contact-email");
        const messageInput = $("#contact-message");
        const nameError = $("#contact-name-error");
        const emailError = $("#contact-email-error");
        const messageError = $("#contact-message-error");
        const successEl = $("#contact-success");

        function validateEmail(value) {
            // Simple email regex for basic validation
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();

            let isValid = true;
            if (successEl) successEl.textContent = "";

            if (nameInput && nameError) {
                const v = nameInput.value.trim();
                if (!v) {
                    nameError.textContent = "Please enter your name.";
                    isValid = false;
                } else {
                    nameError.textContent = "";
                }
            }

            if (emailInput && emailError) {
                const v = emailInput.value.trim();
                if (!v) {
                    emailError.textContent = "Please enter your email address.";
                    isValid = false;
                } else if (!validateEmail(v)) {
                    emailError.textContent = "Please enter a valid email address.";
                    isValid = false;
                } else {
                    emailError.textContent = "";
                }
            }

            if (messageInput && messageError) {
                const v = messageInput.value.trim();
                if (!v) {
                    messageError.textContent = "Please enter a message.";
                    isValid = false;
                } else if (v.length < 10) {
                    messageError.textContent = "Your message should be at least 10 characters.";
                    isValid = false;
                } else {
                    messageError.textContent = "";
                }
            }

            if (!isValid) return;

            // Simulate success (no backend)
            contactForm.reset();
            if (successEl) {
                successEl.textContent =
                    "Thank you for contacting us. Your message has been received and will be reviewed soon.";
            }
        });
    }
})();