/**
 * Generates a random alphanumeric CAPTCHA code with mixed casing
 */
export const generateCaptchaCode = (length = 6): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Renders the CAPTCHA code into an image (Data URL format) using HTML5 Canvas.
 * Safe for Server-Side Rendering (SSR).
 */
export const generateCaptchaImage = (code: string): string => {
  if (typeof window === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 55;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background color with clean light style
  ctx.fillStyle = "#f8fafc"; // slate-50
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw some noise grid lines
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.25)`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Draw background dots for noise
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, 0.4)`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  // Font styles
  const fontFamilies = ["monospace", "sans-serif", "serif"];
  ctx.textBaseline = "middle";

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = 15 + i * 23 + Math.random() * 4;
    const y = 28 + (Math.random() * 10 - 5);
    const angle = (Math.random() * 30 - 15) * Math.PI / 180; // random rotation -15 to 15 degrees

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Choose random fonts and styles for each character to make it anti-OCR
    ctx.font = `bold ${22 + Math.floor(Math.random() * 6)}px ${fontFamilies[Math.floor(Math.random() * fontFamilies.length)]}`;
    
    // Dark-themed colors (so it stands out and is readable)
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 120)})`;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
};
