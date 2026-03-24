/* ═══════════════════════════════════════════
   CHROMATA — App Principal (Cloud Version)
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dropzone = $('#dropzone');
  const fileInput = $('#fileInput');
  const uploadForm = $('#uploadForm');
  const previewArea = $('#previewArea');
  const uploadProgress = $('#uploadProgress');
  const progressFill = $('#progressFill');
  const progressText = $('#progressText');
  const cancelUpload = $('#cancelUpload');
  const confirmUpload = $('#confirmUpload');
  const mediaTitle = $('#mediaTitle');
  const mediaCategory = $('#mediaCategory');
  const galleryGrid = $('#galleryGrid');
  const galleryEmpty = $('#galleryEmpty');
  const lightbox = $('#lightbox');
  const lightboxClose = $('#lightboxClose');
  const lightboxContent = $('#lightboxContent');
  const lightboxInfo = $('#lightboxInfo');
  const menuToggle = $('.menu-toggle');
  const mainNav = $('.main-nav');
  const toastContainer = $('#toastContainer');

  let currentFile = null;
  let currentFilter = 'todos';

  // ── Init (async) ──
  renderGallery();
  updateStats();

  // ═══════════════════════════════════════
  //  NAVIGATION
  // ═══════════════════════════════════════

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mainNav.classList.toggle('open');
  });

  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('open');
    });
  });

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 200;
    $$('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href.startsWith('#')) return;
      const section = $(href);
      if (!section) return;
      if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        $$('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  // ═══════════════════════════════════════
  //  UPLOAD FLOW
  // ═══════════════════════════════════════

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL') fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFileSelect(fileInput.files[0]);
  });

  function handleFileSelect(file) {
    currentFile = file;

    previewArea.innerHTML = '';
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'Preview';
      previewArea.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.controls = true;
      video.muted = true;
      previewArea.appendChild(video);
    }

    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    mediaTitle.value = nameWithoutExt;

    if (file.type.startsWith('video/')) {
      mediaCategory.value = 'video';
    }

    dropzone.style.display = 'none';
    uploadForm.style.display = 'block';
    uploadProgress.style.display = 'none';
  }

  cancelUpload.addEventListener('click', () => {
    resetUpload();
  });

  confirmUpload.addEventListener('click', async () => {
    if (!currentFile) return;

    const title = mediaTitle.value.trim() || 'Sin título';
    const category = mediaCategory.value;

    if (!CloudinaryConfig.isConfigured) {
      showToast('⚠️ Configura Cloudinary en js/cloudinary.js', 'error');
      return;
    }

    uploadForm.style.display = 'none';
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Subiendo...';

    try {
      const result = await uploadToCloudinary(currentFile, (percent) => {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `Subiendo... ${percent}%`;
      });

      progressText.textContent = 'Guardando en la galería...';

      await GalleryData.add({
        title,
        category,
        url: result.url,
        thumbnail: result.thumbnail,
        type: result.type,
        format: result.format,
        cloudinaryId: result.id,
      });

      progressText.textContent = '¡Completado!';
      showToast('✅ ¡Archivo subido correctamente!', 'success');
      await renderGallery();
      await updateStats();

      setTimeout(resetUpload, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      showToast(`❌ ${err.message}`, 'error');
      uploadProgress.style.display = 'none';
      uploadForm.style.display = 'block';
    }
  });

  function resetUpload() {
    currentFile = null;
    fileInput.value = '';
    mediaTitle.value = '';
    mediaCategory.value = 'arte';
    previewArea.innerHTML = '';
    dropzone.style.display = 'block';
    uploadForm.style.display = 'none';
    uploadProgress.style.display = 'none';
    progressFill.style.width = '0%';
  }

  // ═══════════════════════════════════════
  //  GALLERY
  // ═══════════════════════════════════════

  async function renderGallery() {
    const items = await GalleryData.filterByCategory(currentFilter);

    if (items.length === 0) {
      galleryGrid.style.display = 'none';
      galleryEmpty.style.display = 'block';
      return;
    }

    galleryGrid.style.display = 'grid';
    galleryEmpty.style.display = 'none';

    galleryGrid.innerHTML = items.map((item, index) => {
      const isVideo = item.type === 'video';
      const thumbUrl = isVideo
        ? getThumbnailUrl(item.thumbnail, 500)
        : getThumbnailUrl(item.url, 500);
      
      const categoryLabels = {
        arte: '🎨 Arte',
        fotografia: '📸 Foto',
        video: '🎬 Video',
        diseno: '✏️ Diseño',
        naturaleza: '🌿 Naturaleza',
        otro: '📁 Otro'
      };

      return `
        <div class="gallery-item" 
             data-id="${item.id}" 
             data-category="${item.category}"
             style="animation-delay: ${index * 0.06}s">
          <div class="gallery-item-media" onclick="openLightbox('${item.id}')">
            ${isVideo 
              ? `<img src="${thumbUrl}" alt="${item.title}" loading="lazy">
                 <div class="gallery-item-play"><div class="play-circle">▶</div></div>`
              : `<img src="${thumbUrl}" alt="${item.title}" loading="lazy">`
            }
            <span class="gallery-item-badge">${isVideo ? 'Video' : 'Foto'}</span>
          </div>
          <div class="gallery-item-info">
            <div class="gallery-item-title">${escapeHtml(item.title)}</div>
            <div class="gallery-item-meta">
              <span class="gallery-item-category">${categoryLabels[item.category] || item.category}</span>
              
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Filters ──
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      await renderGallery();
    });
  });

  // ── Lightbox ──
  window.openLightbox = async function(id) {
    const items = await GalleryData.getAll();
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.type === 'video') {
      lightboxContent.innerHTML = `
        <video src="${item.url}" controls autoplay style="max-width:90vw; max-height:75vh; border-radius:12px;">
        </video>`;
    } else {
      lightboxContent.innerHTML = `
        <img src="${getOptimizedUrl(item.url, { width: 1400, quality: 'auto' })}" alt="${item.title}">`;
    }

    const categoryLabels = {
      arte: '🎨 Arte', fotografia: '📸 Fotografía', video: '🎬 Video',
      diseno: '✏️ Diseño', naturaleza: '🌿 Naturaleza', otro: '📁 Otro'
    };

    lightboxInfo.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p>${categoryLabels[item.category] || item.category}</p>
    `;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    const video = lightboxContent.querySelector('video');
    if (video) video.pause();
  }

  // ── Delete ──
  window.deleteItem = async function(id) {
    if (confirm('¿Eliminar este archivo de la galería?')) {
      await GalleryData.remove(id);
      await renderGallery();
      await updateStats();
      showToast('🗑 Archivo eliminado', 'info');
    }
  };

  // ── Stats ──
  async function updateStats() {
    const stats = await GalleryData.getStats();
    animateNumber($('#totalMedia'), stats.total);
    animateNumber($('#totalPhotos'), stats.photos);
    animateNumber($('#totalVideos'), stats.videos);
  }

  function animateNumber(el, target) {
    const start = parseInt(el.textContent) || 0;
    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ── Toast ──
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ── Helpers ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = $(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.section-header, .upload-card, .feature-card, .about-text').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

});
