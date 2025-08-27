export function formatMachineName(originalName: string): string {
  if (originalName.includes('_CM_')) {
    const parts = originalName.split('_CM_');
    
    if (parts[0].includes('Pachinko')) {
      const prefix = parts[0];
      const numberPart = parts[1];
      return `${prefix} ${numberPart}`;
    }
    
    if (parts.length >= 2) {
      const prefix = parts[0];
      const numberPart = parts[1];
      return `${prefix} ${numberPart}`;
    }
  } else if (originalName.startsWith('CM_')) {
    const numberPart = originalName.substring(3);
    return `Claw Machine ${numberPart}`;
  }
  
  return originalName;
}
