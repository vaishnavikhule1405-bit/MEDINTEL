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

export interface ClinicalPredictionResponse {
  predicted_disease: string;
  predicted_disease_display: string;
  model_confidence: number;
  class_probability: number;
  top_5_predictions: DiseasePrediction[];
  model_evidence: ShapContribution[];
  active_symptoms_count: number;
  active_symptoms: string[];
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
  negated_count: number;
  uncertain_count: number;
  historical_count: number;
  total_entities: number;
}

export interface NLPAnalysisResponse {
  original_text: string;
  word_count: number;
  char_count: number;
  entities: ExtractedEntity[];
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
export interface ToolCallTrace {
  tool_name: string;
  parameters: Record<string, any>;
  result: any;
  success: boolean;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCallTrace[];
  safety_notes?: string[];
  timestamp: string;
}
