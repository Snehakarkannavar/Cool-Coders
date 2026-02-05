# 📊 HYBRID VALIDATION SYSTEM - VISUAL GUIDE

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE (React)                       │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Upload CSV  │→ │ Select Format│→ │ Generate Report Btn │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                   VALIDATION PIPELINE                             │
│                                                                   │
│  STEP 1: PARSE CSV                                               │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Input: test_sales_data.csv                        │          │
│  │  Output: [{month:"Jan", sales:120, ...}, ...]      │          │
│  │  Time: ~30ms                                        │          │
│  └────────────────────────────────────────────────────┘          │
│                            ↓                                      │
│  STEP 2: SCHEMA DISCOVERY (schemaDiscovery.ts)                   │
│  ┌────────────────────────────────────────────────────┐          │
│  │  • Auto-detect column types:                       │          │
│  │    - month: date                                   │          │
│  │    - sales: numeric (min:75, max:195, mean:128.5)  │          │
│  │    - region: categorical (4 unique values)         │          │
│  │  • Calculate null % (0% for this dataset)          │          │
│  │  • Identify uniqueness (sales: 95.8% unique)       │          │
│  │  Time: ~50ms                                        │          │
│  └────────────────────────────────────────────────────┘          │
│                            ↓                                      │
│  STEP 3: MATH VALIDATION (dataValidation.ts)                     │
│  ┌────────────────────────────────────────────────────┐          │
│  │  STRUCTURAL CHECK (35% weight):                    │          │
│  │  • Null %: 0% → Score: 100                         │          │
│  │  • Completeness: 100% → Score: 100                 │          │
│  │  • Type consistency: Perfect → Score: 100          │          │
│  │  → Structural: 96%                                 │          │
│  │                                                     │          │
│  │  STATISTICAL CHECK (35% weight):                   │          │
│  │  • Outliers (IQR): 2 found → Score: 92             │          │
│  │  • Duplicates: 0% → Score: 100                     │          │
│  │  • Coefficient of variation: Normal → Score: 95    │          │
│  │  → Statistical: 94%                                │          │
│  │                                                     │          │
│  │  ANOMALY DETECTION (30% weight):                   │          │
│  │  • Missing patterns: None → Score: 100             │          │
│  │  • Future dates: None → Score: 100                 │          │
│  │  • Type mismatches: None → Score: 100              │          │
│  │  • Range violations: None → Score: 100             │          │
│  │  → Anomaly: 98%                                    │          │
│  │                                                     │          │
│  │  OVERALL: (96×0.35) + (94×0.35) + (98×0.30) = 96%  │          │
│  │  RISK LEVEL: 96% ≥ 85% → LOW                       │          │
│  │  Time: ~100ms                                       │          │
│  └────────────────────────────────────────────────────┘          │
│                            ↓                                      │
│  STEP 4: AI VALIDATION (geminiValidation.ts) ← OPTIONAL          │
│  ┌────────────────────────────────────────────────────┐          │
│  │  4a. SAMPLE DATA (Fix #1):                         │          │
│  │      24 rows → 100 rows max (first 50 + last 50)   │          │
│  │      ✅ Prevents token limit errors                │          │
│  │                                                     │          │
│  │  4b. PREPARE CONTEXT:                              │          │
│  │      • Schema: All 7 columns with types            │          │
│  │      • Aggregates: {sales: {total:3084, avg:128.5}}│          │
│  │      • Trends: "sales: Growth of 62.5%"            │          │
│  │      • Math scores: {structural:96, stat:94, ...}  │          │
│  │      • Sample rows: First 5 rows                   │          │
│  │                                                     │          │
│  │  4c. DETECT TRENDS (Fix #2):                       │          │
│  │      if (firstAvg !== 0) {  ← Protects div by zero│          │
│  │        change = (secondAvg - firstAvg) / firstAvg  │          │
│  │      }                                              │          │
│  │      ✅ No NaN in API request                      │          │
│  │                                                     │          │
│  │  4d. CALL GEMINI API (Fix #3):                     │          │
│  │      generationConfig: {                           │          │
│  │        temperature: 0.3,                           │          │
│  │        responseMimeType: "application/json"        │          │
│  │      }                                              │          │
│  │      ✅ Strict JSON output                         │          │
│  │                                                     │          │
│  │  4e. PARSE RESPONSE:                               │          │
│  │      {                                              │          │
│  │        qualityScore: 94,                           │          │
│  │        logicalConsistency: 92,                     │          │
│  │        redFlags: [                                 │          │
│  │          "Sales growth 62.5% - verify Q2 data"    │          │
│  │        ],                                           │          │
│  │        insights: [                                 │          │
│  │          "Strong growth across all regions",       │          │
│  │          "Pricing stable (~$240-245)"              │          │
│  │        ],                                           │          │
│  │        recommendations: [                          │          │
│  │          "Verify Q2 sales spike",                  │          │
│  │          "Consider seasonal adjustments"           │          │
│  │        ]                                            │          │
│  │      }                                              │          │
│  │  Time: ~2-4 seconds                                │          │
│  └────────────────────────────────────────────────────┘          │
│                            ↓                                      │
│  STEP 5: COMBINE RESULTS                                         │
│  ┌────────────────────────────────────────────────────┐          │
│  │  final validation = {                              │          │
│  │    scores: {                                       │          │
│  │      structural: 96,    ← From math               │          │
│  │      statistical: 94,   ← From math               │          │
│  │      anomaly: 98,       ← From math               │          │
│  │      overall: 96,       ← From math               │          │
│  │      riskLevel: "low"   ← From math               │          │
│  │    },                                              │          │
│  │    aiValidation: {                                 │          │
│  │      qualityScore: 94,  ← From Gemini             │          │
│  │      logicalConsistency: 92, ← From Gemini        │          │
│  │      redFlags: [...],   ← From Gemini             │          │
│  │      insights: [...],   ← From Gemini             │          │
│  │      recommendations: [...] ← From Gemini         │          │
│  │    }                                               │          │
│  │  }                                                 │          │
│  └────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                   REPORT GENERATION                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐          │
│  │  • Generate PDF/DOCX/PPTX                          │          │
│  │  • Include validation scores section               │          │
│  │  • Add charts and visualizations                   │          │
│  │  • Format with professional template               │          │
│  │  Time: ~500ms                                       │          │
│  └────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                   UI DISPLAY                                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🎯 Validation Confidence Scores                          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │ Overall Score: 96%  [████████████████████░]  LOW RISK   │   │
│  │                                                          │   │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │ │   96%    │  │   94%    │  │   98%    │               │   │
│  │ │Structural│  │Statistical│ │ Anomaly  │               │   │
│  │ └──────────┘  └──────────┘  └──────────┘               │   │
│  │                                                          │   │
│  │ 🤖 AI Quality Assessment                                 │   │
│  │ Quality: 94%  |  Logical Consistency: 92%               │   │
│  │                                                          │   │
│  │ 🚨 AI Red Flags:                                         │   │
│  │ • Sales growth 62.5% - verify Q2 data                   │   │
│  │                                                          │   │
│  │ ✅ AI Insights:                                          │   │
│  │ • Strong growth across all regions                      │   │
│  │ • Pricing stable (~$240-245)                            │   │
│  │                                                          │   │
│  │ 💡 Recommendations:                                      │   │
│  │ • Verify Q2 sales spike                                 │   │
│  │ • Consider seasonal adjustments                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Download PDF] ← Report saved to Downloads                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────┐
│   CSV   │  test_sales_data.csv (24 rows × 7 columns)
└────┬────┘
     │
     ↓
┌────────────────────────────────────────────────────┐
│  LAYER 1: SCHEMA DISCOVERY                         │
│  ─────────────────────────────────────────────     │
│  Input:  Raw CSV data                              │
│  Output: Schema object                             │
│                                                     │
│  {                                                  │
│    totalRows: 24,                                  │
│    totalColumns: 7,                                │
│    columns: [                                      │
│      {                                             │
│        name: "sales",                              │
│        type: "numeric",                            │
│        nullPercentage: 0,                          │
│        statistics: {                               │
│          min: 75,                                  │
│          max: 195,                                 │
│          mean: 128.5,                              │
│          median: 127.5                             │
│        }                                           │
│      },                                            │
│      { name: "region", type: "categorical", ... }, │
│      ...                                           │
│    ]                                               │
│  }                                                 │
└────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────┐
│  LAYER 2: MATHEMATICAL VALIDATION                  │
│  ─────────────────────────────────────────────     │
│  Input:  Data + Schema                             │
│  Output: Validation scores                         │
│                                                     │
│  Structural Check (35%):                           │
│  ┌──────────────────────────────────────┐          │
│  │ for each column:                     │          │
│  │   if null% < 5%  → +100 points       │          │
│  │   if complete    → +100 points       │          │
│  │   if types match → +100 points       │          │
│  │ average → 96%                        │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  Statistical Check (35%):                          │
│  ┌──────────────────────────────────────┐          │
│  │ for numeric columns:                 │          │
│  │   detect outliers (IQR method)       │          │
│  │   check duplicates (<10% good)       │          │
│  │   calculate CV (variation)           │          │
│  │ average → 94%                        │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  Anomaly Detection (30%):                          │
│  ┌──────────────────────────────────────┐          │
│  │ check for:                           │          │
│  │   - future dates                     │          │
│  │   - type mismatches                  │          │
│  │   - range violations                 │          │
│  │   - missing patterns                 │          │
│  │ no issues found → 98%                │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  Overall: (96×0.35) + (94×0.35) + (98×0.30) = 96%  │
│  Risk: 96% ≥ 85% → LOW                             │
└────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────┐
│  LAYER 3: AI SEMANTIC VALIDATION                   │
│  ─────────────────────────────────────────────     │
│  Input:  Sampled data + Schema + Math scores       │
│  Output: AI validation result                      │
│                                                     │
│  Step 1: Sample data                               │
│  ┌──────────────────────────────────────┐          │
│  │ if (data.length > 100)               │          │
│  │   first 50 rows + last 50 rows       │          │
│  │ else                                 │          │
│  │   all rows                           │          │
│  │                                      │          │
│  │ 24 rows → use all (< 100)            │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  Step 2: Prepare context                           │
│  ┌──────────────────────────────────────┐          │
│  │ Prompt includes:                     │          │
│  │ • Schema (all columns + types)       │          │
│  │ • Aggregates (totals, averages)      │          │
│  │ • Trends (growth/decline %)          │          │
│  │ • Math scores (96/94/98)             │          │
│  │ • Sample rows (first 5)              │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  Step 3: Call Gemini API                           │
│  ┌──────────────────────────────────────┐          │
│  │ POST to:                             │          │
│  │ generativelanguage.googleapis.com    │          │
│  │                                      │          │
│  │ Config:                              │          │
│  │   temperature: 0.3                   │          │
│  │   responseMimeType: "application/json"│          │
│  │                                      │          │
│  │ Response time: 2-4 seconds           │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  Step 4: Parse response                            │
│  ┌──────────────────────────────────────┐          │
│  │ {                                    │          │
│  │   qualityScore: 94,                  │          │
│  │   logicalConsistency: 92,            │          │
│  │   redFlags: [                        │          │
│  │     "High growth rate (62.5%)"       │          │
│  │   ],                                 │          │
│  │   insights: [                        │          │
│  │     "Strong regional growth",        │          │
│  │     "Stable pricing"                 │          │
│  │   ],                                 │          │
│  │   recommendations: [...]             │          │
│  │ }                                    │          │
│  └──────────────────────────────────────┘          │
└────────────────────────────────────────────────────┘
     │
     ↓
┌────────────────────────────────────────────────────┐
│  FINAL RESULT                                      │
│  ─────────────────────────────────────────────     │
│  {                                                 │
│    validation: {                                   │
│      scores: {                                     │
│        structural: 96,    ← Math                   │
│        statistical: 94,   ← Math                   │
│        anomaly: 98,       ← Math                   │
│        overall: 96,       ← Math                   │
│        riskLevel: "low"   ← Math                   │
│      },                                            │
│      aiValidation: {                               │
│        qualityScore: 94,  ← Gemini                 │
│        logicalConsistency: 92, ← Gemini            │
│        redFlags: [...],   ← Gemini                 │
│        insights: [...],   ← Gemini                 │
│        recommendations: [...] ← Gemini             │
│      }                                             │
│    },                                              │
│    reportContent: { ... }  ← PDF/DOCX/PPTX         │
│  }                                                 │
└────────────────────────────────────────────────────┘
```

---

## The 3 Critical Fixes (Visual)

### Fix 1: Data Sampling

```
BEFORE (❌):
┌─────────────────────────────┐
│ 10,000 rows                 │  → 500K tokens
│ All sent to Gemini API      │  ❌ Token limit exceeded
└─────────────────────────────┘

AFTER (✅):
┌─────────────────────────────┐
│ 10,000 rows                 │
│    ↓                        │
│ Sample first 50 + last 50   │  → 8K tokens
│ = 100 rows to Gemini        │  ✅ Under limit
└─────────────────────────────┘

Code:
const sampledData = data.length > 100
  ? [...data.slice(0, 50), ...data.slice(-50)]
  : data;
```

---

### Fix 2: Division by Zero Protection

```
BEFORE (❌):
firstAvg = 0
secondAvg = 100

change = (100 - 0) / 0 * 100
       = Infinity  ❌

Sent to Gemini: "Trend: Infinity%"
Gemini: Confused / Error

AFTER (✅):
if (firstAvg !== 0) {
  change = (100 - 0) / 0 * 100  ← Never executes
} else if (secondAvg !== 0) {
  trends.push("Increased from zero baseline")  ✅
}

Sent to Gemini: "Trend: Increased from zero baseline"
Gemini: ✅ Understands
```

---

### Fix 3: Strict JSON Output

```
BEFORE (❌):
Gemini returns:
```markdown
Here's the analysis:

```json
{
  "qualityScore": 94,
  "insights": [...]
}
```

This data shows...
```

Parser: ❌ "Unexpected token H" (tries to parse "Here's...")

AFTER (✅):
generationConfig: {
  responseMimeType: "application/json"
}

Gemini returns:
{
  "qualityScore": 94,
  "insights": [...]
}

Parser: ✅ Success
```

---

## Component Interaction Map

```
reports.tsx (Main UI Component)
    │
    ├─ Imports:
    │   ├─ analyzeDataWithValidation  (reportGenerator.ts)
    │   └─ ValidationScoresCard       (validation-scores.tsx)
    │
    ├─ State:
    │   ├─ dataSources: DataSource[]
    │   ├─ selectedSources: string[]
    │   ├─ lastValidation: ComprehensiveReport['validation']
    │   └─ geminiApiKey: string (from .env)
    │
    ├─ Functions:
    │   ├─ handleFileUpload()
    │   │   └─ parseCSVFile()
    │   │
    │   └─ handleGenerateReport()
    │       ├─ 1. Combine selected data
    │       ├─ 2. Call analyzeDataWithValidation()
    │       │   │
    │       │   └─ reportGenerator.ts
    │       │       ├─ discoverSchema()           (schemaDiscovery.ts)
    │       │       ├─ validateData()             (dataValidation.ts)
    │       │       ├─ validateWithGemini()       (geminiValidation.ts)
    │       │       │   ├─ Sample data (Fix #1)
    │       │       │   ├─ Detect trends (Fix #2)
    │       │       │   └─ Call API (Fix #3)
    │       │       └─ Return ComprehensiveReport
    │       │
    │       ├─ 3. setLastValidation()
    │       ├─ 4. generatePDFReport()
    │       └─ 5. Save to localStorage
    │
    └─ Render:
        ├─ Upload section
        ├─ Template/Format selectors
        ├─ Generate button
        └─ {lastValidation && <ValidationScoresCard />}
            └─ validation-scores.tsx
                ├─ Overall score + risk badge
                ├─ 3-column breakdown (Struct/Stat/Anom)
                ├─ AI quality + consistency
                ├─ Red flags list
                ├─ Insights list
                └─ Recommendations list
```

---

## File Dependencies

```
.env
  ↓
reports.tsx
  ↓
analyzeDataWithValidation (reportGenerator.ts)
  ├─→ discoverSchema (schemaDiscovery.ts)
  │     ↓
  │   DataSchema
  │
  ├─→ validateData (dataValidation.ts)
  │     ↓
  │   ValidationScore
  │     ├─ structural: number
  │     ├─ statistical: number
  │     ├─ anomaly: number
  │     ├─ overall: number
  │     ├─ riskLevel: string
  │     └─ flags: ValidationFlag[]
  │
  └─→ validateWithGemini (geminiValidation.ts)
        ├─ Uses: Gemini API key from .env
        ├─ Inputs: sampledData, schema, validationScores
        └─ Returns: AIValidationResult
              ├─ qualityScore: number
              ├─ logicalConsistency: number
              ├─ redFlags: string[]
              ├─ insights: string[]
              ├─ recommendations: string[]
              └─ reasoning: string
```

---

## Timing Waterfall

```
Time (seconds)
0.00 ─┬─ User clicks "Generate Report"
      │
0.03 ─┼─ CSV parsing complete
      │
0.08 ─┼─ Schema discovery complete
      │   (7 columns identified, stats calculated)
      │
0.18 ─┼─ Mathematical validation complete
      │   (Structural: 96%, Statistical: 94%, Anomaly: 98%)
      │
      │   [Gemini API Call starts]
      │   ├─ Data sampled (100 rows)
      │   ├─ Context prepared (~8K tokens)
      │   ├─ POST request sent
2.18 ─┼─  │ [API processing...]
      │   ├─ Gemini analyzes data
      │   ├─ Generates JSON response
4.18 ─┼─  └─ Response received
      │
      │   AI validation parsed:
      │   - Quality: 94%
      │   - Logical: 92%
      │   - Red flags: 1
      │   - Insights: 3
      │   - Recommendations: 2
      │
4.68 ─┼─ PDF generation complete
      │   (Charts rendered, document formatted)
      │
4.70 ─┼─ ValidationScoresCard rendered
      │   (All scores displayed in UI)
      │
5.00 ─┴─ PDF download initiated
         ✅ Process complete
```

---

## Error Handling Flow

```
validateWithGemini()
    │
    ├─ Try:
    │   ├─ Sample data
    │   ├─ Prepare context
    │   ├─ Call Gemini API
    │   │   ├─ 200 OK → Parse response
    │   │   ├─ 400 Bad Request → Catch
    │   │   ├─ 401 Unauthorized → Catch
    │   │   ├─ 429 Rate Limit → Catch
    │   │   └─ 500 Server Error → Catch
    │   │
    │   └─ Return AIValidationResult
    │
    └─ Catch (any error):
        └─ Return fallback:
            {
              qualityScore: validationScores.overall,  ← Use math score
              logicalConsistency: 85,
              redFlags: ['AI validation unavailable'],
              insights: ['Mathematical validation shows acceptable quality'],
              recommendations: ['Verify Gemini API key'],
              reasoning: 'AI validation could not be completed.'
            }

System continues with math-only validation ✅
User still gets report ✅
No crash ✅
```

---

**🎯 Key Takeaway:**

Math validates → AI reviews → Combined trust

If AI fails, math continues → System never breaks
