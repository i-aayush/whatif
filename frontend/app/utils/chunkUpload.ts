import { API_URL } from '../config/config';

const CHUNK_SIZE = 2048 * 1024; // 2MB chunks

interface InitUploadResponse {
  upload_id: string;
}

export async function uploadInChunks(
  files: File[],
  modelName: string,
  onProgress: (progress: number) => void
): Promise<{ status: 'success' | 'error'; message?: string }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Calculate total size of all files
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Initialize upload with metadata
    const initResponse = await fetch(
      `${API_URL}/training/init-upload?file_count=${files.length}&total_size=${totalSize}&model_name=${encodeURIComponent(modelName)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      }
    );

    if (!initResponse.ok) {
      const errorData = await initResponse.json();
      throw new Error(errorData.detail || 'Failed to initialize upload');
    }

    const { upload_id } = await initResponse.json() as InitUploadResponse;

    // Calculate total size for progress tracking
    let totalUploaded = 0;

    // Upload each file in chunks
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      let start = 0;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      while (start < file.size) {
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const chunkIndex = Math.floor(start / CHUNK_SIZE);

        const formData = new FormData();
        formData.append('file', chunk, file.name);

        const uploadResponse = await fetch(
          `${API_URL}/training/upload-chunk/${upload_id}?` +
          `chunk_index=${chunkIndex}&` +
          `file_index=${fileIndex}&` +
          `total_chunks=${totalChunks}&` +
          `filename=${encodeURIComponent(file.name)}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
            credentials: 'include'
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.detail || `Failed to upload chunk ${chunkIndex} of file ${fileIndex}`);
        }

        // Update progress
        totalUploaded += chunk.size;
        const progress = (totalUploaded / totalSize) * 100;
        onProgress(progress);

        start += CHUNK_SIZE;
      }
    }

    // The backend will automatically process the upload and start training
    // when all chunks are received, so we don't need to call upload-and-train
    return { status: 'success' };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to upload files'
    };
  }
} 