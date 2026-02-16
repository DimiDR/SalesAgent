/**
 * SAP Terminology Dictionary & Speech-to-Text Correction
 *
 * Maps common speech recognition misinterpretations to correct SAP terms.
 * Used as post-processing for the Web Speech API to improve accuracy
 * in SAP project contexts.
 */

// --- SAP Speech Corrections ---
// Each entry: [regex pattern (case-insensitive), correct replacement]
// Ordered from most specific to least specific to avoid partial replacements.

type Replacement = string | ((match: string) => string);

const sapSpeechCorrections: [RegExp, Replacement][] = [
  // ============================================================
  // S/4HANA and variants (most critical — many misrecognitions)
  // ============================================================
  [/\bs(?:\/|\s)?(?:4|vier)\s*(?:hann?a(?:u)?|hannah?|hanner?)\b/gi, 'S/4HANA'],
  [/\bsv\s*hann?a(?:u)?\b/gi, 'S/4HANA'],
  [/\bes\s*(?:4|vier)\s*hann?a\b/gi, 'S/4HANA'],
  [/\bs\s*vier\s*hann?a\b/gi, 'S/4HANA'],
  [/\bs4\s*hana\b/gi, 'S/4HANA'],
  [/\bs\s*4\s*hana\b/gi, 'S/4HANA'],
  [/\bsap\s+s(?:\/|\s)?(?:4|vier)\s*hann?a\b/gi, 'SAP S/4HANA'],
  [/\bsap\s+sv\s*hann?a(?:u)?\b/gi, 'SAP S/4HANA'],

  // ============================================================
  // BW/4HANA
  // ============================================================
  [/\bb(?:w|e\s*we)\s*(?:\/|\s)?(?:4|vier)\s*hann?a\b/gi, 'BW/4HANA'],
  [/\bsap\s+bw\s*(?:\/|\s)?(?:4|vier)\s*hann?a\b/gi, 'SAP BW/4HANA'],

  // ============================================================
  // SAP HANA (standalone)
  // ============================================================
  [/\bsap\s+hann?ah?\b/gi, 'SAP HANA'],
  [/\bhann?a\s+datenbank\b/gi, 'HANA-Datenbank'],

  // ============================================================
  // SAP BTP (Business Technology Platform)
  // ============================================================
  [/\bsap\s+b(?:e\s*)?t(?:e\s*)?p(?:e\s*)?\b/gi, 'SAP BTP'],
  [/\bsap\s+be\s*te\s*pe\b/gi, 'SAP BTP'],
  [/\bbusiness\s+technology\s+platform\b/gi, 'Business Technology Platform (BTP)'],

  // ============================================================
  // SAP Fiori
  // ============================================================
  [/\bsap\s+fiore\b/gi, 'SAP Fiori'],
  [/\bsap\s+fior[ie]\b/gi, 'SAP Fiori'],
  [/\bsap\s+fiori\b/gi, 'SAP Fiori'],

  // ============================================================
  // SAPUI5
  // ============================================================
  [/\bsap\s*ui\s*(?:5|fünf|fuenf)\b/gi, 'SAPUI5'],

  // ============================================================
  // SAP Modules (classic & new)
  // ============================================================
  [/\bsap\s+(?:ef\s*f\s*)?i\b/gi, 'SAP FI'],
  [/\bsap\s+co\b/gi, 'SAP CO'],
  [/\bsap\s+(?:äm\s*äm|em\s*em|mm)\b/gi, 'SAP MM'],
  [/\bsap\s+(?:es\s*de|sd|es\s*d)\b/gi, 'SAP SD'],
  [/\bsap\s+(?:pe\s*pe|pp|pe\s*p)\b/gi, 'SAP PP'],
  [/\bsap\s+(?:ha\s*er|hr)\b/gi, 'SAP HR'],
  [/\bsap\s+(?:ha\s*ce\s*äm|hcm)\b/gi, 'SAP HCM'],
  [/\bsap\s+(?:pe\s*äm|pm)\b/gi, 'SAP PM'],
  [/\bsap\s+(?:qu\s*äm|qm)\b/gi, 'SAP QM'],
  [/\bsap\s+(?:we\s*äm|wm)\b/gi, 'SAP WM'],
  [/\bsap\s+(?:e\s*we\s*äm|ewm)\b/gi, 'SAP EWM'],
  [/\bsap\s+(?:te\s*äm|tm)\b/gi, 'SAP TM'],

  // ============================================================
  // SAP Module + "Berater" WITHOUT "SAP" prefix (common in speech)
  // e.g. "ein FI-Berater", "mm Berater", "fiberater"
  // These must come BEFORE standalone module abbreviation rules.
  // ============================================================
  // "fiberater" (one word) / "fi berater" / "fi-berater" / "ef i berater"
  [/\b(?:fi|ef\s*i)\s*[-]?\s*berater\b/gi, 'FI-Berater'],
  // "mm berater" / "äm äm berater" / "em em berater"
  [/\b(?:mm|äm\s*äm|em\s*em)\s*[-]?\s*berater\b/gi, 'MM-Berater'],
  // "sd berater" / "es de berater"
  [/\b(?:sd|es\s*de)\s*[-]?\s*berater\b/gi, 'SD-Berater'],
  // "pp berater" / "pe pe berater"
  [/\b(?:pp|pe\s*pe)\s*[-]?\s*berater\b/gi, 'PP-Berater'],
  // "co berater"
  [/\bco\s*[-]?\s*berater\b/gi, 'CO-Berater'],
  // "hcm berater"
  [/\b(?:hcm|ha\s*ce\s*äm)\s*[-]?\s*berater\b/gi, 'HCM-Berater'],
  // "basis berater"
  [/\bbasis\s*[-]?\s*berater\b/gi, 'Basis-Berater'],

  // ============================================================
  // SAP Products & Solutions
  // ============================================================
  [/\bsap\s+(?:e\s*ce\s*ce|ecc|ec)\b/gi, 'SAP ECC'],
  [/\bsap\s+(?:e\s*er\s*pe|erp|er\s*p)\b/gi, 'SAP ERP'],
  [/\bsap\s+(?:ce\s*er\s*äm|crm|ce\s*r\s*m)\b/gi, 'SAP CRM'],
  [/\bsap\s+(?:es\s*er\s*äm|srm)\b/gi, 'SAP SRM'],
  [/\bsap\s+(?:areba|ariba)\b/gi, 'SAP Ariba'],
  [/\bsap\s+(?:kon\s*kur|concur|conquer)\b/gi, 'SAP Concur'],
  [/\b(?:success\s*factors?|sacks?\s*es\s*faktors?)\b/gi, 'SuccessFactors'],
  [/\bsap\s+(?:success\s*factors?|sacks?\s*es\s*faktors?)\b/gi, 'SAP SuccessFactors'],
  [/\bsap\s+fieldglass\b/gi, 'SAP Fieldglass'],
  [/\bsap\s+(?:sign\s*avio|signa\s*wio)\b/gi, 'SAP Signavio'],
  [/\bsap\s+(?:an\s*al[iy]t?ics?\s*cloud|analytik\s*klaut)\b/gi, 'SAP Analytics Cloud'],
  [/\bsap\s+(?:daten\s*sphäre|data\s*sphere|data\s*sphäre)\b/gi, 'SAP Datasphere'],
  [/\bsap\s+(?:integration\s*su[iy]te|integration\s*sweet)\b/gi, 'SAP Integration Suite'],
  [/\bsap\s+(?:build|bild)\b/gi, 'SAP Build'],
  [/\bsap\s+(?:commerce\s*cloud|kommers\s*klaut)\b/gi, 'SAP Commerce Cloud'],
  [/\bsap\s+(?:emarsys|emassis)\b/gi, 'SAP Emarsys'],
  [/\bsap\s+(?:business\s*(?:one|wann?)|b\s*(?:1|eins|one))\b/gi, 'SAP Business One'],
  [/\bsap\s+(?:business\s*by\s*design|bbd)\b/gi, 'SAP Business ByDesign'],
  [/\bsap\s+(?:solution\s*manager|sol\s*man)\b/gi, 'SAP Solution Manager'],
  [/\bsol\s*man\b/gi, 'SolMan'],

  // ============================================================
  // SAP Technical Terms
  // ============================================================
  [/\ba\s*bap\b/gi, 'ABAP'],
  [/\ba\s*bapp?\b/gi, 'ABAP'],
  [/\babap\s+on\s+(?:hanna|hana)\b/gi, 'ABAP on HANA'],
  [/\brap\s+(?:modell|model)\b/gi, 'RAP-Modell'],
  [/\b(?:be\s*)?api\b/gi, (match) => match.toLowerCase().startsWith('be') ? 'BAPI' : match],
  [/\bbapi\b/gi, 'BAPI'],
  [/\bbappi\b/gi, 'BAPI'],
  [/\bi\s*doc\b/gi, 'IDoc'],
  [/\bei\s*dock?\b/gi, 'IDoc'],
  [/\b(?:er\s*ef\s*ce|rfc)\b/gi, 'RFC'],
  [/\b(?:al\s*es\s*em\s*we|lsmw)\b/gi, 'LSMW'],
  [/\b(?:ai\s*äm\s*dschi|img)\b/gi, (match) => match.length > 4 ? 'IMG' : match],
  [/\bsap\s+gui\b/gi, 'SAP GUI'],
  [/\bsap\s+(?:gooey|guh?i)\b/gi, 'SAP GUI'],
  [/\bcustomizing\b/gi, 'Customizing'],
  [/\b(?:o\s*data|oh?\s*daten?)\b/gi, 'OData'],
  [/\b(?:ce\s*de\s*es|cds)\b/gi, 'CDS'],
  [/\bcds\s+views?\b/gi, 'CDS Views'],

  // ============================================================
  // SAP Cloud & Integration
  // ============================================================
  [/\bsap\s+(?:ce\s*pe\s*i|cpi)\b/gi, 'SAP CPI'],
  [/\bsap\s+(?:pe\s*o|po)\b/gi, 'SAP PO'],
  [/\bsap\s+(?:pe\s*i|pi)\b/gi, 'SAP PI'],
  [/\bsap\s+cloud\s+(?:connector|konnektor)\b/gi, 'SAP Cloud Connector'],
  [/\bcloud\s*(?:connector|konnektor)\b/gi, 'Cloud Connector'],

  // ============================================================
  // SAP Methodologies & Frameworks
  // ============================================================
  [/\b(?:activate|äkti\s*weit)\s+(?:methode|methodology)\b/gi, 'SAP Activate'],
  [/\bsap\s+activate\b/gi, 'SAP Activate'],
  [/\bfit\s*(?:to\s*)?standard\b/gi, 'Fit-to-Standard'],
  [/\bfit\s*gap\b/gi, 'Fit/Gap'],
  [/\bblue\s*print\b/gi, 'Blueprint'],
  [/\b(?:go\s*live|golive|go\s*leif)\b/gi, 'Go-Live'],
  [/\bcutover\b/gi, 'Cutover'],
  [/\bhyper\s*care\b/gi, 'Hypercare'],
  [/\bgreen\s*field\b/gi, 'Greenfield'],
  [/\bbrown\s*field\b/gi, 'Brownfield'],
  [/\bblue\s*field\b/gi, 'Bluefield'],
  [/\bselective\s+data\s+(?:transition|migration)\b/gi, 'Selective Data Transition'],

  // ============================================================
  // SAP Certification & Licensing
  // ============================================================
  [/\brise\s+(?:with|wis)\s+sap\b/gi, 'RISE with SAP'],
  [/\bgrow\s+(?:with|wis)\s+sap\b/gi, 'GROW with SAP'],
  [/\bclean\s*core\b/gi, 'Clean Core'],

  // ============================================================
  // SAP Conversion / Migration
  // ============================================================
  [/\bsystem\s*(?:konversion|conversion)\b/gi, 'Systemkonversion'],
  [/\bnew\s*(?:implementation|implementierung)\b/gi, 'Neuimplementierung'],
  [/\bdata\s*migration\b/gi, 'Datenmigration'],
  [/\bdaten\s*migration\b/gi, 'Datenmigration'],
  [/\b(?:brownfield\s+)?migration\b/gi, (match) => match.includes('rown') ? 'Brownfield-Migration' : match],

  // ============================================================
  // General IT terms commonly used in SAP projects
  // ============================================================
  [/\bon\s*premise\b/gi, 'On-Premise'],
  [/\bon\s*prem\b/gi, 'On-Premise'],
  [/\b(?:klaut|cloud)\s*(?:nativ|native)\b/gi, 'Cloud-native'],
  [/\b(?:dev\s*ops|def\s*ops)\b/gi, 'DevOps'],
  [/\b(?:ce\s*i\s*ce\s*de|cicd)\b/gi, 'CI/CD'],
  [/\brest\s*(?:api|a\s*pe\s*i)\b/gi, 'REST API'],
];

