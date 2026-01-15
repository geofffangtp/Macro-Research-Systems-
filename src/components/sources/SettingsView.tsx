'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Save, RefreshCw, Database, Key, Trash2 } from 'lucide-react';

export function SettingsView() {
  const { thesis, updateThesis, initializeData } = useAppStore();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Thesis editing
  const [editingThesis, setEditingThesis] = useState(false);
  const [thesisName, setThesisName] = useState(thesis?.name || '');
  const [thesisSummary, setThesisSummary] = useState(thesis?.summary || '');
  const [scenarios, setScenarios] = useState(thesis?.scenarios || []);

  const handleSaveThesis = () => {
    updateThesis({
      name: thesisName,
      summary: thesisSummary,
      scenarios,
    });
    setEditingThesis(false);
  };

  const handleResetData = () => {
    if (confirm('This will reset all data to defaults. Are you sure?')) {
      localStorage.removeItem('macro-research-store');
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* API Configuration */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Key size={20} className="text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">API Configuration</h3>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          Configure your API keys. These are stored in environment variables for security.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Anthropic API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Note: For production, set ANTHROPIC_API_KEY in your environment variables.
            </p>
          </div>
        </div>
      </div>

      {/* Thesis Configuration */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Investment Thesis</h3>
          </div>
          {!editingThesis && (
            <button
              onClick={() => setEditingThesis(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editingThesis ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Thesis Name
              </label>
              <input
                type="text"
                value={thesisName}
                onChange={(e) => setThesisName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Summary
              </label>
              <textarea
                value={thesisSummary}
                onChange={(e) => setThesisSummary(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Scenarios
              </label>
              {scenarios.map((scenario, i) => (
                <div key={i} className="mb-2 grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={scenario.name}
                    onChange={(e) => {
                      const newScenarios = [...scenarios];
                      newScenarios[i].name = e.target.value;
                      setScenarios(newScenarios);
                    }}
                    placeholder="Scenario name"
                    className="col-span-5 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <input
                    type="number"
                    value={scenario.probability}
                    onChange={(e) => {
                      const newScenarios = [...scenarios];
                      newScenarios[i].probability = parseInt(e.target.value) || 0;
                      setScenarios(newScenarios);
                    }}
                    placeholder="%"
                    className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <input
                    type="text"
                    value={scenario.description}
                    onChange={(e) => {
                      const newScenarios = [...scenarios];
                      newScenarios[i].description = e.target.value;
                      setScenarios(newScenarios);
                    }}
                    placeholder="Description"
                    className="col-span-5 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveThesis}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Save size={16} />
                Save Changes
              </button>
              <button
                onClick={() => setEditingThesis(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {thesis ? (
              <>
                <h4 className="font-medium text-zinc-900 dark:text-white">{thesis.name}</h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{thesis.summary}</p>
                <div className="mt-4 space-y-2">
                  {thesis.scenarios.map((scenario, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {scenario.name}
                      </span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {scenario.probability}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-400">
                  Last updated: {new Date(thesis.lastUpdated).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-500">No thesis configured</p>
            )}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Database size={20} className="text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">Data Management</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Initialize Default Data
              </p>
              <p className="text-xs text-zinc-500">
                Load default sources and data releases
              </p>
            </div>
            <button
              onClick={() => {
                initializeData();
                window.location.reload();
              }}
              className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <RefreshCw size={14} />
              Initialize
            </button>
          </div>
          <hr className="border-zinc-200 dark:border-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Reset All Data</p>
              <p className="text-xs text-zinc-500">
                Clear all stored data and start fresh
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <Trash2 size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 font-semibold text-zinc-900 dark:text-white">About</h3>
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            <strong>Macro Research System</strong> v1.0
          </p>
          <p>A personal research system for macro investing.</p>
          <p className="text-xs text-zinc-400 mt-4">
            Built with Next.js, Tailwind CSS, and Claude API
          </p>
        </div>
      </div>
    </div>
  );
}
