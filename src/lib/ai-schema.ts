/**
 * AI Field Schema – generic schema-driven field definitions for AI prompts.
 *
 * Keeps field descriptions, defaults, and validation in one place so that
 * system prompts stay in sync with the expected response shape.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'object[]';
  label: string;           // German label used in the prompt
  description: string;     // Explanation for the AI
  required?: boolean;
  nullable?: boolean;      // Field may be null (e.g. optional extraction)
  default?: unknown;
  examples?: string[];     // Example values
  speechHints?: string[];  // How users might dictate this field
  enum?: string[];         // Allowed values (optional)
  items?: AIFieldSchema;   // Nested schema for object[] type
}

export type AIFieldSchema = FieldDef[];

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

export const DEFAULT_ROLE_RATES: Record<string, number> = {
  'SAP Projektleiter': 1600,
  'S/4HANA Solution Architect': 1500,
  'SAP FI/CO-Berater': 1300,
  'SAP FI-Berater': 1300,
  'SAP MM-Berater': 1300,
  'SAP SD-Berater': 1300,
  'ABAP-Entwickler': 1200,
  'Fiori-Entwickler': 1200,
  'ABAP/Fiori-Entwickler': 1200,
  'SAP Basis-Berater': 1100,
};

export const DEFAULT_DAILY_RATE = 1300;
export const DEFAULT_PLANNED_DAYS = 20;
export const DEFAULT_OVERHEAD_PERCENT = 12;
export const DEFAULT_MARGIN_PERCENT = 20;
export const DEFAULT_DISCOUNT_PERCENT = 0;

export const DEFAULT_CHAPTER_TITLES = [
  'Deckblatt',
  'Executive Summary',
  'Ausgangssituation und Zielsetzung',
  'Unser Lösungsansatz',
  'Projektmethodik',
  'Zeitplan und Meilensteine',
  'Unser Team',
  'Investition',
  'Warum wir',
  'Anhang',
];

// ---------------------------------------------------------------------------
// Prompt generation
// ---------------------------------------------------------------------------

/** Renders field lines with optional indentation (used for nested schemas). */
function fieldLinesToPrompt(schema: AIFieldSchema, indent: string): string {
  return schema.map((f) => {
    const parts: string[] = [];

    const meta: string[] = [f.type === 'object[]' || f.type === 'string[]' ? f.type : f.type];
    if (f.required) meta.push('Pflichtfeld');
    if (f.nullable) meta.push('oder null');
    if (f.default !== undefined) meta.push(`Standard: ${JSON.stringify(f.default)}`);
    if (f.enum) meta.push(`erlaubt: ${f.enum.join(', ')}`);

    parts.push(`${indent}- ${f.name} (${meta.join(', ')}): ${f.description}`);

    if (f.examples?.length) {
      parts.push(`${indent}  Beispiele: ${f.examples.map((e) => `"${e}"`).join(', ')}`);
    }
    if (f.speechHints?.length) {
      parts.push(`${indent}  Spracheingabe-Hinweise: ${f.speechHints.join('; ')}`);
    }
    if (f.type === 'object[]' && f.items?.length) {
      parts.push(`${indent}  Jedes Element hat:`);
      parts.push(fieldLinesToPrompt(f.items, indent + '    '));
    }

    return parts.join('\n');
  }).join('\n');
}

/**
 * Converts a field schema into a prompt section the AI can follow.
 *
 * mode 'array' (default): "Jede <itemLabel> hat:\n- field …"
 * mode 'object':          "Gib das Ergebnis als JSON-Objekt zurück mit:\n- field …"
 */
export function schemaToPrompt(
  schema: AIFieldSchema,
  itemLabel: string,
  options?: { mode?: 'array' | 'object' },
): string {
  const mode = options?.mode ?? 'array';
  const prefix = mode === 'object'
    ? `Gib das Ergebnis als JSON-Objekt zurück mit:`
    : `Jede ${itemLabel} hat:`;
  return `${prefix}\n${fieldLinesToPrompt(schema, '')}`;
}

// ---------------------------------------------------------------------------
// Validation & defaults
// ---------------------------------------------------------------------------

