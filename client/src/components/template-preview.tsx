import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplatePreviewProps {
  templateId: string;
  templateName: string;
  onClose: () => void;
}

export function TemplatePreview({ templateId, templateName, onClose }: TemplatePreviewProps) {
  const getPreviewContent = () => {
    switch (templateId) {
      case 'executive':
        return (
          <div className="space-y-6">
            <div className="text-center border-b pb-4">
              <h1 className="text-3xl font-bold text-slate-900">Executive Summary Report</h1>
              <p className="text-slate-600 mt-2">Business Intelligence Dashboard</p>
              <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">98%</div>
                <div className="text-sm text-slate-600">Data Quality</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">$1.2M</div>
                <div className="text-sm text-slate-600">Total Revenue</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">+24%</div>
                <div className="text-sm text-slate-600">Growth Rate</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Key Insights</h2>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Strong revenue growth across all regions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Customer acquisition increased by 18%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">⚠</span>
                  <span>Q2 sales spike requires verification</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Data Visualization</h2>
              <div className="bg-slate-100 h-48 rounded flex items-center justify-center text-slate-500">
                [Bar Chart: Revenue Trends]
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h2 className="text-xl font-semibold mb-2">Strategic Recommendations</h2>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>Focus on high-performing regions</li>
                <li>Investigate Q2 anomalies</li>
                <li>Optimize marketing spend allocation</li>
              </ol>
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">Technical Analysis Report</h1>
              <p className="text-slate-600 mt-1">Detailed Data Quality Assessment</p>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h2 className="text-lg font-semibold mb-3">Dataset Overview</h2>
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div><span className="text-slate-600">Total Rows:</span> <span className="font-bold">10,000</span></div>
                <div><span className="text-slate-600">Total Columns:</span> <span className="font-bold">12</span></div>
                <div><span className="text-slate-600">Data Size:</span> <span className="font-bold">2.4 MB</span></div>
                <div><span className="text-slate-600">Null Values:</span> <span className="font-bold">0.2%</span></div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Schema Analysis</h2>
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Column</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Null %</th>
                    <th className="text-left p-2">Unique %</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr className="border-t">
                    <td className="p-2">customer_id</td>
                    <td className="p-2 text-blue-600">numeric</td>
                    <td className="p-2">0%</td>
                    <td className="p-2">100%</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">order_date</td>
                    <td className="p-2 text-green-600">date</td>
                    <td className="p-2">0%</td>
                    <td className="p-2">82%</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">region</td>
                    <td className="p-2 text-purple-600">categorical</td>
                    <td className="p-2">0.5%</td>
                    <td className="p-2">4 values</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Validation Results</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Structural Integrity</span>
                    <span className="text-sm font-bold">96%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '96%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Statistical Consistency</span>
                    <span className="text-sm font-bold">94%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Anomaly Detection</span>
                    <span className="text-sm font-bold">98%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-yellow-700">⚠</span> Validation Flags
              </h2>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>[WARNING] sales: 23 outliers detected (2.3%)</li>
                <li>[INFO] order_date: Future dates found (3 records)</li>
              </ul>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="text-center border-b pb-4">
              <h1 className="text-3xl font-bold text-slate-900">Financial Performance Report</h1>
              <p className="text-slate-600 mt-2">Q4 2025 Analysis</p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white border-2 border-slate-200 p-4 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Revenue</div>
                <div className="text-2xl font-bold text-slate-900">$2.4M</div>
                <div className="text-xs text-green-600 mt-1">↑ 12%</div>
              </div>
              <div className="bg-white border-2 border-slate-200 p-4 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Expenses</div>
                <div className="text-2xl font-bold text-slate-900">$1.2M</div>
                <div className="text-xs text-red-600 mt-1">↑ 5%</div>
              </div>
              <div className="bg-white border-2 border-slate-200 p-4 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Net Profit</div>
                <div className="text-2xl font-bold text-slate-900">$1.2M</div>
                <div className="text-xs text-green-600 mt-1">↑ 18%</div>
              </div>
              <div className="bg-white border-2 border-slate-200 p-4 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Margin</div>
                <div className="text-2xl font-bold text-slate-900">50%</div>
                <div className="text-xs text-green-600 mt-1">↑ 3%</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Revenue Breakdown</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Product Sales</span>
                    <span className="text-sm font-bold">$1.6M (67%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{width: '67%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Services</span>
                    <span className="text-sm font-bold">$600K (25%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{width: '25%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Subscriptions</span>
                    <span className="text-sm font-bold">$200K (8%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-purple-500 h-3 rounded-full" style={{width: '8%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Performance by Region</h2>
              <div className="bg-slate-100 h-48 rounded flex items-center justify-center text-slate-500">
                [Line Chart: Regional Performance]
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-900 mb-2">Strengths</h3>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• Strong Q4 performance</li>
                  <li>• Improved profit margins</li>
                  <li>• Consistent revenue growth</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold text-yellow-900 mb-2">Areas of Focus</h3>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• Reduce operational costs</li>
                  <li>• Diversify revenue streams</li>
                  <li>• Optimize pricing strategy</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{templateName} Preview</h2>
            <p className="text-sm text-slate-600 mt-1">This is how your report will look</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
          {getPreviewContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Use This Template
          </Button>
        </div>
      </div>
    </div>
  );
}
