import { GoogleGenAI, Type } from "@google/genai";
import { Dataset, AnalysisResponse, VizConfig, DataStory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStory(dataset: Dataset, focus?: string): Promise<DataStory> {
  const prompt = `
    You are a master data storyteller. Create a compelling narrative story from the following dataset.
    
    Dataset: ${dataset.name}
    Structure: ${JSON.stringify(dataset.columns.map(c => ({ name: c.name, type: c.type, samples: c.sampleValues })))}
    Row count: ${dataset.data.length}
    Focus: ${focus || "General overview and most interesting patterns"}

    The story should be structured as a sequence of "slides" or "chapters".
    Each slide needs:
    1. A title
    2. A narrative text (1-2 paragraphs)
    3. A visualization config (type, xAxis, yAxis, title) that supports the slide's claim
    4. A concise "tl;dr" insight

    Respond strictly in JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                insight: { type: Type.STRING },
                visualization: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['line', 'bar', 'scatter', 'area', 'pie'] },
                    xAxis: { type: Type.STRING },
                    yAxis: { type: Type.STRING },
                    title: { type: Type.STRING }
                  },
                  required: ['type', 'xAxis', 'yAxis', 'title']
                }
              },
              required: ['title', 'content', 'insight']
            }
          }
        },
        required: ['title', 'summary', 'slides']
      }
    }
  });

  return JSON.parse(response.text || '{}') as DataStory;
}

export async function analyzeDataset(dataset: Dataset): Promise<AnalysisResponse> {
  const summaryPrompt = `
    Analyze this dataset summary and provide insights, cleaning suggestions, and visualization ideas.
    
    Dataset Name: ${dataset.name}
    Columns: ${JSON.stringify(dataset.columns.map(c => ({ 
      name: c.name, 
      type: c.type, 
      missing: c.missingCount,
      unique: c.uniqueCount,
      samples: c.sampleValues
    })))}
    Rows: ${dataset.data.length}

    Respond in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: summaryPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Top findings from the data summary"
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Immediate cleaning or normalization steps"
          },
          suggestedVisualizations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['line', 'bar', 'scatter', 'area', 'pie'] },
                xAxis: { type: Type.STRING },
                yAxis: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['type', 'xAxis', 'yAxis', 'title']
            }
          }
        },
        required: ['insights', 'suggestions', 'suggestedVisualizations']
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnalysisResponse;
}

export async function getVisualizationForQuery(query: string, dataset: Dataset): Promise<VizConfig | null> {
  const prompt = `
    The user wants to see: "${query}"
    
    Based on this dataset:
    Columns: ${JSON.stringify(dataset.columns.map(c => ({ name: c.name, type: c.type })))}
    
    Return a visualization configuration that would answer this query.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['line', 'bar', 'scatter', 'area', 'pie'] },
          xAxis: { type: Type.STRING },
          yAxis: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['type', 'xAxis', 'yAxis', 'title']
      }
    }
  });

  try {
    return JSON.parse(response.text || '') as VizConfig;
  } catch (e) {
    return null;
  }
}

export async function chatAboutData(messages: {role: string, content: string}[], dataset: Dataset) {
  const context = `
    You are AnalystIQ, a professional data analyst AI. 
    You are helping the user explore a dataset: ${dataset.name}.
    Dataset Layout: ${JSON.stringify(dataset.columns.map(c => c.name))}
    Number of rows: ${dataset.data.length}
    
    Answer questions precisely based on the data provided. 
    If you need to suggest a chart, describe it clearly.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: context
    }
  });

  return response.text;
}
