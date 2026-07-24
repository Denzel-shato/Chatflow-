const CONFIG = {
    image: {
      maxSize: 10 * 1024 * 1024,
      extensions: ["jpg", "jpeg", "png", "gif", "webp"]
    },
    video: {
      maxSize: 100 * 1024 * 1024,
      extensions: ["mp4", "webm", "ogg"]
    },
    audio: {
      maxSize: 20 * 1024 * 1024,
      extensions: ["mp3", "wav", "ogg"]
    }
  };
  
  export default function fileValidation(file) {
    if (!file) {
      return { ok: false, error: "No file selected." };
    }
  
    const [category] = file.type.split("/");
  
    if (!CONFIG[category]) {
      return { ok: false, error: "Unsupported file type." };
    }
  
    const extension = file.name.split(".").pop().toLowerCase();
  
    if (!CONFIG[category].extensions.includes(extension)) {
      return { ok: false, error: "Invalid file format." };
    }
  
    if (file.size > CONFIG[category].maxSize) {
      const mb = (CONFIG[category].maxSize / 1024 / 1024).toFixed(0);
      return {
        ok: false,
        error: `${category} files must be under ${mb}MB.`
      };
    }
  
    return { ok: true };
  }
  