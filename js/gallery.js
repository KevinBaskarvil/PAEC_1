/* ═══════════════════════════════════════════
   Gallery Data Module — Cloud Storage
   Base de datos en la nube con JSONBin.io
   ═══════════════════════════════════════════
   
   CONFIGURACIÓN:
   1. Crea una cuenta en https://jsonbin.io (gratis)
   2. Ve a API Keys → copia tu X-Master-Key
   3. Crea un nuevo Bin con contenido: []
   4. Copia el Bin ID
   5. Reemplaza los valores de abajo
*/

const JSONBinConfig = {
  // ═══ REEMPLAZA ESTOS VALORES CON LOS TUYOS ═══
  binId: '69c21371aa77b81da912c5b8',
  masterKey: '$2a$10$6j9wBsMDSYg3MBbMMdgWLeeORF6EDcC3WycsY4bwlsf3R4kRQIgQO',
  // ═══════════════════════════════════════════════

  get apiUrl() {
    return `https://api.jsonbin.io/v3/b/${this.binId}`;
  },

  get isConfigured() {
    return this.binId !== 'TU_BIN_ID' && this.masterKey !== 'TU_MASTER_KEY';
  }
};

const GalleryData = {
  _cache: null,
  _lastFetch: 0,
  _cacheDuration: 5000,

  async getAll() {
    const now = Date.now();
    if (this._cache && (now - this._lastFetch) < this._cacheDuration) {
      return this._cache;
    }

    if (!JSONBinConfig.isConfigured) {
      console.warn('JSONBin no configurado. Usando localStorage.');
      return this._getLocal();
    }

    try {
      const response = await fetch(JSONBinConfig.apiUrl + '/latest', {
        headers: { 'X-Master-Key': JSONBinConfig.masterKey }
      });
      if (!response.ok) throw new Error('Error al leer datos');
      const data = await response.json();
      this._cache = Array.isArray(data.record) ? data.record : [];
      this._lastFetch = now;
      return this._cache;
    } catch (err) {
      console.error('Error obteniendo datos:', err);
      return this._getLocal();
    }
  },

  async add(item) {
    const items = await this.getAll();
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: item.title || 'Sin título',
      category: item.category || 'otro',
      url: item.url,
      thumbnail: item.thumbnail || item.url,
      type: item.type,
      format: item.format,
      cloudinaryId: item.cloudinaryId || null,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    await this._save(items);
    return newItem;
  },

  async remove(id) {
    const items = await this.getAll();
    const filtered = items.filter(item => item.id !== id);
    await this._save(filtered);
  },

  async filterByCategory(category) {
    const items = await this.getAll();
    if (category === 'todos') return items;
    return items.filter(item => item.category === category);
  },

  async getStats() {
    const items = await this.getAll();
    return {
      total: items.length,
      photos: items.filter(i => i.type === 'image').length,
      videos: items.filter(i => i.type === 'video').length,
    };
  },

  async _save(items) {
    this._cache = items;
    this._lastFetch = Date.now();
    this._saveLocal(items);

    if (!JSONBinConfig.isConfigured) return;

    try {
      const response = await fetch(JSONBinConfig.apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBinConfig.masterKey
        },
        body: JSON.stringify(items)
      });
      if (!response.ok) throw new Error('Error al guardar');
    } catch (err) {
      console.error('Error guardando en la nube:', err);
    }
  },

  _getLocal() {
    try {
      const data = localStorage.getItem('chromata_gallery');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  _saveLocal(items) {
    try {
      localStorage.setItem('chromata_gallery', JSON.stringify(items));
    } catch (e) { console.error('Error local:', e); }
  }
};