/**
 * Corrects SAP-specific terminology in speech-to-text transcripts.
 * Applies regex-based replacements for known misrecognitions.
 */
export function correctSAPTerminology(transcript: string): string {
  let corrected = transcript;

  for (const [pattern, replacement] of sapSpeechCorrections) {
    if (typeof replacement === 'string') {
      corrected = corrected.replace(pattern, replacement);
    } else {
      corrected = corrected.replace(pattern, (_match: string) => replacement(_match));
    }
  }

  return corrected;
}

/**
 * Full list of SAP tools, products, and technologies for reference.
 * Used in AI system prompts for domain context.
 */
export const sapProductsAndTools = {
  erp: [
    'SAP S/4HANA (Cloud, On-Premise, Private Cloud)',
    'SAP ECC (ERP Central Component)',
    'SAP Business One',
    'SAP Business ByDesign',
  ],
  modules: [
    'FI (Financial Accounting)',
    'CO (Controlling)',
    'MM (Materials Management)',
    'SD (Sales & Distribution)',
    'PP (Production Planning)',
    'PM (Plant Maintenance)',
    'QM (Quality Management)',
    'WM (Warehouse Management)',
    'EWM (Extended Warehouse Management)',
    'TM (Transportation Management)',
    'HR/HCM (Human Capital Management)',
  ],
  cloudPlatform: [
    'SAP BTP (Business Technology Platform)',
    'SAP Integration Suite',
    'SAP Build (Apps, Process Automation, Work Zone)',
    'SAP Datasphere',
    'SAP Analytics Cloud (SAC)',
    'SAP AI Core / AI Launchpad',
  ],
  ux: [
    'SAP Fiori',
    'SAPUI5',
    'SAP Build Apps (ehem. AppGyver)',
    'SAP Work Zone',
  ],
  hcm: [
    'SAP SuccessFactors',
    'SAP Fieldglass',
    'SAP Concur',
  ],
  procurement: [
    'SAP Ariba',
    'SAP SRM',
  ],
  analytics: [
    'SAP BW/4HANA',
    'SAP Analytics Cloud',
    'SAP Datasphere',
    'SAP HANA (In-Memory Database)',
  ],
  cx: [
    'SAP Commerce Cloud',
    'SAP Emarsys',
    'SAP CRM',
    'SAP Sales Cloud',
    'SAP Service Cloud',
  ],
  integration: [
    'SAP CPI (Cloud Platform Integration)',
    'SAP PO (Process Orchestration)',
    'SAP PI (Process Integration)',
    'SAP Cloud Connector',
    'OData Services',
  ],
  development: [
    'ABAP / ABAP on HANA',
    'RAP (RESTful ABAP Programming Model)',
    'CDS Views',
    'BAPI',
    'IDoc',
    'RFC',
    'SAP GUI',
    'SAP Business Application Studio',
    'LSMW',
    'Customizing (IMG)',
  ],
  methodologies: [
    'SAP Activate',
    'Fit-to-Standard Workshops',
    'Fit/Gap-Analyse',
    'Blueprint / Explore Phase',
    'Realize Phase',
    'Go-Live / Cutover',
    'Hypercare',
    'Greenfield (Neuimplementierung)',
    'Brownfield (Systemkonversion)',
    'Bluefield (Selective Data Transition)',
    'Clean Core',
  ],
  licensing: [
    'RISE with SAP',
    'GROW with SAP',
  ],
  processIntelligence: [
    'SAP Signavio',
    'SAP Solution Manager (SolMan)',
  ],
};

