export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetType?: "image/webp" | "image/jpeg";
  minBytesToCompress?: number;
};

export type CompressImageResult = {
  file: File;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
};

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.78,
  targetType: "image/jpeg",
  minBytesToCompress: 200 * 1024,
};

const getFileExtensionByType = (type: string) => {
  if (type === "image/webp") return "webp";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/gif") return "gif";
  return "bin";
};

const getFileNameWithoutExtension = (fileName: string) =>
  fileName.replace(/\.[^/.]+$/, "");

const isCompressibleImage = (file: File) => {
  if (!file.type.startsWith("image/")) return false;
  // Keep GIF and SVG untouched to avoid breaking animation/vector data.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return false;
  }
  return true;
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    image.src = objectUrl;
  });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
};

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  if (typeof window === "undefined" || !isCompressibleImage(file)) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  if (file.size < merged.minBytesToCompress) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  try {
    const image = await loadImage(file);

    const scale = Math.min(
      1,
      merged.maxWidth / image.width,
      merged.maxHeight / image.height,
    );

    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        file,
        compressed: false,
        originalSize: file.size,
        compressedSize: file.size,
      };
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, merged.targetType, merged.quality);
    if (!blob) {
      return {
        file,
        compressed: false,
        originalSize: file.size,
        compressedSize: file.size,
      };
    }

    // Keep original if compression did not help materially.
    if (blob.size >= file.size * 0.95) {
      return {
        file,
        compressed: false,
        originalSize: file.size,
        compressedSize: file.size,
      };
    }

    const fileName = getFileNameWithoutExtension(file.name);
    const ext = getFileExtensionByType(merged.targetType);
    const compressedFile = new File([blob], `${fileName}.${ext}`, {
      type: merged.targetType,
      lastModified: Date.now(),
    });

    return {
      file: compressedFile,
      compressed: true,
      originalSize: file.size,
      compressedSize: compressedFile.size,
    };
  } catch {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file as data URL"));
    reader.readAsDataURL(file);
  });
}
