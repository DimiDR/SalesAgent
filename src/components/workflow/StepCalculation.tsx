'use client';

import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Plus, Trash2, Calculator, Users, CalendarRange, Euro, Mic, StopCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import type { ProjectCalculation, CalculationResource, MonthlyAllocation } from '@/types';

interface StepCalculationProps {
  projectId: string;
  onComplete: () => void;
}

function getMonthsBetween(start: string, end: string): string[] {
  if (!start || !end) return [];
  const months: string[] = [];
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${monthNames[parseInt(m) - 1]} ${y}`;
}

function allocationColor(percent: number): string {
  if (percent === 0) return 'bg-gray-50 text-gray-400';
  if (percent <= 30) return 'bg-green-100 text-green-800';
  if (percent <= 60) return 'bg-yellow-100 text-yellow-800';
  if (percent <= 80) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

export default function StepCalculation({ projectId, onComplete }: StepCalculationProps) {
  const {
    currentCalculation,
    setCurrentCalculation,
    saveCalculation,
    updateCalculationResource,
    removeCalculationResource,
    aiProcessing,
    setAiProcessing,
    currentAnalysis,
    currentMeeting,
    questions,
    employees,
  } = useStore();

  const [calc, setCalc] = useState<ProjectCalculation>(() => {
    if (currentCalculation && currentCalculation.projectId === projectId) {
      return currentCalculation;
    }
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      projectId,
      resources: [],
      projectStart: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
      projectEnd: new Date(now.getFullYear(), now.getMonth() + 7, 0).toISOString().split('T')[0],
      overheadPercent: 12,
      marginPercent: 20,
      discountPercent: 0,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const months = useMemo(() => getMonthsBetween(calc.projectStart, calc.projectEnd), [calc.projectStart, calc.projectEnd]);

  // Speech-to-resource state
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isSpeechProcessing, setIsSpeechProcessing] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const handleSpeechResult = useCallback((text: string) => {
    setSpeechTranscript((prev) => prev + (prev ? ' ' : '') + text);
  }, []);

  const { isListening, interimTranscript, toggleListening } =
    useSpeechRecognition({ onTranscript: handleSpeechResult });

  const handleSpeechToResources = async () => {
    if (!speechTranscript.trim()) return;
    setIsSpeechProcessing(true);
    setSpeechError('');
    try {
      const response = await fetch('/api/ai/parse-resources-from-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: speechTranscript,
          employees,
        }),
      });

      const data = await response.json();

      if (data.error && (!data.resources || data.resources.length === 0)) {
        setSpeechError(data.error);
        return;
      }

      const parsed: CalculationResource[] = (data.resources || []).map(
        (r: { role: string; dailyRate: number; plannedDays: number }) => ({
          id: crypto.randomUUID(),
          employeeId: '',
          role: r.role,
          dailyRate: r.dailyRate,
          plannedDays: r.plannedDays,
          monthlyAllocations: months.map((m) => ({ month: m, allocationPercent: 0 })),
        })
      );

      if (parsed.length > 0) {
        syncToStore({
          ...calc,
          resources: [...calc.resources, ...parsed],
          updatedAt: new Date(),
        });
        setSpeechTranscript('');
      } else {
        setSpeechError('Keine Ressourcen erkannt. Bitte beschreiben Sie Rolle, Tage und Tagessatz.');
      }
    } catch (error) {
      console.error('Speech-to-resource error:', error);
      setSpeechError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSpeechProcessing(false);
    }
  };

  const syncToStore = (updated: ProjectCalculation) => {
    setCalc(updated);
    setCurrentCalculation(updated);
    // Persist to DB (fire-and-forget)
    saveCalculation(updated).catch(e => console.warn('Failed to save calculation:', e));
  };

  const handleDateChange = (field: 'projectStart' | 'projectEnd', value: string) => {
    const updated = { ...calc, [field]: value, updatedAt: new Date() };
    // Re-align monthly allocations to new month range
    const newMonths = getMonthsBetween(
      field === 'projectStart' ? value : calc.projectStart,
      field === 'projectEnd' ? value : calc.projectEnd,
    );
    updated.resources = updated.resources.map(r => ({
      ...r,
      monthlyAllocations: newMonths.map(m => {
        const existing = r.monthlyAllocations.find(a => a.month === m);
        return existing || { month: m, allocationPercent: 0 };
      }),
    }));
    syncToStore(updated);
  };

  const handleAddResource = () => {
    const newResource: CalculationResource = {
      id: crypto.randomUUID(),
      employeeId: '',
      role: '',
      dailyRate: 1000,
      plannedDays: 20,
      monthlyAllocations: months.map(m => ({ month: m, allocationPercent: 0 })),
    };
    syncToStore({
      ...calc,
      resources: [...calc.resources, newResource],
      updatedAt: new Date(),
    });
  };

  const handleResourceChange = (id: string, field: keyof CalculationResource, value: string | number) => {
    const updated = {
      ...calc,
      resources: calc.resources.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ),
      updatedAt: new Date(),
    };
    syncToStore(updated);
  };

  const handleRemoveResource = (id: string) => {
    syncToStore({
      ...calc,
      resources: calc.resources.filter(r => r.id !== id),
      updatedAt: new Date(),
    });
  };

  const handleAllocationChange = (resourceId: string, month: string, percent: number) => {
    const clamped = Math.min(100, Math.max(0, percent));
    const updated = {
      ...calc,
      resources: calc.resources.map(r => {
        if (r.id !== resourceId) return r;
        return {
          ...r,
          monthlyAllocations: r.monthlyAllocations.map(a =>
            a.month === month ? { ...a, allocationPercent: clamped } : a
          ),
        };
      }),
      updatedAt: new Date(),
    };
    syncToStore(updated);
  };

  const handleFieldChange = (field: 'overheadPercent' | 'marginPercent' | 'discountPercent' | 'notes', value: number | string) => {
    syncToStore({ ...calc, [field]: value, updatedAt: new Date() });
  };

  // Cost calculations
  const personalCosts = calc.resources.reduce((sum, r) => sum + r.dailyRate * r.plannedDays, 0);
  const overheadAmount = personalCosts * (calc.overheadPercent / 100);
  const subtotal = personalCosts + overheadAmount;
  const marginAmount = subtotal * (calc.marginPercent / 100);
  const grossTotal = subtotal + marginAmount;
  const discountAmount = grossTotal * (calc.discountPercent / 100);
  const finalPrice = grossTotal - discountAmount;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

  const handleGenerateAI = async () => {
    setAiProcessing(true);
    try {
      const response = await fetch('/api/ai/generate-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          analysis: currentAnalysis,
          meeting: currentMeeting,
          questions: questions.filter(q => q.projectId === projectId),
          employees,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate calculation');

      const data: ProjectCalculation = await response.json();
      const merged: ProjectCalculation = {
        ...data,
        id: calc.id,
        projectId,
        createdAt: calc.createdAt,
        updatedAt: new Date(),
      };
      syncToStore(merged);
    } catch (error) {
      console.error('Calculation generation error:', error);
      // Fallback: create a simple mock calculation
      const mockMonths = getMonthsBetween(calc.projectStart, calc.projectEnd);
      const availableEmps = employees.slice(0, 3);
      const roles = ['Projektleiter', 'Senior Entwickler', 'Berater'];
      const rates = [1400, 1200, 1100];
      const days = [25, 50, 35];

      const mockResources: CalculationResource[] = availableEmps.map((emp, idx) => ({
        id: crypto.randomUUID(),
        employeeId: emp.id,
        role: roles[idx % roles.length],
        dailyRate: rates[idx % rates.length],
        plannedDays: days[idx % days.length],
        monthlyAllocations: mockMonths.map(m => ({
          month: m,
          allocationPercent: [60, 80, 50, 40, 70][Math.floor(Math.random() * 5)],
        })),
      }));

      syncToStore({
        ...calc,
        resources: mockResources,
        overheadPercent: 12,
        marginPercent: 20,
        discountPercent: 0,
        updatedAt: new Date(),
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : '';
  };

  return (
    <div className="space-y-6">
      {/* AI Suggestion */}
      <Card variant="bordered" className="border-purple-200 bg-purple-50">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900">KI-gestützte Kalkulation</h3>
              <p className="text-sm text-purple-700 mt-1">
                Basierend auf RFP-Analyse, Meeting-Erkenntnissen und verfügbaren Mitarbeitern wird ein Kalkulationsvorschlag generiert.
              </p>
            </div>
            <Button
              onClick={handleGenerateAI}
              isLoading={aiProcessing}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 whitespace-nowrap"
            >
              KI-Vorschlag generieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Speech-to-Resource */}
      <Card variant="bordered" className="border-blue-200 bg-blue-50">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Ressourcen per Sprache oder Text hinzufügen</h3>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Diktieren oder tippen Sie Ressourcen, z.B. &quot;Ich brauche einen SAP FI/CO Berater für 40 Tage zu 1400 Euro&quot;
          </p>

          <div className="flex items-center gap-3 mb-3">
            <Button
              variant={isListening ? 'danger' : 'outline'}
              onClick={toggleListening}
              leftIcon={isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              className={isListening ? 'animate-pulse' : ''}
            >
              {isListening ? 'Aufnahme stoppen' : 'Aufnahme starten'}
            </Button>

            {isListening && (
              <span className="flex items-center gap-2 text-sm text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Aufnahme läuft...
              </span>
            )}
          </div>

          {isListening && interimTranscript && (
            <div className="mb-3 p-3 bg-white/60 rounded-lg border border-blue-200 text-sm text-gray-500 italic">
              {interimTranscript}
            </div>
          )}

          <div className="mb-3">
            <textarea
              value={speechTranscript}
              onChange={(e) => { setSpeechTranscript(e.target.value); setSpeechError(''); }}
              placeholder="z.B. Einen Senior SAP FI/CO Berater für 40 Tage zu 1400 Euro und einen SD Entwickler für 30 Tage zu 1200 Euro"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y placeholder:text-gray-400"
            />
          </div>

          {speechError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {speechError}
            </div>
          )}

          {speechTranscript.trim() && (
            <Button
              onClick={handleSpeechToResources}
              isLoading={isSpeechProcessing}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              Ressourcen erkennen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Project Duration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Projektlaufzeit</h3>
            {months.length > 0 && (
              <Badge variant="info">{months.length} Monate</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Projektstart"
              value={calc.projectStart}
              onChange={(e) => handleDateChange('projectStart', e.target.value)}
            />
            <Input
              type="date"
              label="Projektende"
              value={calc.projectEnd}
              onChange={(e) => handleDateChange('projectEnd', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Ressourcen</h3>
              {calc.resources.length > 0 && (
                <Badge variant="default">{calc.resources.length} Personen</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddResource}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Ressource hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calc.resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Noch keine Ressourcen geplant.</p>
              <p className="text-sm mt-1">Fügen Sie Mitarbeiter hinzu oder nutzen Sie den KI-Vorschlag.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-3 font-medium text-gray-700">Mitarbeiter</th>
                    <th className="pb-3 pr-3 font-medium text-gray-700">Rolle</th>
                    <th className="pb-3 pr-3 font-medium text-gray-700 text-right">Tagessatz</th>
                    <th className="pb-3 pr-3 font-medium text-gray-700 text-right">Tage</th>
                    <th className="pb-3 pr-3 font-medium text-gray-700 text-right">Kosten</th>
                    <th className="pb-3 font-medium text-gray-700 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {calc.resources.map((resource) => (
                    <tr key={resource.id} className="border-b last:border-0">
                      <td className="py-3 pr-3">
                        <select
                          value={resource.employeeId}
                          onChange={(e) => handleResourceChange(resource.id, 'employeeId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="">-- Auswählen --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} ({emp.position})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          type="text"
                          value={resource.role}
                          onChange={(e) => handleResourceChange(resource.id, 'role', e.target.value)}
                          placeholder="z.B. Projektleiter"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          value={resource.dailyRate}
                          onChange={(e) => handleResourceChange(resource.id, 'dailyRate', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          value={resource.plannedDays}
                          onChange={(e) => handleResourceChange(resource.id, 'plannedDays', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-3 pr-3 text-right font-medium whitespace-nowrap">
                        {formatCurrency(resource.dailyRate * resource.plannedDays)}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleRemoveResource(resource.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={4} className="py-3 pr-3 font-semibold text-right">
                      Personalkosten Gesamt:
                    </td>
                    <td className="py-3 pr-3 font-semibold text-right whitespace-nowrap">
                      {formatCurrency(personalCosts)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Allocation Matrix */}
      {calc.resources.length > 0 && months.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Monats-Auslastung (%)</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 pr-3 text-left font-medium text-gray-700 sticky left-0 bg-white min-w-[140px]">
                      Ressource
                    </th>
                    {months.map((m) => (
                      <th key={m} className="pb-3 px-1 text-center font-medium text-gray-700 min-w-[70px]">
                        {formatMonth(m)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.resources.map((resource) => (
                    <tr key={resource.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-900 sticky left-0 bg-white">
                        {getEmployeeName(resource.employeeId) || resource.role || 'N/A'}
                      </td>
                      {months.map((m) => {
                        const alloc = resource.monthlyAllocations.find(a => a.month === m);
                        const percent = alloc?.allocationPercent ?? 0;
                        return (
                          <td key={m} className="py-2 px-1 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={percent}
                              onChange={(e) => handleAllocationChange(resource.id, m, parseInt(e.target.value) || 0)}
                              className={`w-16 px-1 py-1 text-center text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${allocationColor(percent)}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span> 1-30%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span> 31-60%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></span> 61-80%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300"></span> 81-100%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Kostenzusammenfassung</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <Input
                type="number"
                label="Overhead / Gemeinkosten (%)"
                value={calc.overheadPercent}
                onChange={(e) => handleFieldChange('overheadPercent', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
              />
              <Input
                type="number"
                label="Marge (%)"
                value={calc.marginPercent}
                onChange={(e) => handleFieldChange('marginPercent', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
              />
              <Input
                type="number"
                label="Rabatt (%)"
                value={calc.discountPercent}
                onChange={(e) => handleFieldChange('discountPercent', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
              />
              <Textarea
                label="Notizen zur Kalkulation"
                placeholder="Anmerkungen, Annahmen, Sonderbedingungen..."
                value={calc.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h4 className="font-semibold text-gray-800 mb-4">Preisberechnung</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Personalkosten</span>
                  <span className="font-medium">{formatCurrency(personalCosts)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">+ Overhead ({calc.overheadPercent}%)</span>
                  <span className="font-medium">{formatCurrency(overheadAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-gray-600">Zwischensumme</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">+ Marge ({calc.marginPercent}%)</span>
                  <span className="font-medium">{formatCurrency(marginAmount)}</span>
                </div>
                {calc.discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>- Rabatt ({calc.discountPercent}%)</span>
                    <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t-2 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Angebotspreis</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(finalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Step */}
      <div className="flex justify-end">
        <Button onClick={onComplete} size="lg">
          Schritt abschließen & weiter
        </Button>
      </div>
    </div>
  );
}