/**
 * Returns a formatted SAP context string for AI system prompts.
 */
export function getSAPContextForPrompt(): string {
  return `Du arbeitest im Kontext von SAP-Beratungsprojekten. Typische SAP-Produkte und -Tools sind:

**ERP-Systeme:** ${sapProductsAndTools.erp.join(', ')}

**Module:** ${sapProductsAndTools.modules.join(', ')}

**Cloud-Plattform:** ${sapProductsAndTools.cloudPlatform.join(', ')}

**UX/Frontend:** ${sapProductsAndTools.ux.join(', ')}

**HCM:** ${sapProductsAndTools.hcm.join(', ')}

**Procurement:** ${sapProductsAndTools.procurement.join(', ')}

**Analytics:** ${sapProductsAndTools.analytics.join(', ')}

**Customer Experience:** ${sapProductsAndTools.cx.join(', ')}

**Integration:** ${sapProductsAndTools.integration.join(', ')}

**Entwicklung:** ${sapProductsAndTools.development.join(', ')}

**Methodik:** ${sapProductsAndTools.methodologies.join(', ')}

**Lizenzmodelle:** ${sapProductsAndTools.licensing.join(', ')}

**Prozessintelligenz:** ${sapProductsAndTools.processIntelligence.join(', ')}

Wenn Begriffe unklar erscheinen, interpretiere sie im SAP-Kontext (z.B. "FI" = Financial Accounting, "CO" = Controlling, "MM" = Materials Management).`;
}
