export class ImageUtils {
  private static readonly MAX_SIDE = 1200;
  private static readonly IMAGE_QUALITY = 0.8;

  //Метод сжатия изображения
  static async compressImage(file: File): Promise<Blob> {
    //Декодируем изображение из File в ImageBitmap для последующих операций
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error('Не удалось прочитать файл как изображение. Проверьте формат файла.');
    }

    try {
      //Урезаем размеры до максимально указанных
      const scale = Math.min(1, this.MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      //Передаём в canvas размеры нового изображения
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      //Получаем контекст для отрисовки
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D-контекст недоступен в этом браузере');
      }

      //Рисуем новое фото по новым размерам
      ctx.drawImage(bitmap, 0, 0, width, height);

      //Возвращаем формат WebP, если браузер его поддерживает
      //если нет, то далее вернем формат JPEG иначе по умолчанию будет PNG
      const webpBlob = await this.canvasToBlob(canvas, 'image/webp');
      if (webpBlob.type === 'image/webp') {
        return webpBlob;
      }

      return await this.canvasToBlob(canvas, 'image/jpeg');
    } finally {
      bitmap.close();
    }
  }

  //Метод, возвращающий Blob в виде форматов webp или jpeg
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    type: 'image/webp' | 'image/jpeg',
  ): Promise<Blob> {
    //Возвращаем новый промис с конвертацией в Blob объект для базы данных с качеством 0.8
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сжать изображение'))),
        type,
        this.IMAGE_QUALITY,
      );
    });
  }

  //Метод для получения размеров уже сжатого blob - для метаданных
  //Отдельный метод, а не часть compressImage, потому что нужен только в момент
  //сохранения записи, а не при каждом сжатии (например, если фото ещё будут
  //где-то предпросматриваться без сохранения размеров).
  //Декодирование маленького (уже сжатого, ~100-300 КБ) blob — дешёвая операция.
  static async getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    const bitmap = await createImageBitmap(blob);
    try {
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  }
}
