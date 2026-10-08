// Core Type Definitions for MEDINTEL AI matching backend Pydantic schemas

export type AppExperience = 'landing' | 'app';

export type NavTab = 
  | 'dashboard'
  | 'clinical'
  | 'imaging'
  | 'nlp'
  | 'fusion'
  | 'explainability'
  | 'assistant'
  | 'cases'
  | 'analytics'
  | 'model-info'
  | 'settings';

// ==========================================
// Clinical Service Types
// ==========================================
export interface SymptomItem {
  id: string;
  name: string;
  category: string;
  is_rare: boolean;
}

export interface SymptomCategoryGroup {
  category: string;
  count: number;
  symptoms: SymptomItem[];
}

export interface SymptomListResponse {
  total: number;
  categories: SymptomCategoryGroup[];
  all_symptoms: SymptomItem[];
}

export interface DiseasePrediction {
  disease: string;
  disease_display_name: string;
  class_index: number;
  probability: number;
  model_confidence: number;
}

export interface ShapContribution {
  symptom_id: string;
  symptom_name: string;
  symptom_value: number;
  shap_value: number;
  contribution: string; // 'increases_prediction' | 'decreases_prediction'
  absolute_impact: number;
}

export interface ClinicalModelEvaluationMetrics {
  model_name: string;
  accuracy: string;
  macro_precision: string;
  macro_recall: string;
  macro_f1: string;
  weighted_f1: string;
  training_dataset_records: string;
  num_symptom_features: number;
  num_disease_classes: number;
}

export interface ClinicalPredictionResponse {
  predicted_disease: string;
  predicted_disease_display: string;
  model_confidence: number;
  class_probability: number;
  top_5_predictions: DiseasePrediction[];
  model_evidence: ShapContribution[];
  active_symptoms_count: number;
  active_symptoms: string[];
  model_info: ClinicalModelEvaluationMetrics;
  disclaimer: string;
  safety_note: string;
}

// ==========================================
// Imaging Service Types
// ==========================================
export interface VisualEvidence {
  evidence_label: string;
  target_layer: string;
  heatmap_base64: string;
  overlay_base64: string;
  original_base64: string;
  disclaimer: string;
}

export interface ImagingPredictionResponse {
  predicted_class: string; // 'NORMAL' | 'PNEUMONIA'
  normal_probability: number;
  pneumonia_probability: number;
  model_confidence: number;
  visual_evidence: VisualEvidence;
  disclaimer: string;
  safety_note: string;
}

// ==========================================
// NLP Service Types
// ==========================================
export interface ExtractedEntity {
  text: string;
  category: string;
  confidence: number;
  status: 'PRESENT' | 'NEGATED' | 'UNCERTAIN' | 'HISTORICAL' | 'FAMILY_HISTORY' | string;
  trigger_word?: string;
  char_start?: number;
  char_end?: number;
}

export type NLPEntity = ExtractedEntity;

export interface SimilarReport {
  record_id: number;
  sample_name: string;
  medical_specialty: string;
  similarity_score: number;
  text_preview: string;
  entity_count: number;
}

export interface CategoryCounts {
  problems_count: number;
  symptoms_count: number;
  medications_count: number;
  tests_count: number;
  procedures_count: number;
  anatomy_count: number;
  measurements_count: number;
  clinical_events_count: number;
  clinical_history_count: number;
  treatment_count: number;
  clinical_attributes_count: number;
  negated_count: number;
  uncertain_count: number;
  historical_count: number;
  family_history_count: number;
  total_entities: number;
}

export interface CategorizedEntities {
  problems: ExtractedEntity[];
  symptoms: ExtractedEntity[];
  medications: ExtractedEntity[];
  tests: ExtractedEntity[];
  procedures: ExtractedEntity[];
  anatomy: ExtractedEntity[];
  measurements: ExtractedEntity[];
  clinical_events: ExtractedEntity[];
  clinical_history: ExtractedEntity[];
  treatment: ExtractedEntity[];
  clinical_attributes: ExtractedEntity[];
}

export interface NLPAnalysisResponse {
  original_text: string;
  word_count: number;
  char_count: number;
  entities: ExtractedEntity[];
  categorized_entities: CategorizedEntities;
  counts: CategoryCounts;
  similar_reports: SimilarReport[];
  disclaimer: string;
  safety_note: string;
}

// ==========================================
// Fusion Service Types
// ==========================================
export interface ModalityContributions {
  clinical: number;
  imaging: number;
  medical_text: number;
}

export interface ModalityAvailability {
  clinical_provided: boolean;
  imaging_provided: boolean;
  text_provided: boolean;
  missing_modalities: string[];
  active_modality_count: number;
}

export interface EvidenceProfile {
  overall_evidence_index: number;
  evidence_level: 'LOW' | 'MODERATE' | 'HIGH' | string;
  cross_modality_relationship: string;
  relationship_explanation: string;
  modality_contributions: ModalityContributions;
  modality_availability: ModalityAvailability;
  uncertainty_notes: string[];
}

export interface MultimodalEvidenceProfileResponse {
  profile_type: string;
  case_type: string;
  is_synthetic_demonstration: boolean;
  synthetic_case_id?: string;
  evidence_profile: EvidenceProfile;
  clinical_analysis?: ClinicalPredictionResponse;
  imaging_analysis?: ImagingPredictionResponse;
  textual_analysis?: NLPAnalysisResponse;
  clinical_evidence_score?: number;
  imaging_evidence_score?: number;
  textual_evidence_score?: number;
  provenance?: {
    clinical_record?: number;
    imaging_record?: number;
    nlp_record?: number;
    same_patient?: boolean;
    architecture_note?: string;
    case_mode?: string;
  };
  synthetic_badge: string;
  disclaimer: string;
  safety_note: string;
}

export interface SyntheticCaseSummary {
  case_id: string;
  case_type: string;
  clinical_prediction: string;
  clinical_confidence: number;
  imaging_prediction: string;
  imaging_confidence: number;
  text_entities_count: number;
  overall_evidence_index: number;
  evidence_level: string;
  cross_modality_relationship: string;
}

// ==========================================
// Assistant Types
// ==========================================
export interface AssistantToolMetadata {
  name: string;
  description: string;
  parameters: string[];
}

export interface AssistantHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantToolsResponse {
  tools: AssistantToolMetadata[];
  safety_guardrails: string[];
}

export interface AssistantStatusResponse {
  language_api: 'groq' | 'built-in';
  groq_configured: boolean;
  model: string | null;
}

export interface AssistantToolInvocation {
  tool_name: string;
  arguments: Record<string, unknown>;
  result_summary: string;
  status: string;
}

export type AssistantConcordanceStatus =
  | 'CONCORDANT'
  | 'DISCORDANT'
  | 'INCOMPLETE'
  | 'INFORMATIONAL';

export interface AssistantChatResponse {
  reply: string;
  session_id: string;
  tools_executed: AssistantToolInvocation[];
  concordance_status: AssistantConcordanceStatus;
  suggested_actions: string[];
  response_source: 'groq' | 'local';
  disclaimer: string;
  safety_note: string;
}

export interface ToolCallTrace {
  tool_name: string;
  parameters: Record<string, unknown>;
  result: string;
  success: boolean;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCallTrace[];
  safety_notes?: string[];
  suggested_actions?: string[];
  concordance_status?: AssistantConcordanceStatus;
  response_source?: 'groq' | 'local';
  timestamp: string;
}
