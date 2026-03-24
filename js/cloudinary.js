const CloudinaryConfig = {
  cloudName: 'dcqnpg0vj',
  uploadPreset: 'PAEC_1',

  // Límites
  maxFileSize: 30 * 1024 * 1024, // 30MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],

  get uploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
  },

  get isConfigured() {
    return this.cloudName !== 'TU_CLOUD_NAME';
  }
};

/**
 * Sube un archivo a Cloudinary
 * @param {File} file - El archivo a subir
 * @param {Function} onProgress - Callback de progreso (0-100)
 * @returns {Promise<Object>} Datos del archivo subido
 */
async function uploadToCloudinary(file, onProgress = () => {}) {
  // Verificar configuración
  if (!CloudinaryConfig.isConfigured) {
    throw new Error(
      'Cloudinary no está configurado. Abre js/cloudinary.js y agrega tu Cloud Name y Upload Preset.'
    );
  }

  // Validar tipo de archivo
  const allAllowed = [
    ...CloudinaryConfig.allowedImageTypes,
    ...CloudinaryConfig.allowedVideoTypes
  ];
  if (!allAllowed.includes(file.type)) {
    throw new Error(`Tipo de archivo no soportado: ${file.type}`);
  }

  // Validar tamaño
  if (file.size > CloudinaryConfig.maxFileSize) {
    throw new Error(`El archivo excede el límite de 50MB`);
  }

  // Preparar FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CloudinaryConfig.uploadPreset);
  formData.append('folder', 'galeria-multimedia');

  // Subir con seguimiento de progreso
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          id: data.public_id,
          url: data.secure_url,
          type: data.resource_type, // 'image' o 'video'
          format: data.format,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          thumbnail: data.resource_type === 'video'
            ? data.secure_url.replace(/\.[^.]+$/, '.jpg')
            : data.secure_url,
          createdAt: data.created_at
        });
      } else {
        const errData = JSON.parse(xhr.responseText);
        reject(new Error(errData.error?.message || 'Error al subir archivo'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Error de red al subir archivo'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Subida cancelada'));
    });

    xhr.open('POST', CloudinaryConfig.uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Genera una URL optimizada de Cloudinary
 * @param {string} url - URL original
 * @param {Object} opts - Opciones de transformación
 * @returns {string} URL transformada
 */
function getOptimizedUrl(url, opts = {}) {
  const { width, height, quality = 'auto', format = 'auto' } = opts;
  
  if (!url.includes('cloudinary.com')) return url;
  
  const transforms = [`q_${quality}`, `f_${format}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_fill');

  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

/**
 * Genera una URL de thumbnail
 */
function getThumbnailUrl(url, size = 400) {
  return getOptimizedUrl(url, { width: size, height: size });
}