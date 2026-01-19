// src/services/firestoreClean.ts
// Utilitário recursivo para limpar campos undefined antes de salvar no Firestore
// Firestore não aceita campos undefined (apenas null ou ausentes)

/**
 * Remove recursivamente todos os campos undefined de um valor
 * Mantém null (que é válido no Firestore)
 * 
 * Regras:
 * - undefined → removido (não incluído no resultado)
 * - null → mantido
 * - Arrays → limpa recursivamente cada elemento (mantém array vazio se necessário)
 * - Objetos → limpa recursivamente cada propriedade (mantém objeto vazio se necessário)
 * - Primitivos → mantidos como estão
 */
export function cleanFirestoreData<T>(value: T): T {
  // null é válido no Firestore, então mantém
  if (value === null) {
    return value;
  }

  // undefined → retorna como undefined (será removido no objeto pai)
  if (value === undefined) {
    return value as T;
  }

  // Arrays: limpa recursivamente cada elemento
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => cleanFirestoreData(item))
      .filter((item) => item !== undefined);
    // Sempre retorna um array (mesmo que vazio)
    return cleaned as T;
  }

  // Objetos: limpa recursivamente cada propriedade e remove as undefined
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, any>;
    const cleaned: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const cleanedValue = cleanFirestoreData(obj[key]);
        // Só inclui se não for undefined
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }

    // Sempre retorna um objeto (mesmo que vazio)
    return cleaned as T;
  }

  // Primitivos (string, number, boolean, Date, etc.): mantém como está
  return value;
}

