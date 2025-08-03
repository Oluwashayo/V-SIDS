// Memory store for current image
let currentImageBase64: string | null = null;

export const setImage = (base64: string) => {
  currentImageBase64 = base64;
};

export const getImage = (): string | null => {
  return currentImageBase64;
};

export const hasImage = (): boolean => {
  return !!currentImageBase64;
};

export const clearImage = () => {
  currentImageBase64 = null;
};

// Modified API call function
export const queryRag = async (question: string) => {
  // ONLY block if no image has EVER been uploaded
  if (!hasImage()) {
    throw new Error("Please upload an image first");
  }
  
  // ALWAYS use the stored image for ALL subsequent calls
  const payload = {
    image_b64: getImage(),  // Automatically include stored image
    question
  };
  
  const response = await fetch("/api/diagnose", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}; 