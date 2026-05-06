import { GoogleGenAI } from "@google/genai";
import { FinancialData } from "../types";

const SYSTEM_PROMPT = `Você é um Assistente Financeiro Pessoal de Alta Performance e um estrategista de alocação de capital. Seu objetivo é ajudar o usuário a organizar suas finanças, quitar débitos de forma inteligente e construir patrimônio.

Diferenciação Crucial:
1. DESPESAS MENSAIS (Fluxo de Caixa): Gastos fixos (aluguel, luz), variáveis (mercado, lazer) e pontuais (viagem). Estes são o custo de vida.
2. PASSIVOS/DÍVIDAS (Patrimônio Negativo): Itens a serem quitados (empréstimos, saldo devedor de cartão, financiamentos). O objetivo aqui é a QUITAÇÃO total.

Sua comunicação deve ser clara, objetiva, encorajadora e extremamente organizada.
Use tabelas, bullet points e negritos para destacar números importantes.

Sempre que o usuário inserir dados ou solicitar um reajuste, sua resposta DEVE conter:
1. 📊 RESUMO DO MÊS: [Renda Total] | [Despesas Totais] | [Saldo Disponível para Dívidas/Investimentos]
2. 🛒 PLANO DE GASTOS MENSAL: Orçamento para o custo de vida (Despesas).
3. 📉 PLANO DE QUITAÇÃO: Estratégia agressiva para eliminar os Passivos.
4. 📈 INVESTIMENTOS: Alocação do excedente após as prioridades acima.
5. 🔄 RECALCULAR ROTA: Próximos passos imediatos.

Importante: Responda SEMPRE em Markdown.`;

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
