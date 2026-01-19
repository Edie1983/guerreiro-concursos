// src/services/aiMocks.ts

/**
 * Simula uma chamada para uma função de IA que gera questões de concurso.
 * @param {string} topic - O tópico para o qual gerar questões.
 * @param {number} count - O número de questões a serem geradas.
 * @returns {Promise<object[]>} - Uma promessa que resolve para uma lista de questões.
 */
export const generateQuestionsMock = (topic: string, count: number) => {
  console.log(`Gerando ${count} questões sobre "${topic}"...`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const questions = Array.from({ length: count }, (_, i) => ({
        id: `q${i + 1}`,
        topic,
        question: `Qual é a capital do estado de ${topic}? (Questão Mock ${i + 1})`,
        options: ["Opção A", "Opção B", "Opção C", "Opção D"],
        correctAnswer: "Opção A",
      }));
      resolve(questions);
    }, 1500);
  });
};
