import { GoogleGenAI } from "@google/genai";
import { FinancialData } from "../types";

const SYSTEM_PROMPT = `Você é o Estrategista Financeiro Chefe da Fortuna.

ESTRUTURA DA RESPOSTA (Obrigatório):
## 📊 Análise Comparativa de Estratégias
Apresente DUAS estratégias distintas para o usuário:
1. **ESTRATÉGIA A (Bola de Neve)**: Foco em quitar a menor dívida primeiro para ganho psicológico.
2. **ESTRATÉGIA B (Avalanche)**: Foco em quitar a dívida com maior juro para economia financeira total.

Para cada uma, forneça uma tabela simples com:
- Tempo estimado de quitação.
- Economia total em juros.
- Vantagem principal.

## 📉 Plano de Ação Detalhado
Explique o porquê de cada recomendação.

DIRETRIZES DE FORMATAÇÃO:
- Use Tabelas Markdown padrão.
- Use Negrito para números.
- Responda em Markdown limpo.`;

export async function getFinancialAdvice(data: FinancialData, userQuery?: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!key) {
    return "Configuração da API ausente. Por favor, adicione sua VITE_GEMINI_API_KEY no arquivo .env.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key }); // Default is v1beta
    
    const expensesTotal = (data.expenses || []).reduce((acc, curr) => acc + curr.amount, 0);
    const debtsTotal = (data.debts || []).reduce((acc, curr) => acc + curr.monthlyPayment, 0);
    const saldoLivre = data.monthlyIncome - (expensesTotal + debtsTotal);

    const contextPrompt = `
      ${SYSTEM_PROMPT}

      CONTEXTO FINANCEIRO ATUAL DO USUÁRIO:
      - Renda Mensal: R$ ${data.monthlyIncome}
      - Saldo Livre Previsto: R$ ${saldoLivre}
      - Despesas (Listagem): ${JSON.stringify((data.expenses || []).map(e => ({ item: e.category, valor: e.amount, tipo: e.type })))}
      - Passivos/Dívidas (Listagem): ${JSON.stringify(data.debts || [])}
      - Reserva Total: R$ ${data.savings || 0}
      - Baldes de Reserva: ${JSON.stringify(data.reserves || [])}
      - Objetivo: ${data.goal || 'Não definido'}
      - Perfil: ${data.riskProfile || 'moderado'}

      INSTRUÇÃO: Analise o contexto acima para responder a pergunta do usuário. 
      Se ele perguntar sobre parcelamento, calcule o impacto no fluxo de caixa mensal futuro.
      Seja pragmático e use números.
    `;

    const promptMessage = userQuery 
      ? `${contextPrompt}\n\nPERGUNTA DO USUÁRIO: ${userQuery}`
      : `${contextPrompt}\n\nPor favor, forneça a análise estratégica padrão completa seguindo o formato solicitado no SYSTEM_PROMPT.`;

    // Implementação de Retry para o erro 503
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: 'user', parts: [{ text: promptMessage }] }],
          config: {
            temperature: 0.7,
          },
        });
        return response.text || "Desculpe, não consegui processar uma resposta.";
      } catch (error: any) {
        attempts++;
        const isHighDemand = error.message?.includes("503") || error.message?.includes("high demand");
        
        if (isHighDemand && attempts < maxAttempts) {
          console.warn(`Tentativa ${attempts} falhou por alta demanda. Retentando em ${attempts * 2}s...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 2000));
          continue;
        }
        throw error;
      }
    }
    
    return "O servidor está muito ocupado no momento. Por favor, tente novamente em alguns instantes.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error.message || "Erro desconhecido";
    return `Erro na análise: ${msg}. Verifique sua conexão e se a chave VITE_GEMINI_API_KEY no .env é válida.`;
  }
}
