'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/utils/timestamp';

export default function TestActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testActivity = {
    type: 'user_registered',
    title: 'Test User Registration',
    description: 'Test user registered: test@example.com',
    priority: 'medium',
    actorId: 'test-user-123',
    targetId: 'test-user-123',
    targetType: 'user',
    targetName: 'test@example.com',
    metadata: {
      email: 'test@example.com',
      registrationMethod: 'email'
    }
  };

  const createActivity = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testActivity),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Activity created successfully! ID: ${data.activity.id}`);
        await fetchActivities(); // Refresh the list
      } else {
        setMessage(`❌ Failed to create activity: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/activities?limit=10');
      const data = await response.json();
      
      if (response.ok) {
        setActivities(data.activities);
        setMessage(`✅ Retrieved ${data.activities.length} activities`);
      } else {
        setMessage(`❌ Failed to fetch activities: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage(`✅ Activity deleted successfully!`);
        await fetchActivities(); // Refresh the list
      } else {
        const data = await response.json();
        setMessage(`❌ Failed to delete activity: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Activity System Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={createActivity}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {loading ? 'Creating...' : 'Create Test Activity'}
            </button>
            
            <button
              onClick={fetchActivities}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {loading ? 'Loading...' : 'Fetch Activities'}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-md ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Activities ({activities.length})</h2>
          
          {activities.length === 0 ? (
            <p className="text-gray-500">No activities found. Create one to get started!</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{activity.title}</h3>
                      <p className="text-gray-600 mb-2">{activity.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Type: {activity.type}</span>
                        <span>Priority: {activity.priority}</span>
                        <span>Status: {activity.status}</span>
                        <span>Created: {formatRelativeTime(activity.createdAt)}</span>
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Metadata:</span>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
