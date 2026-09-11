import React, { useState, useEffect, useRef } from 'react';
import { fusionApi } from '../api/client';
import { SafetyDisclaimer } from '../components/SafetyDisclaimer';
import { Badge } from '../components/Badge';
import { GaugeChart } from '../components/GaugeChart';
import { MultimodalEvidenceProfileResponse, SyntheticCaseSummary } from '../types';

export const FusionView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'synthetic' | 'custom'>('synthetic');
  const [syntheticCases, setSyntheticCases] = useState<SyntheticCaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<MultimodalEvidenceProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [symptomsInput, setSymptomsInput] = useState<string[]>([
    'symptom_fever', 'symptom_cough', 'symptom_productive_cough',
    'symptom_pleuritic_chest_pain', 'symptom_shortness_of_breath',
    'symptom_chills', 'symptom_fatigue',
  ]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [medicalText, setMedicalText] = useState<string>(
    'Patient presents with persistent productive cough, dyspnea, and pleuritic chest pain. Rales noted in right lung base. Started on antibiotic therapy.'
  );

  const [enableClinical, setEnableClinical] = useState<boolean>(true);
  const [enableImaging, setEnableImaging] = useState<boolean>(true);
  const [enableNLP, setEnableNLP] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSyntheticCases() {
      try {
        const casesData = await fusionApi.getSyntheticCases(50, 0);
        if (casesData && casesData.length > 0) {
          setSyntheticCases(casesData);
          setSelectedCaseId(casesData[0].case_id);
          loadSyntheticCaseDetail(casesData[0].case_id);
        }
      } catch (err) {
        console.error('Failed to load initial fusion cases:', err);
      }
    }
    loadSyntheticCases();
  }, []);

  const loadSyntheticCaseDetail = async (caseId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedCaseId(caseId);
      const res = await fusionApi.getSyntheticCaseById(caseId);
      setProfile(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load synthetic demonstration case.');
    } finally {
      setLoading(false);
    }
  };

  const loadPresetRadiograph = async (type: 'pneumonia' | 'normal') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/imaging/sample/${type}`);
      if (!res.ok) throw new Error('Sample image request failed');
      const blob = await res.blob();
      const file = new File([blob], `sample_${type}.jpeg`, { type: 'image/jpeg' });
      setSelectedImageFile(file);
    } catch (err: any) {
      setError('Could not load sample radiograph: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFuse = async () => {
    if (!enableClinical && !enableImaging && !enableNLP) {
      setError('Please enable at least one modality for Late Evidence Fusion.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const symptoms = enableClinical ? symptomsInput : undefined;
      const file = enableImaging && selectedImageFile ? selectedImageFile : undefined;
      const text = enableNLP && medicalText.trim() ? medicalText.trim() : undefined;
      const res = await fusionApi.fuse(symptoms, file, text);
      setProfile(res);
    } catch (err: any) {
      setError(err.message || 'Multimodal fusion analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const getConcordanceBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s.includes('HIGH') || s.includes('CONCORDANT')) {
      return { label: statusStr, variant: 'operational' as const };
    } else if (s.includes('LOW-EVIDENCE') || s.includes('PARTIAL')) {
      return { label: statusStr, variant: 'development' as const };
    } else if (s.includes('DISAGREEMENT') || s.includes('DISCORDANT')) {
      return { label: statusStr, variant: 'research' as const };
    }
    return { label: statusStr || 'EVALUATION', variant: 'beta' as const };
  };

  const overallIndex = profile?.evidence_profile?.overall_evidence_index ?? 0;
  const evidenceLevel = (profile?.evidence_profile?.evidence_level || 'MODERATE') as 'LOW' | 'MODERATE' | 'HIGH';
  const relationship = profile?.evidence_profile?.cross_modality_relationship || 'HIGH AGREEMENT';
  const explanation = profile?.evidence_profile?.relationship_explanation || '';
  const primaryDisease =
    profile?.clinical_analysis?.predicted_disease_display ||
    profile?.imaging_analysis?.predicted_class ||
    'Respiratory / Multimodal Synthesis';

  return (
    <div className="space-y-6 animate-fade-in">
      <SafetyDisclaimer />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Evidence Fusion
          </h1>
          <Badge variant="development" label="Beta" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMode('synthetic')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
              activeMode === 'synthetic'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Synthetic Cases
          </button>
          <button
            onClick={() => setActiveMode('custom')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
              activeMode === 'custom'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Custom Analysis
          </button>
        </div>
      </div>

      {activeMode === 'synthetic' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600">Select Case</label>
            <select
              value={selectedCaseId}
              onChange={(e) => loadSyntheticCaseDetail(e.target.value)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 max-w-md"
            >
              {syntheticCases.map((c) => (
                <option key={c.case_id} value={c.case_id}>{c.case_id} - {c.evidence_level}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeMode === 'custom' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Clinical Symptoms</span>
                <input
                  type="checkbox"
                  checked={enableClinical}
                  onChange={(e) => setEnableClinical(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              {enableClinical && (
                <textarea
                  value={symptomsInput.join(', ')}
                  onChange={(e) => setSymptomsInput(e.target.value.split(',').map(s => s.trim()))}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  rows={3}
                />
              )}
            </div>
            
            <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Imaging File</span>
                <input
                  type="checkbox"
                  checked={enableImaging}
                  onChange={(e) => setEnableImaging(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              {enableImaging && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => e.target.files && setSelectedImageFile(e.target.files[0])}
                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => loadPresetRadiograph('pneumonia')} className="text-xs text-emerald-600 hover:underline">Pneumonia Sample</button>
                    <button onClick={() => loadPresetRadiograph('normal')} className="text-xs text-emerald-600 hover:underline">Normal Sample</button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">NLP Text</span>
                <input
                  type="checkbox"
                  checked={enableNLP}
                  onChange={(e) => setEnableNLP(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              {enableNLP && (
                <textarea
                  value={medicalText}
                  onChange={(e) => setMedicalText(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  rows={4}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCustomFuse}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors duration-150"
            >
              {loading ? 'Analyzing...' : 'Run Multimodal Analysis'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200">
          {error}
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col items-center justify-center">
              <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-4">Evidence Index</div>
              <GaugeChart value={overallIndex} title="Evidence Index" subtitle="Fusion Score" size={180} level={evidenceLevel} />
              <div className="mt-4">
                <Badge variant={getConcordanceBadge(relationship).variant} label={getConcordanceBadge(relationship).label} />
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm md:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Evidence Profile</h3>
                {(profile.is_synthetic_demonstration || profile.synthetic_case_id) && (
                  <Badge variant="synthetic" label="Synthetic" />
                )}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                {primaryDisease}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                {explanation}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Clinical</div>
                  <div className="text-sm text-zinc-900 dark:text-zinc-100">
                    {profile.clinical_analysis ? profile.clinical_analysis.predicted_disease_display || profile.clinical_analysis.predicted_disease : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">Imaging</div>
                  <div className="text-sm text-zinc-900 dark:text-zinc-100">
                    {profile.imaging_analysis ? profile.imaging_analysis.predicted_class : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-600 mb-2">NLP</div>
                  <div className="text-sm text-zinc-900 dark:text-zinc-100">
                    {profile.textual_analysis ? `${profile.textual_analysis.entities?.length || 0} Entities` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
