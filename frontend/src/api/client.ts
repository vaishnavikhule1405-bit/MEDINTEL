// MedIntel API Client
import {
  SymptomListResponse,
  ClinicalPredictionResponse,
  ImagingPredictionResponse,
  NLPAnalysisResponse,
  MultimodalEvidenceProfileResponse,
  SyntheticCaseSummary,
  AssistantHistoryTurn,
  AssistantStatusResponse,
  AssistantChatResponse,
  AssistantToolsResponse,
} from '../types';

const BASE_URL = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

// ==========================================
// Clinical API
// ==========================================
export const clinicalApi = {
  getSymptoms: () => request<SymptomListResponse>('/clinical/symptoms'),
  
  predict: (symptoms: string[]) => 
    request<ClinicalPredictionResponse>('/clinical/predict', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    }),
};

// ==========================================
// Imaging API
// ==========================================
export const imagingApi = {
  predict: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<ImagingPredictionResponse>('/imaging/predict', {
      method: 'POST',
      body: formData,
    });
  },

  getModelInfo: () => request<any>('/imaging/model-info'),
};

// ==========================================
// NLP API
// ==========================================
export const nlpApi = {
  analyze: (text: string, retrieveSimilar = true, topK = 3) =>
    request<NLPAnalysisResponse>('/nlp/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, retrieve_similar: retrieveSimilar, top_k: topK }),
    }),

  uploadFile: (file: File, retrieveSimilar = true, topK = 3) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('retrieve_similar', String(retrieveSimilar));
    formData.append('top_k', String(topK));
    return request<NLPAnalysisResponse>('/nlp/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// ==========================================
// Late Evidence Fusion API
// ==========================================
export const fusionApi = {
  fuse: (symptoms?: string[], file?: File, medicalText?: string) => {
    const formData = new FormData();
    if (symptoms && symptoms.length > 0) {
      formData.append('symptoms', JSON.stringify(symptoms));
    }
    if (file) {
      formData.append('file', file);
    }
    if (medicalText && medicalText.trim().length > 0) {
      formData.append('medical_text', medicalText.trim());
    }
    return request<MultimodalEvidenceProfileResponse>('/fusion/analyze', {
      method: 'POST',
      body: formData,
    });
  },

  getSyntheticCases: (limit = 50, offset = 0) =>
    request<SyntheticCaseSummary[]>(`/fusion/synthetic-cases?limit=${limit}&offset=${offset}`),

  getSyntheticCaseById: (caseId: string) =>
    request<MultimodalEvidenceProfileResponse>(`/fusion/synthetic-cases/${caseId}`),

  getAnalysisSummary: () =>
    request<any>('/fusion/analysis-summary'),
};

// ==========================================
// Explainability API
// ==========================================
export const explainabilityApi = {
  getClinicalGlobal: () => request<any>('/explainability/clinical/global'),
  getClinicalExample: () => request<any>('/explainability/clinical/example'),
  getImagingSamples: () => request<any>('/explainability/imaging/samples'),
  getNLPExamples: (limit = 10) => request<any>(`/explainability/nlp/examples?limit=${limit}`),
};

// ==========================================
// Agentic Healthcare Assistant API
// ==========================================
export const assistantApi = {
  getStatus: () => request<AssistantStatusResponse>('/assistant/status'),

  chat: (
    message: string,
    sessionId?: string,
    caseId?: string,
    options: {
      symptoms?: string[];
      medicalText?: string;
      history?: AssistantHistoryTurn[];
      imageFile?: File;
    } = {},
  ) => {
    if (options.imageFile) {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('file', options.imageFile);
      if (sessionId) formData.append('session_id', sessionId);
      if (caseId) formData.append('case_id', caseId);
      if (options.symptoms?.length) formData.append('symptoms', options.symptoms.join(','));
      if (options.medicalText) formData.append('medical_text', options.medicalText);
      formData.append('history', JSON.stringify(options.history ?? []));
      return request<AssistantChatResponse>('/assistant/chat/image', {
        method: 'POST',
        body: formData,
      });
    }

    return request<AssistantChatResponse>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId,
        case_id: caseId,
        symptoms: options.symptoms?.length ? options.symptoms : undefined,
        medical_text: options.medicalText || undefined,
        history: options.history ?? [],
      }),
    });
  },

  getTools: () => request<AssistantToolsResponse>('/assistant/tools'),
};

// ==========================================
// Cases API
// ==========================================
export const casesApi = {
  listCases: (limit = 25, offset = 0, caseType?: string, evidenceLevel?: string, search?: string) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (caseType) params.set('case_type', caseType);
    if (evidenceLevel) params.set('evidence_level', evidenceLevel);
    if (search) params.set('search', search);
    return request<any[]>(`/cases?${params.toString()}`);
  },

  getCaseDetail: (caseId: string) => request<any>(`/cases/${caseId}`),
};

// ==========================================
// Analytics API
// ==========================================
export const analyticsApi = {
  getSummary: () => request<any>('/analytics/summary'),
};
