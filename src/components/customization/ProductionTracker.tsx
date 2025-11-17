'use client';

import { CustomizationRequest } from '@/types/customization';

interface ProductionTrackerProps {
  request: CustomizationRequest;
}

export function ProductionTracker({ request }: ProductionTrackerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-200 text-gray-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'quality_check': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Confirmation';
      case 'confirmed': return 'Confirmed';
      case 'in_progress': return 'In Production';
      case 'quality_check': return 'Quality Check';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle Firestore Timestamp object with seconds and nanoseconds
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle plain Date or timestamp string
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'N/A';
    }
  };

  const productionDetails = request.productionDetails;

  if (!productionDetails) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <p className="text-gray-600">Production has not started yet.</p>
      </div>
    );
  }

  const stages = [
    {
      name: 'Confirmed',
      status: 'confirmed',
      completed: productionDetails.status !== 'pending',
      date: productionDetails.confirmedAt
    },
    {
      name: 'In Production',
      status: 'in_progress',
      completed: ['in_progress', 'quality_check', 'completed'].includes(productionDetails.status),
      date: productionDetails.startedAt
    },
    {
      name: 'Quality Check',
      status: 'quality_check',
      completed: ['quality_check', 'completed'].includes(productionDetails.status),
      date: null
    },
    {
      name: 'Completed',
      status: 'completed',
      completed: productionDetails.status === 'completed',
      date: productionDetails.actualCompletionDate
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Production Status</h3>
      
      <div className="mb-6">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(productionDetails.status)}`}>
          {getStatusLabel(productionDetails.status)}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.status} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {stage.completed ? '✓' : index + 1}
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    stage.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <h4 className="font-medium text-gray-900">{stage.name}</h4>
              {stage.date && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(stage.date)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
        {productionDetails.estimatedCompletionDate && (
          <div>
            <span className="text-sm font-medium text-gray-700">Estimated Completion:</span>
            <span className="text-sm text-gray-900 ml-2">
              {formatDate(productionDetails.estimatedCompletionDate)}
            </span>
          </div>
        )}
        
        {productionDetails.materials && (
          <div>
            <span className="text-sm font-medium text-gray-700">Materials:</span>
            <span className="text-sm text-gray-900 ml-2">{productionDetails.materials}</span>
          </div>
        )}
        
        {productionDetails.notes && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-1">Notes:</span>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {productionDetails.notes}
            </p>
          </div>
        )}

        {productionDetails.qualityCheckPassed !== undefined && (
          <div>
            <span className="text-sm font-medium text-gray-700">Quality Check:</span>
            <span className={`text-sm ml-2 ${productionDetails.qualityCheckPassed ? 'text-green-600' : 'text-red-600'}`}>
              {productionDetails.qualityCheckPassed ? '✓ Passed' : '✗ Failed'}
            </span>
            {productionDetails.qualityCheckNotes && (
              <p className="text-sm text-gray-600 mt-1">{productionDetails.qualityCheckNotes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

