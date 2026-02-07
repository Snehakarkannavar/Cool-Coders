"""
Flask Backend for Gemini AI Chatbot
Handles AI queries with efficient data summarization
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
from typing import Dict, Any, List

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Gemini API endpoint
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def create_data_summary(data: List[Dict], columns: List[Dict], name: str) -> Dict[str, Any]:
    """
    Create an efficient summary of the dataset instead of sending full data
    This dramatically reduces payload size and API costs
    """
    row_count = len(data)
    
    # Smart sampling based on dataset size
    if row_count <= 10:
        sample_data = data
    elif row_count <= 100:
        sample_data = data[:10]
    elif row_count <= 500:
        # First 5 + last 5
        sample_data = data[:5] + data[-5:]
    else:
        # First 5 + middle 2 + last 3
        middle_idx = row_count // 2
        sample_data = data[:5] + data[middle_idx:middle_idx+2] + data[-3:]
    
    # Calculate statistics for numeric columns
    statistics = {}
    for col in columns:
        col_name = col['name']
        col_type = col['type']
        
        if col_type == 'number':
            values = [row.get(col_name) for row in data if row.get(col_name) is not None]
            if values:
                try:
                    numeric_values = [float(v) for v in values if v != '']
                    if numeric_values:
                        statistics[col_name] = {
                            'type': 'numeric',
                            'count': len(numeric_values),
                            'min': round(min(numeric_values), 2),
                            'max': round(max(numeric_values), 2),
                            'avg': round(sum(numeric_values) / len(numeric_values), 2),
                            'sum': round(sum(numeric_values), 2)
                        }
                except (ValueError, TypeError):
                    pass
        
        elif col_type == 'string':
            values = [str(row.get(col_name)) for row in data if row.get(col_name)]
            if values:
                unique_values = list(set(values))
                value_counts = {}
                for v in values:
                    value_counts[v] = value_counts.get(v, 0) + 1
                
                # Get top 5 most frequent values
                top_values = sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                
                statistics[col_name] = {
                    'type': 'categorical',
                    'count': len(values),
                    'unique_count': len(unique_values),
                    'top_values': [{'value': v, 'count': c, 'percentage': f"{(c/len(values)*100):.1f}%"} for v, c in top_values]
                }
    
    return {
        'name': name,
        'row_count': row_count,
        'columns': [col['name'] for col in columns],
        'column_types': {col['name']: col['type'] for col in columns},
        'statistics': statistics,
        'sample': sample_data[:10]  # Only first 10 for context
    }

def build_gemini_prompt(query: str, data_summary: Dict[str, Any]) -> str:
    """
    Build an optimized prompt for Gemini using data summary
    """
    stats_text = []
    
    for col_name, stats in data_summary.get('statistics', {}).items():
        if stats['type'] == 'numeric':
            stats_text.append(
                f"  • {col_name}: {stats['count']} values, "
                f"Range: {stats['min']} to {stats['max']}, "
                f"Average: {stats['avg']}, Sum: {stats['sum']}"
            )
        elif stats['type'] == 'categorical':
            top_vals = ', '.join([f"{v['value']} ({v['percentage']})" for v in stats['top_values'][:3]])
            stats_text.append(
                f"  • {col_name}: {stats['unique_count']} unique values, "
                f"Top: {top_vals}"
            )
    
    statistics_block = '\n'.join(stats_text) if stats_text else 'No statistics available'
    
    prompt = f"""You are a data analyst AI. Answer concisely using only the provided data.

**Question:** {query}

**Dataset:** {data_summary.get('name', 'Unknown')} - {data_summary.get('row_count', 0):,} rows, {len(data_summary.get('columns', []))} columns
**Columns:** {', '.join(data_summary.get('columns', []))}

**Statistics (from complete dataset):**
{statistics_block}

**Sample Data:**
{json.dumps(data_summary.get('sample', [])[:5], indent=2)}

**Instructions:**
- Use EXACT numbers from statistics above
- Be concise - answer directly without lengthy explanations
- Use bullet points for clarity
- Format key numbers with **bold**

Answer the question:"""
    return prompt

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint - receives query and data, returns AI response
    """
    try:
        data = request.get_json()
        
        # Extract request parameters
        query = data.get('query')
        dataset_name = data.get('name', 'Dataset')
        dataset_data = data.get('data', [])
        dataset_columns = data.get('columns', [])
        api_key = data.get('api_key')
        
        # Validation
        if not query:
            return jsonify({"error": "Missing query parameter"}), 400
        
        if not api_key:
            return jsonify({"error": "Missing API key"}), 400
        
        if not dataset_data or len(dataset_data) == 0:
            return jsonify({
                "response": "⚠️ **No Data Available**\n\nPlease upload a dataset first to analyze.",
                "shouldNavigateToVisualBuilder": False
            }), 200
        
        # Create efficient data summary (instead of sending full dataset)
        print(f"[Chatbot] Creating summary for {len(dataset_data)} rows...")
        data_summary = create_data_summary(dataset_data, dataset_columns, dataset_name)
        print(f"[Chatbot] Summary created: {data_summary['row_count']} rows, {len(data_summary['columns'])} columns")
        
        # Build optimized prompt
        prompt = build_gemini_prompt(query, data_summary)
        
        # Call Gemini API
        print(f"[Chatbot] Sending request to Gemini API...")
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "topK": 20,
                "topP": 0.8,
                "maxOutputTokens": 800
            }
        }
        
        response = requests.post(
            f"{GEMINI_URL}?key={api_key}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            error_text = response.text
            print(f"[Chatbot] Gemini API error: {response.status_code} - {error_text}")
            return jsonify({
                "error": f"Gemini API error: {response.status_code}",
                "details": error_text
            }), response.status_code
        
        result = response.json()
        
        # Extract AI response
        if not result.get('candidates') or len(result['candidates']) == 0:
            return jsonify({
                "error": "No response from Gemini API",
                "details": "API returned empty candidates"
            }), 500
        
        gemini_response = result['candidates'][0]['content']['parts'][0]['text']
        
        print(f"[Chatbot] Gemini response received: {len(gemini_response)} characters")
        
        # Check if query suggests visualization
        query_lower = query.lower()
        should_navigate = any(keyword in query_lower for keyword in [
            'visual', 'chart', 'graph', 'plot', 'create chart', 'make chart',
            'draw', 'show chart', 'build chart'
        ])
        
        return jsonify({
            "response": gemini_response,
            "shouldNavigateToVisualBuilder": should_navigate
        })
    
    except requests.exceptions.Timeout:
        print("[Chatbot] Request timeout")
        return jsonify({"error": "Request timeout"}), 504
    
    except requests.exceptions.RequestException as e:
        print(f"[Chatbot] Network error: {str(e)}")
        return jsonify({"error": "Network error"}), 500
    
    except Exception as e:
        print(f"[Chatbot] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Gemini Chatbot API",
        "version": "1.0.0"
    })

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    print(f"🚀 Starting Gemini Chatbot API on port {port}...")
    app.run(debug=True, host='0.0.0.0', port=port)