/**
 * Validates a single item against the schema:
 * – coerces types where possible
 * – applies defaults for missing fields
 * – strips unknown fields
 */
export function validateItem(
  item: Record<string, unknown>,
  schema: AIFieldSchema,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of schema) {
    let value = item[field.name];

    // Handle missing / null / undefined
    if (value === undefined || value === null) {
      if (field.nullable) {
        result[field.name] = null;
        continue;
      }
      if (field.default !== undefined) {
        result[field.name] = field.default;
      } else if (field.required) {
        result[field.name] = undefined;
      }
      continue;
    }

    // Type coercion
    switch (field.type) {
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value);
        result[field.name] = isNaN(num) ? field.default : num;
        break;
      }
      case 'boolean': {
        if (typeof value === 'boolean') {
          result[field.name] = value;
        } else if (typeof value === 'string') {
          result[field.name] = value.toLowerCase() === 'true' || value === '1';
        } else {
          result[field.name] = Boolean(value);
        }
        break;
      }
      case 'string[]': {
        if (Array.isArray(value)) {
          result[field.name] = value.filter((v) => v != null).map((v) => String(v));
        } else {
          result[field.name] = field.default ?? [];
        }
        break;
      }
      case 'object[]': {
        if (Array.isArray(value) && field.items) {
          result[field.name] = validateArray(value, field.items);
        } else {
          result[field.name] = field.default ?? [];
        }
        break;
      }
      case 'string':
      default: {
        value = typeof value === 'string' ? value : String(value);
        if (field.enum && !field.enum.includes(value as string)) {
          result[field.name] = field.default ?? value;
        } else {
          result[field.name] = value;
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Validates an array of items, applying `validateItem` to each entry and
 * filtering out items that are missing required fields without defaults.
 */
export function validateArray(
  items: unknown[],
  schema: AIFieldSchema,
): Record<string, unknown>[] {
  const requiredFields = schema.filter((f) => f.required && f.default === undefined);

  return items
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => validateItem(item, schema))
    .filter((item) =>
      requiredFields.every((f) => item[f.name] !== undefined && item[f.name] !== null),
    );
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

// --- Resource (speech-to-resource parsing) ---

export const resourceFieldSchema: AIFieldSchema = [
  {
    name: 'role',
    type: 'string',
    label: 'SAP-Rolle',
    description: 'Die SAP-Rolle im Projekt',
    required: true,
    examples: [
      'SAP FI-Berater',
      'SAP MM-Berater',
      'ABAP-Entwickler',
      'SAP Basis-Berater',
      'S/4HANA Solution Architect',
      'SAP Projektleiter',
      'Fiori-Entwickler',
    ],
    speechHints: [
      '"FI-Berater" / "fiberater" → "SAP FI-Berater"',
      '"MM-Berater" / "äm äm berater" → "SAP MM-Berater"',
      '"SD-Berater" / "es de berater" → "SAP SD-Berater"',
      '"Basis-Berater" / "basis berater" → "SAP Basis-Berater"',
      '"ABAP Entwickler" / "abap entwickler" → "ABAP-Entwickler"',
    ],
  },
  {
    name: 'dailyRate',
    type: 'number',
    label: 'Tagessatz (EUR)',
    description: 'Tagessatz in EUR als Zahl. Wenn kein Tagessatz genannt wird, rollenbasiert schätzen (Projektleiter: 1600, Architect: 1500, Berater: 1300, Entwickler: 1200, Basis: 1100)',
    default: DEFAULT_DAILY_RATE,
    speechHints: [
      '"1400 Euro" → 1400',
      '"tausendzweihundert" → 1200',
    ],
  },
  {
    name: 'plannedDays',
    type: 'number',
    label: 'Geplante Tage',
    description: 'Geplante Personentage als Zahl',
    default: DEFAULT_PLANNED_DAYS,
    speechHints: [
      '"40 Tage" → 40',
      '"40 PT" → 40',
      '"40 Personentage" → 40',
    ],
  },
];

// --- Resource recommendation (RFP analysis) ---

export const resourceRecommendationSchema: AIFieldSchema = [
  {
    name: 'type',
    type: 'string',
    label: 'Typ',
    description: 'Ressourcentyp',
    enum: ['expert', 'department', 'tool', 'template'],
    default: 'expert',
  },
  {
    name: 'name',
    type: 'string',
    label: 'Name',
    description: 'Name der empfohlenen Ressource',
    required: true,
  },
  {
    name: 'reason',
    type: 'string',
    label: 'Begründung',
    description: 'Warum diese Ressource empfohlen wird',
    required: true,
  },
  {
    name: 'priority',
    type: 'string',
    label: 'Priorität',
    description: 'Priorität der Empfehlung',
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
];

// --- RFP Analysis ---

export const rfpAnalysisSchema: AIFieldSchema = [
  {
    name: 'summary',
    type: 'string',
    label: 'Zusammenfassung',
    description: 'Zusammenfassung des RFP (2-3 Sätze), inkl. identifizierter SAP-Produkte/Module',
    required: true,
  },
  {
    name: 'requirements',
    type: 'string[]',
    label: 'Anforderungen',
    description: 'Die wichtigsten Anforderungen (insbesondere SAP-spezifische)',
    required: true,
  },
  {
    name: 'deadlines',
    type: 'string[]',
    label: 'Fristen',
    description: 'Identifizierte Fristen',
  },
  {
    name: 'budgetHints',
    type: 'string[]',
    label: 'Budget-Hinweise',
    description: 'Budget-Hinweise aus dem RFP',
  },
  {
    name: 'gaps',
    type: 'string[]',
    label: 'Lücken',
    description: 'Identifizierte Lücken oder fehlende Informationen (z.B. fehlende Angaben zur SAP-Systemlandschaft)',
  },
  {
    name: 'matchScore',
    type: 'number',
    label: 'Übereinstimmung',
    description: 'Geschätzte Übereinstimmung mit typischen SAP-Beratungsleistungen (0-100)',
    default: 0,
  },
  {
    name: 'recommendedResources',
    type: 'object[]',
    label: 'Empfohlene Ressourcen',
    description: 'Empfohlene SAP-Ressourcen (z.B. S/4HANA-Berater, ABAP-Entwickler, Fiori-Entwickler)',
    items: resourceRecommendationSchema,
  },
];

// --- Question (generated from RFP) ---

export const questionSchema: AIFieldSchema = [
  {
    name: 'persona',
    type: 'string',
    label: 'Perspektive',
    description: 'Aus welcher Perspektive die Frage kommt',
    required: true,
    enum: ['sales', 'technical', 'project_management', 'customer'],
  },
  {
    name: 'question',
    type: 'string',
    label: 'Frage',
    description: 'Die Frage',
    required: true,
  },
  {
    name: 'reasoning',
    type: 'string',
    label: 'Begründung',
    description: 'Warum diese Frage wichtig ist',
    required: true,
  },
  {
    name: 'priority',
    type: 'string',
    label: 'Priorität',
    description: 'Priorität der Frage',
    required: true,
    enum: ['high', 'medium', 'low'],
  },
];

// --- Agenda item ---

export const agendaItemSchema: AIFieldSchema = [
  {
    name: 'title',
    type: 'string',
    label: 'Titel',
    description: 'Agendapunkt',
    required: true,
  },
  {
    name: 'description',
    type: 'string',
    label: 'Beschreibung',
    description: 'Kurze Beschreibung des Agendapunkts',
    required: true,
  },
  {
    name: 'duration',
    type: 'number',
    label: 'Dauer (Min)',
    description: 'Geschätzte Dauer in Minuten',
    default: 15,
  },
  {
    name: 'order',
    type: 'number',
    label: 'Reihenfolge',
    description: 'Reihenfolge des Agendapunkts',
  },
];

// --- Insight extraction (meeting notes) ---

export const insightResponseSchema: AIFieldSchema = [
  {
    name: 'insights',
    type: 'string[]',
    label: 'Erkenntnisse',
    description: 'Die wichtigsten Erkenntnisse aus dem Gespräch',
    required: true,
  },
  {
    name: 'actionItems',
    type: 'string[]',
    label: 'Action Items',
    description: 'Konkrete Aufgaben für das SAP-Projektteam',
    required: true,
  },
];

// --- Compliance check ---

export const complianceCheckSchema: AIFieldSchema = [
  {
    name: 'item',
    type: 'string',
    label: 'Prüfpunkt',
    description: 'Was geprüft wurde',
    required: true,
  },
  {
    name: 'status',
    type: 'string',
    label: 'Status',
    description: 'Ergebnis der Prüfung',
    required: true,
    enum: ['pass', 'warning', 'fail'],
  },
  {
    name: 'message',
    type: 'string',
    label: 'Erklärung',
    description: 'Erklärung zum Prüfergebnis',
    required: true,
  },
];

// --- Proposal chapter structure ---

export const chapterSchema: AIFieldSchema = [
  {
    name: 'title',
    type: 'string',
    label: 'Kapitelüberschrift',
    description: 'Titel des Kapitels',
    required: true,
  },
  {
    name: 'order',
    type: 'number',
    label: 'Reihenfolge',
    description: 'Reihenfolge des Kapitels',
  },
];

// --- Calculation: monthly allocation ---

export const monthlyAllocationSchema: AIFieldSchema = [
  {
    name: 'month',
    type: 'string',
    label: 'Monat',
    description: 'Monat im Format YYYY-MM',
    required: true,
    examples: ['2026-03', '2026-04'],
  },
  {
    name: 'allocationPercent',
    type: 'number',
    label: 'Auslastung (%)',
    description: 'Auslastung in Prozent (0-100)',
    default: 0,
  },
];

// --- Calculation: resource ---

export const calculationResourceSchema: AIFieldSchema = [
  {
    name: 'employeeId',
    type: 'string',
    label: 'Mitarbeiter-ID',
    description: 'ID des Mitarbeiters (aus der übergebenen Liste)',
  },
  {
    name: 'role',
    type: 'string',
    label: 'Rolle',
    description: 'SAP-spezifische Rolle im Projekt',
    required: true,
    examples: [
      'S/4HANA Solution Architect',
      'SAP FI/CO-Berater',
      'ABAP-Entwickler',
      'SAP Basis-Berater',
      'Fiori-Entwickler',
    ],
  },
  {
    name: 'dailyRate',
    type: 'number',
    label: 'Tagessatz (EUR)',
    description: 'Tagessatz in EUR (realistisch für SAP-Beratung)',
    default: DEFAULT_DAILY_RATE,
  },
  {
    name: 'plannedDays',
    type: 'number',
    label: 'Geplante Tage',
    description: 'Geplante Personentage',
    default: DEFAULT_PLANNED_DAYS,
  },
  {
    name: 'monthlyAllocations',
    type: 'object[]',
    label: 'Monatsauslastung',
    description: 'Monatliche Auslastungsverteilung',
    items: monthlyAllocationSchema,
  },
];

// --- Calculation: top-level ---

export const calculationSchema: AIFieldSchema = [
  {
    name: 'projectStart',
    type: 'string',
    label: 'Projektstart',
    description: 'Startdatum im Format YYYY-MM-DD',
    required: true,
  },
  {
    name: 'projectEnd',
    type: 'string',
    label: 'Projektende',
    description: 'Enddatum im Format YYYY-MM-DD',
    required: true,
  },
  {
    name: 'resources',
    type: 'object[]',
    label: 'Ressourcen',
    description: 'Projektressourcen',
    items: calculationResourceSchema,
  },
  {
    name: 'overheadPercent',
    type: 'number',
    label: 'Gemeinkosten (%)',
    description: 'Gemeinkostenaufschlag in Prozent (typisch 10-15%)',
    default: DEFAULT_OVERHEAD_PERCENT,
  },
  {
    name: 'marginPercent',
    type: 'number',
    label: 'Marge (%)',
    description: 'Marge in Prozent (typisch 15-25%)',
    default: DEFAULT_MARGIN_PERCENT,
  },
  {
    name: 'discountPercent',
    type: 'number',
    label: 'Rabatt (%)',
    description: 'Rabatt in Prozent',
    default: DEFAULT_DISCOUNT_PERCENT,
  },
];

// --- Customer (speech-to-customer parsing) ---

export const customerFieldSchema: AIFieldSchema = [
  {
    name: 'companyName',
    type: 'string',
    label: 'Firmenname',
    description: 'Name des Unternehmens',
    required: true,
    examples: ['SAP SE', 'Siemens AG', 'Deutsche Telekom', 'Bosch GmbH'],
    speechHints: [
      '"Firma SAP" → "SAP SE"',
      '"Siemens" → "Siemens AG"',
      '"die Telekom" → "Deutsche Telekom"',
    ],
  },
  {
    name: 'industry',
    type: 'string',
    label: 'Branche',
    description: 'Branche/Industrie des Unternehmens',
    nullable: true,
    examples: ['Automobilindustrie', 'Pharma', 'Handel', 'Maschinenbau', 'IT & Technologie', 'Finanzwesen'],
    speechHints: [
      '"die sind im Automotive-Bereich" → "Automobilindustrie"',
      '"Pharmaunternehmen" → "Pharma"',
    ],
  },
  {
    name: 'contactPerson',
    type: 'string',
    label: 'Ansprechpartner',
    description: 'Vor- und Nachname des Ansprechpartners',
    required: true,
    examples: ['Max Mustermann', 'Dr. Anna Schmidt'],
    speechHints: [
      '"Ansprechpartner ist Herr Müller" → "Herr Müller"',
      '"Frau Doktor Schmidt" → "Dr. Schmidt"',
    ],
  },
  {
    name: 'contactEmail',
    type: 'string',
    label: 'E-Mail',
    description: 'E-Mail-Adresse des Ansprechpartners. "at" / "ät" → "@", "punkt" → "."',
    required: true,
    examples: ['max.mustermann@firma.de', 'a.schmidt@unternehmen.com'],
    speechHints: [
      '"müller at firma punkt de" → "mueller@firma.de"',
      '"info ät beispiel punkt com" → "info@beispiel.com"',
    ],
  },
  {
    name: 'contactPhone',
    type: 'string',
    label: 'Telefon',
    description: 'Telefonnummer des Ansprechpartners',
    nullable: true,
    examples: ['+49 89 1234567', '0221 9876543'],
    speechHints: [
      '"null eins sieben eins" → "0171..."',
      '"plus neunundvierzig" → "+49"',
    ],
  },
  {
    name: 'website',
    type: 'string',
    label: 'Website',
    description: 'Website-URL des Unternehmens. "punkt" → ".", immer mit https:// prefix',
    nullable: true,
    examples: ['https://www.sap.com', 'https://www.siemens.de'],
    speechHints: [
      '"www punkt firma punkt de" → "https://www.firma.de"',
    ],
  },
  {
    name: 'street',
    type: 'string',
    label: 'Straße',
    description: 'Straße und Hausnummer',
    nullable: true,
    examples: ['Dietmar-Hopp-Allee 16', 'Werner-von-Siemens-Str. 1'],
  },
  {
    name: 'postalCode',
    type: 'string',
    label: 'PLZ',
    description: 'Postleitzahl',
    nullable: true,
    examples: ['69190', '80333', '10115'],
  },
  {
    name: 'city',
    type: 'string',
    label: 'Stadt',
    description: 'Stadt/Ort',
    nullable: true,
    examples: ['Walldorf', 'München', 'Berlin', 'Hamburg'],
  },
  {
    name: 'country',
    type: 'string',
    label: 'Land',
    description: 'Land (Standard: Deutschland)',
    default: 'Deutschland',
  },
  {
    name: 'notes',
    type: 'string',
    label: 'Notizen',
    description: 'Zusätzliche Informationen über den Kunden',
    nullable: true,
  },
];

// --- Employee (speech-to-employee parsing) ---

export const employeeFieldSchema: AIFieldSchema = [
  {
    name: 'firstName',
    type: 'string',
    label: 'Vorname',
    description: 'Vorname des Mitarbeiters',
    required: true,
    examples: ['Thomas', 'Anna', 'Michael', 'Sarah'],
  },
  {
    name: 'lastName',
    type: 'string',
    label: 'Nachname',
    description: 'Nachname des Mitarbeiters',
    required: true,
    examples: ['Müller', 'Schmidt', 'Weber', 'Fischer'],
  },
  {
    name: 'email',
    type: 'string',
    label: 'E-Mail',
    description: 'E-Mail-Adresse des Mitarbeiters. "at" / "ät" → "@", "punkt" → "."',
    required: true,
    examples: ['t.mueller@beratung.de', 'a.schmidt@consulting.com'],
    speechHints: [
      '"müller at firma punkt de" → "mueller@firma.de"',
    ],
  },
  {
    name: 'phone',
    type: 'string',
    label: 'Telefon',
    description: 'Telefonnummer des Mitarbeiters',
    nullable: true,
    examples: ['+49 171 1234567', '0171 9876543'],
  },
  {
    name: 'position',
    type: 'string',
    label: 'Position',
    description: 'Position/Rolle im Unternehmen',
    required: true,
    examples: [
      'Senior SAP FI/CO-Berater',
      'SAP S/4HANA Solution Architect',
      'ABAP-Entwickler',
      'SAP Projektleiter',
      'SAP Basis-Administrator',
      'Fiori/UI5-Entwickler',
    ],
    speechHints: [
      '"FI-Berater" → "SAP FI-Berater"',
      '"er ist Solution Architect" → "SAP S/4HANA Solution Architect"',
      '"Senior ABAP Entwickler" → "Senior ABAP-Entwickler"',
    ],
  },
  {
    name: 'department',
    type: 'string',
    label: 'Abteilung',
    description: 'Abteilung des Mitarbeiters',
    nullable: true,
    examples: ['SAP Consulting', 'Entwicklung', 'Projektmanagement', 'Vertrieb'],
  },
  {
    name: 'availability',
    type: 'string',
    label: 'Verfügbarkeit',
    description: 'Verfügbarkeitsstatus des Mitarbeiters',
    default: 'available',
    enum: ['available', 'partially_available', 'unavailable'],
    speechHints: [
      '"verfügbar" / "frei" → "available"',
      '"teilweise verfügbar" / "teilweise frei" → "partially_available"',
      '"nicht verfügbar" / "ausgebucht" / "belegt" → "unavailable"',
    ],
  },
  {
    name: 'skills',
    type: 'string[]',
    label: 'Skills',
    description: 'Liste der Fähigkeiten/Technologien als einfache Strings (nur Skill-Namen)',
    nullable: true,
    examples: ['SAP FI/CO', 'S/4HANA', 'ABAP', 'SAP Fiori', 'SAP BTP', 'SAP MM'],
    speechHints: [
      '"er kann FI CO und ABAP" → ["SAP FI/CO", "ABAP"]',
      '"Skills sind S4 HANA und Fiori" → ["S/4HANA", "SAP Fiori"]',
    ],
  },
];

// --- Proposal field extraction ---

export const proposalFieldsSchema: AIFieldSchema = [
  {
    name: 'projectName',
    type: 'string',
    label: 'Projektname',
    description: 'Projektname/Titel des Vorhabens',
    nullable: true,
  },
  {
    name: 'description',
    type: 'string',
    label: 'Beschreibung',
    description: 'Kurzbeschreibung des Vorhabens',
    nullable: true,
  },
  {
    name: 'requirements',
    type: 'string[]',
    label: 'Anforderungen',
    description: 'Liste der erkannten Anforderungen',
    nullable: true,
  },
  {
    name: 'deadline',
    type: 'string',
    label: 'Frist',
    description: 'Datum im Format DD.MM.YYYY oder MM/YYYY. "Dezember 27" / "Dez 27" → "12/2027". "Q1 2026" → "03/2026", "Q2 2026" → "06/2026"',
    nullable: true,
  },
  {
    name: 'budget',
    type: 'string',
    label: 'Budget',
    description: 'Nur die Zahl ohne Währung. "100.000 €" → "100000", "50k" → "50000"',
    nullable: true,
  },
  {
    name: 'customerCompany',
    type: 'string',
    label: 'Firma',
    description: 'Firmenname des Kunden',
    nullable: true,
  },
  {
    name: 'customerContact',
    type: 'string',
    label: 'Ansprechpartner',
    description: 'Vor- und Nachname des Ansprechpartners',
    nullable: true,
  },
  {
    name: 'customerEmail',
    type: 'string',
    label: 'E-Mail',
    description: 'E-Mail-Adresse des Ansprechpartners',
    nullable: true,
  },
];
