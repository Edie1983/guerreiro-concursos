export const generateEditalStructureMock = () => ({
  nome: "Concurso Polícia Federal 2024",
  banca: "Cebraspe",
  dataProva: "2024-12-15",
  disciplinas: [
    {
      nome: "Língua Portuguesa",
      subdisciplinas: [
        {
          nome: "Interpretação de Textos",
          conteudos: [
            "Compreensão de textos verbais e não verbais",
            "Tipologia textual",
            "Figuras de linguagem"
          ],
          estudado: false
        },
        {
          nome: "Gramática Aplicada",
          conteudos: [
            "Ortografia oficial",
            "Acentuação gráfica",
            "Classes de palavras",
            "Concordância nominal e verbal",
            "Regência nominal e verbal",
            "Crase"
          ],
          estudado: false
        }
      ]
    },
    {
      nome: "Direito Constitucional",
      subdisciplinas: [
        {
          nome: "Dos Princípios Fundamentais",
          conteudos: [
            "República Federativa do Brasil: princípios e fundamentos",
            "Direitos e garantias fundamentais",
            "Separação dos Poderes"
          ],
          estudado: false
        },
        {
          nome: "Da Organização do Estado",
          conteudos: [
            "União, Estados, Distrito Federal e Municípios",
            "Administração Pública: disposições gerais e servidores públicos"
          ],
          estudado: false
        }
      ]
    },
    {
      nome: "Informática",
      subdisciplinas: [
        {
          nome: "Segurança da Informação",
          conteudos: [
            "Princípios de segurança",
            "Malware, ataques e ameaças",
            "Criptografia",
            "Firewall e IDS/IPS"
          ],
          estudado: false
        },
        {
          nome: "Redes de Computadores",
          conteudos: [
            "Modelo OSI e TCP/IP",
            "Principais protocolos (HTTP, FTP, SMTP, DNS)",
            "Redes sem fio (Wi-Fi)"
          ],
          estudado: false
        }
      ]
    }
  ]
});
