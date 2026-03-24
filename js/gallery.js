/* ═══════════════════════════════════════════
   Gallery Data Module
   Manejo de datos con localStorage
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'chromata_gallery';

const GalleryData = {
  /**
   * Obtener todos los items de la galería
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Guardar un nuevo item
   */
  add(item) {
    const items = this.getAll();
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: item.title || 'Sin título',
      category: item.category || 'otro',
      url: item.url,
      thumbnail: item.thumbnail || item.url,
      type: item.type, // 'image' o 'video'
      format: item.format,
      cloudinaryId: item.cloudinaryId || null,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem); // Agregar al inicio
    this._save(items);
    return newItem;
  },

  /**
   * Eliminar un item
   */
  remove(id) {
    const items = this.getAll().filter(item => item.id !== id);
    this._save(items);
  },

  /**
   * Filtrar por categoría
   */
  filterByCategory(category) {
    if (category === 'todos') return this.getAll();
    return this.getAll().filter(item => item.category === category);
  },

  /**
   * Obtener estadísticas
   */
  getStats() {
    const items = this.getAll();
    return {
      total: items.length,
      photos: items.filter(i => i.type === 'image').length,
      videos: items.filter(i => i.type === 'video').length,
    };
  },

  /**
   * Guardar en localStorage
   */
  _save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error guardando datos:', e);
    }
  }
};